import Papa from 'papaparse';
import FitParser from 'fit-file-parser';
import { useStore } from '../../store/useStore';
import { GarminActivity, NormalizedMetric } from '../../types';

export const parseActivityCSV = async (csvString: string, logId: string) => {
  return new Promise<void>((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const activities: GarminActivity[] = results.data
            .filter((row: any) => row['Date'] && (row["Type d'activité"] || row["Activity Type"]))
            .map((row: any) => {
              const dateStr = row['Date'];
              const type = row["Type d'activité"] || row["Activity Type"];
              const title = row['Titre'] || row['Title'] || 'Activité';
              const distanceRaw = row['Distance'] || '0';
              const distance = parseFloat(distanceRaw.replace(',', '.'));
              const duration = row['Durée'] || row['Time'] || '00:00:00';
              const avgHr = parseInt(row['Fréquence cardiaque moyenne'] || row['Avg HR']) || null;
              const maxHr = parseInt(row['Fréquence cardiaque maximale'] || row['Max HR']) || null;
              const calories = parseInt(row['Calories']) || null;
              const tssRaw = row['Training Stress Score® (TSS®)'] || row['Training Stress Score®'] || '';
              const tss = parseFloat(tssRaw.replace(',', '.')) || null;

              // Robust ID generation
              const id = `${dateStr}-${type}-${distance}-${duration}`.replace(/\s+/g, '-');

              return {
                id,
                sourceId: logId,
                date: dateStr,
                type,
                title,
                distance,
                duration,
                avgHeartRate: avgHr,
                maxHeartRate: maxHr,
                calories,
                tss
              };
            });

          const { addGarminActivities, updateGarminImportLog, garminImportLogs } = useStore.getState();
          addGarminActivities(activities);
          
          import('../firebaseSync').then(({ syncActivitiesToFirestore }) => {
            syncActivitiesToFirestore(activities);
          }).catch(() => {});
          
          // Update log counts
          const currentLog = garminImportLogs.find(l => l.id === logId);
          if (currentLog) {
            updateGarminImportLog(logId, { 
              recordsAdded: (currentLog.recordsAdded || 0) + activities.length,
              status: activities.length > 0 ? 'success' : 'warning',
              errorMessage: activities.length === 0 ? 'Aucune activité trouvée dans le CSV.' : undefined
            });
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
};

export const parseActivityJSON = async (jsonString: string, logId: string) => {
  try {
    const data = JSON.parse(jsonString);
    const { addGarminActivities, updateGarminImportLog, garminImportLogs } = useStore.getState();

    // Garmin JSON can be deeply nested
    const findActivities = (obj: any, arr: any[] = []) => {
      if (!obj || typeof obj !== 'object') return arr;
      if (Array.isArray(obj)) {
        obj.forEach(item => findActivities(item, arr));
        return arr;
      }
      if (obj.beginTimestamp || obj.startTimeLocal || obj.activityId || obj.distanceInMeters) {
        arr.push(obj);
      }
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          findActivities(obj[key], arr);
        }
      });
      return arr;
    };

    const entries = findActivities(data);
    
    const activities: GarminActivity[] = entries
      .filter((entry: any) => entry.beginTimestamp || entry.startTimeLocal || entry.startTimeGMT)
      .map((entry: any) => {
        const timestamp = entry.beginTimestamp || entry.startTimeLocal || entry.startTimeGMT;
        let dateObj = new Date();
        try {
          if (typeof timestamp === 'number') {
             dateObj = new Date(timestamp < 100000000000 ? timestamp * 1000 : timestamp);
          } else {
             dateObj = new Date(timestamp);
          }
        } catch(e) {}
        
        const dateStr = dateObj.toISOString().split('T')[0];
        const type = entry.activityType || entry.sportType || 'Unknown';
        const title = entry.name || entry.activityName || 'Activité';
        const distance = (entry.distance || entry.distanceInMeters || 0) / 1000; // convert to km
        
        // duration can be in milliseconds or seconds
        const durationSeconds = entry.duration || entry.durationInSeconds || (entry.durationInMilliseconds ? entry.durationInMilliseconds / 1000 : 0);
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const seconds = Math.floor(durationSeconds % 60);
        const durationStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const avgHr = entry.averageHeartRateInBeatsPerMinute || entry.averageHR || null;
        const maxHr = entry.maxHeartRateInBeatsPerMinute || entry.maxHR || null;
        const calories = entry.activeCalories || entry.calories || null;
        const tss = entry.trainingStressScore || null;

        const id = `${dateStr}-${type}-${distance}-${durationStr}`.replace(/\s+/g, '-');

        return {
          id,
          sourceId: logId,
          date: dateStr,
          type,
          title,
          distance,
          duration: durationStr,
          avgHeartRate: avgHr,
          maxHeartRate: maxHr,
          calories,
          tss
        };
      });

    if (activities.length > 0) {
      addGarminActivities(activities);
      
      // Async sync to firestore
      import('../firebaseSync').then(({ syncActivitiesToFirestore }) => {
        syncActivitiesToFirestore(activities);
      }).catch(() => {});
      
      const currentLog = garminImportLogs.find(l => l.id === logId);
      if (currentLog) {
        updateGarminImportLog(logId, { 
          recordsAdded: (currentLog.recordsAdded || 0) + activities.length,
          status: 'success'
        });
      }
    }
  } catch (error) {
    console.error("Error parsing activity JSON:", error);
    throw new Error("Format JSON invalide pour les activités.");
  }
};

export const parseWellnessJSON = async (jsonString: string, logId: string) => {
  try {
    const data = JSON.parse(jsonString);
    const metrics: NormalizedMetric[] = [];
    const { addMetrics, updateGarminImportLog, garminImportLogs } = useStore.getState();

    // Helper function to recursively find objects that look like Garmin records
    const findRecords = (obj: any, records: any[] = []) => {
      if (!obj || typeof obj !== 'object') return records;
      
      // If it's an array, search its elements
      if (Array.isArray(obj)) {
        obj.forEach(item => findRecords(item, records));
        return records;
      }

      // Check if this object looks like a record (has a date)
      const hasDate = obj.calendarDate || obj.date || obj.sleepStartTimestampGMT || obj.startTimeGMT || obj.startTimeLocal || obj.timestamp || obj.sleepStartTimestampLocal || obj.metaData?.calendarDate;
      
      // Just collect anything with a date. We will filter out useless ones later.
      if (hasDate) {
        records.push(obj);
      } else if (obj.dailySleepDTO) {
        // Sometimes sleep is nested inside dailySleepDTO
        records.push(obj.dailySleepDTO);
      }

      // Continue searching deeper
      Object.values(obj).forEach(val => {
        if (val && typeof val === 'object') {
          findRecords(val, records);
        }
      });

      return records;
    };

    const entries = findRecords(data);

    entries.forEach((entry: any) => {
      // Handle nested dailySleepDTO if it was pushed directly
      const record = entry.dailySleepDTO || entry;

      let dateRaw = record.calendarDate || record.date || record.sleepStartTimestampGMT || record.startTimeGMT || record.startTimeLocal || record.timestamp || record.sleepStartTimestampLocal || record.metaData?.calendarDate;
      if (!dateRaw) return;

      // Handle stringified unix timestamps (like "1672524000" or "1672524000000")
      if (typeof dateRaw === 'string' && /^\d{10,14}$/.test(dateRaw)) {
        dateRaw = parseInt(dateRaw, 10);
      }
      
      // If unix timestamp is in seconds (10 digits), convert to milliseconds
      if (typeof dateRaw === 'number' && dateRaw < 100000000000) {
        dateRaw *= 1000;
      }

      let timestamp;
      try {
        timestamp = new Date(dateRaw).toISOString();
      } catch (e) {
        return; // Skip if date is invalid
      }
      
      const date = timestamp.split('T')[0];

      // Handle generic "userMetric" or "userMetricProfile" structure
      const metricName = typeof record.userMetric === 'string' ? record.userMetric.toLowerCase() : '';
      const metricValue = record.value !== undefined ? record.value : undefined;

      // SPECIFIC FIX: Handle "healthstatusdata.json" structure where HRV, HR, SPO2 are listed in a "metrics" array
      if (Array.isArray(record.metrics)) {
        record.metrics.forEach((m: any) => {
           if (m.type === 'HRV' && typeof m.value === 'number') {
              metrics.push({
                id: `hrv-${date}-${timestamp}-${m.type}`,
                source: 'garmin',
                sourceId: logId,
                timestamp,
                type: 'hrv_rmssd',
                value: m.value,
                unit: 'ms',
                confidenceScore: 90
              });
           } else if (m.type === 'HR' && typeof m.value === 'number') {
              metrics.push({
                id: `rhr-${date}-${timestamp}-${m.type}`,
                source: 'garmin',
                sourceId: logId,
                timestamp,
                type: 'rhr',
                value: m.value,
                unit: 'bpm',
                confidenceScore: 90
              });
           } else if (m.type === 'SPO2' && typeof m.value === 'number') {
              metrics.push({
                id: `spo2-${date}-${timestamp}-${m.type}`,
                source: 'garmin',
                sourceId: logId,
                timestamp,
                type: 'spo2',
                value: m.value,
                unit: '%',
                confidenceScore: 90
              });
           } else if (m.type === 'RESPIRATION' && typeof m.value === 'number') {
              metrics.push({
                id: `resp-${date}-${timestamp}-${m.type}`,
                source: 'garmin',
                sourceId: logId,
                timestamp,
                type: 'respiration_rate',
                value: m.value,
                unit: 'brpm',
                confidenceScore: 85
              });
           }
        });
      }

      const vo2Max = record.vo2Max || record.vo2MaxCycling || record.vo2MaxRunning;
      if (vo2Max !== undefined) {
         metrics.push({
           id: `vo2max-${date}-${timestamp}`,
           source: 'garmin',
           sourceId: logId,
           timestamp,
           type: 'vo2max',
           value: Number(vo2Max),
           unit: 'ml/kg/min',
           confidenceScore: 85
         });
      }

      const ftp = record.functionalThresholdPower;
      if (ftp !== undefined) {
         metrics.push({
           id: `ftp-${date}-${timestamp}`,
           source: 'garmin',
           sourceId: logId,
           timestamp,
           type: 'ftp',
           value: Number(ftp),
           unit: 'W',
           confidenceScore: 85
         });
      }

      const lthr = record.lactateThresholdHeartRate;
      if (lthr !== undefined) {
         metrics.push({
           id: `lthr-${date}-${timestamp}`,
           source: 'garmin',
           sourceId: logId,
           timestamp,
           type: 'lthr',
           value: Number(lthr),
           unit: 'bpm',
           confidenceScore: 85
         });
      }

      const rhr = record.restingHeartRateInBeatsPerMinute || record.restingHeartRate || record.minHeartRate || (metricName.includes('resting_heart_rate') ? metricValue : undefined);
      if (rhr !== undefined) {
        metrics.push({
          id: `rhr-${date}-${timestamp}`,
          source: 'garmin',
          sourceId: logId,
          timestamp,
          type: 'rhr',
          value: Number(rhr),
          unit: 'bpm',
          confidenceScore: 90
        });
      }

      const stress = record.averageStressLevel || record.avgStressLevel || record.averageStressInStressLevel || record.overallStressLevel || (metricName.includes('stress') ? metricValue : undefined);
      if (stress !== undefined) {
        metrics.push({
          id: `stress-${date}-${timestamp}`,
          source: 'garmin',
          sourceId: logId,
          timestamp,
          type: 'stress_score',
          value: Number(stress),
          unit: '/100',
          confidenceScore: 85
        });
      }

      const hrv = record.averageHrv || record.hrvSummary?.averageHrv || record.lastNightAvg || record.hrvSummary?.lastNightAvg || record.lastNightHrv || record.hrv || (metricName.includes('hrv') ? metricValue : undefined);
      if (hrv !== undefined) {
        metrics.push({
          id: `hrv-${date}-${timestamp}`,
          source: 'garmin',
          sourceId: logId,
          timestamp,
          type: 'hrv_rmssd',
          value: Number(hrv),
          unit: 'ms',
          confidenceScore: 85
        });
      }

      const steps = record.totalSteps || record.steps || (metricName.includes('steps') ? metricValue : undefined);
      if (steps !== undefined) {
        metrics.push({
          id: `steps-${date}-${timestamp}`,
          source: 'garmin',
          sourceId: logId,
          timestamp,
          type: 'steps',
          value: Number(steps),
          unit: 'steps',
          confidenceScore: 95
        });
      }

      // Add sleep duration if available (in seconds usually)
      let sleepSeconds = record.sleepTimeSeconds || record.totalSleepSeconds || record.sleepingSeconds || record.sleepDurationInSeconds || record.sleepDuration || (metricName.includes('sleep') ? metricValue : undefined);
      
      // NEW FIX: Garmin Export archives split sleep into phases without giving a total sleep duration key
      if (sleepSeconds === undefined && record.deepSleepSeconds !== undefined && record.lightSleepSeconds !== undefined) {
         sleepSeconds = (record.deepSleepSeconds || 0) + (record.lightSleepSeconds || 0) + (record.remSleepSeconds || 0);
      }
      
      if (sleepSeconds !== undefined) {
        let durationHours = Number(sleepSeconds);
        if (durationHours > 24) {
          durationHours = durationHours / 3600;
        }
        
        if (durationHours > 0 && durationHours <= 18) {
          metrics.push({
            id: `sleep-${date}-${timestamp}`,
            source: 'garmin',
            sourceId: logId,
            timestamp,
            type: 'sleep_duration',
            value: durationHours,
            unit: 'h',
            confidenceScore: 95
          });
        }
      }
      
      const sleepScore = record.overallSleepScore?.value || record.sleepScore || record.overallSleepScore || record.sleepScoreValue || record.sleepScores?.overall?.value || record.sleepScores?.overallScore || (metricName.includes('sleep_score') ? metricValue : undefined);
      if (sleepScore !== undefined) {
        let finalScore = sleepScore;
        if (typeof sleepScore === 'object' && sleepScore !== null && sleepScore.value !== undefined) finalScore = sleepScore.value;
        metrics.push({
          id: `sleep-score-${date}-${timestamp}`,
          source: 'garmin',
          sourceId: logId,
          timestamp,
          type: 'sleep_score',
          value: Number(finalScore),
          unit: '/100',
          confidenceScore: 90
        });
      }
    });

    if (metrics.length > 0) {
      addMetrics(metrics);
      import('../firebaseSync').then(({ syncMetricsToFirestore }) => {
         syncMetricsToFirestore(metrics);
      }).catch(() => {});
      
      const currentLog = garminImportLogs.find(l => l.id === logId);
      if (currentLog) {
        updateGarminImportLog(logId, { 
          recordsAdded: (currentLog.recordsAdded || 0) + metrics.length,
          status: 'success'
        });
      }
    }
  } catch (error) {
    console.error("Error parsing wellness JSON:", error);
    throw new Error("Format JSON invalide pour les données Wellness.");
  }
};

export const parseWellnessFIT = async (arrayBuffer: ArrayBuffer, logId: string) => {
  return new Promise<void>((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'cascade',
    });

    fitParser.parse(arrayBuffer, (error: any, data: any) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const metrics: NormalizedMetric[] = [];
        const { addMetrics, updateGarminImportLog, garminImportLogs } = useStore.getState();

        const dailyAggregates: Record<string, { minHr: number, maxHr: number, steps: number, timestamp: string }> = {};

        // Parse Sleep from SLEEP_DATA.fit
        if (data.activity && data.activity.events && data.activity.events.length > 0) {
          const startEvent = data.activity.events.find((e: any) => e.event_type === 'start');
          const stopEvent = data.activity.events.find((e: any) => e.event_type === 'stop');
          
          if (startEvent && stopEvent && startEvent.timestamp && stopEvent.timestamp) {
            const start = new Date(startEvent.timestamp);
            const stop = new Date(stopEvent.timestamp);
            const durationHours = (stop.getTime() - start.getTime()) / (1000 * 60 * 60);
            
            if (durationHours > 0 && durationHours <= 18) {
              const dateOnly = start.toISOString().split('T')[0];
              metrics.push({
                id: `sleep-fit-${dateOnly}`,
                source: 'garmin',
                sourceId: logId,
                timestamp: stop.toISOString(),
                type: 'sleep_duration',
                value: durationHours,
                unit: 'h',
                confidenceScore: 75 // Raw calculation from FIT
              });
            }
          }
        }

        if (data.sleep_level) {
          // Sleep level messages usually have timestamp and sleep_level
          // We can just count the total duration of sleep messages
          // Or if there's a summary...
          // For now, let's just log it or handle it if it's a simple array
          let totalSleepSeconds = 0;
          let sleepDate = '';
          data.sleep_level.forEach((s: any) => {
            if (s.timestamp) {
              sleepDate = new Date(s.timestamp).toISOString().split('T')[0];
              // Assuming each message represents a certain duration, but without knowing the exact interval,
              // it's hard to calculate. Usually, Garmin sleep FIT files have a summary in `monitoring_info` or similar.
            }
          });
        }

        if (data.hrv && Array.isArray(data.hrv)) {
          // If the file explicitly contains HRV data records
          let hrvSum = 0;
          let hrvCount = 0;
          let lastTimestamp = '';
          
          data.hrv.forEach((h: any) => {
            if (h.time && h.time.length > 0) {
               // Calculate RMSSD from RR intervals if possible, or use provided values
               // Garmin FIT sometimes stores HRV in `time` arrays for RR intervals
               lastTimestamp = h.timestamp || lastTimestamp;
            }
          });
        }

        if (data.monitoring) {
          data.monitoring.forEach((m: any) => {
            if (!m.timestamp) return;
            const date = new Date(m.timestamp).toISOString();
            const dateOnly = date.split('T')[0];
            
            if (!dailyAggregates[dateOnly]) {
              dailyAggregates[dateOnly] = { minHr: 999, maxHr: 0, steps: 0, timestamp: date };
            }
            
            if (m.heart_rate) {
              if (m.heart_rate < dailyAggregates[dateOnly].minHr) dailyAggregates[dateOnly].minHr = m.heart_rate;
              if (m.heart_rate > dailyAggregates[dateOnly].maxHr) dailyAggregates[dateOnly].maxHr = m.heart_rate;
            }
            
            if (m.steps) {
              dailyAggregates[dateOnly].steps += m.steps;
            }
          });

          Object.entries(dailyAggregates).forEach(([dateOnly, agg]) => {
            if (agg.minHr < 999) {
              metrics.push({
                id: `rhr-${dateOnly}`,
                source: 'garmin',
                sourceId: logId,
                timestamp: agg.timestamp,
                type: 'rhr',
                value: agg.minHr,
                unit: 'bpm',
                confidenceScore: 70 // Lower confidence since it's an aggregated minimum, not official RHR
              });
            }
            if (agg.steps > 0) {
              metrics.push({
                id: `steps-${dateOnly}`,
                source: 'garmin',
                sourceId: logId,
                timestamp: agg.timestamp,
                type: 'steps',
                value: agg.steps,
                unit: 'steps',
                confidenceScore: 80
              });
            }
          });
        }

        if (metrics.length > 0) {
          addMetrics(metrics);
          import('../firebaseSync').then(({ syncMetricsToFirestore }) => {
             syncMetricsToFirestore(metrics);
          }).catch(() => {});
          const currentLog = garminImportLogs.find(l => l.id === logId);
          if (currentLog) {
            updateGarminImportLog(logId, { 
              recordsAdded: (currentLog.recordsAdded || 0) + metrics.length,
              status: 'success'
            });
          }
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
};
