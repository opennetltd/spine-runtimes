#!/bin/bash
set -e
cd "$(dirname "$0")"

# Source logging utilities
source ../formatters/logging/logging.sh

log_title "Spine Flutter Setup"

log_detail "CocoaPods requires all source files to be under the same folder hierarchy"
log_detail "as the podspec file resides in. Copying spine-cpp sources to platform folders."

# Clean destination directories
log_action "Cleaning destination directories"
rm -rf ios/Classes/spine-c ios/Classes/spine-cpp
rm -rf macos/Classes/spine-c macos/Classes/spine-cpp
rm -rf src/spine-c src/spine-cpp
log_ok

log_action "Copying spine-c to iOS Classes"
mkdir -p ios/Classes/spine-c
if CP_OUTPUT=$(cp -r ../spine-c/src ../spine-c/include ios/Classes/spine-c/ 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CP_OUTPUT"
    exit 1
fi

log_action "Copying spine-cpp to iOS Classes"
mkdir -p ios/Classes/spine-cpp
if CP_OUTPUT=$(cp -r ../spine-cpp/src ../spine-cpp/include ios/Classes/spine-cpp/ 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CP_OUTPUT"
    exit 1
fi
rm -f ios/Classes/spine-cpp/src/no-cpprt.cpp

log_action "Copying spine-c to macOS Classes"
mkdir -p macos/Classes/spine-c
if CP_OUTPUT=$(cp -r ../spine-c/src ../spine-c/include macos/Classes/spine-c/ 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CP_OUTPUT"
    exit 1
fi

log_action "Copying spine-cpp to macOS Classes"
mkdir -p macos/Classes/spine-cpp
if CP_OUTPUT=$(cp -r ../spine-cpp/src ../spine-cpp/include macos/Classes/spine-cpp/ 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CP_OUTPUT"
    exit 1
fi
rm -f macos/Classes/spine-cpp/src/no-cpprt.cpp

log_action "Copying spine-c to src directory"
mkdir -p src/spine-c
if CP_OUTPUT=$(cp -r ../spine-c/src ../spine-c/include src/spine-c/ 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CP_OUTPUT"
    exit 1
fi

log_action "Copying spine-cpp to src directory"
mkdir -p src/spine-cpp
if CP_OUTPUT=$(cp -r ../spine-cpp/src ../spine-cpp/include src/spine-cpp/ 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$CP_OUTPUT"
    exit 1
fi
rm -f src/spine-cpp/src/no-cpprt.cpp

log_summary "✓ Flutter setup completed successfully"
