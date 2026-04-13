#!/bin/bash
# deploy.sh — upload index.html (and static assets) directly to Netlify
# without triggering a build. Use this for day-to-day edits to index.html.
#
# For changes to netlify/functions/, just git push — a real build is needed.

set -e

cd "$(dirname "$0")"

echo "Deploying to arsenal.retroboomgames.com..."
netlify deploy --prod --message "${1:-manual deploy}"
echo "Done."
