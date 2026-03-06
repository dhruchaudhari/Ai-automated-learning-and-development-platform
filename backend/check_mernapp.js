const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://localhost:27017/mernapp';

const userSchema = new mongoose.Schema({
    fullName: String,
    role: String,
    dummyuser: Boolean
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function checkDb() {
    try {
        await mongoose.connect(MONGODB_URI);
        const count = await User.countDocuments({});
        const dummyCount = await User.countDocuments({ dummyuser: true });
        console.log(`mernapp Total Users: ${count}`);
        console.log(`mernapp Dummy Users: ${dummyCount}`);

        if (dummyCount > 0) {
            const sample = await User.findOne({ dummyuser: true });
            console.log('Sample Dummy User from mernapp:', JSON.stringify(sample, null, 2));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error checking mernapp:', err);
    }
}

checkDb();
