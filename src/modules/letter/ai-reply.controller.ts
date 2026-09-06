import { Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetAiReplyRequestDto, GetAiReplyResponseDto } from './dto';
import { LetterService } from './letter.service';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * AI 답장 API 컨트롤러
 */
@ApiTags('ai-replies')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('ai-replies')
export class AiReplyController {
  constructor(private readonly letterService: LetterService) {}

  /**
   * AI 답장 읽음 처리
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'AI 답장 읽음 처리' })
  @ApiParam({ name: 'id', description: 'AI 답장 ID', example: '1' })
  @ApiOkResponse({ description: '처리 성공', type: GetAiReplyResponseDto })
  @ApiNotFoundResponse({ description: 'AI 답장을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async markAsRead(
    @Req() request: JwtAuthRequest,
    @Param() params: GetAiReplyRequestDto,
  ): Promise<GetAiReplyResponseDto> {
    return this.letterService.markAiReplyAsRead(request.user.sub, params.id);
  }
}
