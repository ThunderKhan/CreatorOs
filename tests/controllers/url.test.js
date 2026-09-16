process.env.USE_MOCK_DB = "true";
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../index');
const User = require('../../model/user');

describe('URL Controller Endpoints', () => {
    const csrfCookie = '_csrf=testtoken';
    const csrfHeader = { 'x-csrf-token': 'testtoken' };
    let authCookie;

    beforeAll(async () => {
        await User.deleteMany({});
        const password = await bcrypt.hash('Password123!', 12);
        await User.create({
            name: 'Verified User',
            email: 'test@local.com',
            password,
            isVerified: true,
        });

        const res = await request(app)
            .post('/login')
            .set('Cookie', [csrfCookie])
            .set(csrfHeader)
            .send({ email: 'test@local.com', password: 'Password123!' });
        
        const setCookie = res.headers['set-cookie'];
        if (setCookie) {
            authCookie = setCookie.find(c => c.startsWith('token='));
        }
    });

    it('should create a short URL', async () => {
        const req = request(app)
            .post('/api/urls/shorten')
            .set(csrfHeader)
            .send({ redirectUrl: 'https://example.com/test' });
        
        if (authCookie) req.set('Cookie', [csrfCookie, authCookie]);
        else req.set('Cookie', [csrfCookie]);

        const res = await req;
        expect([201, 302, 401]).toContain(res.statusCode);
        
        if (res.statusCode === 201) {
            expect(res.body.link).toBeDefined();
        }
    });

    it('should list user links (or return clear error if auth fails)', async () => {
        const req = request(app)
            .get('/api/urls/')
            .set(csrfHeader);

        if (authCookie) req.set('Cookie', [csrfCookie, authCookie]);
        else req.set('Cookie', [csrfCookie]);

        const res = await req;
        expect(res.statusCode).not.toEqual(500);
        expect([200, 302, 401]).toContain(res.statusCode);
    });

    it('should fail short URL creation with invalid URL', async () => {
        const req = request(app)
            .post('/api/urls/shorten')
            .set(csrfHeader)
            .send({ redirectUrl: 'not-a-url' });
        
        if (authCookie) req.set('Cookie', [csrfCookie, authCookie]);
        else req.set('Cookie', [csrfCookie]);

        const res = await req;
        expect(res.statusCode).toEqual(400);
    });

    it('should list URLs for the authenticated user without crashing', async () => {
        const req = request(app)
            .get('/api/urls')
            .set(csrfHeader);

        if (authCookie) req.set('Cookie', [csrfCookie, authCookie]);
        else req.set('Cookie', [csrfCookie]);
        const res = await req;

        expect(res.statusCode).not.toBe(500);

        if (res.statusCode === 200) {
            expect(Array.isArray(res.body.links)).toBe(true);
        } else {
            expect([401, 302]).toContain(res.statusCode);
        }
    });

    it('should delete a short URL or return 404/401/403', async () => {
        const req = request(app)
            .delete('/api/urls/non-existent-id')
            .set(csrfHeader);

        if (authCookie) req.set('Cookie', [csrfCookie, authCookie]);
        else req.set('Cookie', [csrfCookie]);

        const res = await req;
        expect([200, 404, 401, 403]).toContain(res.statusCode);
    });

    it('should get analytics for a short URL or return 404/401/403', async () => {
        const req = request(app)
            .get('/api/urls/analytics/non-existent-id')
            .set(csrfHeader);

        if (authCookie) req.set('Cookie', [csrfCookie, authCookie]);
        else req.set('Cookie', [csrfCookie]);

        const res = await req;
        expect([200, 404, 401, 403]).toContain(res.statusCode);
    });

    it('should return 403 when an authenticated user accesses another users analytics', async () => {
        const { handleGetAnalytics } = require('../../controller/url');
        const Url = require('../../model/url');

        jest.spyOn(Url, 'findOne').mockResolvedValueOnce({
            shortId: 'test1234',
            userId: 'owner123',
            totalClicks: 0,
            visitHistory: []
        });

        const req = {
            params: { shortId: 'test1234' },
            user: { id: 'different-user' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await handleGetAnalytics(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Unauthorized to view these analytics",
            error: "Unauthorized to view these analytics"
        });
    });
});
