const {
    DEFAULT_MAX_DM_TRIGGERS_PER_CREATOR,
    getMaxDmTriggersPerCreator,
} = require('../services/dmTriggerPolicy');

describe('DM trigger policy', () => {
    const originalLimit = process.env.MAX_DM_TRIGGERS_PER_CREATOR;

    afterEach(() => {
        if (originalLimit === undefined) {
            delete process.env.MAX_DM_TRIGGERS_PER_CREATOR;
        } else {
            process.env.MAX_DM_TRIGGERS_PER_CREATOR = originalLimit;
        }
    });

    it('uses the default trigger limit when no override is configured', () => {
        delete process.env.MAX_DM_TRIGGERS_PER_CREATOR;
        expect(getMaxDmTriggersPerCreator()).toBe(
            DEFAULT_MAX_DM_TRIGGERS_PER_CREATOR,
        );
    });

    it('accepts a positive configured trigger limit', () => {
        process.env.MAX_DM_TRIGGERS_PER_CREATOR = '250';
        expect(getMaxDmTriggersPerCreator()).toBe(250);
    });

    it.each(['0', '-1', 'not-a-number'])(
        'falls back to the default for invalid limit %s',
        (value) => {
            process.env.MAX_DM_TRIGGERS_PER_CREATOR = value;
            expect(getMaxDmTriggersPerCreator()).toBe(
                DEFAULT_MAX_DM_TRIGGERS_PER_CREATOR,
            );
        },
    );
});
