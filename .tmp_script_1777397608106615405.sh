
set -e

cd "/home/combos/workspace"
git config --global --add safe.directory "/home/combos/workspace"
git config user.name "AI Agent"
git config user.email "bot@combos.fun"
mkdir -p .git/info
touch .git/info/exclude
if ! grep -qxF "combos/" .git/info/exclude; then
    echo "combos/" >> .git/info/exclude
fi
git add -A

# Check if there are changes to commit
if git status --porcelain | grep -q .; then
    git commit -m 'Add dimensional rift title screen background'
fi

# Get commit hash
COMMIT_HASH=$(git rev-parse HEAD)

# Get remote URL
REMOTE_URL=$(git remote get-url origin)

# Clean any existing auth info from URL first, then inject token for push
CLEAN_URL=$(echo "$REMOTE_URL" | sed 's|://[^@]*@|://|')
AUTH_URL=$(echo "$CLEAN_URL" | sed 's|://|://e9781347bbb8f74d443be883e0408a509ccceb8b:x-oauth-basic@|')
git remote set-url origin "$AUTH_URL"
git push origin HEAD
git remote set-url origin "$CLEAN_URL"

# Output commit hash for parsing
echo "COMMIT_HASH=$COMMIT_HASH"
