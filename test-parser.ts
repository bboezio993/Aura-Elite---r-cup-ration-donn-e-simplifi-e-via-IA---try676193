import { parseWellnessJSON } from './src/services/garmin/parsers';
import { useStore } from './src/store/useStore';

const mockData = {
  "sleepData": [
    {
      "sleepStartTimestampLocal": "2023-01-01T22:00:00.0",
      "sleepTimeSeconds": 28800,
      "sleepScores": {
        "overall": {
          "value": 85
        }
      }
    }
  ]
};

async function runTest() {
  console.log("Running test...");
  try {
    await parseWellnessJSON(JSON.stringify(mockData), 'test-log');
    const state = useStore.getState();
    console.log("Metrics in store:", state.metrics.filter(m => m.type === 'sleep_duration'));
  } catch (e) {
    console.error("Test failed:", e);
  }
}

runTest();
