#!/usr/bin/env bash
# Mobile smoke test
# Verifies: node present, dependencies installed, env file exists,
#           TypeScript clean, lint clean, Jest passes.
# Usage: bash mobile/scripts/smoke-test.sh
# Exit 0 = pass, exit 1 = fail

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PASS=0
FAIL=0

ok()   { echo "[PASS] $*"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $*"; FAIL=$((FAIL+1)); }
info() { echo "[INFO] $*"; }

# ── 1. Node.js version ────────────────────────────────────────────────────────
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
  if [[ "$NODE_MAJOR" -ge 18 ]]; then
    ok "node $(node --version) (>= 18 required)"
  else
    fail "node version too old: $(node --version) — need >= 18"
  fi
else
  fail "node not found — install from https://nodejs.org"
fi

# ── 2. node_modules installed ────────────────────────────────────────────────
if [[ -d "$MOBILE_DIR/node_modules" ]]; then
  ok "node_modules directory exists"
else
  fail "node_modules missing — run: npm install in mobile/"
fi

# ── 3. Environment file ───────────────────────────────────────────────────────
if [[ -f "$MOBILE_DIR/.env" ]]; then
  ok ".env file exists"
else
  fail ".env not found — run: cp mobile/.env.example mobile/.env and set API_BASE_URL"
fi

# ── 4. Required env vars ──────────────────────────────────────────────────────
if [[ -f "$MOBILE_DIR/.env" ]]; then
  # shellcheck source=/dev/null
  set -a; source "$MOBILE_DIR/.env"; set +a
fi

check_var() {
  local var="$1"
  local val="${!var:-}"
  if [[ -z "$val" ]]; then
    fail "$var is not set in mobile/.env"
  else
    ok "$var is set"
  fi
}

check_var API_BASE_URL
check_var STELLAR_NETWORK

# ── 5. TypeScript type check ──────────────────────────────────────────────────
info "Running tsc --noEmit…"
if (cd "$MOBILE_DIR" && npm run type-check 2>&1); then
  ok "TypeScript type check passed"
else
  fail "TypeScript errors — run 'npm run type-check' in mobile/ for details"
fi

# ── 6. ESLint ─────────────────────────────────────────────────────────────────
info "Running ESLint…"
if (cd "$MOBILE_DIR" && npm run lint 2>&1); then
  ok "ESLint passed"
else
  fail "ESLint errors — run 'npm run lint' in mobile/ for details"
fi

# ── 7. Jest unit tests ────────────────────────────────────────────────────────
info "Running Jest…"
if (cd "$MOBILE_DIR" && npm test -- --passWithNoTests --forceExit 2>&1); then
  ok "Jest tests passed"
else
  fail "Jest tests failed — run 'npm test' in mobile/ for details"
fi

# ── 8. Android build tools present (optional) ────────────────────────────────
if command -v adb &>/dev/null; then
  ok "adb found — Android SDK available"
else
  info "adb not found — Android builds require Android Studio with SDK tools in PATH"
fi

# ── 9. Xcode present (macOS only) ────────────────────────────────────────────
if [[ "$(uname)" == "Darwin" ]]; then
  if command -v xcodebuild &>/dev/null; then
    ok "xcodebuild found: $(xcodebuild -version 2>&1 | head -1)"
  else
    info "xcodebuild not found — install Xcode from the App Store for iOS builds"
  fi
else
  info "Not macOS — skipping Xcode check"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────"
echo "Mobile smoke test: $PASS passed, $FAIL failed"
echo "────────────────────────────────────────"

if [[ $FAIL -eq 0 ]]; then
  echo "[PASS] mobile smoke test"
  exit 0
else
  echo "[FAIL] mobile smoke test — fix the issues above and re-run"
  exit 1
fi
