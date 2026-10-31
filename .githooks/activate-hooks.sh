#!/bin/sh
# Activate Git hooks in .githooks
git config core.hooksPath .githooks
echo "[SUCCESS] Git hooks path configured to .githooks"
