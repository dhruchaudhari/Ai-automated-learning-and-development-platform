const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://localhost:27017';

async function listDbs() {
    try {
        await mongoose.connect(MONGODB_URI);
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const dbs = await admin.listDatabases();
        console.log('Databases:', JSON.stringify(dbs.databases.map(db => db.name), null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error listing databases:', err);
    }
}

listDbs();
