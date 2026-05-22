import { parseWellnessJSON } from './src/services/garmin/parsers.ts';
import { useStore } from './src/store/useStore.ts';

const sleepData = [
  {
    "sleepStartTimestampGMT": "2023-01-01T22:00:00.0",
    "sleepEndTimestampGMT": "2023-01-02T06:00:00.0",
    "calendarDate": "2023-01-02",
    "sleepTimeSeconds": 28800,
    "overallSleepScore": { "value": 85 }
  }
];

const hrvData = [
  {
    "calendarDate": "2023-01-02",
    "lastNightAvg": 45
  }
];

async function test() {
  await parseWellnessJSON(JSON.stringify(sleepData), 'log1');
  await parseWellnessJSON(JSON.stringify(hrvData), 'log2');
  
  const state = useStore.getState();
  console.log("Metrics:", state.metrics);
}

test().catch(console.error);
