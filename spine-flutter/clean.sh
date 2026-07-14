#!/bin/bash
set -e
cd "$(dirname "$0")"

# Source logging utilities
source ../formatters/logging/logging.sh

log_title "Spine Flutter Clean"

log_detail "Cleaning all build artifacts and resetting iOS/macOS projects"

# Clean Flutter build artifacts
log_action "Cleaning Flutter build artifacts"
if flutter clean 2>&1 >/dev/null; then
    log_ok
else
    log_fail
fi

# Clean example Flutter build artifacts
if [ -d "example" ]; then
    log_action "Cleaning example Flutter build artifacts"
    if (cd example && flutter clean) 2>&1 >/dev/null; then
        log_ok
    else
        log_fail
    fi
fi

# Clean iOS artifacts
log_action "Cleaning iOS CocoaPods artifacts"
rm -rf ios/Pods
rm -f ios/Podfile.lock
rm -rf ios/.symlinks
rm -rf ios/Flutter/Flutter.framework
rm -rf ios/Flutter/Flutter.podspec
log_ok

# Clean macOS artifacts
log_action "Cleaning macOS CocoaPods artifacts"
rm -rf macos/Pods
rm -f macos/Podfile.lock
rm -rf macos/.symlinks
rm -rf macos/Flutter/ephemeral
log_ok

# Clean example iOS artifacts
if [ -d "example/ios" ]; then
    log_action "Cleaning example iOS CocoaPods artifacts"
    rm -rf example/ios/Pods
    rm -f example/ios/Podfile.lock
    rm -rf example/ios/.symlinks
    rm -rf example/ios/Flutter/Flutter.framework
    rm -rf example/ios/Flutter/Flutter.podspec
    log_ok
fi

# Clean example macOS artifacts
if [ -d "example/macos" ]; then
    log_action "Cleaning example macOS CocoaPods artifacts"
    rm -rf example/macos/Pods
    rm -f example/macos/Podfile.lock
    rm -rf example/macos/.symlinks
    rm -rf example/macos/Flutter/ephemeral
    log_ok
fi

# Clean Xcode derived data
log_action "Cleaning Xcode derived data"
rm -rf ~/Library/Developer/Xcode/DerivedData/*spine_flutter*
log_ok

# Clean pub cache for local packages
log_action "Cleaning pub cache"
rm -rf .dart_tool
rm -rf .packages
rm -f .flutter-plugins
rm -f .flutter-plugins-dependencies
rm -f pubspec.lock
if [ -d "example" ]; then
    rm -rf example/.dart_tool
    rm -rf example/.packages
    rm -f example/.flutter-plugins
    rm -f example/.flutter-plugins-dependencies
    rm -f example/pubspec.lock
fi
log_ok

log_summary "✓ Clean completed successfully"
log_detail "Run 'flutter pub get' to restore dependencies"
log_detail "Run 'cd example && pod install' for iOS/macOS to regenerate pod files"