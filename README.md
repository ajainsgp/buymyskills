Here’s a concise, copy-pasteable set of deployment notes you can put in your README. It covers local development on macOS, deployment to OCI (frontend + API + MySQL), opening the right ports, stopping/starting services, and re-deploy steps.

Project overview
- Frontend: React SPA (built with react-scripts), served by Nginx.
- API: Node/Express app in /server, listens on port 4000, proxied via Nginx at /api.
- Database: MySQL (OCI MySQL Database Service or MySQL reachable within the same VCN). Do not expose port 3306 to the internet.

Local development (macOS)
- Prereqs: Node 18+ (or 20), npm 9/10, Git.
- Install deps:
  - rm -rf node_modules package-lock.json
  - npm ci
- Run frontend:
  - npm start
- Run API locally:
  - The server reads DB settings from .env in the project root or server side (dotenv).
  - If using local MySQL:
    - DB_HOST=127.0.0.1, DB_PORT=3306, DB_USER, DB_PASSWORD, DB_NAME
  - If connecting to OCI MySQL, use an SSH tunnel:
    - ssh -i <ssh-key> -N -L 13306:<db-private-host>:3306 ubuntu@<compute-public-ip>
    - Set DB_HOST=127.0.0.1, DB_PORT=13306 in your .env
  - Start API:
    - npm run server (calls node server/index.js)
- Frontend API base configuration:
  - src/utils/apiBase.js uses same-origin:
    - const API_BASE = process.env.REACT_APP_API_BASE_URL || '';
  - All requests should be to ${API_BASE}/api/... or simply /api/...

OCI deployment
- Prereqs: Ubuntu-based compute instance, Git, Node, npm, Nginx installed; API and DB in the same VCN; security lists/NSGs allow inbound 80 (and 443 if TLS).
- Pull code and build frontend:
  - ssh ubuntu@<public-ip>
  - cd /home/ubuntu/buymyskills
  - git checkout main && git pull
  - rm -rf node_modules
  - npm ci --include=dev   (include dev if ESLint/Prettier plugins are required by your build)
  - npm run build
- Deploy frontend to Nginx:
  - sudo mkdir -p /var/www/buymyskills
  - sudo rsync -a --delete build/ /var/www/buymyskills/
- Configure Nginx (SPA + API proxy):
  - sudo tee /etc/nginx/sites-available/buymyskills.conf > /dev/null <<'EOF'
    server {
      listen 80;
      server_name _;

      root /var/www/buymyskills;
      index index.html;

      location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
      }

      location / {
        try_files $uri /index.html;
      }
    }
    EOF
  - sudo ln -sf /etc/nginx/sites-available/buymyskills.conf /etc/nginx/sites-enabled/buymyskills.conf
  - Disable default site if it conflicts:
    - sudo rm -f /etc/nginx/sites-enabled/default
  - sudo nginx -t && sudo systemctl reload nginx
- Create API environment file (do not commit secrets):
  - sudo tee /etc/buymyskills-api.env > /dev/null <<'EOF'
    NODE_ENV=production
    PORT=4000
    DB_HOST=<mysql-private-host-or-ip>
    DB_PORT=3306
    DB_USER=<db-user>
    DB_PASSWORD=<db-password>
    DB_NAME=<db-name>
    EOF
- Run API as a systemd service:
  - sudo tee /etc/systemd/system/buymyskills-api.service > /dev/null <<'EOF'
    [Unit]
    Description=BuyMySkills API (Node/Express)
    After=network-online.target
    Wants=network-online.target

    [Service]
    Type=simple
    EnvironmentFile=/etc/buymyskills-api.env
    WorkingDirectory=/home/ubuntu/buymyskills/server
    ExecStart=/usr/bin/node index.js
    Environment=PATH=/usr/bin:/usr/local/bin
    User=ubuntu
    Group=ubuntu
    Restart=always
    RestartSec=3

    [Install]
    WantedBy=multi-user.target
    EOF
  - sudo systemctl daemon-reload
  - sudo systemctl enable --now buymyskills-api
  - sudo systemctl status buymyskills-api
- Security/ports in OCI:
  - Open inbound 80 (and 443 if HTTPS) in the subnet’s Security List or NSG.
  - Do not open 4000 or 3306 to the internet.
  - Ensure the compute instance can reach MySQL on 3306 within the VCN.

Verification
- API:
  - curl http://127.0.0.1:4000/api/health  (or a real endpoint)
  - curl http://127.0.0.1/api/health       (through Nginx locally)
  - curl http://<public-ip>/api/health     (through Nginx externally)
- Frontend:
  - http://<public-ip> or your domain
  - Browser DevTools Network: API calls should be to /api/... on the same origin (no :4000), status 200.

Re-deploy procedure (OCI)
- ssh ubuntu@<public-ip>
- cd /home/ubuntu/buymyskills
- git checkout main && git pull
- rm -rf node_modules
- npm ci --include=dev
- npm run build
- sudo rsync -a --delete build/ /var/www/buymyskills/
- sudo nginx -t && sudo systemctl reload nginx
- API usually doesn’t need restart unless code changed in /server:
  - sudo systemctl restart buymyskills-api
  - sudo systemctl status buymyskills-api

Stopping/starting services on OCI
- API service:
  - Stop: sudo systemctl stop buymyskills-api
  - Start: sudo systemctl start buymyskills-api
  - Restart: sudo systemctl restart buymyskills-api
  - Logs: journalctl -u buymyskills-api -f
- Frontend (Nginx):
  - Stop serving (not typical): sudo systemctl stop nginx
  - Start: sudo systemctl start nginx
  - Reload after config or content changes: sudo systemctl reload nginx
  - Disable site without stopping Nginx (optional): sudo rm /etc/nginx/sites-enabled/buymyskills.conf && sudo systemctl reload nginx
- MySQL:
  - If using OCI MySQL Database Service (managed), stop/start from the OCI Console (DB system level).
  - If running MySQL on your compute instance (not the case here), use:
    - sudo systemctl stop mysql
    - sudo systemctl start mysql

Common troubleshooting tips
- Build fails due to ESLint/Prettier:
  - Ensure devDependencies are installed: npm ci --include=dev
  - Or temporarily: DISABLE_ESLINT_PLUGIN=true npm run build
- Frontend calls :4000 and times out:
  - Ensure apiBase uses same-origin and Nginx proxies /api to 127.0.0.1:4000.
  - Rebuild and redeploy frontend.
- API 502 via Nginx:
  - Check service: sudo systemctl status buymyskills-api
  - Tail logs: journalctl -u buymyskills-api -f
  - Confirm port is listening: ss -ltnp | grep 4000
- Cannot reach site externally:
  - Confirm NSG/Security List allows ingress TCP 80 (and 443 if TLS).
  - Confirm Nginx is running: sudo systemctl status nginx
- DB connection errors:
  - Verify /etc/buymyskills-api.env values and NSG rules allow 3306 from compute to DB.
  - Test from compute: mysql -h <DB_HOST> -u <DB_USER> -p -D <DB_NAME> -e "SELECT 1"

Optional HTTPS
- Use an OCI Load Balancer with a certificate to terminate TLS and forward to your instance on port 80; or
- If you have a domain pointing to the instance, use certbot:
  - sudo apt install -y certbot python3-certbot-nginx
  - sudo certbot --nginx -d your-domain

Notes on npm and registry
- Use npm ci in CI/servers for reproducible installs.
- If your build relies on devDependencies (ESLint/Prettier), include them on servers:
  - npm ci --include=dev
- If you use the public npm registry, confirm it aligns with your team’s and Oracle’s internal security and compliance guidelines.

That’s it—these steps should keep your local development, OCI deployment, re-deploys, and service management consistent and repeatable.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
