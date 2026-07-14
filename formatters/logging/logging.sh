#!/bin/bash
# Bash color and formatting utilities
# Source this file in your bash scripts for colored output

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
GRAY='\033[0;90m'

# Bright colors
BRIGHT_RED='\033[0;91m'
BRIGHT_GREEN='\033[0;92m'
BRIGHT_YELLOW='\033[0;93m'
BRIGHT_BLUE='\033[0;94m'
BRIGHT_MAGENTA='\033[0;95m'
BRIGHT_CYAN='\033[0;96m'
BRIGHT_WHITE='\033[0;97m'

# Background colors
BG_RED='\033[41m'
BG_GREEN='\033[42m'
BG_YELLOW='\033[43m'
BG_BLUE='\033[44m'
BG_MAGENTA='\033[45m'
BG_CYAN='\033[46m'
BG_WHITE='\033[47m'

# Text styles
BOLD='\033[1m'
DIM='\033[2m'
UNDERLINE='\033[4m'
BLINK='\033[5m'
REVERSE='\033[7m'
STRIKETHROUGH='\033[9m'

# Reset
NC='\033[0m' # No Color

# Design principles:
# 1. Minimal visual noise - use color sparingly for emphasis
# 2. Clear hierarchy - different levels of information have different treatments
# 3. Consistent spacing - clean vertical rhythm
# 4. Accessible - readable without colors

# Detect script nesting level for automatic indentation
# This runs once when logging.sh is sourced
detect_nesting_level() {
    local nesting=0

    # Check parent process for script execution
    if [ -n "$PPID" ]; then
        local parent_info=$(ps -p $PPID -o comm,args 2>/dev/null | tail -1)
        local parent_comm=$(echo "$parent_info" | awk '{print $1}')
        local parent_args=$(echo "$parent_info" | awk '{for(i=2;i<=NF;i++) printf "%s ", $i}')

        case "$parent_comm" in
            *bash|*sh|bash|sh)
                if echo "$parent_args" | grep -q '\.sh\|\.bash' && ! echo "$parent_args" | grep -q 'claude\|snapshot\|/tmp/\|eval'; then
                    nesting=1
                fi
                ;;
        esac
    fi

    # Fallback to SHLVL-based detection if no parent script found
    if [ $nesting -eq 0 ] && [ $((SHLVL - 1)) -gt 0 ]; then
        # Check if non-interactive (likely scripted)
        if [ ! -t 0 ] && [ ! -t 1 ]; then
            nesting=$((SHLVL - 1))
        fi
    fi

    echo $nesting
}

# Calculate indentation spaces based on nesting level (local to this sourcing)
SPINE_LOG_NESTING_LEVEL=$(detect_nesting_level)
SPINE_LOG_INDENT_SPACES=$(printf "%*s" $((SPINE_LOG_NESTING_LEVEL * 2)) "")

# Main header for script/tool name
log_title() {
    if [ $SPINE_LOG_NESTING_LEVEL -gt 0 ]; then
        echo -e "${SPINE_LOG_INDENT_SPACES}${GREEN}${BOLD}$1${NC}"
    else
        echo -e "${GREEN}${BOLD}$1${NC}"
    fi
}


# Individual actions/steps - inline result format
log_action() {
    echo -n "${SPINE_LOG_INDENT_SPACES}  $1... "
}

# Results - success/failure/info (on same line)
log_ok() {
    echo -e "${GREEN}✓${NC}"
}

log_fail() {
    echo -e "${RED}✗${NC}"
}

log_warn() {
    echo -e "${SPINE_LOG_INDENT_SPACES}  ${YELLOW}!${NC} ${YELLOW}$1${NC}"
}

log_skip() {
    echo -e "${GRAY}-${NC}"
}

# For errors, show full output prominently (not grayed)
log_error_output() {
    echo "$1"
}

# Final summary
log_summary() {
    echo -e "${BOLD}$1${NC}"
}

# Detailed output (errors, etc.)
log_detail() {
    echo -e "${SPINE_LOG_INDENT_SPACES}  ${GRAY}$1${NC}"
}

# Log a simple info string at the current nesting level
log_info() {
    echo -e "${SPINE_LOG_INDENT_SPACES}${CYAN}$1${NC}"
}