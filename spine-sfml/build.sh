#!/bin/bash
set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$script_dir"

if [ ! -f "CMakePresets.json" ]; then
    echo "Error: CMakePresets.json not found"
    exit 1
fi

# Default to debug build
preset=${1:-debug}

echo "Configuring with preset: $preset"
cmake --preset=$preset

echo "Building..."
cmake --build --preset=$preset

echo "Build complete!"
echo "Examples are in build/$preset/"