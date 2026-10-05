import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import {
  CreateAdViewRequestDto,
  CreateAdViewResponseDto,
  GetRewardHistoryResponseDto,
} from './dto';
import { RewardService } from './reward.service';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 리워드(꿈조각) API 컨트롤러
 */
@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  /**
   * 내 리워드 적립 이력 조회
   */
  @Get('history')
  @ApiOperation({ summary: '내 리워드 적립 이력 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetRewardHistoryResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
  async findMyHistory(
    @Req() request: JwtAuthRequest,
  ): Promise<GetRewardHistoryResponseDto[]> {
    return this.rewardService.findMyHistory(request.user.sub);
  }

  /**
   * 광고 시청 기록 및 리워드 지급 (출석체크 포함)
   */
  @Post('ad-view')
  @ApiOperation({
    summary: '광고 시청 기록 및 리워드 지급',
    description:
      'rewarded 광고는 하루 1회 리워드가 지급된다. 출석체크도 이 API(rewarded)로 처리한다.',
  })
  @ApiBody({ type: CreateAdViewRequestDto })
  @ApiCreatedResponse({
    description: '기록 성공',
    type: CreateAdViewResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.AD_ALREADY_VIEWED_TODAY,
    ErrorCode.USER_NOT_FOUND,
  )
  async recordAdView(
    @Req() request: JwtAuthRequest,
    @Body() dto: CreateAdViewRequestDto,
  ): Promise<CreateAdViewResponseDto> {
    return this.rewardService.recordAdView(request.user.sub, dto);
  }
}
