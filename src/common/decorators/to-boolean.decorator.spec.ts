import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { ToBoolean } from './to-boolean.decorator';

class QueryDto {
  @ToBoolean()
  isOnSale?: boolean;
}

describe('ToBoolean', () => {
  it("암묵 변환을 켜도 'false'는 false다", () => {
    const actual = plainToInstance(
      QueryDto,
      { isOnSale: 'false' },
      { enableImplicitConversion: true },
    );

    expect(actual.isOnSale).toBe(false);
  });
});
