#!/usr/bin/env bash
set -euo pipefail
echo "Levantando servidor local en http://localhost:8080"
python3 -m http.server 8080
