import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
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
  @ApiOperation({ summary: '내 캐릭터 조회' })
  @ApiOkResponse({ description: '조회 성공', type: GetCharacterResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findMine(
    @Req() request: JwtAuthRequest,
  ): Promise<GetCharacterResponseDto> {
    return this.characterService.findOrCreateMine(request.user.sub);
  }

  /**
   * 캐릭터 졸업 처리
   */
  @Post('graduate')
  @ApiOperation({ summary: '캐릭터 졸업 처리' })
  @ApiCreatedResponse({
    description: '졸업 처리 성공',
    type: GetGraduationCardResponseDto,
  })
  @ApiNotFoundResponse({ description: '졸업 가능한 캐릭터를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
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
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findMyGraduationCards(
    @Req() request: JwtAuthRequest,
  ): Promise<GetGraduationCardResponseDto[]> {
    return this.characterService.findMyGraduationCards(request.user.sub);
  }
}
