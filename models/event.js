const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  time: String,
  description: String,
  category: String,
  venueName: String,
  address: String,
  city: String,
  image: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ Added event creator
  isApproved: { type: Boolean, default: false }  // ✅ New field for admin approval
});

module.exports = mongoose.model('Event', eventSchema);
