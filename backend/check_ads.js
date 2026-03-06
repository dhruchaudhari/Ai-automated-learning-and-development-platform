const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Advertisement = require('./models/Advertisement');

async function checkAds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/LearningDevelopmentplatform');
        console.log('Connected to MongoDB');

        const ads = await Advertisement.find({});
        console.log(`Total Advertisements: ${ads.length}`);

        if (ads.length > 0) {
            console.log('Available Advertisements:');
            ads.forEach(ad => {
                console.log(`- ID: ${ad._id}, Title: ${ad.title}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkAds();
