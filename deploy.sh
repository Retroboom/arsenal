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

echo "Deploying to Cloudflare Pages (arsenal.retroboomgames.com)..."
wrangler pages deploy . \
  --project-name=hof-arsenal \
  --branch=main \
  --commit-dirty=true \
  --commit-message "${1:-manual deploy}"
echo "Done."
