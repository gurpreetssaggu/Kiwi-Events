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
  image: String, // Store filename of uploaded image
});

module.exports = mongoose.model('Event', eventSchema);
