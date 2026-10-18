import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../../common/app-exception';
import { ErrorCode } from '../../common/error-code';
import { assignDefined } from '../../common/utils/assign-defined.util';
import {
  CreateCharacterTypeRequestDto,
  GetCharacterTypeResponseDto,
  UpdateCharacterTypeRequestDto,
} from './dto';
import { CharacterType } from './entities/character-type.entity';

/**
 * 캐릭터 종류 관리 서비스 (관리자)
 */
@Injectable()
export class CharacterTypeService {
  constructor(
    @InjectRepository(CharacterType)
    private readonly characterTypeRepository: Repository<CharacterType>,
  ) {}

  /**
   * 캐릭터 종류 전체를 등록 순으로 조회한다.
   */
  async findAll(): Promise<GetCharacterTypeResponseDto[]> {
    const characterTypes = await this.characterTypeRepository.find({
      order: { id: 'ASC' },
    });
    return characterTypes.map((characterType) =>
      this.mapToResponse(characterType),
    );
  }

  /**
   * 캐릭터 종류를 추가한다. 추가하면 바로 새 캐릭터 배정 대상이 된다.
   */
  async create(
    dto: CreateCharacterTypeRequestDto,
  ): Promise<GetCharacterTypeResponseDto> {
    const saved = await this.characterTypeRepository.save({
      name: dto.name,
      imageUrl: dto.imageUrl ?? null,
      isActive: true,
    });
    return this.mapToResponse(saved);
  }

  /**
   * 캐릭터 종류를 부분 수정한다. isActive=false면 새로 배정하지 않는다.
   */
  async update(
    characterTypeId: string,
    dto: UpdateCharacterTypeRequestDto,
  ): Promise<GetCharacterTypeResponseDto> {
    const characterType = await this.characterTypeRepository.findOneBy({
      id: characterTypeId,
    });
    if (!characterType) {
      throw AppException.withTarget(ErrorCode.CHARACTER_TYPE_NOT_FOUND, {
        characterTypeId: characterTypeId,
      });
    }
    assignDefined(characterType, dto);
    const saved = await this.characterTypeRepository.save(characterType);
    return this.mapToResponse(saved);
  }

  private mapToResponse(
    characterType: CharacterType,
  ): GetCharacterTypeResponseDto {
    return {
      id: characterType.id,
      name: characterType.name,
      imageUrl: characterType.imageUrl,
      isActive: characterType.isActive,
    };
  }
}
