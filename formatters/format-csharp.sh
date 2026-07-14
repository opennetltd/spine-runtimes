#!/bin/bash
set -e

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source logging utilities
source "$dir/logging/logging.sh"

log_title "C# Formatting"

if command -v dotnet &> /dev/null; then
    # Store original directory
    pushd "$dir" > /dev/null
    
    cp .editorconfig ../spine-csharp/ 2>/dev/null || true
    cp .editorconfig ../spine-monogame/ 2>/dev/null || true
    cp .editorconfig ../spine-unity/ 2>/dev/null || true

    # Format spine-csharp
    log_action "Formatting spine-csharp"
    pushd ../spine-csharp > /dev/null
    if DOTNET_OUTPUT=$(dotnet format spine-csharp.csproj --no-restore --verbosity quiet 2>&1); then
        log_ok
    else
        log_warn
        log_detail "$DOTNET_OUTPUT"
    fi
    popd > /dev/null

    # Format spine-monogame
    log_action "Formatting spine-monogame"
    pushd ../spine-monogame > /dev/null
    if DOTNET_OUTPUT=$(dotnet format --no-restore --verbosity quiet 2>&1); then
        log_ok
    else
        log_warn
        log_detail "$DOTNET_OUTPUT"
    fi
    popd > /dev/null

    # Format spine-unity - look for .cs files directly
    log_action "Formatting spine-unity C# files"
    pushd ../spine-unity > /dev/null
    # Find all .cs files and format them using dotnet format whitespace
    cs_files=$(find . -name "*.cs" -type f -not -path "./Library/*" -not -path "./Temp/*" -not -path "./obj/*" -not -path "./bin/*" | wc -l | tr -d ' ')
    if [ "$cs_files" -gt 0 ]; then
        find . -name "*.cs" -type f -not -path "./Library/*" -not -path "./Temp/*" -not -path "./obj/*" -not -path "./bin/*" | while read -r file; do
            dotnet format whitespace --include "$file" --no-restore 2>/dev/null || true
        done
        log_ok
    else
        log_skip
    fi
    popd > /dev/null

    rm -f ../spine-csharp/.editorconfig
    rm -f ../spine-monogame/.editorconfig
    rm -f ../spine-unity/.editorconfig

    # Return to original directory
    popd > /dev/null
else
    log_fail
    log_error_output "dotnet not found. Please install .NET SDK to format C# files."
    exit 1
fi