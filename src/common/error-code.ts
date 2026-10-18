import { HttpStatus } from '@nestjs/common';

/**
 * 프론트가 분기하는 에러 코드. 사유 1개 = 코드 1개.
 * 새 코드를 추가하면 ERROR_META에도 status/message를 등록해야 한다(Record 타입이 강제).
 */
export enum ErrorCode {
  // 공통
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_IN_USE = 'RESOURCE_IN_USE',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // 인증/인가
  AUTH_EMAIL_NOT_FOUND = 'AUTH_EMAIL_NOT_FOUND',
  AUTH_WRONG_PASSWORD = 'AUTH_WRONG_PASSWORD',
  AUTH_SOCIAL_ACCOUNT = 'AUTH_SOCIAL_ACCOUNT',
  AUTH_PASSWORD_NOT_SET = 'AUTH_PASSWORD_NOT_SET',
  AUTH_ACCOUNT_INACTIVE = 'AUTH_ACCOUNT_INACTIVE',
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_REFRESH_TOKEN_INVALID',
  FORBIDDEN_ROLE = 'FORBIDDEN_ROLE',
  KAKAO_TOKEN_INVALID = 'KAKAO_TOKEN_INVALID',
  KAKAO_PROFILE_UNAVAILABLE = 'KAKAO_PROFILE_UNAVAILABLE',
  KAKAO_UPSTREAM_ERROR = 'KAKAO_UPSTREAM_ERROR',

  // 사용자
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVITE_CODE_INVALID = 'INVITE_CODE_INVALID',
  INVITE_ALREADY_REGISTERED = 'INVITE_ALREADY_REGISTERED',
  INVITE_CODE_TOO_LATE = 'INVITE_CODE_TOO_LATE',

  // 질문
  QUESTION_SERIES_NOT_FOUND = 'QUESTION_SERIES_NOT_FOUND',
  QUESTION_NOT_FOUND = 'QUESTION_NOT_FOUND',
  QUESTION_CONTENT_NOT_FOUND = 'QUESTION_CONTENT_NOT_FOUND',
  DATE_IN_FUTURE = 'DATE_IN_FUTURE',

  // 일지/AI 답장
  LETTER_NOT_FOUND = 'LETTER_NOT_FOUND',
  LETTER_REPORT_OWN_LETTER = 'LETTER_REPORT_OWN_LETTER',
  LETTER_REPORT_NOT_FOUND = 'LETTER_REPORT_NOT_FOUND',
  LETTER_REPORT_ALREADY_EXISTS = 'LETTER_REPORT_ALREADY_EXISTS',
  LETTER_ALREADY_EXISTS = 'LETTER_ALREADY_EXISTS',
  LETTER_EDIT_EXPIRED = 'LETTER_EDIT_EXPIRED',
  AI_REPLY_NOT_FOUND = 'AI_REPLY_NOT_FOUND',

  // 캐릭터/아이템
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  ITEM_NOT_ON_SALE = 'ITEM_NOT_ON_SALE',
  CHARACTER_ITEM_ALREADY_OWNED = 'CHARACTER_ITEM_ALREADY_OWNED',
  CHARACTER_ITEM_NOT_OWNED = 'CHARACTER_ITEM_NOT_OWNED',
  REWARD_INSUFFICIENT = 'REWARD_INSUFFICIENT',
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
  CHARACTER_GRADUATION_NOT_READY = 'CHARACTER_GRADUATION_NOT_READY',
  CHARACTER_TYPE_NOT_FOUND = 'CHARACTER_TYPE_NOT_FOUND',
  CHARACTER_TYPE_NOT_REGISTERED = 'CHARACTER_TYPE_NOT_REGISTERED',

  // 리워드
  ATTENDANCE_ALREADY_CHECKED = 'ATTENDANCE_ALREADY_CHECKED',

  // 공지
  NOTICE_NOT_FOUND = 'NOTICE_NOT_FOUND',
}

export const ERROR_META: Record<
  ErrorCode,
  { status: HttpStatus; message: string }
> = {
  [ErrorCode.VALIDATION_FAILED]: {
    status: HttpStatus.BAD_REQUEST,
    message: '요청 값이 올바르지 않습니다.',
  },
  [ErrorCode.BAD_REQUEST]: {
    status: HttpStatus.BAD_REQUEST,
    message: '잘못된 요청입니다.',
  },
  [ErrorCode.UNAUTHORIZED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '인증이 필요합니다.',
  },
  [ErrorCode.FORBIDDEN]: {
    status: HttpStatus.FORBIDDEN,
    message: '접근이 거부되었습니다.',
  },
  [ErrorCode.NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '요청한 리소스를 찾을 수 없습니다.',
  },
  [ErrorCode.CONFLICT]: {
    status: HttpStatus.CONFLICT,
    message: '요청이 현재 상태와 충돌합니다.',
  },
  [ErrorCode.DUPLICATE_RESOURCE]: {
    status: HttpStatus.CONFLICT,
    message: '이미 존재하는 값입니다.',
  },
  [ErrorCode.RESOURCE_IN_USE]: {
    status: HttpStatus.CONFLICT,
    message: '다른 데이터에서 사용 중이라 처리할 수 없습니다.',
  },
  [ErrorCode.TOO_MANY_REQUESTS]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  [ErrorCode.INTERNAL_ERROR]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: '서버 내부 오류가 발생했습니다.',
  },

  [ErrorCode.AUTH_EMAIL_NOT_FOUND]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '가입되지 않은 이메일입니다.',
  },
  [ErrorCode.AUTH_WRONG_PASSWORD]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '비밀번호가 올바르지 않습니다.',
  },
  [ErrorCode.AUTH_SOCIAL_ACCOUNT]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '소셜 로그인으로 가입된 계정입니다. 해당 방식으로 로그인해주세요.',
  },
  [ErrorCode.AUTH_PASSWORD_NOT_SET]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '비밀번호가 설정되지 않은 계정입니다.',
  },
  [ErrorCode.AUTH_ACCOUNT_INACTIVE]: {
    status: HttpStatus.FORBIDDEN,
    message: '사용할 수 없는 계정입니다.',
  },
  [ErrorCode.AUTH_TOKEN_MISSING]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '인증 토큰이 없습니다.',
  },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '인증 토큰이 만료되었습니다.',
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '유효하지 않은 인증 토큰입니다.',
  },
  [ErrorCode.AUTH_REFRESH_TOKEN_INVALID]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  },
  [ErrorCode.FORBIDDEN_ROLE]: {
    status: HttpStatus.FORBIDDEN,
    message: '접근 권한이 없습니다.',
  },
  [ErrorCode.KAKAO_TOKEN_INVALID]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '유효하지 않은 카카오 Access Token입니다.',
  },
  [ErrorCode.KAKAO_PROFILE_UNAVAILABLE]: {
    status: HttpStatus.UNAUTHORIZED,
    message: '카카오 사용자 정보를 확인할 수 없습니다.',
  },
  [ErrorCode.KAKAO_UPSTREAM_ERROR]: {
    status: HttpStatus.BAD_GATEWAY,
    message: '카카오 서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.',
  },

  [ErrorCode.USER_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '사용자를 찾을 수 없습니다.',
  },
  [ErrorCode.EMAIL_ALREADY_EXISTS]: {
    status: HttpStatus.CONFLICT,
    message: '이미 존재하는 이메일입니다.',
  },
  [ErrorCode.INVITE_CODE_INVALID]: {
    status: HttpStatus.BAD_REQUEST,
    message: '유효하지 않은 친구 초대 코드입니다.',
  },

  [ErrorCode.INVITE_ALREADY_REGISTERED]: {
    status: HttpStatus.CONFLICT,
    message: '이미 친구 초대 코드를 등록했습니다.',
  },
  [ErrorCode.INVITE_CODE_TOO_LATE]: {
    status: HttpStatus.CONFLICT,
    message: '친구 초대 코드는 첫 일지를 쓰기 전에만 입력할 수 있습니다.',
  },
  [ErrorCode.QUESTION_SERIES_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '존재하지 않는 질문 시리즈입니다.',
  },
  [ErrorCode.QUESTION_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '해당 날짜의 질문을 찾을 수 없습니다.',
  },
  [ErrorCode.DATE_IN_FUTURE]: {
    status: HttpStatus.BAD_REQUEST,
    message: '미래 날짜는 사용할 수 없습니다.',
  },
  [ErrorCode.QUESTION_CONTENT_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '질문 콘텐츠를 찾을 수 없습니다.',
  },

  [ErrorCode.LETTER_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '일지를 찾을 수 없습니다.',
  },
  [ErrorCode.LETTER_REPORT_OWN_LETTER]: {
    status: HttpStatus.FORBIDDEN,
    message: '본인 일지는 신고할 수 없습니다.',
  },
  [ErrorCode.LETTER_REPORT_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '신고를 찾을 수 없습니다.',
  },
  [ErrorCode.LETTER_REPORT_ALREADY_EXISTS]: {
    status: HttpStatus.CONFLICT,
    message: '이미 신고한 일지입니다.',
  },
  [ErrorCode.LETTER_ALREADY_EXISTS]: {
    status: HttpStatus.CONFLICT,
    message: '해당 날짜에는 이미 일지를 작성했습니다.',
  },
  [ErrorCode.LETTER_EDIT_EXPIRED]: {
    status: HttpStatus.FORBIDDEN,
    message: '일지 내용은 작성한 당일에만 수정할 수 있습니다.',
  },
  [ErrorCode.AI_REPLY_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'AI 답장을 찾을 수 없습니다.',
  },

  [ErrorCode.ITEM_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '아이템을 찾을 수 없습니다.',
  },
  [ErrorCode.ITEM_NOT_ON_SALE]: {
    status: HttpStatus.CONFLICT,
    message: '판매가 중지된 아이템입니다.',
  },
  [ErrorCode.CHARACTER_ITEM_ALREADY_OWNED]: {
    status: HttpStatus.CONFLICT,
    message: '이미 보유한 아이템입니다.',
  },
  [ErrorCode.CHARACTER_ITEM_NOT_OWNED]: {
    status: HttpStatus.NOT_FOUND,
    message: '보유한 아이템을 찾을 수 없습니다.',
  },
  [ErrorCode.REWARD_INSUFFICIENT]: {
    status: HttpStatus.BAD_REQUEST,
    message: '리워드(꿈조각)가 부족합니다.',
  },
  [ErrorCode.CHARACTER_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '졸업 가능한 캐릭터를 찾을 수 없습니다.',
  },

  [ErrorCode.CHARACTER_GRADUATION_NOT_READY]: {
    status: HttpStatus.CONFLICT,
    message: '아직 졸업할 수 없습니다.',
  },
  [ErrorCode.CHARACTER_TYPE_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '캐릭터 종류를 찾을 수 없습니다.',
  },
  [ErrorCode.CHARACTER_TYPE_NOT_REGISTERED]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: '배정할 캐릭터 종류가 등록되어 있지 않습니다.',
  },
  [ErrorCode.ATTENDANCE_ALREADY_CHECKED]: {
    status: HttpStatus.CONFLICT,
    message: '오늘은 이미 출석체크를 했습니다.',
  },
  [ErrorCode.NOTICE_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: '공지를 찾을 수 없습니다.',
  },
};
