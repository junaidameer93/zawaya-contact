# DNS Configuration Guide

## Issue

The SSL certificate setup failed because the DNS record for `api.nextsensesolutions.com` is not pointing to the server IP `85.208.48.133`.

## Solution: Configure DNS Record

### Step 1: Access Your Domain Registrar

1. Log in to your domain registrar (where you purchased `nextsensesolutions.com`)
2. Navigate to DNS management / DNS settings

### Step 2: Add A Record

Add a new **A record** with the following values:

| Type | Name/Host | Value/Target | TTL |
|------|-----------|--------------|-----|
| A | `api` | `85.208.48.133` | 3600 (or default) |

**Important Notes:**
- The **Name/Host** should be just `api` (not `api.nextsensesolutions.com`)
- The **Value/Target** should be the server IP: `85.208.48.133`
- **TTL** can be left as default (usually 3600 seconds)

### Step 3: Verify DNS Propagation

After adding the DNS record, wait 5-30 minutes for DNS propagation, then verify:

```bash
# Check if DNS is resolving
nslookup api.nextsensesolutions.com

# Or use dig
dig api.nextsensesolutions.com

# Should return: 85.208.48.133
```

You can also check online at:
- https://www.whatsmydns.net/#A/api.nextsensesolutions.com
- https://dnschecker.org/#A/api.nextsensesolutions.com

### Step 4: Set Up SSL Certificate

Once DNS is propagated, SSH into the server and run:

```bash
ssh root@85.208.48.133
# Password: Oh~dXfx71bc6Ujqm

# Run certbot to get SSL certificate
sudo certbot --nginx -d api.nextsensesolutions.com

# Or if certbot is already installed, just renew
sudo certbot --nginx -d api.nextsensesolutions.com --non-interactive --agree-tos --email junaid.ameer93@gmail.com --redirect
```

## Common Domain Registrars

### GoDaddy
1. Log in → My Products → DNS
2. Click "Add" → Select "A" record
3. Name: `api`, Value: `85.208.48.133`
4. Save

### Namecheap
1. Log in → Domain List → Manage
2. Advanced DNS tab
3. Add new record: Type `A Record`, Host `api`, Value `85.208.48.133`
4. Save

### Cloudflare
1. Log in → Select domain
2. DNS → Records → Add record
3. Type: `A`, Name: `api`, IPv4 address: `85.208.48.133`
4. Save

### Google Domains
1. Log in → My domains → DNS
2. Custom records → Create new record
3. Type: `A`, Name: `api`, IPv4 address: `85.208.48.133`
4. Save

## Temporary Access (HTTP Only)

Until DNS is configured, you can access the API via:

- **Direct IP**: `http://85.208.48.133:3000`
- **HTTP (after DNS)**: `http://api.nextsensesolutions.com`

**Note**: Once DNS is configured and SSL certificate is set up, the API will be available at:
- **HTTPS**: `https://api.nextsensesolutions.com`

## Verify Application is Running

Even without SSL, you can verify the application is working:

```bash
# Test via IP
curl http://85.208.48.133:3000

# Or once DNS is configured (HTTP)
curl http://api.nextsensesolutions.com
```

## After DNS is Configured

1. Wait 5-30 minutes for DNS propagation
2. Verify DNS: `nslookup api.nextsensesolutions.com`
3. SSH into server and run SSL setup:
   ```bash
   sudo certbot --nginx -d api.nextsensesolutions.com
   ```
4. Your API will then be available at `https://api.nextsensesolutions.com`

## Troubleshooting

### DNS Not Propagating
- Wait longer (can take up to 48 hours, usually 5-30 minutes)
- Clear your DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Check with multiple DNS checkers online

### SSL Certificate Still Fails
- Ensure DNS is fully propagated (check with multiple tools)
- Ensure port 80 is open on the server (for Let's Encrypt verification)
- Check firewall: `sudo ufw status`
- Verify Nginx is running: `sudo systemctl status nginx`

### Application Not Accessible
- Check if application is running: `pm2 status`
- Check application logs: `pm2 logs fexen-apis`
- Check Nginx status: `sudo systemctl status nginx`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

