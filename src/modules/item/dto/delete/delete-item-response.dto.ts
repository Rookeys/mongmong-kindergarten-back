import { ApiProperty } from '@nestjs/swagger';

/**
 * 아이템 삭제 응답 DTO
 */
export class DeleteItemResponseDto {
  @ApiProperty({
    description: '메시지',
    example: '아이템 삭제를 완료했습니다.',
  })
  message!: string;

  @ApiProperty({ description: '아이템 ID', example: '1' })
  id!: string;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  statusCode!: number;
}
