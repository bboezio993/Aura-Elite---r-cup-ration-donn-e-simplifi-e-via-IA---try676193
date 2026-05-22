import { parseWellnessJSON } from './src/services/garmin/parsers';
import { useStore } from './src/store/useStore';

const mockData = {
  "someRandomKey": {
    "nestedArray": [
      {
        "dailySleepDTO": {
          "calendarDate": "2023-01-02",
          "sleepTimeSeconds": 28800
        }
      },
      {
        "date": "2023-01-03",
        "durationInMilliseconds": 28800000,
        "sleepScores": { "overall": { "value": 90 } }
      }
    ]
  }
};

async function runTest() {
  console.log("Running test 2...");
  try {
    await parseWellnessJSON(JSON.stringify(mockData), 'test-log');
    const state = useStore.getState();
    console.log("Metrics in store:", state.metrics.filter(m => m.type === 'sleep_duration'));
  } catch (e) {
    console.error("Test failed:", e);
  }
}

runTest();
