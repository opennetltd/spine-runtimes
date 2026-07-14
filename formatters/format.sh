#!/bin/bash
set -e
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source logging utilities
source "$dir/logging/logging.sh"

log_title "Spine Runtimes Code Formatter"

# Default: format all languages
FORMAT_JAVA=true
FORMAT_TS=true
FORMAT_CPP=true
FORMAT_CSHARP=true
FORMAT_HAXE=true
FORMAT_DART=true
FORMAT_SWIFT=true

# Parse command line arguments
show_help() {
    log_title "Spine Runtimes Code Formatter"
    echo "Usage: ./format.sh [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  java          Format only Java files"
    echo "  ts            Format only TypeScript files"
    echo "  cpp           Format only C/C++ files"
    echo "  csharp        Format only C# files"
    echo "  haxe          Format only Haxe files"
    echo "  dart          Format only Dart files"
    echo "  swift         Format only Swift files"
    echo ""
    echo "If no language flags are specified, all languages will be formatted."
    echo "Multiple language flags can be combined, e.g.: ./format.sh java ts"
    echo ""
    echo "Tools used:"
    echo "  Java:       Eclipse formatter (via eclipse-formatter.xml)"
    echo "  TypeScript: tsfmt (typescript-formatter)"
    echo "  C/C++:      clang-format"
    echo "  C#:         dotnet format"
    echo "  Haxe:       haxe formatter"
    echo "  Dart:       dart format"
    echo "  Swift:      swift-format"
    exit 0
}

# If any language flags are specified, disable all by default
if [[ "$*" == *"java"* ]] || [[ "$*" == *"ts"* ]] || [[ "$*" == *"cpp"* ]] || [[ "$*" == *"csharp"* ]] || [[ "$*" == *"haxe"* ]] || [[ "$*" == *"dart"* ]] || [[ "$*" == *"swift"* ]]; then
    FORMAT_JAVA=false
    FORMAT_TS=false
    FORMAT_CPP=false
    FORMAT_CSHARP=false
    FORMAT_HAXE=false
    FORMAT_DART=false
    FORMAT_SWIFT=false
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            ;;
        java)
            FORMAT_JAVA=true
            shift
            ;;
        ts)
            FORMAT_TS=true
            shift
            ;;
        cpp)
            FORMAT_CPP=true
            shift
            ;;
        csharp)
            FORMAT_CSHARP=true
            shift
            ;;
        haxe)
            FORMAT_HAXE=true
            shift
            ;;
        dart)
            FORMAT_DART=true
            shift
            ;;
        swift)
            FORMAT_SWIFT=true
            shift
            ;;
        *)
            log_fail
            log_error_output "Unknown option: $1"
            log_detail "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Call individual formatter scripts (they handle their own logging)
if [ "$FORMAT_CPP" = true ]; then
    "$dir/format-cpp.sh"
fi

if [ "$FORMAT_JAVA" = true ]; then
    "$dir/format-java.sh"
fi

if [ "$FORMAT_CSHARP" = true ]; then
    "$dir/format-csharp.sh"
fi

if [ "$FORMAT_TS" = true ]; then
    "$dir/format-ts.sh"
fi

if [ "$FORMAT_DART" = true ]; then
    "$dir/format-dart.sh"
fi

if [ "$FORMAT_HAXE" = true ]; then
    "$dir/format-haxe.sh"
fi

if [ "$FORMAT_SWIFT" = true ]; then
    "$dir/format-swift.sh"
fi

log_summary "✓ All formatting completed"