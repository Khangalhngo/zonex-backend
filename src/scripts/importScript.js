const pool = require('../config/database');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const createOrganizationTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);
    console.log('Organization table created successfully');
  } catch (error) {
    console.error('Error creating organization table:', error);
    throw error;
  }
};

const importOrganizationsFromCSV = async (csvFilePath) => {
  try {
    // First ensure the table exists
    await createOrganizationTable();

    const results = [];

    // Read and parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert data in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const values = batch.map((row, index) => {
        // Generate sequential ID starting from 0001
        const id = String(i + index + 1).padStart(4, '0');
        return [id, row.name];
      });

      await pool.query(
        'INSERT INTO organizations (id, name) VALUES ?',
        [values]
      );
    }

    console.log(`Successfully imported ${results.length} organizations`);
    return results.length;
  } catch (error) {
    console.error('Error importing organizations:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    // Replace this path with your CSV file path
    const csvFilePath = path.join(__dirname, '../../data/organizations.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error('CSV file not found at:', csvFilePath);
      console.log('Please place your CSV file in the data folder with name organizations.csv');
      process.exit(1);
    }

    await importOrganizationsFromCSV(csvFilePath);
    console.log('Import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

main(); 