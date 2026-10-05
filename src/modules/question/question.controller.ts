import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import {
  GetQuestionSeriesResponseDto,
  GetTodayQuestionRequestDto,
  GetTodayQuestionResponseDto,
} from './dto';
import { QuestionService } from './question.service';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 질문 조회 API 컨트롤러
 */
@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  /**
   * 질문 시리즈 목록 조회
   */
  @Get('series')
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
   * 오늘의 질문 조회
   */
  @Get('today')
  @ApiOperation({ summary: '오늘의 질문 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetTodayQuestionResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.USER_NOT_FOUND,
    ErrorCode.QUESTION_SERIES_NOT_SELECTED,
    ErrorCode.QUESTION_EMPTY_SERIES,
    ErrorCode.QUESTION_CONTENT_NOT_FOUND,
  )
  async findToday(
    @Req() request: JwtAuthRequest,
    @Query() query: GetTodayQuestionRequestDto,
  ): Promise<GetTodayQuestionResponseDto> {
    return this.questionService.findToday(request.user.sub, query.locale);
  }
}
