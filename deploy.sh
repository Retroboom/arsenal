#!/bin/bash
# deploy.sh — publish the arsenal to Cloudflare Pages.
#
# One-time setup:
#   npm install -g wrangler
#   wrangler login
#   wrangler pages project create hof-arsenal   (first time only)
#
# Add secrets (one-time, or when they change):
#   wrangler pages secret put FIREBASE_SERVICE_ACCOUNT --project-name=hof-arsenal
#   wrangler pages secret put KOFI_VERIFICATION_TOKEN  --project-name=hof-arsenal
#
# Local dev (no deploys needed):
#   python3 -m http.server 8080   (static files + Firebase work; functions won't run)
#   wrangler pages dev .          (static + functions, reads .dev.vars for secrets)

set -e

cd "$(dirname "$0")"

# Stamp the service worker with a unique version so each deploy busts the
# offline cache cleanly, then restore the placeholder afterward (keeps the
# working tree clean whether the deploy succeeds or fails).
STAMP="$(git rev-parse --short HEAD 2>/dev/null || echo manual)-$(date +%Y%m%d%H%M%S)"
restore_sw() { sed -i '' "s/const VERSION = '[^']*';/const VERSION = '__BUILD_VERSION__';/" sw.js; }
trap restore_sw EXIT
sed -i '' "s/const VERSION = '__BUILD_VERSION__';/const VERSION = '$STAMP';/" sw.js

echo "Deploying to Cloudflare Pages (arsenal.retroboomgames.com) [sw $STAMP]..."
wrangler pages deploy . \
  --project-name=hof-arsenal \
  --branch=main \
  --commit-dirty=true \
  --commit-message "${1:-manual deploy}"
echo "Done."
