const EventType = require("../../model/eventType");
const MeetingBooking = require("../../model/meetingBooking");
const User = require("../../model/user");
const GoogleCalendarService = require("../../services/googleCalendarService");
const meetingController = require("../../controller/meetingController");

describe("Meeting Controller & Google Calendar Service", () => {
  let originalUserFindById;
  let originalUserFindByIdAndUpdate;

  beforeAll(() => {
    originalUserFindById = User.findById;
    originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
  });

  afterEach(() => {
    User.findById = originalUserFindById;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
    jest.restoreAllMocks();
  });

  describe("GoogleCalendarService", () => {
    it("should return false for isConfigured when env vars are missing", () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_ID;

      expect(GoogleCalendarService.isConfigured()).toBe(false);

      process.env.GOOGLE_CLIENT_ID = originalClientId;
    });

    it("should generate mock calendar event and meet link when not connected", async () => {
      const mockUser = {
        email: "host@example.com",
        name: "Host User",
        googleCalendarTokens: { isConnected: false },
      };

      const bookingDetails = {
        title: "30 Min Discovery Call",
        description: "Initial Chat",
        startTime: new Date("2026-09-01T10:00:00.000Z"),
        endTime: new Date("2026-09-01T10:30:00.000Z"),
        attendeeName: "Jane Doe",
        attendeeEmail: "jane@example.com",
        locationType: "google_meet",
      };

      const result = await GoogleCalendarService.createCalendarEvent(mockUser, bookingDetails);

      expect(result.eventId).toBeDefined();
      expect(result.meetingLink).toMatch(/^https:\/\/meet\.google\.com\//);
      expect(result.isMock).toBe(true);
    });
  });

  describe("Meeting Controller Unit Logic", () => {
    let req, res;
    const userId = "60d5ecb8b5c9c22b1c8e1111";

    beforeEach(() => {
      req = {
        user: { id: userId, name: "Alex Creator", alias: "alex" },
        body: {},
        params: {},
        query: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
      };
    });

    it("uses the JWT user id when listing event types", async () => {
      const sort = jest.fn().mockResolvedValue([]);
      const find = jest.spyOn(EventType, "find").mockReturnValue({ sort });

      await meetingController.getEventTypes(req, res);

      expect(find).toHaveBeenCalledWith({ userId });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("uses the JWT user id when creating an event type", async () => {
      const findOne = jest.spyOn(EventType, "findOne").mockResolvedValue(null);
      const createdEventType = { _id: "event-1", userId, title: "Discovery Call" };
      const create = jest.spyOn(EventType, "create").mockResolvedValue(createdEventType);
      req.body = { title: "Discovery Call", duration: 30 };

      await meetingController.createEventType(req, res);

      expect(findOne).toHaveBeenCalledWith({ userId, slug: "discovery-call" });
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ userId, title: "Discovery Call", duration: 30 })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("uses the JWT user id when updating an event type", async () => {
      const eventType = { _id: "event-1", userId, title: "Discovery Call" };
      const findOne = jest.spyOn(EventType, "findOne").mockResolvedValue(eventType);
      const findByIdAndUpdate = jest
        .spyOn(EventType, "findByIdAndUpdate")
        .mockResolvedValue({ ...eventType, description: "Updated" });
      req.params = { id: "event-1" };
      req.body = { description: "Updated" };

      await meetingController.updateEventType(req, res);

      expect(findOne).toHaveBeenCalledWith({ _id: "event-1", userId });
      expect(findByIdAndUpdate).toHaveBeenCalledWith(
        "event-1",
        req.body,
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("uses the JWT user id when deleting an event type", async () => {
      const findOneAndDelete = jest
        .spyOn(EventType, "findOneAndDelete")
        .mockResolvedValue({ _id: "event-1", userId });
      req.params = { id: "event-1" };

      await meetingController.deleteEventType(req, res);

      expect(findOneAndDelete).toHaveBeenCalledWith({ _id: "event-1", userId });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("uses the JWT user id when listing bookings", async () => {
      const sort = jest.fn().mockResolvedValue([]);
      const populate = jest.fn().mockReturnValue({ sort });
      const find = jest.spyOn(MeetingBooking, "find").mockReturnValue({ populate });

      await meetingController.getUserBookings(req, res);

      expect(find).toHaveBeenCalledWith({ userId });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("uses the JWT user id when cancelling an owned booking", async () => {
      const booking = {
        userId: { toString: () => userId },
        status: "scheduled",
        cancelReason: undefined,
        googleEventId: null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      const findById = jest.spyOn(MeetingBooking, "findById").mockResolvedValue(booking);
      req.params = { id: "booking-1" };
      req.body = { cancelReason: "Schedule change" };

      await meetingController.cancelBooking(req, res);

      expect(findById).toHaveBeenCalledWith("booking-1");
      expect(booking.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("uses the JWT user id for Google Calendar status", async () => {
      const findById = jest.fn().mockResolvedValue({
        googleCalendarTokens: { isConnected: true },
      });
      const original = User.findById;
      User.findById = findById;
      const getAuthUrl = jest
        .spyOn(GoogleCalendarService, "getAuthUrl")
        .mockReturnValue("https://calendar.example/auth");
      jest.spyOn(GoogleCalendarService, "isConfigured").mockReturnValue(true);

      await meetingController.getGoogleCalendarStatus(req, res);

      expect(findById).toHaveBeenCalledWith(userId);
      expect(getAuthUrl).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      User.findById = original;
    });

    it("uses the JWT user id when connecting Google Calendar", async () => {
      const getAuthUrl = jest
        .spyOn(GoogleCalendarService, "getAuthUrl")
        .mockReturnValue("https://calendar.example/auth");

      await meetingController.connectGoogleCalendar(req, res);

      expect(getAuthUrl).toHaveBeenCalledWith(userId);
      expect(res.redirect).toHaveBeenCalledWith("https://calendar.example/auth");
    });

    it("uses the JWT user id when disconnecting Google Calendar", async () => {
      const findByIdAndUpdate = jest.fn().mockResolvedValue({});
      const original = User.findByIdAndUpdate;
      User.findByIdAndUpdate = findByIdAndUpdate;

      await meetingController.disconnectGoogleCalendar(req, res);

      expect(findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          googleCalendarTokens: expect.objectContaining({ isConnected: false }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      User.findByIdAndUpdate = original;
    });

    it("should reject createEventType if title or duration is missing", async () => {
      req.body = { description: "Missing title and duration" };
      await meetingController.createEventType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringMatching(/required/i) })
      );
    });

    it("should reject getAvailableSlots if date parameter is missing", async () => {
      req.params = { alias: "alex", slug: "30-min-call" };
      req.query = {}; // missing date

      await meetingController.getAvailableSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringMatching(/Date query parameter is required/i) })
      );
    });

    it("should reject createBooking if required attendee details are missing", async () => {
      req.params = { alias: "alex", slug: "30-min-call" };
      req.body = { attendeeName: "John" }; // missing attendeeEmail and startTime

      await meetingController.createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringMatching(/required/i) })
      );
    });
  });
});
