#!/bin/bash
set -e

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source logging utilities
source "$dir/logging/logging.sh"

log_title "TypeScript Formatting"

# Store original directory
pushd "$dir" > /dev/null

# Check if tsfmt.json files match
log_action "Checking tsfmt.json consistency"
if CMP_OUTPUT=$(cmp -s ../spine-ts/tsfmt.json ../tests/tsfmt.json 2>&1); then
    log_ok
else
    log_fail
    log_error_output "spine-ts/tsfmt.json and tests/tsfmt.json differ!"
    log_detail "Please sync them to ensure consistent formatting."
    popd > /dev/null
    exit 1
fi

# Format TypeScript files
log_action "Formatting spine-ts TypeScript files"
pushd ../spine-ts > /dev/null
if NPM_OUTPUT=$(npm run format 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$NPM_OUTPUT"
    popd > /dev/null
    popd > /dev/null
    exit 1
fi
popd > /dev/null

log_action "Formatting tests TypeScript files"
pushd ../tests > /dev/null
if NPM_OUTPUT=$(npm run format 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$NPM_OUTPUT"
    popd > /dev/null
    popd > /dev/null
    exit 1
fi
popd > /dev/null

# Return to original directory
popd > /dev/null