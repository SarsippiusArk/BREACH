
set -e
cd "/home/combos/workspace"

echo "[Warmup] Initializing git repository..."
git init -b main
git config user.name "AI Agent"
git config user.email "bot@combos.fun"
mkdir -p .git/info
touch .git/info/exclude
if ! grep -qxF "combos/" .git/info/exclude; then
    echo "combos/" >> .git/info/exclude
fi
git add .
git commit -m "chore: initial project structure"

echo "[Warmup] Git repository initialized"
