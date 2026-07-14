#!/bin/bash
set -e

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source logging utilities
source "$dir/logging/logging.sh"

log_title "Haxe Formatting"

# Store original directory
pushd "$dir" > /dev/null

if command -v haxelib &> /dev/null; then
    log_action "Checking Haxe formatter availability"
    if HAXELIB_OUTPUT=$(haxelib list formatter 2>&1); then
        log_ok

        # Format spine-haxe directory
        if [ -d ../spine-haxe ]; then
            log_action "Formatting spine-haxe directory"
            if FORMATTER_OUTPUT=$(haxelib run formatter -s ../spine-haxe 2>&1); then
                log_ok
            else
                log_fail
                log_error_output "$FORMATTER_OUTPUT"
                popd > /dev/null
                exit 1
            fi
        else
            log_action "Formatting spine-haxe directory"
            log_skip
        fi
    else
        log_fail
        log_error_output "Haxe formatter not found. Install with: haxelib install formatter"
        exit 1
    fi
else
    log_fail
    log_error_output "haxelib not found. Please install Haxe to format Haxe files."
    exit 1
fi

# Return to original directory
popd > /dev/null