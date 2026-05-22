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

  const sleepFile = Object.keys(zip.files).find(f => f.includes('SLEEP_DATA.fit'));
  if (sleepFile) {
    console.log(`\n--- Parsing ${sleepFile} ---`);
    const buffer = await zip.files[sleepFile].async('nodebuffer');
    const fitData = await parseFit(buffer);
    console.log("activity:", JSON.stringify(fitData.activity, null, 2));
    // Let's also look at any other keys that might have data
    for (const key of Object.keys(fitData)) {
      if (Array.isArray(fitData[key]) && fitData[key].length > 0) {
        console.log(`First item of ${key}:`, fitData[key][0]);
      } else if (typeof fitData[key] === 'object' && fitData[key] !== null && !Array.isArray(fitData[key])) {
        console.log(`Object ${key}:`, fitData[key]);
      }
    }
  }

  const hrvFile = Object.keys(zip.files).find(f => f.includes('HRV_STATUS.fit'));
  if (hrvFile) {
    console.log(`\n--- Parsing ${hrvFile} ---`);
    const buffer = await zip.files[hrvFile].async('nodebuffer');
    const fitData = await parseFit(buffer);
    console.log("activity:", JSON.stringify(fitData.activity, null, 2));
    for (const key of Object.keys(fitData)) {
      if (Array.isArray(fitData[key]) && fitData[key].length > 0) {
        console.log(`First item of ${key}:`, fitData[key][0]);
      } else if (typeof fitData[key] === 'object' && fitData[key] !== null && !Array.isArray(fitData[key])) {
        console.log(`Object ${key}:`, fitData[key]);
      }
    }
  }
}

inspect().catch(console.error);
