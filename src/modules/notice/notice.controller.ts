import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/enums/user-role.enum';
import {
  CreateNoticeRequestDto,
  DeleteNoticeResponseDto,
  GetNoticeRequestDto,
  GetNoticeResponseDto,
  GetNoticesRequestDto,
  UpdateNoticeRequestDto,
} from './dto';
import { NoticeService } from './notice.service';

type JwtAuthRequest = {
  user: JwtPayloadDto;
};

/**
 * 공지 API 컨트롤러
 * 목록/단건 조회는 로그인 사용자 누구나(비게시 공지는 관리자만), 생성/수정/삭제는 관리자 전용.
 */
@ApiTags('notices')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  /**
   * 공지 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '공지 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetNoticeResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findAll(
    @Req() request: JwtAuthRequest,
    @Query() query: GetNoticesRequestDto,
  ): Promise<GetNoticeResponseDto[]> {
    return this.noticeService.findAll(query, request.user.role);
  }

  /**
   * 공지 단건 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '공지 단건 조회' })
  @ApiParam({ name: 'id', description: '공지 ID', example: '1' })
  @ApiOkResponse({ description: '조회 성공', type: GetNoticeResponseDto })
  @ApiNotFoundResponse({ description: '공지를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findOne(
    @Req() request: JwtAuthRequest,
    @Param() params: GetNoticeRequestDto,
  ): Promise<GetNoticeResponseDto> {
    return this.noticeService.findOne(params.id, request.user.role);
  }

  /**
   * 공지 생성 (관리자 전용)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '공지 생성 (관리자용)' })
  @ApiBody({ type: CreateNoticeRequestDto })
  @ApiCreatedResponse({ description: '생성 성공', type: GetNoticeResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async create(
    @Body() dto: CreateNoticeRequestDto,
  ): Promise<GetNoticeResponseDto> {
    return this.noticeService.create(dto);
  }

  /**
   * 공지 부분 수정 (관리자 전용)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '공지 부분 수정 (관리자용)' })
  @ApiParam({ name: 'id', description: '공지 ID', example: '1' })
  @ApiBody({ type: UpdateNoticeRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: GetNoticeResponseDto })
  @ApiNotFoundResponse({ description: '공지를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async update(
    @Param() params: GetNoticeRequestDto,
    @Body() dto: UpdateNoticeRequestDto,
  ): Promise<GetNoticeResponseDto> {
    return this.noticeService.update(params.id, dto);
  }

  /**
   * 공지 삭제 (관리자 전용)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '공지 삭제 (관리자용)' })
  @ApiParam({ name: 'id', description: '공지 ID', example: '1' })
  @ApiOkResponse({ description: '삭제 성공', type: DeleteNoticeResponseDto })
  @ApiNotFoundResponse({ description: '공지를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async remove(
    @Param() params: GetNoticeRequestDto,
  ): Promise<DeleteNoticeResponseDto> {
    return this.noticeService.remove(params.id);
  }
}
