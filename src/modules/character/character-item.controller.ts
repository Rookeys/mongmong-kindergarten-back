import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
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
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
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
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
  )
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
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.ITEM_NOT_FOUND,
    ErrorCode.CHARACTER_ITEM_ALREADY_OWNED,
    ErrorCode.REWARD_INSUFFICIENT,
    ErrorCode.USER_NOT_FOUND,
  )
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
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.CHARACTER_ITEM_NOT_OWNED,
  )
  async updateEquip(
    @Req() request: JwtAuthRequest,
    @Param() params: GetCharacterItemRequestDto,
    @Body() dto: UpdateCharacterItemRequestDto,
  ): Promise<GetCharacterItemResponseDto> {
    return this.characterService.updateEquip(request.user.sub, params.id, dto);
  }
}
