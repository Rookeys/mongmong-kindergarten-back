import { Injectable } from '@nestjs/common';
import { AppException } from '../../../common/app-exception';
import { ErrorCode } from '../../../common/error-code';
import { KakaoUserProfile } from '../types/kakao-user-profile.type';

const KAKAO_USER_ME_URL = 'https://kapi.kakao.com/v2/user/me';

/**
 * 카카오 OAuth Access Token 검증 및 사용자 프로필 조회
 */
@Injectable()
export class KakaoAuthService {
  /**
   * 카카오 Access Token으로 사용자 프로필을 조회한다.
   */
  async fetchUserProfile(kakaoAccessToken: string): Promise<KakaoUserProfile> {
    let response: Response;
    try {
      response = await fetch(KAKAO_USER_ME_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${kakaoAccessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });
    } catch {
      throw new AppException(ErrorCode.KAKAO_UPSTREAM_ERROR);
    }
    if (response.status >= 500) {
      throw new AppException(ErrorCode.KAKAO_UPSTREAM_ERROR);
    }
    if (!response.ok) {
      throw new AppException(ErrorCode.KAKAO_TOKEN_INVALID);
    }
    const kakaoUserProfile = (await response.json()) as KakaoUserProfile;
    if (!kakaoUserProfile.id) {
      throw new AppException(ErrorCode.KAKAO_PROFILE_UNAVAILABLE);
    }
    return kakaoUserProfile;
  }

  /**
   * 카카오 프로필에서 이메일을 추출한다.
   */
  extractEmail(kakaoUserProfile: KakaoUserProfile): string | null {
    return kakaoUserProfile.kakao_account?.email ?? null;
  }

  /**
   * 카카오 프로필에서 닉네임을 추출한다.
   */
  extractNickname(kakaoUserProfile: KakaoUserProfile): string | null {
    return (
      kakaoUserProfile.kakao_account?.profile?.nickname ??
      kakaoUserProfile.properties?.nickname ??
      null
    );
  }
}
