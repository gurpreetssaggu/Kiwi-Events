const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: false }, // ❌ Not required for OTP users
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // ❌ Not required for OTP users
    otp: { type: String, required: false } // ✅ Allow OTP field
});

module.exports = mongoose.model('User', userSchema);
