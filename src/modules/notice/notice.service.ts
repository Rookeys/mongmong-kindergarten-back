import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { assignDefined } from '../../common/utils/assign-defined.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user/enums/user-role.enum';
import {
  CreateNoticeRequestDto,
  DeleteNoticeResponseDto,
  GetNoticeResponseDto,
  GetNoticesRequestDto,
  UpdateNoticeRequestDto,
} from './dto';
import { Notice } from './entities/notice.entity';

/**
 * 공지 서비스
 * 관리자가 아니면 게시된(isPublished=true) 공지만 조회할 수 있다.
 */
@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  /**
   * 공지 목록을 조회한다.
   */
  async findAll(
    query: GetNoticesRequestDto,
    requesterRole: UserRole,
  ): Promise<GetNoticeResponseDto[]> {
    const isAdmin = requesterRole === UserRole.ADMIN;
    const notices = await this.noticeRepository.find({
      where: {
        ...(query.type ? { type: query.type } : {}),
        isPublished: isAdmin ? query.isPublished : true,
      },
      order: { createdDate: 'DESC' },
    });
    return notices.map((notice) => this.mapNoticeToResponse(notice));
  }

  /**
   * 공지 단건을 조회한다.
   */
  async findOne(
    noticeId: string,
    requesterRole: UserRole,
  ): Promise<GetNoticeResponseDto> {
    const notice = await this.findById(noticeId);
    if (!notice.isPublished && requesterRole !== UserRole.ADMIN) {
      throw AppException.withTarget(ErrorCode.NOTICE_NOT_FOUND, {
        noticeId: noticeId,
      });
    }
    return this.mapNoticeToResponse(notice);
  }

  /**
   * 공지를 생성한다.
   */
  async create(dto: CreateNoticeRequestDto): Promise<GetNoticeResponseDto> {
    const savedNotice = await this.noticeRepository.save({
      type: dto.type,
      title: dto.title,
      content: dto.content,
      isPublished: dto.isPublished ?? false,
    });
    return this.mapNoticeToResponse(savedNotice);
  }

  /**
   * 공지를 부분 수정한다.
   */
  async update(
    noticeId: string,
    dto: UpdateNoticeRequestDto,
  ): Promise<GetNoticeResponseDto> {
    const notice = await this.findById(noticeId);
    assignDefined(notice, dto);
    const savedNotice = await this.noticeRepository.save(notice);
    return this.mapNoticeToResponse(savedNotice);
  }

  /**
   * 공지를 삭제한다.
   */
  async remove(noticeId: string): Promise<DeleteNoticeResponseDto> {
    await this.findById(noticeId);
    await this.noticeRepository.delete(noticeId);
    return {
      message: '공지 삭제를 완료했습니다.',
      id: noticeId,
      statusCode: 200,
    };
  }

  private async findById(noticeId: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOneBy({ id: noticeId });
    if (!notice) {
      throw AppException.withTarget(ErrorCode.NOTICE_NOT_FOUND, {
        noticeId: noticeId,
      });
    }
    return notice;
  }

  private mapNoticeToResponse(notice: Notice): GetNoticeResponseDto {
    return {
      id: notice.id,
      type: notice.type,
      title: notice.title,
      content: notice.content,
      isPublished: notice.isPublished,
      createdDate: notice.createdDate,
      updatedDate: notice.updatedDate,
    };
  }
}
