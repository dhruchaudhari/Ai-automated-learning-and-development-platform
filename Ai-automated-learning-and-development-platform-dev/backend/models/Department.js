// models/Department.js

const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    code: {
        type: String,
        required: true,
        uppercase: true,
        unique: true,
        index: true
    },

    description: {
        type: String,
        trim: true
    },

    parentDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Department", departmentSchema);