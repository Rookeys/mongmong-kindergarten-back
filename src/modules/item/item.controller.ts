import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/enums/user-role.enum';
import {
  CreateItemRequestDto,
  DeleteItemResponseDto,
  GetItemRequestDto,
  GetItemResponseDto,
  GetItemsRequestDto,
  UpdateItemRequestDto,
} from './dto';
import { ItemService } from './item.service';

/**
 * 아이템 API 컨트롤러
 * 목록/단건 조회는 로그인 사용자 누구나, 생성/수정/삭제는 관리자 전용.
 */
@ApiTags('items')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  /**
   * 아이템 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '아이템 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetItemResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findAll(
    @Query() query: GetItemsRequestDto,
  ): Promise<GetItemResponseDto[]> {
    return this.itemService.findAll(query);
  }

  /**
   * 아이템 생성 (관리자 전용)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '아이템 생성 (관리자용)' })
  @ApiBody({ type: CreateItemRequestDto })
  @ApiCreatedResponse({ description: '생성 성공', type: GetItemResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async create(@Body() dto: CreateItemRequestDto): Promise<GetItemResponseDto> {
    return this.itemService.create(dto);
  }

  /**
   * 아이템 부분 수정 (관리자 전용)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '아이템 부분 수정 (관리자용)' })
  @ApiParam({ name: 'id', description: '아이템 ID', example: '1' })
  @ApiBody({ type: UpdateItemRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: GetItemResponseDto })
  @ApiNotFoundResponse({ description: '아이템을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async update(
    @Param() params: GetItemRequestDto,
    @Body() dto: UpdateItemRequestDto,
  ): Promise<GetItemResponseDto> {
    return this.itemService.update(params.id, dto);
  }

  /**
   * 아이템 삭제 (관리자 전용)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '아이템 삭제 (관리자용)' })
  @ApiParam({ name: 'id', description: '아이템 ID', example: '1' })
  @ApiOkResponse({ description: '삭제 성공', type: DeleteItemResponseDto })
  @ApiNotFoundResponse({ description: '아이템을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async remove(
    @Param() params: GetItemRequestDto,
  ): Promise<DeleteItemResponseDto> {
    return this.itemService.remove(params.id);
  }
}
