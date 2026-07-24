#!/usr/bin/env bash
# Direct Click-and-Execute Launcher for Local Dev Server Manager
# Runs directly from compiled HTML files without spawning any dev server for the UI.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Build static bundle if dist doesn't exist
if [ ! -d "dist" ]; then
    echo "Building static UI assets..."
    npx vite build
fi

# Launch native desktop window directly loading file:// dist/index.html
npx electron .
