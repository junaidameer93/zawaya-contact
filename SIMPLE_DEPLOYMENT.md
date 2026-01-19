# Simple Deployment Guide

This guide shows you how to deploy the Form Handler API without Docker - just Node.js, MongoDB, and PM2.

## Quick Overview

1. **Setup MongoDB** (local or cloud)
2. **Install dependencies and build**
3. **Configure environment variables**
4. **Run with PM2** (keeps your app running 24/7)
5. **Optional: Setup Nginx for production domain**

---

## Step 1: MongoDB Setup

### Option A: MongoDB Atlas (Cloud - Recommended)

**Advantages**: Free tier, no server maintenance, automatic backups

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user:
   - Go to Database Access
   - Add New Database User
   - Username: `formhandler`
   - Password: Generate secure password
   - Save credentials
4. Network Access:
   - Go to Network Access
   - Add IP Address
   - Allow Access from Anywhere: `0.0.0.0/0` (or your server IP)
5. Get connection string:
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Example: `mongodb+srv://formhandler:yourpassword@cluster0.xxxxx.mongodb.net/form-handler?retryWrites=true&w=majority`

### Option B: Local MongoDB

**Advantages**: Free, no external dependencies

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Your connection string will be:
# mongodb://localhost:27017/form-handler
```

---

## Step 2: Server Setup

### Install Node.js 18+

```bash
# Download Node.js installer
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PM2 (Process Manager)

```bash
# PM2 keeps your app running 24/7 and restarts it if it crashes
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## Step 3: Deploy Application

### Upload Your Code

```bash
# Create directory
sudo mkdir -p /var/www/form-handler
cd /var/www/form-handler

# Upload your code here (via FTP, git, scp, etc.)
# Or clone from git:
git clone your-repository-url .

# Set permissions
sudo chown -R $USER:$USER /var/www/form-handler
```

### Install Dependencies

```bash
# Install production dependencies only
npm ci --only=production

# Build the application
npm run build
```

### Configure Environment

```bash
# Create .env file
nano .env
```

Add your configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/form-handler?retryWrites=true&w=majority

# Brevo Configuration  
BREVO_API_KEY=your-brevo-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Brevo List ID
BREVO_LIST_ID=
```

**Important**: Get your Brevo API key from https://app.brevo.com → Settings → API Keys

---

## Step 4: Run with PM2

### Start Application

```bash
# Start the app
pm2 start dist/main.js --name form-handler

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it gives you (usually need to run with sudo)
```

### PM2 Commands

```bash
# Check status
pm2 status

# View logs (real-time)
pm2 logs form-handler

# View logs (last 100 lines)
pm2 logs form-handler --lines 100

# Restart app
pm2 restart form-handler

# Stop app
pm2 stop form-handler

# Monitor resources
pm2 monit
```

---

## Step 5: Test Your API

```bash
# Test if API is running
curl http://localhost:3000

# Test form submission
curl -X POST http://localhost:3000/form/submit-json \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "interests": ["Website Development"],
    "budget": "$5,000 - $10,000",
    "message": "Test message",
    "newsletterSubscribed": true,
    "privacyPolicyAccepted": true
  }'
```

You should see a success response!

---

## Step 6: Setup Domain (Optional but Recommended)

### Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/form-handler
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Change to your domain

    # Increase max upload size for file attachments
    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/form-handler /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Setup SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Certificate auto-renews, but you can test renewal:
sudo certbot renew --dry-run
```

Now your API is available at `https://api.yourdomain.com`

---

## Updating Your Application

When you need to deploy new code:

```bash
# Navigate to project directory
cd /var/www/form-handler

# Pull latest code (if using git)
git pull

# Install any new dependencies
npm ci --only=production

# Rebuild
npm run build

# Restart with PM2
pm2 restart form-handler

# Check logs
pm2 logs form-handler
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs form-handler --err

# Check if port is already in use
sudo lsof -i :3000

# Restart the app
pm2 restart form-handler
```

### MongoDB Connection Issues

```bash
# Test MongoDB connection
mongosh "your-connection-string"

# Check MongoDB Atlas:
# - Is IP address whitelisted?
# - Is database user created?
# - Is password correct?
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Application Crashes

```bash
# Check crash logs
pm2 logs form-handler --err

# View more details
pm2 show form-handler

# Increase memory limit if needed
pm2 delete form-handler
pm2 start dist/main.js --name form-handler --max-memory-restart 500M
pm2 save
```

---

## Security Checklist

- [ ] Use HTTPS (SSL certificate installed)
- [ ] Update `.env` with production values
- [ ] Set specific CORS origins (not `*`)
- [ ] Use strong MongoDB password
- [ ] Keep Node.js and npm updated
- [ ] Setup firewall (UFW):
  ```bash
  sudo ufw allow 22    # SSH
  sudo ufw allow 80    # HTTP
  sudo ufw allow 443   # HTTPS
  sudo ufw enable
  ```
- [ ] Regular backups of MongoDB
- [ ] Monitor application logs

---

## Monitoring

### View Application Logs

```bash
# Real-time logs
pm2 logs form-handler

# Save logs to file
pm2 logs form-handler > app.log
```

### Monitor Resources

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

### Setup Notifications (Optional)

PM2 can notify you if your app crashes:

```bash
# Install PM2 Plus (free tier available)
pm2 link your-secret-key your-public-key
```

---

## Cost Estimate

| Service | Cost |
|---------|------|
| Server (DigitalOcean/Vultr/Linode) | $5-10/month |
| MongoDB Atlas | Free tier (512MB) |
| Brevo | Free tier (300 emails/day) |
| Domain | $10-15/year |
| SSL Certificate | Free (Let's Encrypt) |
| **Total** | **~$5-10/month** |

---

## Quick Command Reference

```bash
# PM2 Commands
pm2 start dist/main.js --name form-handler
pm2 restart form-handler
pm2 stop form-handler
pm2 logs form-handler
pm2 monit
pm2 save
pm2 startup

# Nginx Commands
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t

# Application Commands
npm run build
npm ci --only=production
node dist/main.js  # Test without PM2

# SSL Certificate
sudo certbot --nginx -d api.yourdomain.com
sudo certbot renew
```

---

## Need Help?

- MongoDB Atlas: https://docs.atlas.mongodb.com/
- PM2 Documentation: https://pm2.keymetrics.io/
- Nginx Documentation: https://nginx.org/en/docs/
- Brevo API: https://developers.brevo.com/

Your API should now be running smoothly! 🚀

