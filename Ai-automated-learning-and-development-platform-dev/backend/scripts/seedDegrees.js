const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const DegreeOption = require('../models/DegreeOption');

dotenv.config();

const DEGREE_DATA = [
    {
        name: 'Bachelor Technology / Bachelor Engineering',
        category: 'bachelor',
        specializations: [
            'Computer Science Engineering (CSE)',
            'Information Technology (IT)',
            'Artificial Intelligence & Machine Learning',
            'Data Science',
            'Cyber Security',
            'Cloud Computing'
        ]
    },
    {
        name: 'Bachelor of Computer Applications (BCA)',
        category: 'bachelor',
        specializations: [
            'Data Science',
            'Artificial Intelligence (AI)',
            'Machine Learning (ML)',
            'Cyber Security',
            'Cloud Computing',
            'Web Development'
        ]
    },
    {
        name: 'Bachelor of Science',
        category: 'bachelor',
        specializations: [
            'Computer Science',
            'Information Technology',
            'Data Analytics',
            'Artificial Intelligence',
            'Machine Learning',
            'Cyber Security',
            'Cloud Computing'
        ]
    },
    {
        name: 'Master of Technology / Master of Engineering (M.Tech / M.E.)',
        category: 'master',
        specializations: [
            'Computer Science Engineering (CSE)',
            'Information Technology (IT)',
            'Artificial Intelligence & Machine Learning',
            'Data Science',
            'Cyber Security',
            'Cloud Computing',
            'Software Engineering',
            'Computer Engineering'
        ]
    },
    {
        name: 'Master of Computer Applications (MCA)',
        category: 'master',
        specializations: [
            'Data Science',
            'Artificial Intelligence (AI)',
            'Machine Learning (ML)',
            'Cyber Security',
            'Cloud Computing',
            'Web Development'
        ]
    },
    {
        name: 'Master of Science (M.Sc.)',
        category: 'master',
        specializations: [
            'Computer Science',
            'Information Technology',
            'Data Analytics',
            'Artificial Intelligence',
            'Machine Learning',
            'Cyber Security',
            'Cloud Computing'
        ]
    }
];

async function seedDegrees() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mernapp');
        console.log('Connected to MongoDB for seeding...');

        for (const degree of DEGREE_DATA) {
            const existing = await DegreeOption.findOne({ name: degree.name });
            if (!existing) {
                await DegreeOption.create(degree);
                console.log(`Created: ${degree.name}`);
            } else {
                console.log(`Skipped (already exists): ${degree.name}`);
            }
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedDegrees();
