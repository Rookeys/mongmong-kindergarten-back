import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { API_GLOBAL_PREFIX } from './common/constants/api-global-prefix.constant';
import { Logger } from 'nestjs-pino';
import { toValidationException } from './common/validation-errors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useLogger(app.get(Logger));

  const corsOrigin = process.env.CORS_ORIGIN;
  const corsMethods = process.env.CORS_METHODS;
  if (!corsOrigin || !corsMethods) {
    throw new Error(
      'CORS_ORIGIN, CORS_METHODS 환경변수가 설정되지 않았습니다.',
    );
  }
  app.enableCors({
    origin: corsOrigin.split(','),
    methods: corsMethods.split(','),
    credentials: true,
  });

  app.setGlobalPrefix(API_GLOBAL_PREFIX);

  // 전역 유효성 검사 파이프 적용
  // whitelist: true - DTO에 정의되지 않은 속성은 자동으로 제거
  // forbidNonWhitelisted: true - DTO에 정의되지 않은 속성이 있으면 에러 발생
  // transform: true - 요청 데이터를 DTO 클래스 인스턴스로 자동 변환
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: toValidationException,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('몽몽유치원 API')
    .setDescription('JSON 구조 [링크](/api-docs-json)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // 클라이언트 코드젠 메서드명을 짧게: LetterController.findAll → letterFindAll
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        controllerKey.charAt(0).toLowerCase() +
        controllerKey.slice(1).replace(/Controller$/, '') +
        methodKey.charAt(0).toUpperCase() +
        methodKey.slice(1),
    });

  // 문서 UI는 접두사 없이 /api-docs 유지 (스펙 내 경로는 전역 접두사 반영)
  SwaggerModule.setup('api-docs', app, documentFactory, {
    useGlobalPrefix: false,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap().catch((error) => {
  console.error('Program exited with error:', error);
  process.exit(1);
});
