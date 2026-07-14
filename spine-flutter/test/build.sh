#!/bin/bash
set -e

cd "$(dirname "$0")"

# Source logging utilities
source ../../formatters/logging/logging.sh

log_title "Spine Flutter Test Build"

# Create and clean build directory
log_action "Setting up build directory"
mkdir -p build
cd build
rm -rf *
log_ok

# Configure and build using CMake with Ninja
log_action "Configuring CMake"
if CMAKE_OUTPUT=$(cmake -G Ninja ../../src 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CMAKE_OUTPUT"
    exit 1
fi

log_action "Building native library"
if BUILD_OUTPUT=$(cmake --build . 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$BUILD_OUTPUT"
    exit 1
fi

log_action "Copying library to test directory"
if CP_OUTPUT=$(cp libspine_flutter.dylib ../spine_flutter.dylib 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CP_OUTPUT"
    exit 1
fi

log_summary "✓ Build completed successfully"