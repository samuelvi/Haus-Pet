#!/bin/sh
set -e

# Ensure ACME webroot exists
mkdir -p /var/www/certbot

# Install cron job for daily renewal if not already present
CRON_FILE="/etc/crontabs/root"
RENEW_CMD="0 3 * * * certbot renew --webroot -w /var/www/certbot --quiet --deploy-hook \"nginx -s reload\""
echo "$RENEW_CMD" > "$CRON_FILE"

# Start cron in background
/usr/sbin/crond -l 2

# Start nginx in foreground
exec nginx -g 'daemon off;'
