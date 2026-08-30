import { telegramService } from '../src/services/telegram.service';
import { prisma } from '../src/config';

describe('Telegram Webhook Idempotency & Deduplication Test Suite', () => {
  it('should process a webhook update once and reject duplicate update_ids', async () => {
    const testUpdateId = 99990001;

    const fakeUpdate = {
      update_id: testUpdateId,
      message: {
        message_id: 12345,
        from: {
          id: 888888,
          first_name: 'Test',
          username: 'tester',
        },
        chat: {
          id: 888888,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Spent 180 on coffee',
      },
    };

    // First time: should handle and save
    const firstAttempt = await telegramService.processUpdate(fakeUpdate);
    expect(firstAttempt.handled).toBe(true);

    // Second time (simulating Telegram retry): should identify duplicate update_id and not process again
    const secondAttempt = await telegramService.processUpdate(fakeUpdate);
    expect(secondAttempt.handled).toBe(true);

    // Verify exactly one record exists in TelegramUpdate table for this update_id
    const dbRecordCount = await prisma.telegramUpdate.count({
      where: { updateId: String(testUpdateId) },
    });
    expect(dbRecordCount).toBe(1);
  });
});
