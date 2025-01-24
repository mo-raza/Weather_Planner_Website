const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    events: [{ type: Object }]  // to store user-specific events
  });
  
const User = mongoose.model('User', userSchema); // Collection

module.exports = User;  // Export the model
  