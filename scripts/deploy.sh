#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "ImpactHub deployment helper"
echo "==========================="
echo ""
echo "Stack (all free tier):"
echo "  • MongoDB Atlas M0  — database"
echo "  • Render            — Node.js API + Socket.io"
echo "  • Vercel            — React frontend"
echo ""

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "⚠️  Set MONGODB_URI to your Atlas connection string before deploying the API."
  echo "   Create a free cluster: https://www.mongodb.com/cloud/atlas/register"
  echo ""
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Frontend: run 'npx vercel login' then deploy from client/:"
  echo "  cd client && npx vercel --prod"
  echo ""
else
  echo "Deploying frontend to Vercel..."
  cd client
  VITE_API_URL="${VITE_API_URL:-}" npx vercel deploy --prod --token "$VERCEL_TOKEN" --yes
fi

echo ""
echo "Backend: push to GitHub, then open https://dashboard.render.com/select-repo"
echo "  • New Blueprint → connect repo → uses render.yaml at repo root"
echo "  • Set MONGODB_URI and CLIENT_URL in Render dashboard"
echo ""
