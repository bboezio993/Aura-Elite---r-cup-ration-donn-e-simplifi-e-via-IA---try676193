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

  const wellnessFile = Object.keys(zip.files).find(f => f.includes('WELLNESS.fit'));
  if (wellnessFile) {
    console.log(`\n--- Parsing ${wellnessFile} ---`);
    const buffer = await zip.files[wellnessFile].async('nodebuffer');
    const fitData = await parseFit(buffer);
    
    // Look for monitoring info
    console.log("monitoring_info:", JSON.stringify(fitData.monitoring_info, null, 2));
    if (fitData.monitoring) {
      console.log(`Found ${fitData.monitoring.length} monitoring records`);
      console.log("First 2 monitoring:", JSON.stringify(fitData.monitoring.slice(0, 2), null, 2));
      
      // Check if any monitoring record has sleep or hrv
      const hrvRecords = fitData.monitoring.filter(m => m.hrv || m.hrv_rmssd);
      console.log(`Found ${hrvRecords.length} HRV records`);
      if (hrvRecords.length > 0) console.log("Sample HRV:", hrvRecords[0]);
    }
  }
}

inspect().catch(console.error);
