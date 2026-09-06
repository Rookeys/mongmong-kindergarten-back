import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { CharacterService } from './character.service';
import {
  CreateCharacterItemRequestDto,
  GetCharacterItemRequestDto,
  GetCharacterItemResponseDto,
  UpdateCharacterItemRequestDto,
} from './dto';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 캐릭터 보유 아이템(꾸미기) API 컨트롤러
 */
@ApiTags('character-items')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('character-items')
export class CharacterItemController {
  constructor(private readonly characterService: CharacterService) {}

  /**
   * 내 캐릭터 보유 아이템 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '내 캐릭터 보유 아이템 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetCharacterItemResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findMine(
    @Req() request: JwtAuthRequest,
  ): Promise<GetCharacterItemResponseDto[]> {
    return this.characterService.findMyItems(request.user.sub);
  }

  /**
   * 아이템 구매
   */
  @Post()
  @ApiOperation({ summary: '아이템 구매' })
  @ApiBody({ type: CreateCharacterItemRequestDto })
  @ApiCreatedResponse({
    description: '구매 성공',
    type: GetCharacterItemResponseDto,
  })
  @ApiBadRequestResponse({ description: '리워드 부족 또는 이미 보유한 아이템' })
  @ApiNotFoundResponse({ description: '아이템을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async purchase(
    @Req() request: JwtAuthRequest,
    @Body() dto: CreateCharacterItemRequestDto,
  ): Promise<GetCharacterItemResponseDto> {
    return this.characterService.purchaseItem(request.user.sub, dto);
  }

  /**
   * 아이템 장착/해제
   */
  @Patch(':id')
  @ApiOperation({ summary: '아이템 장착/해제' })
  @ApiParam({ name: 'id', description: '캐릭터-아이템 매핑 ID', example: '1' })
  @ApiBody({ type: UpdateCharacterItemRequestDto })
  @ApiOkResponse({
    description: '처리 성공',
    type: GetCharacterItemResponseDto,
  })
  @ApiNotFoundResponse({ description: '보유한 아이템을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async updateEquip(
    @Req() request: JwtAuthRequest,
    @Param() params: GetCharacterItemRequestDto,
    @Body() dto: UpdateCharacterItemRequestDto,
  ): Promise<GetCharacterItemResponseDto> {
    return this.characterService.updateEquip(request.user.sub, params.id, dto);
  }
}
