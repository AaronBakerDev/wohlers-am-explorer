import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file (env > arg > default)
const argPath = process.argv[2];
const envPath = process.env.VENDOR_EXCEL_PATH;
const defaultPath = path.join(__dirname, '..', '..', 'project-documents', 'WA digital platform - Vendors data (MVP) (1).xlsx');
const excelFilePath = envPath || argPath || defaultPath;
const outputDir = path.join(__dirname, '..', '..', 'project-documents', 'extracted-vendor-data');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    console.log('Reading Excel file:', excelFilePath);
    if (!fs.existsSync(excelFilePath)) {
        console.error('❌ Excel file not found. Provide it via:');
        console.error('   - VENDOR_EXCEL_PATH env var, or');
        console.error('   - CLI arg: node scripts/extract-excel-sheets.js /path/to/file.xlsx');
        console.error('   - Default location:', defaultPath);
        process.exit(1);
    }
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('Found sheets:', workbook.SheetNames);
    console.log('');
    
    // Extract each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`Processing sheet ${index + 1}: "${sheetName}"`);
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON to see the data structure
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`  - Rows: ${jsonData.length}`);
        console.log(`  - Columns: ${jsonData.length > 0 ? jsonData[0].length : 0}`);
        
        // Show first few rows as preview
        if (jsonData.length > 0) {
            console.log('  - Preview (first 3 rows):');
            jsonData.slice(0, 3).forEach((row, rowIndex) => {
                console.log(`    Row ${rowIndex + 1}:`, row.slice(0, 5).map(cell => 
                    cell ? String(cell).substring(0, 20) : 'empty'
                ));
            });
        }
        
        // Create safe filename
        const safeSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Save as CSV
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        const csvFilePath = path.join(outputDir, `${safeSheetName}.csv`);
        fs.writeFileSync(csvFilePath, csvData);
        console.log(`  - Saved as: ${csvFilePath}`);
        
        // Save as JSON for easier programmatic access
        const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
        const jsonFilePath = path.join(outputDir, `${safeSheetName}.json`);
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonDataWithHeaders, null, 2));
        console.log(`  - Saved as: ${jsonFilePath}`);
        
        console.log('');
    });
    
    console.log('✅ Excel extraction completed successfully!');
    console.log('Output directory:', outputDir);
    
} catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    process.exit(1);
}
