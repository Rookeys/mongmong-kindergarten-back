import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from '../auth/auth.module';
import { CharacterModule } from '../character/character.module';
import { ItemModule } from '../item/item.module';
import { LetterModule } from '../letter/letter.module';
import { NoticeModule } from '../notice/notice.module';
import { QuestionModule } from '../question/question.module';
import { RewardModule } from '../reward/reward.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env/${process.env.NODE_ENV || 'development'}.env`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>('DB_TYPE') as 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get('synchronize') === 'true',
      }),
    }),
    LoggerModule.forRoot(),
    QuestionModule,
    ItemModule,
    UserModule,
    AuthModule,
    LetterModule,
    CharacterModule,
    RewardModule,
    NoticeModule,
  ],
})
export class AppModule {}
