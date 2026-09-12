const express = require('express');
const request = require('supertest');
const { validateCreateBooking } = require('../../middleware/validators/meetingValidator');

const app = express();
app.use(express.json());
app.post('/book', validateCreateBooking, (req, res) => {
  res.status(200).json({ success: true, body: req.body });
});

describe('validateCreateBooking', () => {
  test('accepts the payload emitted by the public booking page', async () => {
    const response = await request(app)
      .post('/book')
      .send({
        attendeeName: 'Jane Doe',
        attendeeEmail: 'jane@example.com',
        attendeeNotes: 'Looking forward to the call.',
        startTime: '2026-09-20T10:00:00.000Z',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('rejects a booking when attendee name is missing', async () => {
    const response = await request(app)
      .post('/book')
      .send({
        attendeeEmail: 'jane@example.com',
        startTime: '2026-09-20T10:00:00.000Z',
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.some((error) => error.field === 'attendeeName')).toBe(true);
  });

  test('rejects a booking when start time is missing', async () => {
    const response = await request(app)
      .post('/book')
      .send({
        attendeeName: 'Jane Doe',
        attendeeEmail: 'jane@example.com',
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.some((error) => error.field === 'startTime')).toBe(true);
  });
});
