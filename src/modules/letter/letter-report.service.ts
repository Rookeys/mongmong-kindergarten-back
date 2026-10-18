import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import {
  GetLetterReportResponseDto,
  GetLetterReportsRequestDto,
  UpdateLetterReportRequestDto,
} from './dto';
import { LetterReport } from './entities/letter-report.entity';

const DEFAULT_REPORTS_TAKE = 20;

/**
 * 일지 신고 처리 서비스 (관리자)
 */
@Injectable()
export class LetterReportService {
  constructor(
    @InjectRepository(LetterReport)
    private readonly letterReportRepository: Repository<LetterReport>,
  ) {}

  /**
   * 신고 목록을 오래된 순으로 조회한다.
   */
  async findAll(
    query: GetLetterReportsRequestDto,
  ): Promise<GetLetterReportResponseDto[]> {
    const reports = await this.letterReportRepository.find({
      where: query.status ? { status: query.status } : {},
      order: { createdDate: 'ASC' },
      take: query.take ?? DEFAULT_REPORTS_TAKE,
      skip: query.skip ?? 0,
    });
    return reports.map((report) => this.mapReportToResponse(report));
  }

  /**
   * 신고 처리 상태를 바꾼다.
   */
  async updateStatus(
    reportId: string,
    dto: UpdateLetterReportRequestDto,
  ): Promise<GetLetterReportResponseDto> {
    const report = await this.letterReportRepository.findOneBy({
      id: reportId,
    });
    if (!report) {
      throw AppException.withTarget(ErrorCode.LETTER_REPORT_NOT_FOUND, {
        letterReportId: reportId,
      });
    }
    report.status = dto.status;
    const savedReport = await this.letterReportRepository.save(report);
    return this.mapReportToResponse(savedReport);
  }

  private mapReportToResponse(
    report: LetterReport,
  ): GetLetterReportResponseDto {
    return {
      id: report.id,
      letterId: report.letterId,
      reasonType: report.reasonType,
      reasonDetail: report.reasonDetail,
      status: report.status,
      createdDate: report.createdDate,
    };
  }
}
