import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { CharacterService } from './character.service';
import { GetCharacterResponseDto, GetGraduationCardResponseDto } from './dto';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 캐릭터 API 컨트롤러
 */
@ApiTags('characters')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  /**
   * 내 캐릭터 조회 (없으면 새로 생성)
   */
  @Get('me')
  @ApiOperation({
    summary: '내 캐릭터 조회',
    description:
      '키우는 캐릭터가 없으면 사용 중인 종류 중 랜덤으로 새로 만든다. 레벨은 사이클 동안 쓴 편지 수로 계산한다(90통마다 +1, 최대 4). canGraduate가 true면 졸업 연출 후 POST /characters/graduate를 호출한다.',
  })
  @ApiOkResponse({ description: '조회 성공', type: GetCharacterResponseDto })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.CHARACTER_TYPE_NOT_REGISTERED,
  )
  async findMine(
    @Req() request: JwtAuthRequest,
  ): Promise<GetCharacterResponseDto> {
    return this.characterService.findOrCreateMine(request.user.sub);
  }

  /**
   * 캐릭터 졸업 처리
   */
  @Post('graduate')
  @ApiOperation({
    summary: '캐릭터 졸업 처리',
    description:
      '시작일부터 1년(졸업일)이 지나야 한다. 졸업 카드를 발급하고 새 캐릭터(랜덤 종류)를 오늘이 속한 사이클에서 시작한다. 산 아이템은 캐릭터에 묶여 있어 넘어가지 않는다.',
  })
  @ApiCreatedResponse({
    description: '졸업 처리 성공',
    type: GetGraduationCardResponseDto,
  })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.CHARACTER_NOT_FOUND,
    ErrorCode.CHARACTER_GRADUATION_NOT_READY,
    ErrorCode.CHARACTER_TYPE_NOT_REGISTERED,
  )
  async graduate(
    @Req() request: JwtAuthRequest,
  ): Promise<GetGraduationCardResponseDto> {
    return this.characterService.graduate(request.user.sub);
  }

  /**
   * 내 졸업 카드 목록(졸업 앨범) 조회
   */
  @Get('graduation-cards')
  @ApiOperation({ summary: '내 졸업 카드 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetGraduationCardResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
  async findMyGraduationCards(
    @Req() request: JwtAuthRequest,
  ): Promise<GetGraduationCardResponseDto[]> {
    return this.characterService.findMyGraduationCards(request.user.sub);
  }
}
