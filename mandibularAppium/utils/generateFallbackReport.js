const fs = require('fs');
const path = require('path');
const xlsxReporter = require('./xlsxReporter');
const generateHtmlReport = require('./generateHtmlReport');
const generateSummary = require('./generateSummary');

async function run() {
    console.log("Generating fallback report due to fatal crash...");
    
    // Simulate one failed test indicating crash
    xlsxReporter.startRun();
    xlsxReporter.recordTest({
        title: "[Fatal-T1] Setup/Appium Crash",
        state: "failed",
        duration: 0,
        error: "WebDriver session failed to initialize or crashed."
    });

    const outDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    await xlsxReporter.generateReport(path.join(outDir, 'appium-report.xlsx'));
    generateHtmlReport(xlsxReporter.results);
    generateSummary(xlsxReporter.results);
    
    console.log("Fallback report generated successfully.");
}

run();
