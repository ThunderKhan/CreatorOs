const mongoose = require("mongoose");

const dmTriggerSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    keyword: {
        type: String,
        required: true,
        lowercase: true,
    },
    responseUrl: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

// The worker filters by creator and active state for every inbound DM.
// Keep that query index-backed rather than scanning the entire trigger collection.
dmTriggerSchema.index({ creatorId: 1, isActive: 1 });

module.exports = mongoose.models.DmTrigger || mongoose.model("DmTrigger", dmTriggerSchema);
