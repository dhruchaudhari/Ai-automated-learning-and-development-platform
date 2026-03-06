const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://localhost:27017/LearningDevelopmentplatform';

const adSchema = new mongoose.Schema({}, { strict: false });
const Advertisement = mongoose.model('Advertisement', adSchema);

async function verify() {
    try {
        await mongoose.connect(MONGODB_URI);
        const ads = await Advertisement.find({});
        console.log(`Total Advertisements: ${ads.length}`);
        ads.forEach(ad => {
            console.log(`ID: ${ad._id}, Title: ${ad.title}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
verify();
