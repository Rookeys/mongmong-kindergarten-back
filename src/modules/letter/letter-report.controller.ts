import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/enums/user-role.enum';
import {
  GetLetterReportResponseDto,
  GetLetterReportsRequestDto,
  GetLetterRequestDto,
  UpdateLetterReportRequestDto,
} from './dto';
import { LetterReportService } from './letter-report.service';

/**
 * 일지 신고 처리 API 컨트롤러 (관리자 전용)
 */
@ApiTags('letter-reports')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('letter-reports')
export class LetterReportController {
  constructor(private readonly letterReportService: LetterReportService) {}

  /**
   * 신고 목록 조회
   */
  @Get()
  @ApiOperation({
    summary: '신고 목록 조회 (관리자)',
    description: 'status로 거를 수 있고 오래된 신고부터 내려준다.',
  })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetLetterReportResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.FORBIDDEN_ROLE,
  )
  async findAll(
    @Query() query: GetLetterReportsRequestDto,
  ): Promise<GetLetterReportResponseDto[]> {
    return this.letterReportService.findAll(query);
  }

  /**
   * 신고 처리 상태 변경
   */
  @Patch(':id')
  @ApiOperation({
    summary: '신고 처리 상태 변경 (관리자)',
    description:
      'resolved(신고 인정)로 바꾸면 그 일지는 휴게실(GET /letters/public)에서 내려간다.',
  })
  @ApiParam({ name: 'id', description: '신고 ID', example: '1' })
  @ApiBody({ type: UpdateLetterReportRequestDto })
  @ApiOkResponse({ description: '변경 성공', type: GetLetterReportResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.FORBIDDEN_ROLE,
    ErrorCode.LETTER_REPORT_NOT_FOUND,
  )
  async updateStatus(
    @Param() params: GetLetterRequestDto,
    @Body() dto: UpdateLetterReportRequestDto,
  ): Promise<GetLetterReportResponseDto> {
    return this.letterReportService.updateStatus(params.id, dto);
  }
}
