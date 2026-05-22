const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');
const FitParser = require('fit-file-parser').default;

async function inspect() {
  const zipPath = path.join(process.cwd(), 'debug_data', '2026-04-16T11-32-09-418Z_2026-03-30.zip');
  const data = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(data);
  
  const fitParser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'km',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'cascade',
  });

  const parseFit = (buffer) => new Promise((resolve, reject) => {
    fitParser.parse(buffer, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const metricsFiles = Object.keys(zip.files).filter(f => f.includes('METRICS.fit'));
  for (const file of metricsFiles) {
    console.log(`\n--- Parsing ${file} ---`);
    const buffer = await zip.files[file].async('nodebuffer');
    const fitData = await parseFit(buffer);
    
    // Print keys that have data
    for (const key of Object.keys(fitData)) {
      if (Array.isArray(fitData[key]) && fitData[key].length > 0) {
        console.log(`Found ${fitData[key].length} items in ${key}`);
        if (key === 'monitoring') {
          // Check for HRV in monitoring
          const hrvRecords = fitData[key].filter(m => m.hrv !== undefined || m.hrv_rmssd !== undefined);
          if (hrvRecords.length > 0) {
            console.log(`Found ${hrvRecords.length} HRV records in monitoring`);
            console.log(hrvRecords[0]);
          }
        }
      }
    }
  }
}

inspect().catch(console.error);
