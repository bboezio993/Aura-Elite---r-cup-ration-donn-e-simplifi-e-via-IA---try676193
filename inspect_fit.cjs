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

  // Find a sleep file
  const sleepFile = Object.keys(zip.files).find(f => f.includes('SLEEP_DATA.fit'));
  if (sleepFile) {
    console.log(`\n--- Parsing ${sleepFile} ---`);
    const buffer = await zip.files[sleepFile].async('nodebuffer');
    const fitData = await parseFit(buffer);
    console.log("Keys in FIT data:", Object.keys(fitData));
    if (fitData.sleep_level) {
      console.log("Sleep level sample:", fitData.sleep_level.slice(0, 2));
    }
    if (fitData.monitoring_info) {
      console.log("Monitoring info:", fitData.monitoring_info);
    }
    if (fitData.sleep_assessment) {
      console.log("Sleep assessment:", fitData.sleep_assessment);
    }
    // Print any other interesting keys
    for (const key of Object.keys(fitData)) {
      if (Array.isArray(fitData[key]) && fitData[key].length > 0) {
        console.log(`First item of ${key}:`, fitData[key][0]);
      }
    }
  }

  // Find an HRV file
  const hrvFile = Object.keys(zip.files).find(f => f.includes('HRV_STATUS.fit'));
  if (hrvFile) {
    console.log(`\n--- Parsing ${hrvFile} ---`);
    const buffer = await zip.files[hrvFile].async('nodebuffer');
    const fitData = await parseFit(buffer);
    console.log("Keys in FIT data:", Object.keys(fitData));
    for (const key of Object.keys(fitData)) {
      if (Array.isArray(fitData[key]) && fitData[key].length > 0) {
        console.log(`First item of ${key}:`, fitData[key][0]);
      }
    }
  }
}

inspect().catch(console.error);
