const mockGarminSleep = [
  {
    "sleepStartTimestampGMT": 1672520400000,
    "sleepEndTimestampGMT": 1672551000000,
    "calendarDate": "2023-01-01",
    "sleepWindowConfirmationType": "ENHANCED_TENTATIVE",
    "dailySleepDTO": {
      "sleepStartTimestampGMT": 1672520400000,
      "sleepEndTimestampGMT": 1672551000000,
      "calendarDate": "2023-01-01",
      "sleepTimeSeconds": 26460,
      "sleepScores": {
        "overall": { "value": 85 }
      }
    }
  }
];

const findRecords = (obj: any, records: any[] = []) => {
    if (!obj || typeof obj !== 'object') return records;
    if (Array.isArray(obj)) {
        obj.forEach(item => findRecords(item, records));
        return records;
    }
    const hasDate = obj.calendarDate || obj.date || obj.sleepStartTimestampGMT || obj.startTimeGMT || obj.startTimeLocal || obj.timestamp || obj.sleepStartTimestampLocal;
    if (hasDate) {
        records.push(obj);
    } else if (obj.dailySleepDTO) {
        records.push(obj.dailySleepDTO);
    }
    Object.values(obj).forEach(val => {
        if (val && typeof val === 'object') {
            findRecords(val, records);
        }
    });
    return records;
};

const entries = findRecords(mockGarminSleep);
console.log("Records Found:", entries.length);

const metrics: any[] = [];
entries.forEach((entry: any) => {
    const record = entry.dailySleepDTO || entry;
    let dateRaw = record.calendarDate || record.date || record.sleepStartTimestampGMT || record.startTimeGMT || record.startTimeLocal || record.timestamp || record.sleepStartTimestampLocal;
    if (!dateRaw) return;

    if (typeof dateRaw === 'string' && /^\d{10,14}$/.test(dateRaw)) {
        dateRaw = parseInt(dateRaw, 10);
    }
    if (typeof dateRaw === 'number' && dateRaw < 100000000000) {
        dateRaw *= 1000;
    }

    let timestamp;
    try {
        timestamp = new Date(dateRaw).toISOString();
    } catch (e) {
        return;
    }
    const date = timestamp.split('T')[0];
    const metricName = typeof record.userMetric === 'string' ? record.userMetric.toLowerCase() : '';
    const metricValue = record.value !== undefined ? record.value : undefined;

    let sleepSeconds = record.sleepTimeSeconds || record.totalSleepSeconds || record.sleepingSeconds || record.sleepDurationInSeconds || record.sleepDuration || (metricName.includes('sleep') ? metricValue : undefined);
    
    if (sleepSeconds !== undefined) {
        let durationHours = Number(sleepSeconds);
        if (durationHours > 24) {
            durationHours = durationHours / 3600;
        }
        if (durationHours > 0 && durationHours <= 18) {
            metrics.push({ type: 'sleep_duration', value: durationHours, date });
        }
    }
});
console.log("Metrics Final:", metrics);

