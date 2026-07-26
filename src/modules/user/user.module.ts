import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserBlock } from './entities/user-block.entity';
import { UserDevice } from './entities/user-device.entity';
import { UserInvite } from './entities/user-invite.entity';
import { UserSetting } from './entities/user-setting.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * 사용자 도메인 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSetting,
      UserDevice,
      UserInvite,
      UserBlock,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
