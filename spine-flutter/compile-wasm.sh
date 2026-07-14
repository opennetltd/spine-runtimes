#!/bin/bash
set -e
cd "$(dirname "$0")"

# Source logging utilities
source ../formatters/logging/logging.sh

log_title "Spine Flutter WASM Compiler"

log_action "Creating assets directory"
if MKDIR_OUTPUT=$(mkdir -p lib/assets/ 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$MKDIR_OUTPUT"
    exit 1
fi

log_action "Creating pre.js module file"
if ECHO_OUTPUT=$(echo "const module = {};" > pre.js 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$ECHO_OUTPUT"
    exit 1
fi

log_detail "Using -O2 optimization to preserve function names"
log_detail "The Closure compiler in -O3 would scramble native function names"
log_action "Compiling spine-cpp to WASM"

# Build the emscripten command
if EMCC_OUTPUT=$(em++ \
    -Isrc/spine-cpp/include \
    -Isrc/spine-c/include \
    -O2 --closure 1 -fno-rtti -fno-exceptions \
    -s STRICT=1 \
    -s EXPORTED_RUNTIME_METHODS=wasmExports \
    -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
    -s MODULARIZE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ALLOW_TABLE_GROWTH \
    -s MALLOC=emmalloc \
    -s EXPORT_ALL=1 \
    -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' \
    --no-entry \
    --extern-pre-js pre.js \
    -s EXPORT_NAME=libspine_flutter \
    src/spine-c/src/extensions.cpp $(find src/spine-c/src/generated -name "*.cpp") $(find src/spine-cpp/src -name "*.cpp") \
    -o lib/assets/libspine_flutter.js 2>&1); then
    log_ok
else
    log_fail
    log_error_output "$EMCC_OUTPUT"
    rm -f pre.js
    exit 1
fi

log_action "Listing generated assets"
if LS_OUTPUT=$(ls -lah lib/assets 2>&1); then
    log_ok
    log_detail "$LS_OUTPUT"
else
    log_warn
    log_detail "$LS_OUTPUT"
fi

log_action "Cleaning up temporary files"
if RM_OUTPUT=$(rm pre.js 2>&1); then
    log_ok
else
    log_warn
    log_detail "$RM_OUTPUT"
fi

log_summary "✓ WASM compilation completed successfully"