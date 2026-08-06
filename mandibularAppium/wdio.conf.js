const fs = require('fs');
const path = require('path');
const xlsxReporter = require('./utils/xlsxReporter');
const generateHtmlReport = require('./utils/generateHtmlReport');
const generateSummary = require('./utils/generateSummary');

const RESULTS_FILE = path.join(__dirname, '.wdio-results.jsonl');

exports.config = {
    runner: 'local',
    port: 4723,
    path: '/',
    specs: [
        process.env.WDIO_CI_SPEC || './tests/12_e2e/mega_android_1100.test.js'
    ],
    exclude: [],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:app': process.env.APK_PATH || undefined, // Set in CI
        'appium:noReset': true,
        'appium:newCommandTimeout': 240,
    }],
    logLevel: 'error',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: [], // External appium server in CI
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    onPrepare: function (config, capabilities) {
        if (fs.existsSync(RESULTS_FILE)) {
            fs.unlinkSync(RESULTS_FILE);
        }
    },

    afterTest: function (test, context, { error, result, duration, passed, retries }) {
        const testData = {
            title: test.title,
            state: passed ? 'passed' : 'failed',
            duration: duration,
            error: error ? error.message : null
        };
        fs.appendFileSync(RESULTS_FILE, JSON.stringify(testData) + '\n');
    },

    onComplete: async function(exitCode, config, capabilities, results) {
        xlsxReporter.startRun();
        
        if (fs.existsSync(RESULTS_FILE)) {
            const lines = fs.readFileSync(RESULTS_FILE, 'utf8').split('\n').filter(Boolean);
            lines.forEach(line => {
                xlsxReporter.recordTest(JSON.parse(line));
            });
        }

        const outDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        await xlsxReporter.generateReport(path.join(outDir, 'appium-report.xlsx'));
        generateHtmlReport(xlsxReporter.results);
        generateSummary(xlsxReporter.results);
        
        console.log("Custom reports generated in onComplete.");
    }
};
