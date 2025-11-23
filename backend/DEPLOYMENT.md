# Deployment (Apache + systemd)

This guide explains how to run the Retrieva stack on a single Ubuntu server using Apache for static hosting/reverse proxy and systemd for the Node.js API.

## 1. Server prerequisites

1. Ubuntu 22.04+ with sudo access and a domain pointing to the server IP.
2. Packages:
   ```bash
   sudo apt update
   sudo apt install -y apache2 git nodejs npm
   sudo a2enmod rewrite proxy proxy_http headers ssl
   ```
3. Clone this repository into `/var/www/retrieva` (or update paths inside the provided configs).

## 2. Backend service (systemd)

1. Copy `deploy/systemd/retrieva-backend.service` to `/etc/systemd/system/retrieva-backend.service`.
2. Adjust `WorkingDirectory`, `ExecStart`, and environment variables if paths or ports differ.
3. Create `/var/log/retrieva-backend*.log` or change `StandardOutput` / `StandardError` targets as needed.
4. Install dependencies and configure env vars:
   ```bash
   cd /var/www/retrieva/backend
   npm install
   cp .env.example .env   # if you keep one; otherwise create manually (PORT, Supabase keys, etc.)
   ```
5. Enable the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now retrieva-backend
   sudo systemctl status retrieva-backend
   ```

## 3. Frontend build

1. Update `frontend/src/config.js` to point to the proxied API path, e.g.
   ```js
   export const API = { BASE_URL: '/api' };
   ```
2. Build static assets:
   ```bash
   cd /var/www/retrieva/frontend
   npm install
   npm run build
   ```
3. Ensure `/var/www/retrieva/frontend/build` exists and is readable by Apache.

## 4. Apache virtual host

1. Copy `deploy/apache/retrieva.conf` to `/etc/apache2/sites-available/retrieva.conf`.
2. Replace `your-domain.com` with the actual domain.
3. Enable the site:
   ```bash
   sudo a2dissite 000-default.conf
   sudo a2ensite retrieva.conf
   sudo apache2ctl configtest
   sudo systemctl reload apache2
   ```

## 5. HTTPS (Let’s Encrypt)

```bash
sudo snap install --classic certbot
sudo certbot --apache -d your-domain.com
```

This updates the Apache config with TLS blocks and installs automatic renewal timers.

## 6. Verification checklist

- `systemctl status retrieva-backend` shows `active (running)`.
- `curl http://127.0.0.1:5000/test` returns "Backend is working!".
- `curl -I http://your-domain.com` returns `200 OK`.
- `curl -s http://your-domain.com/api/claims | head` returns JSON (confirming proxying).
- Browser loads `https://your-domain.com`, and DevTools Network tab shows `/api/...` requests succeeding.

Use these reference files as templates; adjust paths, domain, and logging destinations for your environment.
