#!/bin/bash

# Build Haxe HeadlessTest using interpreter mode to avoid compilation issues
# Uses Haxe interpreter directly, avoiding framework dependency issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Haxe HeadlessTest..."

# Clean previous build
rm -rf build/headless-test

# Create build directory
mkdir -p build/headless-test

# Create wrapper script that uses Haxe interpreter
cat > build/headless-test/HeadlessTest << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

# Use Haxe interpreter to run HeadlessTest directly
# This avoids compilation issues with optional framework dependencies
haxe \
    -cp spine-haxe \
    -cp tests \
    --run HeadlessTest "$@"
EOF

# Make wrapper executable
chmod +x build/headless-test/HeadlessTest

echo "Build complete: build/headless-test/HeadlessTest (Haxe interpreter)"