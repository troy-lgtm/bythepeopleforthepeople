#!/usr/bin/env bash
# End-to-end local demo of the private growth loop. Read-only against the
# outside world: nothing is emailed unless RESEND_API_KEY is set, and even
# then only the test user can receive anything.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 1/4 Seed the test user (Troy, 90046, five causes) ==="
npm run -s seed:test-user

echo ""
echo "=== 2/4 Run movement detection ==="
npm run -s movements:detect

echo ""
echo "=== 3/4 Build (and maybe send) the test digest ==="
npm run -s digest:test

echo ""
echo "=== 4/4 Launch readiness checklist ==="
npm run -s launch:check || true

echo ""
echo "Demo complete. Now start the app and walk the loop:"
echo "  npm run dev"
echo "  open http://localhost:3000/what-moved"
echo "  open http://localhost:3000/receipts/mv-bill-ca-sb-79-sb79-t5"
echo "  open http://localhost:3000/causes/housing"
echo "  open http://localhost:3000/gov/90046/what-moved"
echo "  open http://localhost:3000/api/digest/preview?format=html"
echo "  open http://localhost:3000/admin/launch?key=\$ADMIN_LAUNCH_SECRET"
echo ""
echo "NOTE: without Redis env vars each script ran against its own in-memory"
echo "store. For a durable end-to-end run, set KV_REST_API_URL/TOKEN first."
