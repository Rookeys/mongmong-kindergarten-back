import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import { Throttle } from '@nestjs/throttler';
import { REWARD_THROTTLE } from '../../common/constants/throttle.constants';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import {
  CreateLetterReactionRequestDto,
  CreateLetterReportRequestDto,
  CreateLetterRequestDto,
  CreateLetterResponseDto,
  GetAiReplyResponseDto,
  GetLetterCalendarRequestDto,
  GetLetterCalendarResponseDto,
  GetLetterReactionResponseDto,
  GetLetterReportResponseDto,
  GetLetterRequestDto,
  GetLetterResponseDto,
  GetLettersRequestDto,
  GetPublicLetterResponseDto,
  GetPublicLettersRequestDto,
  UpdateLetterRequestDto,
} from './dto';
import { LetterService } from './letter.service';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 일지(편지) API 컨트롤러
 */
@ApiTags('letters')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('letters')
export class LetterController {
  constructor(private readonly letterService: LetterService) {}

  /**
   * 내 일지 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '내 일지 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetLetterResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
  async findAll(
    @Req() request: JwtAuthRequest,
    @Query() query: GetLettersRequestDto,
  ): Promise<GetLetterResponseDto[]> {
    return this.letterService.findAllByUser(request.user.sub, query);
  }

  /**
   * 내 일지 단건 조회
   */
  @Get('public')
  @ApiOperation({
    summary: '휴게실: 같은 질문에 다른 사람이 쓴 공개 일지 목록 조회',
    description: '익명으로 내려가며, 내가 차단한 사용자의 일지는 제외된다.',
  })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetPublicLetterResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
  async findPublic(
    @Req() request: JwtAuthRequest,
    @Query() query: GetPublicLettersRequestDto,
  ): Promise<GetPublicLetterResponseDto[]> {
    return this.letterService.findPublic(request.user.sub, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: '월간 캘린더: 일지를 쓴 날짜 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetLetterCalendarResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
  async findCalendar(
    @Req() request: JwtAuthRequest,
    @Query() query: GetLetterCalendarRequestDto,
  ): Promise<GetLetterCalendarResponseDto[]> {
    return this.letterService.findCalendar(request.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '내 일지 단건 조회' })
  @ApiParam({ name: 'id', description: '편지 ID', example: '1' })
  @ApiOkResponse({ description: '조회 성공', type: GetLetterResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.LETTER_NOT_FOUND,
  )
  async findOne(
    @Req() request: JwtAuthRequest,
    @Param() params: GetLetterRequestDto,
  ): Promise<GetLetterResponseDto> {
    return this.letterService.findOneByUser(request.user.sub, params.id);
  }

  /**
   * 오늘의 질문에 대한 일지 작성
   */
  @Patch(':id')
  @ApiOperation({
    summary: '내 일지 부분 수정',
    description:
      '공개 여부·기분은 언제든, 본문(answer)은 작성 당일(KST)에만 수정할 수 있다.',
  })
  @ApiParam({ name: 'id', description: '편지 ID', example: '1' })
  @ApiBody({ type: UpdateLetterRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: GetLetterResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.LETTER_NOT_FOUND,
    ErrorCode.LETTER_EDIT_EXPIRED,
  )
  async update(
    @Req() request: JwtAuthRequest,
    @Param() params: GetLetterRequestDto,
    @Body() dto: UpdateLetterRequestDto,
  ): Promise<GetLetterResponseDto> {
    return this.letterService.update(request.user.sub, params.id, dto);
  }

  @Post()
  @Throttle(REWARD_THROTTLE)
  @ApiOperation({
    summary: '일지 작성',
    description:
      '날짜별 질문에 하루 한 통. 오늘 일지는 꿈조각 1개(연속 5일째면 +5)를 받고, 지난 날짜 일지는 3개가 차감된다.',
  })
  @ApiBody({ type: CreateLetterRequestDto })
  @ApiCreatedResponse({
    description: '작성 성공',
    type: CreateLetterResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.DATE_IN_FUTURE,
    ErrorCode.USER_NOT_FOUND,
    ErrorCode.LETTER_ALREADY_EXISTS,
    ErrorCode.QUESTION_SERIES_NOT_FOUND,
    ErrorCode.QUESTION_NOT_FOUND,
    ErrorCode.REWARD_INSUFFICIENT,
  )
  async create(
    @Req() request: JwtAuthRequest,
    @Body() dto: CreateLetterRequestDto,
  ): Promise<CreateLetterResponseDto> {
    return this.letterService.create(request.user.sub, dto);
  }

  /**
   * 내 일지에 달린 AI 답장 목록 조회
   */
  @Get(':id/ai-replies')
  @ApiOperation({ summary: '내 일지에 달린 AI 답장 목록 조회' })
  @ApiParam({ name: 'id', description: '편지 ID', example: '1' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetAiReplyResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.LETTER_NOT_FOUND,
  )
  async findAiReplies(
    @Req() request: JwtAuthRequest,
    @Param() params: GetLetterRequestDto,
  ): Promise<GetAiReplyResponseDto[]> {
    return this.letterService.findAiReplies(request.user.sub, params.id);
  }

  /**
   * 편지에 반응(스티커) 남기기
   */
  @Post(':id/reactions')
  @ApiOperation({ summary: '편지에 반응(스티커) 남기기' })
  @ApiParam({ name: 'id', description: '편지 ID', example: '1' })
  @ApiBody({ type: CreateLetterReactionRequestDto })
  @ApiCreatedResponse({
    description: '등록 성공',
    type: GetLetterReactionResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.LETTER_NOT_FOUND,
  )
  async addReaction(
    @Req() request: JwtAuthRequest,
    @Param() params: GetLetterRequestDto,
    @Body() dto: CreateLetterReactionRequestDto,
  ): Promise<GetLetterReactionResponseDto> {
    return this.letterService.addReaction(request.user.sub, params.id, dto);
  }

  /**
   * 편지 신고
   */
  @Post(':id/reports')
  @ApiOperation({ summary: '편지 신고' })
  @ApiParam({ name: 'id', description: '편지 ID', example: '1' })
  @ApiBody({ type: CreateLetterReportRequestDto })
  @ApiCreatedResponse({
    description: '신고 접수 성공',
    type: GetLetterReportResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.LETTER_REPORT_OWN_LETTER,
    ErrorCode.LETTER_NOT_FOUND,
  )
  async addReport(
    @Req() request: JwtAuthRequest,
    @Param() params: GetLetterRequestDto,
    @Body() dto: CreateLetterReportRequestDto,
  ): Promise<GetLetterReportResponseDto> {
    return this.letterService.addReport(request.user.sub, params.id, dto);
  }
}
