#!/bin/bash

set -e

# Get to the script's directory
cd "$(dirname "$0")"

# Build Docker image if it doesn't exist or if Dockerfile changed
IMAGE_NAME="spine-test"
if ! docker images | grep -q "$IMAGE_NAME" || [ Dockerfile -nt .docker-built ]; then
    echo "Building Docker test image..."
    docker build -t "$IMAGE_NAME" .
    touch .docker-built
fi

# Clean C++ build directory to avoid platform conflicts
if [ -d "../spine-cpp/build" ]; then
    echo "Cleaning C++ build directory to avoid platform conflicts..."
    rm -rf ../spine-cpp/build
fi

# Clean node_modules to avoid platform conflicts
if [ -d "node_modules" ]; then
    echo "Cleaning node_modules to avoid platform conflicts..."
    rm -rf node_modules package-lock.json
fi

# Run the test in Docker
echo "Running test in Docker container..."
docker run --rm \
    -v "$(cd .. && pwd)":/workspace \
    -w /workspace/tests \
    "$IMAGE_NAME" \
    bash -c "
        # Set up environment
        export JAVA_HOME=\$(ls -d /usr/lib/jvm/java-17-openjdk-* | head -1)
        
        # Install npm dependencies
        npm install --no-save
        
        # Run the test with timeout
        timeout 120 ./test.sh $* || { 
            echo 'Test execution timed out or failed'
            exit 1
        }
    "