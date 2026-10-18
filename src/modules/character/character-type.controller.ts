import { ApiErrors } from '../../common/api-errors.decorator';
import { ErrorCode } from '../../common/error-code';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/enums/user-role.enum';
import { CharacterTypeService } from './character-type.service';
import {
  CreateCharacterTypeRequestDto,
  GetCharacterTypeRequestDto,
  GetCharacterTypeResponseDto,
  UpdateCharacterTypeRequestDto,
} from './dto';

/**
 * 캐릭터 종류 관리 API 컨트롤러 (관리자 전용)
 */
@ApiTags('character-types')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('character-types')
export class CharacterTypeController {
  constructor(private readonly characterTypeService: CharacterTypeService) {}

  /**
   * 캐릭터 종류 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '캐릭터 종류 목록 조회 (관리자)' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetCharacterTypeResponseDto,
    isArray: true,
  })
  @ApiErrors(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.FORBIDDEN_ROLE,
  )
  async findAll(): Promise<GetCharacterTypeResponseDto[]> {
    return this.characterTypeService.findAll();
  }

  /**
   * 캐릭터 종류 추가
   */
  @Post()
  @ApiOperation({
    summary: '캐릭터 종류 추가 (관리자)',
    description: '추가하면 바로 새 캐릭터 랜덤 배정 대상이 된다.',
  })
  @ApiBody({ type: CreateCharacterTypeRequestDto })
  @ApiCreatedResponse({
    description: '추가 성공',
    type: GetCharacterTypeResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.FORBIDDEN_ROLE,
    ErrorCode.DUPLICATE_RESOURCE,
  )
  async create(
    @Body() dto: CreateCharacterTypeRequestDto,
  ): Promise<GetCharacterTypeResponseDto> {
    return this.characterTypeService.create(dto);
  }

  /**
   * 캐릭터 종류 수정
   */
  @Patch(':id')
  @ApiOperation({
    summary: '캐릭터 종류 수정 (관리자)',
    description:
      'isActive=false면 새 캐릭터로 배정하지 않는다. 지우는 API는 없다(키우던 캐릭터·졸업 카드가 참조).',
  })
  @ApiParam({ name: 'id', description: '캐릭터 종류 ID', example: '1' })
  @ApiBody({ type: UpdateCharacterTypeRequestDto })
  @ApiOkResponse({
    description: '수정 성공',
    type: GetCharacterTypeResponseDto,
  })
  @ApiErrors(
    ErrorCode.VALIDATION_FAILED,
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.AUTH_TOKEN_INVALID,
    ErrorCode.FORBIDDEN_ROLE,
    ErrorCode.CHARACTER_TYPE_NOT_FOUND,
    ErrorCode.DUPLICATE_RESOURCE,
  )
  async update(
    @Param() params: GetCharacterTypeRequestDto,
    @Body() dto: UpdateCharacterTypeRequestDto,
  ): Promise<GetCharacterTypeResponseDto> {
    return this.characterTypeService.update(params.id, dto);
  }
}
