import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import {
  CreateLetterReactionRequestDto,
  CreateLetterReportRequestDto,
  CreateLetterRequestDto,
  GetAiReplyResponseDto,
  GetLetterReactionResponseDto,
  GetLetterReportResponseDto,
  GetLetterRequestDto,
  GetLetterResponseDto,
  GetLettersRequestDto,
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
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findAll(
    @Req() request: JwtAuthRequest,
    @Query() query: GetLettersRequestDto,
  ): Promise<GetLetterResponseDto[]> {
    return this.letterService.findAllByUser(request.user.sub, query);
  }

  /**
   * 내 일지 단건 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '내 일지 단건 조회' })
  @ApiParam({ name: 'id', description: '편지 ID', example: '1' })
  @ApiOkResponse({ description: '조회 성공', type: GetLetterResponseDto })
  @ApiNotFoundResponse({ description: '일지를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findOne(
    @Req() request: JwtAuthRequest,
    @Param() params: GetLetterRequestDto,
  ): Promise<GetLetterResponseDto> {
    return this.letterService.findOneByUser(request.user.sub, params.id);
  }

  /**
   * 오늘의 질문에 대한 일지 작성
   */
  @Post()
  @ApiOperation({ summary: '오늘의 질문에 대한 일지 작성' })
  @ApiBody({ type: CreateLetterRequestDto })
  @ApiCreatedResponse({
    description: '작성 성공',
    type: GetLetterResponseDto,
  })
  @ApiBadRequestResponse({ description: '오늘의 질문 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async create(
    @Req() request: JwtAuthRequest,
    @Body() dto: CreateLetterRequestDto,
  ): Promise<GetLetterResponseDto> {
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
  @ApiNotFoundResponse({ description: '일지를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
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
  @ApiNotFoundResponse({ description: '일지를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
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
  @ApiBadRequestResponse({ description: '본인 일지는 신고할 수 없음' })
  @ApiNotFoundResponse({ description: '일지를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async addReport(
    @Req() request: JwtAuthRequest,
    @Param() params: GetLetterRequestDto,
    @Body() dto: CreateLetterReportRequestDto,
  ): Promise<GetLetterReportResponseDto> {
    return this.letterService.addReport(request.user.sub, params.id, dto);
  }
}
