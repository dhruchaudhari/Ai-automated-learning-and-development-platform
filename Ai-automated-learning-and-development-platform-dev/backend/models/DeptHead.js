const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deptHeadSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: 'depthead'
    }
}, {
    timestamps: true
});

// Hash password before saving
deptHeadSchema.pre('save', async function (next) {
    const deptHead = this;
    if (deptHead.isModified('password')) {
        deptHead.password = await bcrypt.hash(deptHead.password, 10);
    }
    next();
});

// Compare password
deptHeadSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const DeptHead = mongoose.model('DeptHead', deptHeadSchema);

module.exports = DeptHead;
