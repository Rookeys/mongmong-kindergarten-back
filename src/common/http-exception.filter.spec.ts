import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsEmail, IsEnum, MinLength, validate } from 'class-validator';
import { QueryFailedError } from 'typeorm';
import { AppException } from './app-exception';
import { ErrorCode } from './error-code';
import { HttpExceptionFilter } from './http-exception.filter';
import { toValidationException } from './validation-errors';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url: '/x' }),
    }),
  } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(exception, host);
  return { status: status.mock.calls[0][0], body: json.mock.calls[0][0] };
}

describe('HttpExceptionFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('AppException은 code/status/details를 그대로 내려준다', () => {
    const { status, body } = run(
      new AppException(ErrorCode.REWARD_INSUFFICIENT, {
        required: 10,
        current: 3,
      }),
    );
    expect(status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      code: 'REWARD_INSUFFICIENT',
      details: { required: 10, current: 3 },
    });
  });

  it('코드 없는 Nest 예외는 상태코드 기반 공통 code', () => {
    const { body } = run(new BadRequestException('english default'));
    expect(body).toMatchObject({
      code: 'BAD_REQUEST',
      message: '잘못된 요청입니다.',
    });
  });

  it('unique 위반은 409 DUPLICATE_RESOURCE', () => {
    const error = new QueryFailedError('q', [], { code: '23505' } as never);
    const { status, body } = run(error);
    expect(status).toBe(409);
    expect(body.code).toBe('DUPLICATE_RESOURCE');
  });

  it('미분류 에러는 내부 메시지 없이 500', () => {
    const { status, body } = run(new Error('secret'));
    expect(status).toBe(500);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('secret');
  });
});

enum Kind {
  A = 'A',
  B = 'B',
}

describe('AppException.withTarget', () => {
  it('대상 식별값을 한글 메시지와 details에 담는다', () => {
    const e = AppException.withTarget(ErrorCode.LETTER_NOT_FOUND, {
      letterId: '12',
    });
    expect(e.message).toBe('일지를 찾을 수 없습니다. (letterId: 12)');
    expect(e.details).toEqual({ letterId: '12' });
  });
});

describe('toValidationException', () => {
  class Dto {
    @IsEmail() email!: string;
    @MinLength(8) password!: string;
    @IsEnum(Kind) type!: string;
  }

  it('필드별 사유 코드와 details를 만든다', async () => {
    const dto = plainToInstance(Dto, {
      email: 'no',
      password: '1',
      type: 'C',
    });
    const { errors, message } = toValidationException(await validate(dto));
    expect(message).toBe(
      '요청 값이 올바르지 않습니다. (email: 이메일 형식이 올바르지 않습니다. 외 2건)',
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', code: 'EMAIL_INVALID' }),
        expect.objectContaining({
          field: 'password',
          code: 'MIN_LENGTH',
          details: { limit: 8 },
        }),
        expect.objectContaining({
          field: 'type',
          code: 'INVALID_ENUM',
          details: { allowed: ['A', 'B'] },
        }),
      ]),
    );
  });
});
