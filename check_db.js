const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/LearningDevelopmentplatform');
        console.log('Connected to MongoDB');

        const totalUsers = await User.countDocuments({});
        const dummyUsers = await User.find({ dummyuser: true });
        const adminUsers = await User.find({ role: 'admin' });

        console.log(`Total Users: ${totalUsers}`);
        console.log(`Dummy Users (bulk uploaded): ${dummyUsers.length}`);
        console.log(`Admin Users: ${adminUsers.length}`);

        if (dummyUsers.length > 0) {
            console.log('Sample Dummy User:', JSON.stringify(dummyUsers[0], null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkUsers();
