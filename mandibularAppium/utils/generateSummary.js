const fs = require('fs');
const path = require('path');

function generateSummary(results) {
    const totalTests = results.length;
    const passes = results.filter(r => r.state === 'passed').length;
    const failures = totalTests - passes;
    const passRate = totalTests > 0 ? ((passes / totalTests) * 100).toFixed(2) : 0;
    const durationTotal = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const durationSec = (durationTotal / 1000).toFixed(2);

    const runNumber = process.env.GITHUB_RUN_NUMBER || 'Local';

    const summary = `## 📊 Appium Android E2E Execution Summary (Build #${runNumber})

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tests** | ${totalTests} | 📱 |
| **Passed** | ${passes} | ✅ |
| **Failed** | ${failures} | ❌ |
| **Pass Rate** | ${passRate}% | 🏆 |
| **Duration** | ${durationSec}s | ⏱️ |

### 🌐 Native GitHub Pages Deployment
*Live execution reports will be published shortly.*
`;

    fs.writeFileSync(path.join(__dirname, '..', 'reports', 'step-summary.md'), summary);
    console.log("GitHub Step Summary markdown generated.");
}

module.exports = generateSummary;
