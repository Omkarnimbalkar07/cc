const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const User = require('./models/User');
const Course = require('./models/Course');

const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// MongoDB Connection  ✅ FIXED
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error(err));

// Seed Courses
const initialCourses = [
    { id: 1, title: 'Web Development Bootcamp', code: 'CS101', description: 'Master HTML, CSS, and JavaScript.', icon: 'fa-code' },
    { id: 2, title: 'Data Science Fundamentals', code: 'DS200', description: 'Learn Python, Pandas, and ML.', icon: 'fa-database' },
    { id: 3, title: 'UI/UX Design Mastery', code: 'DES305', description: 'Create stunning user interfaces.', icon: 'fa-pen-nib' },
    { id: 4, title: 'Cloud Computing AWS', code: 'CLD401', description: 'Deploy scalable applications.', icon: 'fa-cloud' },
    { id: 5, title: 'Mobile App with Flutter', code: 'MOB102', description: 'Build native iOS and Android apps.', icon: 'fa-mobile-screen' },
    { id: 6, title: 'Cybersecurity Basics', code: 'SEC250', description: 'Protect systems and networks.', icon: 'fa-shield-halved' }
];

async function seedCourses() {
    const count = await Course.countDocuments();
    if (count === 0) {
        await Course.insertMany(initialCourses);
        console.log('Courses seeded');
    }
}
seedCourses();

// Routes

// Login / Register
app.post('/api/auth/login', async (req, res) => {
    const { studentId, password } = req.body;
    try {
        let user = await User.findOne({ studentId });
        if (!user) {
            user = new User({ studentId, password });
            await user.save();
        } else if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({ success: true, studentId: user.studentId });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get All Courses
app.get('/api/courses', async (req, res) => {
    const courses = await Course.find({});
    res.json(courses);
});

// Get User's Courses
app.get('/api/user/:studentId/courses', async (req, res) => {
    const user = await User.findOne({ studentId: req.params.studentId }).populate('selectedCourses');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.selectedCourses);
});

// Toggle Course Selection
app.post('/api/user/:studentId/courses', async (req, res) => {
    const { courseId } = req.body;
    try {
        const user = await User.findOne({ studentId: req.params.studentId });
        const course = await Course.findOne({ id: courseId });
        
        if (!user || !course) return res.status(404).json({ message: 'Not found' });

        const courseIndex = user.selectedCourses.indexOf(course._id);
        if (courseIndex > -1) {
            user.selectedCourses.splice(courseIndex, 1);
        } else {
            user.selectedCourses.push(course._id);
        }
        
        await user.save();
        
        const updatedUser = await User.findOne({ studentId: req.params.studentId }).populate('selectedCourses');
        res.json(updatedUser.selectedCourses);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});