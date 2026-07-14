#!/bin/bash
set -e

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source logging utilities
source "$dir/logging/logging.sh"

log_title "Dart Formatting"

# Store original directory
pushd "$dir" > /dev/null

if command -v dart &> /dev/null; then
    dart_files=$(find .. -name "*.dart" \
        -not -path "*/.*" \
        -not -path "*/node_modules/*" \
        -not -path "*/build/*" | wc -l | tr -d ' ')

    if [ "$dart_files" -gt 0 ]; then
        log_action "Formatting $dart_files Dart files"
        # Debug: show dart version and format command
        echo "Dart version: $(dart --version)"
        echo "Running dart format with page-width 120 on all dart files"
        
        # Use xargs instead of -exec to ensure proper argument passing
        if DART_OUTPUT=$(find .. -name "*.dart" \
            -not -path "*/.*" \
            -not -path "*/node_modules/*" \
            -not -path "*/build/*" \
            -print0 | xargs -0 dart format --page-width 120 2>&1); then
            log_ok
        else
            log_fail
            log_error_output "$DART_OUTPUT"
            popd > /dev/null
            exit 1
        fi
    else
        log_action "Formatting Dart files"
        log_skip
    fi
else
    log_fail
    log_error_output "dart not found. Please install Dart SDK to format Dart files."
    exit 1
fi

# Return to original directory
popd > /dev/null