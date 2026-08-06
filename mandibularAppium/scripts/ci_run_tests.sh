#!/bin/bash

# Define fallback function
trigger_fallback() {
    echo "Failure detected! Running fallback report generator..."
    node utils/generateFallbackReport.js
    exit 1
}

echo "Installing APK to emulator..."
adb install -r "${APK_PATH}" || trigger_fallback

echo "Installing Appium UiAutomator2 Driver..."
npx appium driver install uiautomator2

echo "Starting Appium server in background..."
npx appium --log-level warn > /tmp/appium.log 2>&1 &

echo "Waiting for Appium to start..."
timeout 60 bash -c 'while ! curl -s http://127.0.0.1:4723/status >/dev/null; do sleep 2; done' || trigger_fallback
echo "Appium started."

if [ -f "$GITHUB_PATH" ]; then
    export PATH="$PATH:$(cat $GITHUB_PATH | tr '\n' ':')"
fi

echo "Running WDIO tests..."
set +e
node node_modules/@wdio/cli/bin/wdio.js run wdio.conf.js
WDIO_EXIT_CODE=$?

if [ ! -f "reports/appium-report.xlsx" ]; then
    echo "WDIO crashed fatally before generating reports! Running fallback..."
    node utils/generateFallbackReport.js
    exit 1
fi

exit $WDIO_EXIT_CODE
