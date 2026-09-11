#!/usr/bin/env bash
set -euo pipefail
: "${DEPLOY_HOST:?}" "${DEPLOY_SSH_KEY:?}" "${DEPLOY_SHA:?}"
[[ "$DEPLOY_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]
task_tmp=$(mktemp -d)
trap 'rm -rf -- "$task_tmp"' EXIT
chmod 700 "$task_tmp"
printf '%s\n' "$DEPLOY_SSH_KEY" > "$task_tmp/key"
chmod 600 "$task_tmp/key"
if [ -n "${DEPLOY_KNOWN_HOSTS:-}" ]; then
  printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$task_tmp/known_hosts"
else
  # Matches the previous SSH action's trust model; a pinned host key is preferred.
  ssh-keyscan -H "$DEPLOY_HOST" > "$task_tmp/known_hosts"
fi
export RSYNC_RSH="ssh -i $task_tmp/key -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$task_tmp/known_hosts"
# Keep SSH options identical for checks, transfer and execution.
ssh_args=(-i "$task_tmp/key" -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$task_tmp/known_hosts")
remote="root@$DEPLOY_HOST"

# Explicit payload: no .git, .env, worlds, tests, docs or migration backups.
node scripts/deployment-manifest.mjs "$DEPLOY_SHA"
ssh "${ssh_args[@]}" "$remote" 'bash -se' <<'REMOTE'
root="$HOME/foundry"
[ -d "$root/data/Data" ] && [ ! -L "$root" ]
[ "$(realpath "$root")" = "$root" ]
command -v rsync >/dev/null
command -v docker >/dev/null
for directory in modules scripts caddy backup; do
  [ ! -L "$root/$directory" ]
  if [ -d "$root/$directory" ] && [ -n "$(find "$root/$directory" -type l -print -quit)" ]; then
    echo "Symlink in deployment destination: $directory" >&2; exit 1
  fi
done
mkdir -p "$root/modules"
REMOTE

# Only managed source directories are mirrored, never Data/modules or the root.
while IFS= read -r module; do
  [[ "$module" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]
  rsync -rc --delete --no-links "modules/$module/" "$remote:foundry/modules/$module/"
done < .deployment-modules
rsync -rc --no-links --files-from=.deployment-runtime-files ./ "$remote:foundry/"
rsync -c .deployment-files.sha256 .deployment-modules .deployment-build.sha256 "$remote:foundry/"
ssh "${ssh_args[@]}" "$remote" "bash ~/foundry/scripts/deploy-server.sh $DEPLOY_SHA"
