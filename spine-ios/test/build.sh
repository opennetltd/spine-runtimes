#!/bin/bash

set -e

echo "Building Spine iOS test package..."

# Build the test package
swift build

echo "Running Spine iOS tests..."

# Run the test executable
swift run