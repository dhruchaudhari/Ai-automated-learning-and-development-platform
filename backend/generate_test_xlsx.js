
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const data = [
    ["fullName", "fathersName", "email", "mobile", "gender", "dob", "password", "permanentAddress", "state", "tenthBoard", "tenthPassingYear", "tenthPercentage", "twelfthBoard", "twelfthPassingYear", "twelfthPercentage", "graduationDegree", "graduationSpecialization", "graduationPassingYear", "graduationPercentage"],
    ["Test User", "Father Test", "test@example.com", "9876543210", "Male", "2000-01-01", "Password123", "Test Address Street 10", "Maharashtra", "CBSE", 2016, 85.5, "CBSE", 2018, 88.0, "B.Tech", "Computer Science", 2022, 75.0]
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const filePath = path.join(__dirname, 'test_bulk.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Generated ${filePath}`);
