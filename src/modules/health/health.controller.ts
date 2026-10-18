import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

/**
 * 헬스체크 API 컨트롤러 (로드밸런서·모니터링용, 인증 불필요)
 */
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 서버와 DB 연결 상태 확인
   */
  @Get()
  @ApiOperation({
    summary: '헬스체크',
    description: 'DB에 SELECT 1을 보내 응답하면 ok. DB가 죽어 있으면 500.',
  })
  @ApiOkResponse({ description: '정상', schema: { example: { status: 'ok' } } })
  async check(): Promise<{ status: string }> {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
