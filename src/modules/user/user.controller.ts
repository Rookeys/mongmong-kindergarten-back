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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from './enums/user-role.enum';
import {
  CreateUserRequestDto,
  CreateUserResponseDto,
  DeleteUserResponseDto,
  GetUserRequestDto,
  GetUserResponseDto,
  GetUsersRequestDto,
  UpdateUserRequestDto,
  UpdateUserResponseDto,
} from './dto';
import { UserService } from './user.service';

/**
 * 사용자 CRUD API 컨트롤러 (관리자 전용)
 * 본인 프로필 조회/수정은 AuthController의 /auth/me 사용.
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 사용자 목록 조회
   */
  @Get()
  @ApiOperation({
    summary: '사용자 목록 조회',
    description:
      '사용자 목록을 반환합니다. status 쿼리로 필터링할 수 있습니다.',
  })
  @ApiOkResponse({
    description: '조회 성공',
    type: GetUserResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiBadRequestResponse({ description: '쿼리 유효성 검사 실패' })
  async findAll(
    @Query() query: GetUsersRequestDto,
  ): Promise<GetUserResponseDto[]> {
    return this.userService.findAll(query);
  }

  /**
   * 사용자 단건 조회
   */
  @Get(':id')
  @ApiOperation({
    summary: '사용자 단건 조회',
    description: '경로의 id에 해당하는 사용자를 반환합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', example: '1' })
  @ApiOkResponse({ description: '조회 성공', type: GetUserResponseDto })
  @ApiNotFoundResponse({ description: '사용자를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async findOne(
    @Param() params: GetUserRequestDto,
  ): Promise<GetUserResponseDto> {
    return this.userService.findOne(params.id);
  }

  /**
   * 사용자 생성
   */
  @Post()
  @ApiOperation({
    summary: '사용자 생성 (관리자용)',
    description: '로컬 로그인 사용자를 생성합니다.',
  })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiCreatedResponse({
    description: '생성 성공',
    type: CreateUserResponseDto,
  })
  @ApiBadRequestResponse({ description: '유효성 검사 실패 또는 이메일 중복' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async create(
    @Body() body: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    return this.userService.create(body);
  }

  /**
   * 사용자 부분 수정
   */
  @Patch(':id')
  @ApiOperation({
    summary: '사용자 부분 수정',
    description: '보낸 필드만 갱신합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', example: '1' })
  @ApiBody({ type: UpdateUserRequestDto })
  @ApiOkResponse({ description: '수정 성공', type: UpdateUserResponseDto })
  @ApiNotFoundResponse({ description: '사용자를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async update(
    @Param() params: GetUserRequestDto,
    @Body() body: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    return this.userService.update(params.id, body);
  }

  /**
   * 사용자 소프트 삭제
   */
  @Delete(':id')
  @ApiOperation({
    summary: '사용자 삭제',
    description: '사용자를 소프트 삭제(status=deleted) 처리합니다.',
  })
  @ApiParam({ name: 'id', description: '사용자 ID', example: '1' })
  @ApiOkResponse({ description: '삭제 성공', type: DeleteUserResponseDto })
  @ApiNotFoundResponse({ description: '사용자를 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async remove(
    @Param() params: GetUserRequestDto,
  ): Promise<DeleteUserResponseDto> {
    return this.userService.remove(params.id);
  }
}
