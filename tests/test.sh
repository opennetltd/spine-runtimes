#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Source logging utilities
source ../formatters/logging/logging.sh

log_title "Spine Tests"

# Check if node/npm is available
if ! command -v npm &> /dev/null; then
    log_fail "npm is not installed"
    exit 1
fi

# Clean C++ build directory to avoid platform conflicts
if [ -d "../spine-cpp/build" ]; then
    log_action "Cleaning C++ build directory"
    rm -rf ../spine-cpp/build
    log_ok
fi

# Clean node_modules to avoid platform conflicts
if [ -d "node_modules" ]; then
    log_action "Cleaning node_modules"
    rm -rf node_modules package-lock.json
    log_ok
fi

# Install dependencies
log_action "Installing dependencies"
if npm install > /tmp/npm-install.log 2>&1; then
    log_ok
else
    log_fail
    log_detail "$(cat /tmp/npm-install.log)"
    exit 1
fi

log_action "Running TypeScript test runner"

# Run the TypeScript headless test runner with all arguments
npx -y tsx src/headless-test-runner.ts "$@"