describe('DM queue Redis fallback', () => {
  const originalRedisUri = process.env.REDIS_URI;
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URI;
    delete process.env.REDIS_URL;
    jest.resetModules();
  });

  afterEach(() => {
    if (originalRedisUri === undefined) {
      delete process.env.REDIS_URI;
    } else {
      process.env.REDIS_URI = originalRedisUri;
    }

    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('rejects fallback queue writes instead of acknowledging a missing job', async () => {
    const { dmQueue } = require('../services/dmQueueService');

    await expect(
      dmQueue.add('process-dm', {
        senderId: 'sender-1',
        recipientId: 'creator-1',
      }),
    ).rejects.toMatchObject({
      code: 'DM_QUEUE_UNAVAILABLE',
      jobName: 'process-dm',
    });
  });
});
