const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');

async function inspect() {
  const zipPath = path.join(process.cwd(), 'debug_data', '2026-04-16T11-32-09-418Z_2026-03-30.zip');
  const data = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(data);
  
  const files = Object.keys(zip.files);
  console.log(`Total files in zip: ${files.length}`);
  
  // Group files by type/name
  const fileTypes = {};
  files.forEach(f => {
    const name = f.toLowerCase();
    if (name.includes('sleep')) fileTypes['sleep'] = (fileTypes['sleep'] || []).concat(f);
    else if (name.includes('hrv')) fileTypes['hrv'] = (fileTypes['hrv'] || []).concat(f);
    else if (name.includes('wellness')) fileTypes['wellness'] = (fileTypes['wellness'] || []).concat(f);
    else if (name.includes('stress')) fileTypes['stress'] = (fileTypes['stress'] || []).concat(f);
    else if (name.includes('rhr')) fileTypes['rhr'] = (fileTypes['rhr'] || []).concat(f);
    else if (name.includes('activity')) fileTypes['activity'] = (fileTypes['activity'] || []).concat(f);
    else {
      const ext = path.extname(f);
      fileTypes[ext] = (fileTypes[ext] || []).concat(f);
    }
  });
  
  for (const [type, typeFiles] of Object.entries(fileTypes)) {
    console.log(`\n--- Type: ${type} (${typeFiles.length} files) ---`);
    console.log(typeFiles.slice(0, 5).join('\n'));
    
    // Read the first file of this type if it's json
    if (typeFiles.length > 0 && typeFiles[0].endsWith('.json')) {
      const content = await zip.files[typeFiles[0]].async('string');
      console.log(`\nPreview of ${typeFiles[0]}:`);
      console.log(content.substring(0, 1500));
    }
  }
}

inspect().catch(console.error);
