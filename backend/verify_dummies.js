const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://localhost:27017/LearningDevelopmentplatform';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function verify() {
    try {
        await mongoose.connect(MONGODB_URI);
        const total = await User.countDocuments({});
        const dummies = await User.find({ dummyuser: true });
        console.log(`Total Users: ${total}`);
        console.log(`Dummy Users: ${dummies.length}`);
        if (dummies.length > 0) {
            console.log('Fields in first dummy:', Object.keys(dummies[0]._doc));
            console.log('Sample Dummy Details:', JSON.stringify(dummies[0], null, 2));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
verify();
