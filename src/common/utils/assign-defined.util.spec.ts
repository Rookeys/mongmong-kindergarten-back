import { assignDefined } from './assign-defined.util';

class PatchDto {
  name?: string;
  cost?: number;
}

describe('assignDefined', () => {
  it('보내지 않아 undefined인 필드는 기존 값을 지우지 않는다', () => {
    const target = { name: '왕관', cost: 30 };
    const patch = Object.assign(new PatchDto(), { cost: 10 });

    const actual = assignDefined(target, patch);

    expect(actual).toEqual({ name: '왕관', cost: 10 });
  });
});
