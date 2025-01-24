const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String },
    start: { type: Date },
    end: { type: Date },
    allDay: { type: Boolean },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // Reference to the user who created the event
});

const Event = mongoose.model('Event', eventSchema); // Collection

module.exports = Event;
