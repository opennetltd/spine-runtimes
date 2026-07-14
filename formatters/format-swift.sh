#!/bin/bash
set -e

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source logging utilities
source "$dir/logging/logging.sh"

log_title "Swift Formatting"

# Store original directory
pushd "$dir" > /dev/null

if command -v swift-format &> /dev/null; then

    swift_files=$(find .. -name "*.swift" -type f \
        -not -path "*/.*" \
        -not -path "*/build/*" \
        -not -path "*/DerivedData/*" | wc -l | tr -d ' ')

    if [ "$swift_files" -gt 0 ]; then
        log_action "Formatting $swift_files Swift files"
        if SWIFT_OUTPUT=$(find .. -name "*.swift" -type f \
            -not -path "*/.*" \
            -not -path "*/build/*" \
            -not -path "*/DerivedData/*" \
            -print0 | xargs -0 swift-format --in-place --configuration .swift-format 2>&1); then
            log_ok
        else
            log_fail
            log_error_output "$SWIFT_OUTPUT"
            popd > /dev/null
            exit 1
        fi
    else
        log_action "Formatting Swift files"
        log_skip
    fi
else
    log_fail
    log_error_output "swift-format not found. Install via brew install swift-format"
    exit 1
fi

# Return to original directory
popd > /dev/null