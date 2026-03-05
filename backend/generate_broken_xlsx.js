
const XLSX = require('xlsx');
const path = require('path');

const data = [
    ["fullName", "email"], // Missing many critical columns
    ["Test User", "test@example.com"]
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const filePath = path.join(__dirname, 'test_broken.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Generated ${filePath}`);
