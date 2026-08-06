const fs = require('fs');
const path = require('path');

function generateHtmlReport(results) {
    const totalTests = results.length;
    const passes = results.filter(r => r.state === 'passed').length;
    const failures = totalTests - passes;
    const passRate = totalTests > 0 ? ((passes / totalTests) * 100).toFixed(2) : 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Android E2E Execution Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #ffffff; margin: 0; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #333; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; background: #1e1e1e; padding: 20px; border-radius: 8px; }
        .metric { text-align: center; }
        .metric h3 { margin: 0; font-size: 14px; color: #aaaaaa; }
        .metric p { margin: 10px 0 0; font-size: 24px; font-weight: bold; }
        .pass { color: #4caf50; }
        .fail { color: #f44336; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
        th { background-color: #1e1e1e; }
        .row-pass { border-left: 4px solid #4caf50; }
        .row-fail { border-left: 4px solid #f44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📱 Android Appium E2E Test Report</h1>
    </div>
    <div class="summary">
        <div class="metric"><h3>Total Tests</h3><p>${totalTests}</p></div>
        <div class="metric"><h3>Passed</h3><p class="pass">${passes}</p></div>
        <div class="metric"><h3>Failed</h3><p class="fail">${failures}</p></div>
        <div class="metric"><h3>Pass Rate</h3><p>${passRate}%</p></div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Title</th>
                <th>Duration (ms)</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(r => `
            <tr class="${r.state === 'passed' ? 'row-pass' : 'row-fail'}">
                <td>${r.category}</td>
                <td>${r.title}</td>
                <td>${r.duration}</td>
                <td class="${r.state === 'passed' ? 'pass' : 'fail'}">${r.state.toUpperCase()}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    const outDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outDir, 'execution-report.html'), html);
    console.log("HTML report generated.");
}

module.exports = generateHtmlReport;
