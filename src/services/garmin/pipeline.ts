import JSZip from 'jszip';
import { useStore } from '../../store/useStore';
import { parseActivityCSV, parseWellnessJSON, parseWellnessFIT, parseActivityJSON } from './parsers';
import { GarminImportType } from '../../types';

export const processGarminFile = async (file: File, type: GarminImportType, logId: string) => {
  const baseUpdateLog = useStore.getState().updateGarminImportLog;
  
  const updateLog = (id: string, updates: any) => {
    // Remove undefined properties before merging
    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    baseUpdateLog(id, cleanUpdates);
    
    const logs = useStore.getState().garminImportLogs;
    const log = logs.find(l => l.id === id);
    if (log) {
      import('../firebaseSync').then(({ syncLogToFirestore }) => {
        syncLogToFirestore(log);
      }).catch(() => {});
    }
  };

  try {
    if (file.name.endsWith('.zip')) {
      await processZipArchive(file, type, logId, updateLog);
    } else if (file.name.endsWith('.csv')) {
      await processCSV(file, logId, updateLog);
    } else if (file.name.endsWith('.json')) {
      await processJSON(file, logId, updateLog);
    } else if (file.name.endsWith('.fit')) {
      await processFIT(file, logId, updateLog);
    } else {
      throw new Error(`Format de fichier non supporté: ${file.name}`);
    }
  } catch (error: any) {
    updateLog(logId, { 
      status: 'error', 
      errorMessage: error.message || 'Erreur inconnue lors du traitement.' 
    });
  }
};

const processZipArchive = async (fileOrBuffer: File | ArrayBuffer, type: GarminImportType, logId: string, updateLog: any) => {
  const processZipRecursive = async (buffer: ArrayBuffer | Uint8Array | Blob | string | File) => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(buffer);
    const fileNames = Object.keys(contents.files);
    
    let stats = { activitiesFound: 0, wellnessFound: 0, filesProcessed: 0, filesIgnored: 0, filesFailed: 0 };
    let debugFileContents: Record<string, string> = {}; // Extract some samples

    for (const filename of fileNames) {
      const zipEntry = contents.files[filename];
      if (zipEntry.dir) continue;
      
      const lowerName = filename.toLowerCase();
      const baseName = lowerName.split('/').pop() || lowerName;

      // Capture samples for deep debugging
      if (baseName.includes('sleep') || baseName.includes('hrv') || baseName.includes('biometric') || baseName.includes('health') || baseName.includes('lifestyle')) {
        try {
           const sampleString = await zipEntry.async('text');
           // Just keep the first 1000 chars to cover deeper structures
           debugFileContents[baseName] = sampleString.substring(0, 1000); 
        } catch (e) {
           // ignore
        }
      }

      // Nested ZIP files parsing
      if (baseName.endsWith('.zip')) {
        try {
          const nestedBuffer = await zipEntry.async('arraybuffer');
          const nestedStats = await processZipRecursive(nestedBuffer);
          stats.activitiesFound += nestedStats.activitiesFound;
          stats.wellnessFound += nestedStats.wellnessFound;
          stats.filesProcessed += nestedStats.filesProcessed;
          stats.filesIgnored += nestedStats.filesIgnored;
          stats.filesFailed += nestedStats.filesFailed;
          debugFileContents = { ...debugFileContents, ...nestedStats.debugFileContents };
        } catch(e) {
          console.error("Failed to parse nested zip", e);
          stats.filesFailed++;
        }
        continue;
      }

      // Classification
      const isActivityCsv = ((baseName.includes('activity') || baseName.includes('activities')) && baseName.endsWith('.csv')) || (type === 'activity' && baseName.endsWith('.csv'));
      
      let isWellnessJson = false;
      let isActivityJson = false;

      if (baseName.endsWith('.json')) {
        // If it looks like an activity summary, use Activity parser
        if (baseName.includes('activity') || baseName.includes('activities') || baseName.includes('summaries') || baseName.includes('summarizedactivities')) {
          isActivityJson = true;
        } else {
          // Otherwise, pass it to Wellness JSON parser which has a generic deep scanner
          isWellnessJson = true;
        }
      }

      const isWellnessFit = ((baseName.includes('wellness') || baseName.includes('sleep') || baseName.includes('stress') || baseName.includes('rhr') || baseName.includes('hrv') || baseName.includes('monitoring') || baseName.includes('metrics')) && baseName.endsWith('.fit')) || (type === 'wellness' && baseName.endsWith('.fit'));

      if (isWellnessJson) {
        try {
          const jsonString = await zipEntry.async('text');
          await parseWellnessJSON(jsonString, logId);
          stats.wellnessFound++;
          stats.filesProcessed++;
        } catch (e) {
          console.error(`Error parsing wellness file ${filename}`, e);
          stats.filesFailed++;
        }
      } else if (isWellnessFit) {
        try {
          const arrayBuffer = await zipEntry.async('arraybuffer');
          await parseWellnessFIT(arrayBuffer, logId);
          stats.wellnessFound++;
          stats.filesProcessed++;
        } catch (e) {
          console.error(`Error parsing wellness FIT file ${filename}`, e);
          stats.filesFailed++;
        }
      } else if (isActivityCsv) {
        try {
          const csvString = await zipEntry.async('text');
          await parseActivityCSV(csvString, logId);
          stats.activitiesFound++;
          stats.filesProcessed++;
        } catch (e) {
          console.error(`Error parsing fitness file ${filename}`, e);
          stats.filesFailed++;
        }
      } else if (isActivityJson) {
        try {
          const jsonString = await zipEntry.async('text');
          await parseActivityJSON(jsonString, logId);
          stats.activitiesFound++;
          stats.filesProcessed++;
        } catch (e) {
          console.error(`Error parsing fitness JSON file ${filename}`, e);
          stats.filesFailed++;
        }
      } else {
        stats.filesIgnored++;
      }
    }
    return { ...stats, debugFileContents };
  };

  updateLog(logId, { status: 'processing', details: { message: 'Décompression de l\'archive...' } });
  
  const finalStats = await processZipRecursive(fileOrBuffer);
  
  let finalStatus = 'success';
  if (finalStats.filesProcessed === 0) finalStatus = 'warning';
  else if (finalStats.filesFailed > 0) finalStatus = 'partial';

  updateLog(logId, { 
    status: finalStatus as any, 
    errorMessage: finalStats.filesProcessed === 0 ? 'Aucune donnée pertinente trouvée dans l\'archive.' : (finalStats.filesFailed > 0 ? `${finalStats.filesFailed} fichiers n'ont pas pu être traités.` : undefined),
    details: { ...finalStats }
  });

  if (finalStats.filesProcessed > 0) {
    useStore.getState().updateConnection('garmin', 'connected');
  }
};

const processCSV = async (file: File, logId: string, updateLog: any) => {
  const text = await file.text();
  const lowerName = file.name.toLowerCase();
  
  if (lowerName.includes('sleep') || lowerName.includes('sommeil')) {
    // Try to parse as sleep CSV
    const { addMetrics } = useStore.getState();
    import('papaparse').then((Papa) => {
      Papa.default.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const metrics: any[] = [];
          results.data.forEach((row: any) => {
            const dateStr = row['Date'] || row['date'];
            if (!dateStr) return;
            
            // Try to parse date
            let timestamp;
            try {
              // Handle DD/MM/YYYY or YYYY-MM-DD
              if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  timestamp = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
                } else {
                  timestamp = new Date(dateStr).toISOString();
                }
              } else {
                timestamp = new Date(dateStr).toISOString();
              }
            } catch (e) {
              return;
            }
            
            const date = timestamp.split('T')[0];
            
            // Parse duration
            const durationStr = row['Total Sleep'] || row['Temps de sommeil total'] || row['Duration'] || row['Durée'];
            if (durationStr) {
              let durationHours = 0;
              if (durationStr.includes(':')) {
                const parts = durationStr.split(':');
                durationHours = parseInt(parts[0]) + parseInt(parts[1]) / 60;
              } else {
                durationHours = parseFloat(durationStr.replace(',', '.'));
              }
              
              if (durationHours > 0) {
                metrics.push({
                  id: `sleep-${date}`,
                  source: 'garmin',
                  sourceId: logId,
                  timestamp,
                  type: 'sleep_duration',
                  value: durationHours,
                  unit: 'h',
                  confidenceScore: 90
                });
              }
            }
            
            // Parse score
            const scoreStr = row['Sleep Score'] || row['Score de sommeil'] || row['Score'];
            if (scoreStr) {
              const score = parseInt(scoreStr);
              if (!isNaN(score)) {
                metrics.push({
                  id: `sleep-score-${date}`,
                  source: 'garmin',
                  sourceId: logId,
                  timestamp,
                  type: 'sleep_score',
                  value: score,
                  unit: '/100',
                  confidenceScore: 90
                });
              }
            }
          });
          
          if (metrics.length > 0) {
            addMetrics(metrics);
            updateLog(logId, { status: 'success', recordsAdded: metrics.length });
          } else {
            // Fallback to activity parsing if no sleep data found
            parseActivityCSV(text, logId);
          }
        }
      });
    });
  } else {
    await parseActivityCSV(text, logId);
  }
  
  useStore.getState().updateConnection('garmin', 'connected');
};

const processJSON = async (file: File, logId: string, updateLog: any) => {
  const text = await file.text();
  const lowerName = file.name.toLowerCase();
  
  // Use Activity parser for activity JSONs
  if (lowerName.includes('activity') || lowerName.includes('activities') || lowerName.includes('fitness') || lowerName.includes('summaries') || lowerName.includes('summarizedactivities')) {
    await parseActivityJSON(text, logId);
  } else {
    // Default to wellness
    await parseWellnessJSON(text, logId);
  }
  useStore.getState().updateConnection('garmin', 'connected');
};

const processFIT = async (file: File, logId: string, updateLog: any) => {
  const arrayBuffer = await file.arrayBuffer();
  await parseWellnessFIT(arrayBuffer, logId);
  useStore.getState().updateConnection('garmin', 'connected');
};
