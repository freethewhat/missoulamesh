# Deploying Missoula Mesh

Owner's checklist, in order. The server is the same DigitalOcean droplet that runs ham-finder.
Its shared setup (Caddy, the `web` network, the `deploy` user) is already done by
`hamlicenselookup/deploy/setup-server.sh`. Nothing in hamlicenselookup changes.

You can deploy before you own the domain: do steps 5 to 8 now, and steps 1 to 4 and 9 to 11 when you buy it.

## Domain and email

1. Buy `missoulamesh.org` at Namecheap.
2. Namecheap, Domain List, Manage, **Advanced DNS** (keep Namecheap BasicDNS):
   - A record, host `@`, value: the droplet's IP.
   - A record, host `www`, value: the droplet's IP.
3. Namecheap, **Mail Settings: Email Forwarding**. Add `hello` → your Gmail address. (This only works while the domain uses Namecheap BasicDNS.)
4. Resend (resend.com):
   - Create an account. Add the domain `missoulamesh.org`.
   - Resend shows DNS records (a DKIM TXT record, and an MX and TXT record on a `send` subdomain). Add each one in Namecheap Advanced DNS. They do not conflict with the email forwarding.
   - Wait until Resend says the domain is **verified**.
   - Create an API key with **Sending access** only. Keep it for step 9.

## GitHub and deploy key

5. Create a GitHub repo and push `main`. Turn on branch protection for `main`: require a pull request, require the `test` check, block force pushes.
6. On your computer: `ssh-keygen -t ed25519 -f missoulamesh-deploy -N ''`
   Copy `deploy/` and the public key to the droplet:
   `scp -r deploy missoulamesh-deploy.pub root@<IP>:missoulamesh-deploy/`
   On the droplet, as root:
   `/srv/apps/bin/add-deploy-key missoulamesh "$(cat ~/missoulamesh-deploy/missoulamesh-deploy.pub)"`
7. GitHub, Settings, Secrets and variables, Actions. Add:
   - `DEPLOY_HOST`: the droplet IP
   - `DEPLOY_SSH_KEY`: the contents of the private key file `missoulamesh-deploy`
   - `DEPLOY_KNOWN_HOSTS`: the output of `ssh-keyscan <IP>`
8. Push to `main`. The deploy job builds and pushes the image. Its SSH step fails until step 9. That is expected.
   In GitHub, Packages, set the `missoulamesh` image to **public** (the image has no secrets).

## Server

9. On the droplet, as root:
   `bash ~/missoulamesh-deploy/deploy/setup-app.sh missoulamesh.org ghcr.io/<owner>/<repo>` (all lowercase).
   Then edit `/srv/apps/missoulamesh/contact.env`:
   ```
   RESEND_API_KEY=re_...
   CONTACT_TO=you@gmail.com
   ```
   The file is mode 600 and only root can read it. Deploys never change it.
10. Re-run the GitHub workflow, or run `ssh deploy@<IP> deploy missoulamesh <full-commit-sha>`.
11. Check:
    - `https://missoulamesh.org` loads. `https://www.missoulamesh.org` redirects to it.
    - Send a test message from `/contact/`. It arrives in Gmail. Click Reply: it goes to the address you typed in the form.
    - From another email account, send to `hello@missoulamesh.org`. It arrives in Gmail.
    - Logs: `docker compose logs app` in `/srv/apps/missoulamesh`.

## Updating the site

- Repeater status: edit `src/data/repeaters.json` (status, `lastChecked`), open a pull request, merge. The site deploys itself.
- Settings tested: set `"tested": true` in `src/data/settings.json` to remove the "not yet tested" note.
- If you change `contact.env`, run `docker compose up -d` in `/srv/apps/missoulamesh` to reload it.

## How it works

- Only Caddy publishes ports 80 and 443. The app joins the `web` network and is reached as `missoulamesh:3200`.
- Each deploy pulls the image tagged with the commit SHA, waits for two good health checks, and rolls back to `last-good-tag` if they fail.
- The `deploy` key for this repo can only run `deploy missoulamesh <sha>`.
- The app sets all security headers itself (CSP, HSTS, and others). Caddy only proxies and redirects `www`.
- Memory is capped at 128 MB. It uses about 25 MB.
