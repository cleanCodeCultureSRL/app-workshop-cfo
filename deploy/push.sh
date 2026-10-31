#!/usr/bin/env bash
# Deploy de pe laptop: sincronizează app/ pe VPS și rulează deploy/remote.sh acolo.
#   bash deploy/push.sh
# Cheia SSH: ~/.ssh/first7_vps (aceeași ca pentru app.workshop.cleancodeculture.com).
set -euo pipefail
HOST=${DEPLOY_HOST:-148.230.71.117}
KEY=${DEPLOY_KEY:-$HOME/.ssh/first7_vps}
APP="$(cd "$(dirname "$0")/.." && pwd)"
SSH="ssh -o IdentitiesOnly=yes -i $KEY"
rsync -az --delete --exclude node_modules --exclude dist --exclude data --exclude .env -e "$SSH" "$APP/" "root@$HOST:/var/www/freedom-number/"
$SSH "root@$HOST" 'bash /var/www/freedom-number/deploy/remote.sh'
