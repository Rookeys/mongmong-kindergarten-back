import { TestingModule } from '@nestjs/testing';
import { LetterReportReasonType } from '../src/modules/letter/enums/letter-report-reason-type.enum';
import { LetterReportStatus } from '../src/modules/letter/enums/letter-report-status.enum';
import { LetterReportService } from '../src/modules/letter/letter-report.service';
import { LetterService } from '../src/modules/letter/letter.service';
import {
  createTestModule,
  createUser,
  seedQuestions,
} from './support/create-test-module';

describe('신고 처리', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    await seedQuestions(moduleRef);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('신고가 인정(resolved)되면 휴게실에서 내려가고, 기각되면 남는다', async () => {
    const letterService = moduleRef.get(LetterService);
    const letterReportService = moduleRef.get(LetterReportService);
    const reportedWriter = await createUser(moduleRef);
    const normalWriter = await createUser(moduleRef);
    const reporter = await createUser(moduleRef);
    const reportedLetter = await letterService.create(reportedWriter.id, {
      answer: '신고될 일지',
      isPrivate: false,
    });
    const normalLetter = await letterService.create(normalWriter.id, {
      answer: '평범한 일지',
      isPrivate: false,
    });
    const report = await letterService.addReport(
      reporter.id,
      reportedLetter.id,
      { reasonType: LetterReportReasonType.ABUSE },
    );
    const query = { questionId: reportedLetter.questionId };

    const beforeResolve = await letterService.findPublic(reporter.id, query);
    await letterReportService.updateStatus(report.id, {
      status: LetterReportStatus.RESOLVED,
    });
    const afterResolve = await letterService.findPublic(reporter.id, query);

    expect(beforeResolve.map((letter) => letter.id)).toEqual(
      expect.arrayContaining([reportedLetter.id, normalLetter.id]),
    );
    expect(afterResolve.map((letter) => letter.id)).toEqual([normalLetter.id]);
    expect(
      await letterReportService.findAll({
        status: LetterReportStatus.RESOLVED,
      }),
    ).toEqual([expect.objectContaining({ id: report.id })]);
  });
});
