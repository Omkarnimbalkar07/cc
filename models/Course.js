const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    id: Number, // Keeping compat with frontend ID
    title: String,
    code: String,
    description: String,
    icon: String
});

module.exports = mongoose.model('Course', CourseSchema);
