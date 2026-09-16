const {
    isRetryableDmError,
} = require('../services/dmQueueService');

describe('DM delivery retry policy', () => {
    it.each([400, 401, 403, 404])(
        'does not retry permanent HTTP %s failures',
        (status) => {
            expect(isRetryableDmError({ status })).toBe(false);
        },
    );

    it.each([408, 429, 500, 502, 503, 504])(
        'retries transient HTTP %s failures',
        (status) => {
            expect(isRetryableDmError({ status })).toBe(true);
        },
    );

    it('retries transport failures without an HTTP status', () => {
        expect(isRetryableDmError(new Error('socket closed'))).toBe(true);
    });

    it('does not classify malformed status values as permanent HTTP failures', () => {
        expect(isRetryableDmError({ status: 'not-a-status' })).toBe(true);
    });
});
