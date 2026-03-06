const mongoose = require('mongoose');
const User = require('./models/User');
const Advertisement = require('./models/Advertisement');
const AiAuditRecord = require('./models/AiAuditRecord');
const FinalMerit = require('./models/FinalMerit');
const Panel = require('./models/Panel');
const dotenv = require('dotenv');
dotenv.config();

async function runQuery() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/LearningDevelopmentplatform');
        console.log('Connected to MongoDB');

        const users = await User.find({ role: { $ne: 'admin' } }, '-password -__v')
            .populate('advertisements')
            .sort({ createdAt: -1 });

        console.log(`Found ${users.length} non-admin users`);
        if (users.length > 0) {
            console.log('First user:', JSON.stringify(users[0], null, 2));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

runQuery();
