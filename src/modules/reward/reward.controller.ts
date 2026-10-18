import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import { Throttle } from '@nestjs/throttler';
import { REWARD_THROTTLE } from '../../common/constants/throttle.constants';
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
  CreateAttendanceResponseDto,
  GetAttendanceResponseDto,
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
  @Throttle(REWARD_THROTTLE)
  @ApiOperation({
    summary: '광고 시청 기록 및 리워드 지급',
    description:
      '광고를 볼 때마다 꿈조각 3개가 지급된다(횟수 제한 없음). 출석체크는 POST /rewards/attendance를 쓴다.',
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
    ErrorCode.USER_NOT_FOUND,
  )
  async recordAdView(
    @Req() request: JwtAuthRequest,
    @Body() dto: CreateAdViewRequestDto,
  ): Promise<CreateAdViewResponseDto> {
    return this.rewardService.recordAdView(request.user.sub, dto);
  }

  @Get('attendance')
  @ApiOperation({ summary: '오늘 출석체크 여부 조회' })
  @ApiOkResponse({ description: '조회 성공', type: GetAttendanceResponseDto })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
  async findTodayAttendance(
    @Req() request: JwtAuthRequest,
  ): Promise<GetAttendanceResponseDto> {
    return this.rewardService.findTodayAttendance(request.user.sub);
  }

  @Post('attendance')
  @ApiOperation({
    summary: '출석체크 및 리워드 지급',
    description: '하루(KST) 1회 꿈조각 1개가 지급된다.',
  })
  @ApiCreatedResponse({
    description: '출석 성공',
    type: CreateAttendanceResponseDto,
  })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.ATTENDANCE_ALREADY_CHECKED,
    ErrorCode.USER_NOT_FOUND,
  )
  async checkAttendance(
    @Req() request: JwtAuthRequest,
  ): Promise<CreateAttendanceResponseDto> {
    return this.rewardService.checkAttendance(request.user.sub);
  }
}
