#!/bin/bash

set -e

# Get to the script's directory
cd "$(dirname "$0")"

# Source logging utilities
source ../formatters/logging/logging.sh

log_title "spine-dart bindings generation"

# Install dependencies if needed
if [ ! -d "codegen/node_modules" ]; then
    log_action "Installing codegen dependencies"
    if (cd codegen && npm install > /dev/null 2>&1); then
        log_ok
    else
        log_fail
        exit 1
    fi
fi

# Generating spine-c bindings
log_action "Generating spine-c bindings"
if LOG=$(cd ../spine-c && ./build.sh codegen 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$LOG"
    exit 1
fi

# Copy spine-c and spine-cpp sources
log_action "Setting up source files"
if ./setup.sh > /dev/null 2>&1; then
    log_ok
else
    log_fail
    exit 1
fi

# Run the codegen
log_action "Generating Dart bindings"
if LOG=$(npx tsx codegen/src/index.ts 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$LOG"
    exit 1
fi

# Run WASM compilation
log_action "Compiling to WebAssembly"
if LOG=$(bash compile-wasm.sh 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$LOG"
    exit 1
fi

# Build test spine_flutter shared library
log_action "Building test library"
if LOG=$(cd test && ./build.sh 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$LOG"
    exit 1
fi

log_summary "✓ Dart bindings generated successfully"