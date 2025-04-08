const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    otp: { type: String, required: false },
    isAdmin: { type: Boolean, default: false }  // ✅ Added admin field
});

module.exports = mongoose.model('User', userSchema);
