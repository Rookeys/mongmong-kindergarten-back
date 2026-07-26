const INVITE_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;

/**
 * 사용자 초대 코드를 생성한다.
 */
export function createInviteCode(): string {
  let inviteCode = '';
  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * INVITE_CODE_CHARACTERS.length);
    inviteCode += INVITE_CODE_CHARACTERS[randomIndex];
  }
  return inviteCode;
}
