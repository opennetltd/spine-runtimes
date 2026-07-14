#!/bin/bash
set -e

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source logging utilities
source "$dir/logging/logging.sh"

log_title "Java Formatting"

# Store original directory
pushd "$dir" > /dev/null

# Build the Eclipse formatter if needed
jar_file="eclipse-formatter/target/eclipse-formatter-1.0.0-jar-with-dependencies.jar"
src_file="eclipse-formatter/src/main/java/com/esotericsoftware/spine/formatter/EclipseFormatter.java"

if [ ! -f "$jar_file" ] || [ "$src_file" -nt "$jar_file" ]; then
    log_action "Building Eclipse formatter"
    pushd eclipse-formatter > /dev/null
    if MVN_OUTPUT=$(mvn -q clean package 2>&1); then
        log_ok
    else
        log_fail
        log_error_output "$MVN_OUTPUT"
        popd > /dev/null
        popd > /dev/null
        exit 1
    fi
    popd > /dev/null
fi

# Find all Java files
java_files=$(find ../spine-libgdx ../spine-android -name "*.java" -type f \
    -not -path "*/build/*" \
    -not -path "*/.gradle/*" \
    -not -path "*/bin/*" \
    -not -path "*/gen/*" \
    -not -path "*/target/*")

# Run the formatter
if [ -n "$java_files" ]; then
    java_count=$(echo "$java_files" | wc -l | tr -d ' ')
    log_action "Formatting $java_count Java files"
    if FORMATTER_OUTPUT=$(java -jar eclipse-formatter/target/eclipse-formatter-1.0.0-jar-with-dependencies.jar \
        eclipse-formatter.xml \
        $java_files 2>&1); then
        log_ok
    else
        log_fail
        log_error_output "$FORMATTER_OUTPUT"
        popd > /dev/null
        exit 1
    fi
else
    log_action "Formatting Java files"
    log_skip
fi

# Return to original directory
popd > /dev/null