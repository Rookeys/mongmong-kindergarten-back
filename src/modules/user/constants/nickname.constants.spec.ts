import { NICKNAME_PATTERN } from './nickname.constants';

describe('NICKNAME_PATTERN', () => {
  it.each(['진주', 'mong12', 'もんもん', 'モンモン', '夢見る子', 'ハム몽'])(
    '%s 허용',
    (nickname) => {
      expect(NICKNAME_PATTERN.test(nickname)).toBe(true);
    },
  );

  it.each(['진', 'Mong', '진 주', 'mong!', '아주아주긴닉네임이야', 'ｍｏｎｇ'])(
    '%s 거부',
    (nickname) => {
      expect(NICKNAME_PATTERN.test(nickname)).toBe(false);
    },
  );
});
