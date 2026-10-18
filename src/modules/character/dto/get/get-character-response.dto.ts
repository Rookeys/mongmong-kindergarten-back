import { ApiProperty } from '@nestjs/swagger';
import { CharacterStatus } from '../../enums/character-status.enum';
import { GetCharacterTypeResponseDto } from './get-character-type-response.dto';

/**
 * 캐릭터 응답 DTO
 */
export class GetCharacterResponseDto {
  @ApiProperty({ description: '캐릭터 ID', example: '1' })
  id!: string;

  @ApiProperty({
    description: '캐릭터 종류',
    type: GetCharacterTypeResponseDto,
  })
  characterType!: GetCharacterTypeResponseDto;

  @ApiProperty({
    description: '레벨 (1~4). 사이클 동안 쓴 편지 90통마다 1씩 오른다',
    example: 2,
  })
  level!: number;

  @ApiProperty({ description: '최대 레벨', example: 4 })
  maxLevel!: number;

  @ApiProperty({
    description:
      '사이클(cycleStartDate ~ graduationDate 전날) 동안 쓴 편지 수. 편지 날짜(letterDate) 기준',
    example: 95,
  })
  letterCount!: number;

  @ApiProperty({
    description: '다음 레벨이 되는 편지 수 (최대 레벨이면 null)',
    example: 180,
    nullable: true,
    type: Number,
  })
  nextLevelLetterCount!: number | null;

  @ApiProperty({
    description: '상태',
    enum: CharacterStatus,
    enumName: 'CharacterStatus',
    example: CharacterStatus.GROWING,
  })
  status!: CharacterStatus;

  @ApiProperty({
    description: '키우기 시작한 날 (KST, YYYY-MM-DD)',
    example: '2026-10-18',
  })
  cycleStartDate!: string;

  @ApiProperty({
    description: '졸업일 (시작일 + 1년, KST). 이 날부터 졸업할 수 있다',
    example: '2027-10-18',
  })
  graduationDate!: string;

  @ApiProperty({
    description:
      '오늘 졸업할 수 있는지. true면 졸업 연출 후 POST /characters/graduate를 호출한다',
    example: false,
  })
  canGraduate!: boolean;

  @ApiProperty({
    description: '졸업 일시',
    type: String,
    format: 'date-time',
    example: null,
    nullable: true,
  })
  graduatedAt!: Date | null;

  @ApiProperty({
    description: '마지막 물주기 일시',
    type: String,
    format: 'date-time',
    example: null,
    nullable: true,
  })
  lastWateredAt!: Date | null;

  @ApiProperty({
    description: '생성 일시',
    type: String,
    format: 'date-time',
    example: '2026-07-26T12:00:00.000Z',
  })
  createdDate!: Date;
}
