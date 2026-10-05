import { JwtGuard } from './jwt.guard';

describe('JwtGuard.handleRequest', () => {
  const guard = new JwtGuard();
  const codeOf = (info: Error) => {
    try {
      guard.handleRequest(null, false, info);
    } catch (e) {
      return (e as { code: string }).code;
    }
  };

  it('토큰 없음/만료/위조를 구분한다', () => {
    expect(codeOf(new Error('No auth token'))).toBe('AUTH_TOKEN_MISSING');
    expect(
      codeOf(
        Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' }),
      ),
    ).toBe('AUTH_TOKEN_EXPIRED');
    expect(
      codeOf(
        Object.assign(new Error('invalid signature'), {
          name: 'JsonWebTokenError',
        }),
      ),
    ).toBe('AUTH_TOKEN_INVALID');
  });

  it('인증 성공 시 user를 그대로 반환한다', () => {
    expect(guard.handleRequest(null, { sub: '1' })).toEqual({ sub: '1' });
  });
});
