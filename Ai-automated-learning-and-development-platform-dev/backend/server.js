const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mernapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const jobRoutes = require('./routes/jobs');
const degreeOptionRoutes = require('./routes/degreeOptions');
const advertisementRoutes = require('./routes/advertisements');
const panelRoutes = require('./routes/panels');
const roleRoutes = require('./routes/roles');
const deptHeadRoutes = require('./routes/deptheads');

const normalizationRoutes = require('./routes/normalization');
const fitnesstfidfRoutes = require('./routes/fitnesstfidf');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/degree-options', degreeOptionRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/panels', panelRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/deptheads', deptHeadRoutes);
app.use('/api/normalization', normalizationRoutes);
app.use('/api/fitnesstfidf', fitnesstfidfRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});