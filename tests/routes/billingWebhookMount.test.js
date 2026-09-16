const fs = require('fs');
const path = require('path');

describe('billing webhook mount order', () => {
    test('mounts the raw Stripe webhook before global json parsing', () => {
        const indexSource = fs.readFileSync(path.join(__dirname, '../../index.js'), 'utf8');

        const webhookIndex = indexSource.indexOf('app.post(\"/api/billing/webhook\",');
        const rawParserIndex = indexSource.indexOf('express.raw({ type: \"application/json\" })', webhookIndex);
        const jsonParserIndex = indexSource.indexOf('app.use(\n  express.json', rawParserIndex);

        expect(webhookIndex).toBeGreaterThan(-1);
        expect(rawParserIndex).toBeGreaterThan(webhookIndex);
        expect(jsonParserIndex).toBeGreaterThan(-1);
        expect(webhookIndex).toBeLessThan(jsonParserIndex);
    });

    test('does not remount the webhook inside the parsed billing router', () => {
        const routeSource = fs.readFileSync(path.join(__dirname, '../../routes/billing.js'), 'utf8');

        expect(routeSource).not.toContain('router.post("/webhook"');
    });
});
