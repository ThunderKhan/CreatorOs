jest.mock('../model/dmTrigger', () => ({
    find: jest.fn(),
}));

const DmTrigger = require('../model/dmTrigger');
const { findActiveDmTriggers } = require('../services/dmTriggerMatcher');

describe('DM trigger matcher', () => {
    const originalLimit = process.env.MAX_DM_TRIGGERS_PER_CREATOR;

    afterEach(() => {
        jest.clearAllMocks();
        if (originalLimit === undefined) {
            delete process.env.MAX_DM_TRIGGERS_PER_CREATOR;
        } else {
            process.env.MAX_DM_TRIGGERS_PER_CREATOR = originalLimit;
        }
    });

    it('applies the configured per-creator limit before loading active triggers', async () => {
        process.env.MAX_DM_TRIGGERS_PER_CREATOR = '25';
        const lean = jest.fn().mockResolvedValue([{ keyword: 'help' }]);
        const limit = jest.fn().mockReturnValue({ lean });
        DmTrigger.find.mockReturnValue({ limit });

        const result = await findActiveDmTriggers('creator-id');

        expect(DmTrigger.find).toHaveBeenCalledWith({
            creatorId: 'creator-id',
            isActive: true,
        });
        expect(limit).toHaveBeenCalledWith(25);
        expect(lean).toHaveBeenCalledTimes(1);
        expect(result).toEqual([{ keyword: 'help' }]);
    });
});
