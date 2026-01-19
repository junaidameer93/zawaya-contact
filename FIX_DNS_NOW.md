# Fix DNS Configuration - Step by Step

## Current Issue
Certbot failed because DNS record for `api.nextsensesolutions.com` doesn't exist or isn't resolving.

Error: `NXDOMAIN looking up A for api.nextsensesolutions.com`

---

## Step 1: Verify Current DNS Status

First, let's check if DNS is configured:

```bash
# On your local machine or server
nslookup api.nextsensesolutions.com

# Or use dig
dig api.nextsensesolutions.com

# Or check online:
# Visit: https://www.whatsmydns.net/#A/api.nextsensesolutions.com
# Visit: https://dnschecker.org/#A/api.nextsensesolutions.com
```

**Expected Result**: Should return `85.208.48.133`
**Current Result**: Will show "NXDOMAIN" or "not found"

---

## Step 2: Add DNS A Record

You need to add an A record at your domain registrar. Here's how:

### Quick Steps:
1. **Log in** to your domain registrar (where you bought `nextsensesolutions.com`)
2. **Find DNS Management** section
3. **Add A Record** with these values:
   - **Type**: `A`
   - **Name/Host**: `api` (just "api", not the full domain)
   - **Value/Target**: `85.208.48.133`
   - **TTL**: `3600` (or default)

### Detailed Instructions by Registrar:

#### GoDaddy
1. Log in → **My Products**
2. Find `nextsensesolutions.com` → Click **DNS**
3. Click **Add** button
4. Select **A** record type
5. **Name**: `api`
6. **Value**: `85.208.48.133`
7. **TTL**: `600` (10 minutes) or `3600` (1 hour)
8. Click **Save**

#### Namecheap
1. Log in → **Domain List**
2. Click **Manage** next to `nextsensesolutions.com`
3. Go to **Advanced DNS** tab
4. Click **Add New Record**
5. **Type**: `A Record`
6. **Host**: `api`
7. **Value**: `85.208.48.133`
8. **TTL**: `Automatic` or `30 min`
9. Click **Save**

#### Cloudflare
1. Log in → Select `nextsensesolutions.com`
2. Go to **DNS** → **Records**
3. Click **Add record**
4. **Type**: `A`
5. **Name**: `api`
6. **IPv4 address**: `85.208.48.133`
7. **Proxy status**: Can be "DNS only" (gray cloud) or "Proxied" (orange cloud)
8. Click **Save**

#### Google Domains
1. Log in → **My domains**
2. Click on `nextsensesolutions.com`
3. Go to **DNS** tab
4. Scroll to **Custom records**
5. Click **Create new record**
6. **Type**: `A`
7. **Name**: `api`
8. **IPv4 address**: `85.208.48.133`
9. Click **Save**

---

## Step 3: Wait for DNS Propagation

After adding the DNS record:
- **Minimum wait**: 5-10 minutes
- **Typical wait**: 15-30 minutes
- **Maximum wait**: Up to 48 hours (rare)

**Tip**: Set TTL to 600 (10 minutes) for faster propagation during setup.

---

## Step 4: Verify DNS Propagation

Check from multiple locations to ensure DNS is propagated:

### On Server:
```bash
# Check DNS resolution
nslookup api.nextsensesolutions.com

# Should return:
# Name: api.nextsensesolutions.com
# Address: 85.208.48.133
```

### Online Tools:
1. **What's My DNS**: https://www.whatsmydns.net/#A/api.nextsensesolutions.com
2. **DNS Checker**: https://dnschecker.org/#A/api.nextsensesolutions.com
3. **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx?action=a%3aapi.nextsensesolutions.com

**Wait until at least 50% of locations show the correct IP** before proceeding.

---

## Step 5: Test HTTP Access (Before SSL)

Once DNS is resolving, test HTTP access:

```bash
# From server
curl http://api.nextsensesolutions.com

# From your local machine
curl http://api.nextsensesolutions.com/form/submit-json
```

If this works, DNS is configured correctly!

---

## Step 6: Retry SSL Certificate Setup

Once DNS is propagated, run certbot again:

```bash
# SSH into server
ssh root@85.208.48.133

# Retry SSL setup
sudo certbot --nginx -d api.nextsensesolutions.com

# Or non-interactive mode
sudo certbot --nginx -d api.nextsensesolutions.com \
  --non-interactive \
  --agree-tos \
  --email junaid.ameer93@gmail.com \
  --redirect
```

This should now work! Certbot will:
1. Verify DNS is resolving
2. Verify port 80 is accessible
3. Obtain SSL certificate from Let's Encrypt
4. Automatically update nginx config for HTTPS

---

## Step 7: Verify HTTPS Works

After SSL is set up:

```bash
# Test HTTPS endpoint
curl https://api.nextsensesolutions.com

# Should return your API response
```

In Postman, you can now use:
```
https://api.nextsensesolutions.com/form/submit-json
```

---

## Troubleshooting

### DNS Still Not Resolving After 30 Minutes

1. **Double-check the A record**:
   - Name should be `api` (not `api.nextsensesolutions.com`)
   - Value should be `85.208.48.133` (exact IP)
   - No typos!

2. **Clear DNS cache**:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   # or
   sudo systemd-resolve --flush-caches
   ```

3. **Check if domain is using Cloudflare proxy**:
   - If using Cloudflare, make sure the record is set to "DNS only" (gray cloud) not "Proxied" (orange cloud) during SSL setup
   - Or wait longer for propagation

### Certbot Still Fails After DNS is Resolved

1. **Check port 80 is open**:
   ```bash
   sudo ufw status
   # Should show port 80 open
   ```

2. **Check nginx is running**:
   ```bash
   sudo systemctl status nginx
   ```

3. **Check nginx config**:
   ```bash
   sudo nginx -t
   ```

4. **Check if domain is accessible from internet**:
   ```bash
   # From external machine
   curl http://api.nextsensesolutions.com
   ```

---

## Quick Checklist

- [ ] Added A record: `api` → `85.208.48.133` at domain registrar
- [ ] Waited 15-30 minutes for DNS propagation
- [ ] Verified DNS resolves: `nslookup api.nextsensesolutions.com` returns `85.208.48.133`
- [ ] Tested HTTP access: `curl http://api.nextsensesolutions.com` works
- [ ] Port 80 is open: `sudo ufw status`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Ran certbot: `sudo certbot --nginx -d api.nextsensesolutions.com`
- [ ] Tested HTTPS: `curl https://api.nextsensesolutions.com` works

---

## Current Status

**What works now:**
- ✅ Application running on `localhost:3000`
- ✅ Nginx configured for HTTP (port 80)
- ❌ DNS not configured → Can't access via domain
- ❌ SSL certificate not set up → Can't use HTTPS

**After DNS is configured:**
- ✅ Can access via `http://api.nextsensesolutions.com`
- ✅ Can set up SSL certificate
- ✅ Can access via `https://api.nextsensesolutions.com`

