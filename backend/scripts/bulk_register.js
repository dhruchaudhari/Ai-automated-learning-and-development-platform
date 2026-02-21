const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
// Import User model
const User = require('../models/User');

// Load env vars
dotenv.config();

const ROOT_DIR = path.join(__dirname, '../../');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const EXCEL_FILE = path.join(DATA_DIR, 'rejected_candidates_db_ready_v2.xlsx');
const RESUME_SRC_DIR = path.join(DATA_DIR, 'Resume_Batch_20260218_054322');

// Dummy Asset Source Paths
const DUMMY_ASSETS_SRC = {
    tenth: path.join(DATA_DIR, '10thmarksheet', '10thmarksheet.pdf'),
    twelfth: path.join(DATA_DIR, '12thmarksheet', '12thmarksheet.pdf'),
    graduation: path.join(DATA_DIR, 'graduation degree', 'graduation.pdf'),
    qualifying: path.join(DATA_DIR, 'qaulifying degree', "master's degree.pdf"),
    photo: path.join(DATA_DIR, 'photo', 'photo.jpg'),
    id: path.join(DATA_DIR, 'identity proof', 'adharcard.pdf')
};

// Target Relative Paths (stored in DB)
const ASSET_PATHS = {
    tenth: 'uploads/marksheets/bulk_dummy_10th.pdf',
    twelfth: 'uploads/marksheets/bulk_dummy_12th.pdf',
    graduation: 'uploads/marksheets/bulk_dummy_graduation.pdf',
    qualifying: 'uploads/marksheets/bulk_dummy_qualifying.pdf',
    photo: 'uploads/images/bulk_dummy_photo.jpg',
    id: 'uploads/documents/bulk_dummy_id.pdf'
};

async function prepareUploads() {
    console.log('--- Preparing Uploads Directory ---');
    const dirs = [
        path.join(UPLOADS_DIR, 'marksheets'),
        path.join(UPLOADS_DIR, 'images'),
        path.join(UPLOADS_DIR, 'documents'),
        path.join(UPLOADS_DIR, 'resumes')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // Copy Dummy Assets
    fs.copyFileSync(DUMMY_ASSETS_SRC.tenth, path.join(UPLOADS_DIR, 'marksheets/bulk_dummy_10th.pdf'));
    fs.copyFileSync(DUMMY_ASSETS_SRC.twelfth, path.join(UPLOADS_DIR, 'marksheets/bulk_dummy_12th.pdf'));
    fs.copyFileSync(DUMMY_ASSETS_SRC.graduation, path.join(UPLOADS_DIR, 'marksheets/bulk_dummy_graduation.pdf'));
    fs.copyFileSync(DUMMY_ASSETS_SRC.qualifying, path.join(UPLOADS_DIR, 'marksheets/bulk_dummy_qualifying.pdf'));
    fs.copyFileSync(DUMMY_ASSETS_SRC.photo, path.join(UPLOADS_DIR, 'images/bulk_dummy_photo.jpg'));
    fs.copyFileSync(DUMMY_ASSETS_SRC.id, path.join(UPLOADS_DIR, 'documents/bulk_dummy_id.pdf'));

    console.log('Dummy documents copied to uploads.');
}

async function bulkRegister() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mernapp');
        console.log('Connected to MongoDB');

        await prepareUploads();

        console.log('Reading Excel file...');
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { range: 1 });

        console.log(`Found ${rawData.length} rows. Mapping and copying resumes...`);

        const usersToCreate = [];

        const parseNum = (val) => {
            if (val === undefined || val === null || val === '') return undefined;
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
        };

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const srNo = (i + 1).toString().padStart(4, '0');
            const resumeFileName = `${srNo}.pdf`;
            const resumeSrc = path.join(RESUME_SRC_DIR, resumeFileName);
            const resumeTargetRel = `uploads/resumes/${resumeFileName}`;

            // Check if resume exists
            if (fs.existsSync(resumeSrc)) {
                fs.copyFileSync(resumeSrc, path.join(UPLOADS_DIR, 'resumes', resumeFileName));
            } else {
                console.warn(`Warning: Resume NOT found for Row ${i + 2}: ${resumeFileName}`);
            }

            // Map row to User object
            const userData = {
                fullName: row['Full Name'],
                fathersName: row["Father's Name"],
                gender: row['Gender'],
                dob: row['DOB (YYYY-MM-DD)'] ? new Date(row['DOB (YYYY-MM-DD)']) : undefined,
                mobile: row['Mobile (with +91)'],
                email: row['Email'],
                permanentAddress: row['Permanent Address'],
                state: row['State'],
                password: row['Password (hashed by script)'] || 'ChangeMe@123',
                role: row['Role'] || 'user',
                status: row['Status'] || 'pending',
                isEmailVerified: true, // Bypass OTP
                adminNotes: row['Admin Notes'] || '',
                selectedForDegree: row['selectedForDegree'] || '',
                education: {
                    tenth: {
                        board: row['10th Board'],
                        passingYear: parseNum(row['10th Passing Year']),
                        percentage: parseNum(row['10th Percentage (%)']),
                        marksheetUrl: ASSET_PATHS.tenth
                    },
                    twelfth: {
                        board: row['12th Board'],
                        passingYear: parseNum(row['12th Passing Year']),
                        percentage: parseNum(row['12th Percentage (%)']),
                        marksheetUrl: ASSET_PATHS.twelfth
                    },
                    graduation: {
                        degree: row['Grad Degree'],
                        specialization: row['Grad Specialization'],
                        passingYear: parseNum(row['Grad Passing Year']),
                        percentage: parseNum(row['Grad Percentage (%)']),
                        cgpa: parseNum(row['Grad CGPA']),
                        marksheetUrl: ASSET_PATHS.graduation
                    }
                },
                profileImage: ASSET_PATHS.photo,
                identityProofUrl: ASSET_PATHS.id,
                resumeUrl: resumeTargetRel
            };

            // Conditionally add qualifying degree
            if (row['Qualifying Degree']) {
                userData.education.qualifyingDegree = {
                    degree: row['Qualifying Degree'],
                    specialization: row['Qualifying Specialization'],
                    percentage: parseNum(row['Qualifying Percentage (%)']),
                    passingYear: parseNum(row['Qualifying Passing Year']),
                    marksheetUrl: ASSET_PATHS.qualifying
                };
            }

            usersToCreate.push(userData);
        }

        console.log('Inserting users into database (this will trigger password hashing)...');

        // Using User.create one by one or in smaller chunks if needed, but Mongoose create handles array
        // We do it sequentially or in chunks to avoid overwhelming the DB/RAM if needed, 
        // but 467 is small enough for User.create(array)

        try {
            const results = await User.create(usersToCreate);
            console.log(`Successfully registered ${results.length} users.`);
        } catch (err) {
            console.error('Error during bulk insertion:', err.message);
            if (err.writeErrors) {
                console.error('Individual write errors:', err.writeErrors.length);
            }
        }

    } catch (err) {
        console.error('Critical Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
}

bulkRegister();
