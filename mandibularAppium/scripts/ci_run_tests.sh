#!/bin/bash
set -e

echo "Installing APK to emulator..."
adb install -r "${APK_PATH}"

echo "Starting Appium server in background..."
npx appium --log-level warn > /tmp/appium.log 2>&1 &

echo "Waiting for Appium to start..."
timeout 60 bash -c 'while ! curl -s http://127.0.0.1:4723/status >/dev/null; do sleep 2; done'
echo "Appium started."

if [ -f "$GITHUB_PATH" ]; then
    export PATH="$PATH:$(cat $GITHUB_PATH | tr '\n' ':')"
fi

echo "Running WDIO tests..."
node node_modules/@wdio/cli/bin/wdio.js run wdio.conf.js || {
    echo "WDIO failed. Running fallback report generator..."
    node utils/generateFallbackReport.js
    exit 1
}
