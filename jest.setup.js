const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
        mongod = await MongoMemoryServer.create();
        process.env.MONGODB_URI = mongod.getUri();
    }
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';

    await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    } catch (error) {
        // Some tests replace parts of the mongoose connection object with read-only mocks.
        // Cleanup should not turn an otherwise successful suite into a teardown failure.
        if (!/read only property ['"]readyState['"]/.test(error?.message || "")) {
            throw error;
        }
    }

    if (mongod) {
        await mongod.stop();
    }
});
