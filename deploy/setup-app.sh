#!/usr/bin/env bash
# Per-app setup for missoulamesh (idempotent). Run as root on a server already set up
# by hamlicenselookup's deploy/setup-server.sh:
#   bash setup-app.sh missoulamesh.org ghcr.io/<owner>/<repo>
#   bash setup-app.sh meshcore.wa8zkr.com ghcr.io/<owner>/<repo>   (staging; no www redirect)
set -euo pipefail

[ "$(id -u)" = 0 ] || { echo "run as root" >&2; exit 1; }
DOMAIN="${1:?usage: setup-app.sh <domain> <image>}"
IMAGE="${2:?usage: setup-app.sh <domain> <image>}"
[[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "bad domain" >&2; exit 1; }
[[ "$IMAGE" =~ ^[a-z0-9./_-]+$ ]] || { echo "bad image (must be lowercase, no tag)" >&2; exit 1; }
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP=/srv/apps/missoulamesh

mkdir -p "$APP" /srv/apps/caddy/sites

sed "s|__IMAGE__|$IMAGE|" "$HERE/missoulamesh/docker-compose.yml" > "$APP/docker-compose.yml"
install -m 755 -o root -g root "$HERE/missoulamesh/deploy.sh" "$APP/deploy.sh"

# Secrets file: created once, never overwritten.
if [ ! -f "$APP/contact.env" ]; then
  printf 'RESEND_API_KEY=\nCONTACT_TO=\n' > "$APP/contact.env"
  chmod 600 "$APP/contact.env"
  chown root:root "$APP/contact.env"
  echo "Created $APP/contact.env. Fill in RESEND_API_KEY and CONTACT_TO."
fi

# Main domains (one dot, like missoulamesh.org) also get a www redirect.
# Subdomains (like a staging host) do not: www.<subdomain> usually has no DNS record,
# and Caddy would keep failing to get a certificate for it.
{
  sed "s|__DOMAIN__|$DOMAIN|g" "$HERE/missoulamesh.caddy"
  if [ "$(tr -cd . <<< "$DOMAIN" | wc -c)" -eq 1 ]; then
    sed "s|__DOMAIN__|$DOMAIN|g" "$HERE/missoulamesh-www.caddy"
  fi
} > /srv/apps/caddy/sites/missoulamesh.caddy
docker compose -f /srv/apps/caddy/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile

echo "App setup done for $DOMAIN."
