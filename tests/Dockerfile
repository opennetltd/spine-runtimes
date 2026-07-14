FROM ubuntu:24.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    openjdk-17-jdk \
    nodejs \
    npm \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME for Java 17 (will be set dynamically in script)
# ENV JAVA_HOME will be set at runtime

# Set working directory
WORKDIR /workspace

# Set up npm cache directory
RUN npm config set cache /tmp/npm-cache --global

# Default command
CMD ["bash"]