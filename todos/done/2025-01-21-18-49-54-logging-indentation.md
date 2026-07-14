# Improve bash script logging indentation for nested calls
**Status:** Done
**Agent PID:** 30228

## Original Todo
- clean up logging in spine-c/codegen, use chalk to do colored warnings/errors and make logging look very nice and informative (no emojis)

## Description
Implement automatic indentation for bash script logging when scripts call other scripts. Currently, when a script calls another script, both use the same logging functions from `formatters/logging/logging.sh`, making it difficult to distinguish the call hierarchy. The solution will detect script nesting level by analyzing the process tree and automatically indent log output from child scripts.

## Implementation Plan
- [x] Create process tree analysis utility to detect script nesting level
- [x] Add nesting level detection that runs once when logging.sh is sourced
- [x] Store indentation level in a local variable (SPINE_LOG_INDENT_SPACES) - **not exported**
- [x] Modify log_action(), log_warn(), and log_detail() to use the pre-calculated local indentation
- [x] Test with nested script calls (format.sh calling format-cpp.sh, etc.)
- [x] Ensure backward compatibility and graceful fallback if detection fails
- [x] Update documentation to explain the new indentation behavior
- [x] Add script filename to log_title output for better clarity

## Notes
26 bash scripts in the codebase use logging.sh functionality, including build, test, format, setup, and publish scripts. All would benefit from proper indentation when calling each other.