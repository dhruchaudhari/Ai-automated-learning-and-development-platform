const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '../../data/rejected_candidates_db_ready_v2.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { range: 1 }); // Start from row 2 (index 1) which has field names

console.log('Sample Object:', data[0]);
console.log('Number of Rows:', data.length);
