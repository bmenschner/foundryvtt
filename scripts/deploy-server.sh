#!/usr/bin/env bash
set -euo pipefail
revision=${1:?Expected tested commit SHA}
[[ "$revision" =~ ^[0-9a-f]{40}$ ]]
root="$HOME/foundry"
[ -d "$root/data/Data" ] && [ ! -L "$root" ]
[ "$(realpath "$root")" = "$root" ]
cd "$root"
exec 9>.deployment.lock
flock -n 9
sha256sum --check --status .deployment-files.sha256
# Do not accidentally install an unmanaged source directory left on the host.
diff -u .deployment-modules <(find modules -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | LC_ALL=C sort)
managed_modules() {
  docker compose run --rm --no-deps -T --entrypoint node \
    -v "$root/modules:/managed-modules:ro" \
    -v "$root/scripts/deploy-modules.mjs:/deploy-modules.mjs:ro" \
    foundry /deploy-modules.mjs "$1" /managed-modules /foundry/data/Data/modules
}
MODULE_STATE=$(managed_modules check)
[[ "$MODULE_STATE" = changed || "$MODULE_STATE" = unchanged ]]

# One-time migration: remove only Git metadata of this deployment directory.
# All payload checks pass before reclaiming space needed for module staging.
if [ -e "$root/.git" ] || [ -L "$root/.git" ]; then
  [ ! -L "$root/.git" ] && [ -d "$root/.git/objects" ] && [ -f "$root/.git/HEAD" ]
  [ "$(realpath "$root/.git")" = "$root/.git" ]
  rm -rf -- "$root/.git"
fi

# Compare actual build inputs with the last successful deployment, including retries.
# On migration, reuse the running images; build only if none exist yet.
if { [ -f .deployment-build.installed ] && ! cmp -s .deployment-build.sha256 .deployment-build.installed; } || \
   [ -z "$(docker compose images -q foundry)" ] || \
   [ -z "$(docker compose images -q caddy)" ] || \
   [ -z "$(docker compose images -q backup)" ]; then
  docker compose build
fi
docker compose up -d --no-build
if [ "$MODULE_STATE" = changed ]; then
  docker compose stop foundry
  trap 'docker compose start foundry' EXIT
  managed_modules install
  docker compose start foundry
  trap - EXIT
fi
cp .deployment-build.sha256 .deployment-build.installed
printf '%s\n' "$revision" > .deployment-revision
echo "Deployment complete: $revision (no server Git required)."
