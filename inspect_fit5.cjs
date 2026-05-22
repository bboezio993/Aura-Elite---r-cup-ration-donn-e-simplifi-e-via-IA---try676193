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
    const buffer = await zip.files[sleepFile].async('nodebuffer');
    const fitData = await parseFit(buffer);
    
    if (fitData.activity && fitData.activity.events) {
      const startEvent = fitData.activity.events.find(e => e.event_type === 'start');
      const stopEvent = fitData.activity.events.find(e => e.event_type === 'stop');
      
      if (startEvent && stopEvent) {
        const start = new Date(startEvent.timestamp);
        const stop = new Date(stopEvent.timestamp);
        const durationHours = (stop - start) / (1000 * 60 * 60);
        console.log(`Sleep duration from events: ${durationHours} hours`);
      }
    }
  }
}

inspect().catch(console.error);
