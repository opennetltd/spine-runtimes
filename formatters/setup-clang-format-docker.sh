#!/bin/bash
set -e

echo "Setting up clang-format Docker wrapper..."

# Pull the Docker image with clang-format 18
echo "Pulling Docker image..."
docker pull silkeh/clang:18

# Create a wrapper script that runs clang-format in Docker
echo "Creating wrapper script..."
cat > /tmp/clang-format-wrapper <<'EOF'
#!/bin/bash
# Get the absolute path of the file being formatted
args=()
for arg in "$@"; do
    if [[ -f "$arg" ]]; then
        # Convert to absolute path
        args+=("$(realpath "$arg")")
    else
        args+=("$arg")
    fi
done

# Find the project root (where .github directory is)
current_dir="$PWD"
while [[ "$current_dir" != "/" ]]; do
    if [[ -d "$current_dir/.github" ]]; then
        project_root="$current_dir"
        break
    fi
    current_dir="$(dirname "$current_dir")"
done

# If we didn't find project root, use current directory's parent
if [[ -z "$project_root" ]]; then
    project_root="$(dirname "$PWD")"
fi

# Run docker with the project root mounted
exec docker run --rm -i -v "$project_root:$project_root" -w "$PWD" silkeh/clang:18 clang-format "${args[@]}"
EOF

# Install the wrapper
sudo mv /tmp/clang-format-wrapper /usr/local/bin/clang-format
sudo chmod +x /usr/local/bin/clang-format

# Verify version and location
echo "Verifying installation..."
which clang-format
clang-format --version