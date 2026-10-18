import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/enums/user-role.enum';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import {
  CreateQuestionSeriesRequestDto,
  GetDailyQuestionRequestDto,
  GetDailyQuestionResponseDto,
  GetGuestQuestionRequestDto,
  GetQuestionResponseDto,
  GetQuestionSeriesRequestDto,
  GetQuestionSeriesResponseDto,
  UpsertQuestionsRequestDto,
  UpsertQuestionsResponseDto,
} from './dto';
import { QuestionAdminService } from './question-admin.service';
import { QuestionService } from './question.service';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 질문 조회 API 컨트롤러
 */
@ApiTags('questions')
@Controller('questions')
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly questionAdminService: QuestionAdminService,
  ) {}

  /**
   * 질문 시리즈 생성 (관리자 전용)
   */
  @Post('series')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '질문 시리즈 생성 (관리자)',
    description:
      '가장 먼저 만든 시리즈가 기본 시리즈다(시리즈를 고르지 않은 회원·비회원이 쓴다).',
  })
  @ApiBody({ type: CreateQuestionSeriesRequestDto })
  @ApiCreatedResponse({
    description: '생성 성공',
    type: GetQuestionSeriesResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.FORBIDDEN_ROLE,
  )
  async createSeries(
    @Body() dto: CreateQuestionSeriesRequestDto,
  ): Promise<GetQuestionSeriesResponseDto> {
    return this.questionAdminService.createSeries(dto);
  }

  /**
   * 질문 일괄 등록·수정 (관리자 전용)
   */
  @Put('series/:id/questions')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '질문 일괄 등록·수정 (관리자)',
    description:
      '날짜 순번(1~365)별 질문 문구를 한 번에 넣는다. 이미 있는 순번·언어는 덮어쓰고 보내지 않은 순번은 그대로 둔다. 응답의 missingOrderNums로 빈 날짜를 확인한다. CSV 파일은 pnpm import:questions 스크립트로 넣을 수 있다.',
  })
  @ApiParam({ name: 'id', description: '질문 시리즈 ID', example: '1' })
  @ApiBody({ type: UpsertQuestionsRequestDto })
  @ApiOkResponse({ description: '등록 성공', type: UpsertQuestionsResponseDto })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.FORBIDDEN_ROLE,
    ErrorCode.QUESTION_SERIES_NOT_FOUND,
  )
  async upsertQuestions(
    @Param() params: GetQuestionSeriesRequestDto,
    @Body() dto: UpsertQuestionsRequestDto,
  ): Promise<UpsertQuestionsResponseDto> {
    return this.questionAdminService.upsertQuestions(params.id, dto.questions);
  }

  /**
   * 비회원용 오늘의 질문 조회 (인증 불필요)
   */
  @Get('guest/today')
  @ApiOperation({
    summary: '비회원용 오늘의 질문 조회',
    description:
      '로그인 없이 오늘(KST) 질문 하나만 내려준다. 답변 저장은 클라이언트가 처리한다.',
  })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetDailyQuestionResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.QUESTION_SERIES_NOT_FOUND,
    ErrorCode.QUESTION_NOT_FOUND,
    ErrorCode.QUESTION_CONTENT_NOT_FOUND,
  )
  async findGuestToday(
    @Query() query: GetGuestQuestionRequestDto,
  ): Promise<GetDailyQuestionResponseDto> {
    return this.questionService.findGuestToday(query.locale);
  }

  /**
   * 질문 시리즈 목록 조회
   */
  @Get('series')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '질문 시리즈 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetQuestionSeriesResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
  async findAllSeries(): Promise<GetQuestionSeriesResponseDto[]> {
    return this.questionService.findAllSeries();
  }

  /**
   * 날짜별 질문 조회
   */
  @Get('daily')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '날짜별 질문 조회',
    description:
      '날짜를 생략하면 오늘(KST) 질문이다. 같은 월/일은 매년 같은 질문이며, 그 날짜에 쓴 일지가 있으면 letterId가 채워진다.',
  })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetDailyQuestionResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.DATE_IN_FUTURE,
    ErrorCode.USER_NOT_FOUND,
    ErrorCode.QUESTION_SERIES_NOT_FOUND,
    ErrorCode.QUESTION_NOT_FOUND,
    ErrorCode.QUESTION_CONTENT_NOT_FOUND,
  )
  async findDaily(
    @Req() request: JwtAuthRequest,
    @Query() query: GetDailyQuestionRequestDto,
  ): Promise<GetDailyQuestionResponseDto> {
    return this.questionService.findDaily(request.user.sub, query);
  }

  /**
   * 질문 리스트 조회
   */
  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '질문 리스트 조회',
    description: '내 시리즈의 질문 전체를 순번(날짜) 오름차순으로 내려준다.',
  })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetQuestionResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
    ErrorCode.QUESTION_SERIES_NOT_FOUND,
    ErrorCode.QUESTION_CONTENT_NOT_FOUND,
  )
  async findAll(
    @Req() request: JwtAuthRequest,
    @Query() query: GetGuestQuestionRequestDto,
  ): Promise<GetQuestionResponseDto[]> {
    return this.questionService.findAll(request.user.sub, query.locale);
  }
}
