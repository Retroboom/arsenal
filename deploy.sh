#!/bin/bash
# deploy.sh — upload static files directly to Netlify without any build step.
# Use this for day-to-day edits to index.html and hof_arsenal.json.
#
# For changes to netlify/functions/, run: bash deploy.sh --functions

set -e

cd "$(dirname "$0")"

if [ "$1" = "--functions" ]; then
  echo "Deploying with full build (functions changed)..."
  netlify deploy --prod --message "${2:-deploy with functions}"
else
  echo "Deploying static files to arsenal.retroboomgames.com..."
  netlify deploy --prod --no-build --message "${1:-manual deploy}"
fi
echo "Done."
