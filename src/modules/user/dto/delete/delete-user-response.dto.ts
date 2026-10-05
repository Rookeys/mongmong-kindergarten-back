import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 삭제 응답 DTO
 */
export class DeleteUserResponseDto {
  @ApiProperty({
    description: '처리 결과 메시지',
    example: '사용자 삭제를 완료했습니다.',
  })
  message!: string;

  @ApiProperty({ description: '대상 사용자 ID', example: '1' })
  id!: string;

  @ApiProperty({
    description: '응답 본문에 담긴 상태 코드 값',
    example: 200,
  })
  statusCode!: number;
}
