const fs = require('fs');
const path = require('path');

function getMetricValue(metricObj, key) {
    if (!metricObj) return 'N/A';
    if (metricObj.values && metricObj.values[key] !== undefined) {
        return metricObj.values[key];
    }
    if (metricObj[key] !== undefined) {
        return metricObj[key];
    }
    return 'N/A';
}

function formatVal(val, suffix = '', isPercentage = false) {
    if (val === 'N/A') return 'N/A';
    if (isPercentage) return (parseFloat(val) * 100).toFixed(2) + '%';
    return parseFloat(val).toFixed(2) + suffix;
}

try {
    const summaryPath = path.resolve(process.argv[2] || 'summary.json');
    if (!fs.existsSync(summaryPath)) {
        console.error(`Summary file not found at ${summaryPath}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(summaryPath, 'utf8');
    const data = JSON.parse(rawData);
    const metrics = data.metrics || {};

    const reqs = metrics.http_reqs;
    const totalReqs = getMetricValue(reqs, 'count');
    const rps = getMetricValue(reqs, 'rate');

    const dur = metrics.http_req_duration;
    const avg = getMetricValue(dur, 'avg');
    const min = getMetricValue(dur, 'min');
    const max = getMetricValue(dur, 'max');
    const p95 = getMetricValue(dur, 'p(95)');

    const failed = metrics.http_req_failed;
    const failRate = getMetricValue(failed, 'rate');

    const checks = metrics.checks;
    const checkRate = getMetricValue(checks, 'rate');

    const markdown = `## 🚀 API k6 Performance Summary
**Test Parameters:** 100 Virtual Users, 1 Minute Duration

| Metric | Value | Status |
|--------|-------|--------|
| **Total Requests** | ${totalReqs} | 🌐 |
| **Throughput (RPS)** | ${formatVal(rps, ' req/s')} | ⚡ |
| **Failure Rate** | ${formatVal(failRate, '', true)} | ${parseFloat(failRate) >= 0.05 ? '❌' : '✅'} |
| **Check Pass Rate** | ${formatVal(checkRate, '', true)} | 🎯 |
| **Response (Avg)** | ${formatVal(avg, ' ms')} | ⏱️ |
| **Response (Min)** | ${formatVal(min, ' ms')} | ⏱️ |
| **Response (Max)** | ${formatVal(max, ' ms')} | ⏱️ |
| **Response (p95)** | ${formatVal(p95, ' ms')} | ${parseFloat(p95) >= 1500 ? '❌' : '✅'} |
`;

    const ghStepSummary = process.env.GITHUB_STEP_SUMMARY;
    if (ghStepSummary) {
        fs.appendFileSync(ghStepSummary, markdown + '\n');
        console.log("Appended performance summary to GITHUB_STEP_SUMMARY.");
    } else {
        console.log(markdown);
    }
} catch (error) {
    console.error("Error parsing k6 summary:", error);
    process.exit(1);
}
