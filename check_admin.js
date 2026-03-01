const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-gridlist';

async function checkUser() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'dhrubhai3144@gmail.com' });
        if (user) {
            console.log(`User: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
        } else {
            console.log('User not found');
        }

        const adminCount = await User.countDocuments({ role: 'admin' });
        console.log(`Total Admins: ${adminCount}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser();
