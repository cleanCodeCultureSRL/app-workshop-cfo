#!/usr/bin/env bash
# Rulează PE SERVER, ca root, după ce fișierele din app/ au fost sincronizate în /var/www/freedom-number
# (rsync de pe laptop, vezi deploy/push.sh). Idempotent: prima rulare instalează tot, următoarele
# doar reconstruiesc și repornesc. Același VPS găzduiește ai-course (:8788), first7 (:3000) și Turnul de Control (:8789, /var/www/cfo-app).
set -euo pipefail

APP_DIR=/var/www/freedom-number
APP_USER=freedomapp
DOMAIN=${DEPLOY_DOMAIN:-app.cfo.cleancodeculture.com}
CERT_DIR=/etc/letsencrypt/live/$DOMAIN
cd "$APP_DIR"

if ! id -u "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
fi
mkdir -p data /var/www/letsencrypt

# .env se creează o singură dată, cu PIN aleator; deploy-urile următoare nu-l ating.
if [ ! -f .env ]; then
  cat > .env <<ENV
# PIN-ul prezentatorului (generat la primul deploy; schimbă-l liber)
TEACHER_PIN=$(shuf -i 100000-999999 -n 1)
PORT=8794
ENV
  chmod 640 .env
fi

npm ci --no-audit --no-fund
npm run build
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# --- nginx: mai întâi HTTP (necesar ca Let's Encrypt să poată verifica domeniul) ---
install -m 644 deploy/nginx-app.snippet.conf /etc/nginx/snippets/freedom-number.conf
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  install -m 644 deploy/nginx-http.conf /etc/nginx/sites-available/freedom-number
  ln -sfn /etc/nginx/sites-available/freedom-number /etc/nginx/sites-enabled/freedom-number
  nginx -t && systemctl reload nginx
  if [ "$(dig +short "$DOMAIN" | tail -1)" = "$(curl -fsS -4 https://api.ipify.org)" ]; then
    certbot certonly --webroot -w /var/www/letsencrypt -d "$DOMAIN" \
      --non-interactive --agree-tos --register-unsafely-without-email \
      --deploy-hook "systemctl reload nginx" || echo "certbot a eșuat; rămânem pe HTTP" >&2
  else
    echo "DNS pentru $DOMAIN nu arată încă spre acest server; rămânem pe HTTP" >&2
  fi
fi
if [ -f "$CERT_DIR/fullchain.pem" ]; then
  install -m 644 deploy/nginx-https.conf /etc/nginx/sites-available/freedom-number
  SCHEME=https
else
  install -m 644 deploy/nginx-http.conf /etc/nginx/sites-available/freedom-number
  SCHEME=http
fi
ln -sfn /etc/nginx/sites-available/freedom-number /etc/nginx/sites-enabled/freedom-number
nginx -t
systemctl reload nginx

# --- serviciul Node ---
install -m 644 deploy/freedom-number.service /etc/systemd/system/freedom-number.service
systemctl daemon-reload
systemctl enable freedom-number >/dev/null
systemctl restart freedom-number

for i in $(seq 1 15); do
  if out=$(curl -fsS --resolve "$DOMAIN:80:127.0.0.1" --resolve "$DOMAIN:443:127.0.0.1" "$SCHEME://$DOMAIN/api/health" 2>/dev/null); then
    echo "deploy OK ($SCHEME://$DOMAIN): $out"
    echo "PIN prezentator: $(grep TEACHER_PIN .env | cut -d= -f2)"
    exit 0
  fi
  sleep 1
done
echo "serviciul nu răspunde; ultimele loguri:" >&2
journalctl -u freedom-number -n 30 --no-pager >&2
exit 1
