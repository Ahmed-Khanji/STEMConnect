const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, default: null },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    oauthId: { type: String, unique: true, sparse: true, default: null },
    refreshToken: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);