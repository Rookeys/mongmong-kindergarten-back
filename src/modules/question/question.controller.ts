import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
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
  @ApiUnauthorizedResponse({ description: '인증 실패' })
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
  @ApiBadRequestResponse({ description: '질문 시리즈 미선택' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findToday(
    @Req() request: JwtAuthRequest,
    @Query() query: GetTodayQuestionRequestDto,
  ): Promise<GetTodayQuestionResponseDto> {
    return this.questionService.findToday(request.user.sub, query.locale);
  }
}
