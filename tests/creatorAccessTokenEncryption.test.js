const mongoose = require("mongoose");

process.env.CREATOR_TOKEN_ENCRYPTION_KEY = "11".repeat(32);
delete process.env.CREATOR_TOKEN_ENCRYPTION_KEY_PREVIOUS;

const Creator = require("../model/creator");
const {
    encryptSecret,
    decryptSecret,
    isEncryptedSecret,
} = require("../services/tokenEncryption");

describe("Creator access-token encryption", () => {
    it("encrypts and decrypts creator access tokens", () => {
        const token = "instagram-secret-token";
        const encrypted = encryptSecret(token);

        expect(encrypted).not.toBe(token);
        expect(isEncryptedSecret(encrypted)).toBe(true);
        expect(decryptSecret(encrypted)).toBe(token);
    });

    it("stores ciphertext in MongoDB and decrypts only at the model boundary", async () => {
        const token = "creator-token-at-rest";
        const creator = new Creator({
            userId: new mongoose.Types.ObjectId(),
            username: "token-test-creator",
            platform: "instagram",
            platformId: "ig-token-test",
            accessToken: token,
        });

        await creator.save();

        const stored = await Creator.collection.findOne({ _id: creator._id });
        expect(stored.accessToken).not.toBe(token);
        expect(isEncryptedSecret(stored.accessToken)).toBe(true);

        const loaded = await Creator.findById(creator._id);
        expect(loaded.accessToken).toBe(token);

        const serialized = loaded.toJSON();
        expect(serialized.accessToken).toBeUndefined();
        expect(JSON.stringify(serialized)).not.toContain(token);
    });
});
