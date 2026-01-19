#!/bin/bash

###############################################################################
# Deployment Script for fexen-apis
# 
# This script deploys ONLY the fexen-apis application to:
#   - Domain: api.nextsensesolution.com
#   - Port: 3005
#   - PM2 Name: fexen-apis
#
# IMPORTANT: This script will NOT interfere with other applications on the server.
# Each app should have its own domain and deployment script.
###############################################################################

# Don't exit on error for SSL setup - we want deployment to continue even if SSL fails
set -e

echo "🚀 Starting deployment for fexen-apis (api.nextsensesolution.com)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fexen-apis"
APP_DIR="/var/www/fexen-apis"
DOMAIN="api.nextsensesolution.com"
PORT=3005

# Function to print colored messages
print_message() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Step 1: Safely manage domain configuration for fexen-apis only
print_message "Step 1: Checking domain configuration for $APP_NAME ($DOMAIN)..."

# Verify we're only working with the correct domain
if [ "$DOMAIN" != "api.nextsensesolution.com" ]; then
    print_error "Domain mismatch! This script is configured for api.nextsensesolution.com only"
    exit 1
fi

# Check if domain is already configured and validate it's for our app
if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    # Check what port/proxy the existing config points to
    if grep -q "proxy_pass" "/etc/nginx/sites-available/$DOMAIN"; then
        OLD_PROXY=$(grep "proxy_pass" "/etc/nginx/sites-available/$DOMAIN" | head -1 | awk '{print $2}' | tr -d ';' | sed 's|http://localhost:||')
        print_message "Found existing proxy configuration pointing to port: $OLD_PROXY"
        
        # Check if this port matches our expected port
        if [ "$OLD_PROXY" != "$PORT" ]; then
            print_warning "⚠️  WARNING: Domain $DOMAIN is currently configured for port $OLD_PROXY (expected: $PORT)"
            
            # Try to identify which PM2 process might be using this port
            print_warning "Checking which application might be using port $OLD_PROXY..."
            CONFLICT_APP=""
            
            # Check PM2 processes for port conflicts
            for pm2_id in $(pm2 jlist 2>/dev/null | jq -r '.[].pm_id' 2>/dev/null || pm2 list | tail -n +4 | head -n -1 | awk '{print $1}' | grep -E '^[0-9]+$'); do
                if [ -n "$pm2_id" ]; then
                    pm2_name=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.pm_id==$pm2_id) | .name" 2>/dev/null || pm2 list | grep " $pm2_id " | awk '{print $2}')
                    pm2_env_port=$(pm2 env $pm2_id 2>/dev/null | grep "^PORT=" | cut -d'=' -f2)
                    
                    if [ -n "$pm2_env_port" ] && [ "$pm2_env_port" = "$OLD_PROXY" ]; then
                        CONFLICT_APP="$pm2_name"
                        print_error "Port $OLD_PROXY is used by PM2 app: $pm2_name (ID: $pm2_id)"
                    fi
                fi
            done
            
            if [ -n "$CONFLICT_APP" ] && [ "$CONFLICT_APP" != "$APP_NAME" ]; then
                print_error ""
                print_error "⚠️  CONFLICT DETECTED: $DOMAIN is configured for $CONFLICT_APP (port $OLD_PROXY)"
                print_error "This script is for $APP_NAME (port $PORT) only!"
                print_error ""
                print_error "ACTION REQUIRED:"
                print_error "  1. Ensure $CONFLICT_APP has its own domain configured"
                print_error "  2. Verify $DOMAIN should be used by $APP_NAME"
                print_error "  3. If correct, this script will update the config for $APP_NAME"
                print_error ""
                print_warning "Proceeding to update configuration for $APP_NAME..."
            else
                print_message "Port mismatch detected, but no conflicting app found. Updating config for $APP_NAME..."
            fi
        else
            print_message "Existing config points to the same port ($PORT), safe to update for $APP_NAME"
        fi
    fi
fi

# Remove symlink if it exists
if [ -f "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    rm -f "/etc/nginx/sites-enabled/$DOMAIN"
    print_message "Removed existing domain symlink"
fi

# Verify no other Nginx configs are using the same domain (shouldn't happen, but check)
DUPLICATE_CONFIGS=$(grep -l "server_name.*$DOMAIN" /etc/nginx/sites-available/* 2>/dev/null | grep -v "backup" | grep -v "^/etc/nginx/sites-available/$DOMAIN$" || true)
if [ -n "$DUPLICATE_CONFIGS" ]; then
    print_warning "Found other Nginx configs that might reference $DOMAIN:"
    echo "$DUPLICATE_CONFIGS"
    print_warning "Please review these configs to ensure no conflicts"
fi

# Step 2: Create application directory
print_message "Step 2: Setting up application directory..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Step 3: Check Node.js installation (install only if missing)
print_message "Step 3: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    print_message "Node.js installed successfully"
fi

NODE_VERSION=$(node --version)
print_message "Node.js version: $NODE_VERSION"

# Step 4: Check PM2 installation (install only if missing)
print_message "Step 4: Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing..."
    npm install -g pm2
    print_message "PM2 installed successfully"
fi

PM2_VERSION=$(pm2 --version)
print_message "PM2 version: $PM2_VERSION"

# Step 5: Install dependencies and build (MANDATORY for deployment)
print_message "Step 5: Installing dependencies and building application (mandatory)..."
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Cannot proceed with deployment."
    exit 1
fi

# Always install dependencies (mandatory for deployment)
if [ -d "dist" ]; then
    # If dist exists, only install production dependencies
    print_message "Build directory found, installing production dependencies..."
    npm ci --only=production --silent
    print_message "Production dependencies installed"
else
    # If dist doesn't exist, install all deps and build
    print_message "Build directory not found, installing all dependencies and building..."
    npm ci --silent
    print_message "Dependencies installed"
    print_message "Building application..."
    npm run build
    print_message "Build completed"
fi

# Step 6: Create uploads directory
print_message "Step 6: Creating uploads directory..."
mkdir -p "$APP_DIR/uploads"
chmod 755 "$APP_DIR/uploads"

# Step 7: Setup environment variables
print_message "Step 7: Checking environment variables..."
# Preserve existing .env file if it exists - allow manual configuration
if [ -f "$APP_DIR/.env" ]; then
    print_message "Existing .env file found - preserving it (not overwriting)"
    print_message "You can manually edit .env file at: $APP_DIR/.env"
else
    print_message "No .env file found - creating initial .env file..."
    cat > "$APP_DIR/.env" << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb://admin:Pa$$w0rd!@85.208.48.133:27017/fexen-website

# Brevo Configuration
BREVO_API_KEY=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

# Server Configuration
PORT=3005
NODE_ENV=production

# CORS Configuration (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005,http://localhost:4200,https://fexen-website.vercel.app,https://api.nextsensesolution.com

# Brevo List IDs (optional - for adding contacts to specific lists)
BREVO_LIST_ID=
EOF
    print_message "Created initial .env file with default configuration"
    print_message "You can manually edit .env file at: $APP_DIR/.env"
fi

# Step 8: Stop existing PM2 process for fexen-apis only
print_message "Step 8: Managing PM2 process for $APP_NAME only..."
if pm2 list | grep -q "$APP_NAME"; then
    print_warning "Stopping existing $APP_NAME process..."
    pm2 delete "$APP_NAME" || true
    sleep 2
    print_message "Stopped $APP_NAME process"
else
    print_message "No existing $APP_NAME process found"
fi

# Verify we're not accidentally affecting other apps
print_message "Verifying other PM2 processes are not affected..."
OTHER_APPS=$(pm2 list | grep -v "$APP_NAME" | grep -v "┌\|├\|│\|└\|id\|name" | awk '{print $2}' | grep -v "^$" || true)
if [ -n "$OTHER_APPS" ]; then
    print_message "Other PM2 processes detected (will not be affected):"
    echo "$OTHER_APPS" | while read app; do
        if [ -n "$app" ]; then
            print_message "  - $app (untouched)"
        fi
    done
fi

# Step 9: Start application with PM2
print_message "Step 9: Starting application with PM2..."
cd "$APP_DIR"
pm2 start dist/main.js --name "$APP_NAME" --update-env
pm2 save

# Step 10: Setup PM2 startup script (idempotent - safe to run multiple times)
print_message "Step 10: Setting up PM2 startup script..."
if pm2 startup | grep -q "already"; then
    print_message "PM2 startup script already configured (skipping)"
else
    pm2 startup systemd -u root --hp /root || print_warning "PM2 startup script setup failed, but continuing..."
    print_message "PM2 startup script configured"
fi

# Step 11: Check Nginx installation and configure (install only if missing)
print_message "Step 11: Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx not found. Installing..."
    apt-get update
    apt-get install -y nginx
    print_message "Nginx installed successfully"
else
    print_message "Nginx already installed (skipping installation)"
fi

print_message "Configuring Nginx for $DOMAIN..."

# CRITICAL FIX: Check if SSL certificates exist BEFORE writing config
# This prevents Nginx from failing due to missing certificate files
print_message "Checking SSL certificate status..."
SSL_CERTS_EXIST=false
if [ -d "/etc/letsencrypt/live/$DOMAIN" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ]; then
    SSL_CERTS_EXIST=true
    print_message "SSL certificates found - will create HTTPS configuration"
else
    print_warning "SSL certificates not found - will create HTTP-only configuration"
    print_warning "HTTPS will be configured after SSL certificates are obtained"
fi

# Create Nginx configuration based on SSL certificate availability
if [ "$SSL_CERTS_EXIST" = true ]; then
    # SSL certificates exist - create full HTTPS configuration
    print_message "Creating HTTPS configuration..."
    cat > "/etc/nginx/sites-available/$DOMAIN" << EOF
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Increase max upload size for file attachments
    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
else
    # SSL certificates don't exist - create HTTP-only configuration
    print_message "Creating HTTP-only configuration (SSL will be added later)..."
    cat > "/etc/nginx/sites-available/$DOMAIN" << EOF
# HTTP server (HTTPS will be configured after SSL certificates are obtained)
server {
    listen 80;
    server_name $DOMAIN;

    # Increase max upload size for file attachments
    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
fi

# Enable site
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
print_message "Enabled Nginx site for $DOMAIN"

# Verify the configuration is only for our domain and app
print_message "Verifying Nginx configuration is correct for $APP_NAME..."
if grep -q "server_name $DOMAIN" "/etc/nginx/sites-available/$DOMAIN" && grep -q "proxy_pass http://localhost:$PORT" "/etc/nginx/sites-available/$DOMAIN"; then
    print_message "✓ Nginx config verified: $DOMAIN -> localhost:$PORT ($APP_NAME)"
    print_message "✓ Verified: No default_server in config (default-catch-all handles unmatched requests)"
else
    print_error "Nginx configuration verification failed!"
    exit 1
fi


# Test Nginx configuration BEFORE reloading
print_message "Testing Nginx configuration..."
if nginx -t; then
    print_message "✓ Nginx configuration is valid"
    
    # Reload or start Nginx
    if systemctl is-active --quiet nginx; then
        print_message "Reloading Nginx..."
        systemctl reload nginx
        print_message "✓ Nginx reloaded successfully"
    else
        print_message "Starting Nginx..."
        systemctl start nginx
        print_message "✓ Nginx started successfully"
    fi
else
    print_error "Nginx configuration test failed!"
    print_error "This could break the server. Please check the configuration manually."
    print_error "Run: nginx -t"
    exit 1
fi

# Step 12: Check Certbot installation and setup SSL (install only if missing)
print_message "Step 12: Checking Certbot installation..."
if ! command -v certbot &> /dev/null; then
    print_warning "Certbot not found. Installing..."
    apt-get install -y certbot python3-certbot-nginx
    print_message "Certbot installed successfully"
else
    print_message "Certbot already installed (skipping installation)"
fi

print_message "Setting up SSL certificate..."

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "SSL certificate already exists, renewing..."
    certbot renew --quiet || print_warning "Certificate renewal failed, but continuing..."
    # Verify nginx config is still valid after renewal
    if nginx -t; then
        print_message "Nginx configuration verified"
        systemctl reload nginx
        print_message "Nginx reloaded"
    else
        print_error "Nginx configuration test failed after certificate renewal!"
        exit 1
    fi
else
    print_message "Attempting to obtain SSL certificate..."
    print_warning "Note: DNS must be configured for $DOMAIN to point to 85.208.48.133"
    
    # Try to get certificate, but don't fail if DNS isn't ready
    # Temporarily disable exit on error for SSL setup
    set +e
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email junaid.ameer93@gmail.com --redirect > /tmp/certbot.log 2>&1
    CERTBOT_EXIT_CODE=$?
    set -e
    
    if [ $CERTBOT_EXIT_CODE -eq 0 ]; then
        print_message "SSL certificate obtained successfully!"
        
        # Certbot modifies the nginx config, but we want our specific config
        # So rewrite it with the full HTTPS configuration
        print_message "Writing final nginx configuration with HTTPS..."
        cat > "/etc/nginx/sites-available/$DOMAIN" << EOF
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Increase max upload size for file attachments
    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
        
        # Test and reload nginx with final config
        if nginx -t; then
            print_message "Final nginx configuration is valid"
            systemctl reload nginx
            print_message "Nginx reloaded with full HTTPS configuration"
        else
            print_error "Nginx configuration test failed after writing final config!"
            exit 1
        fi
    else
        print_warning "SSL certificate setup failed - this is usually because DNS isn't configured yet"
        print_warning "The nginx config is written but nginx cannot start without valid SSL certificates"
        print_warning "You can set up SSL later by running:"
        print_warning "  sudo certbot --nginx -d $DOMAIN"
        print_warning ""
        print_warning "To set up DNS:"
        print_warning "  1. Go to your domain registrar"
        print_warning "  2. Add an A record: api.nextsensesolution.com -> 85.208.48.133"
        print_warning "  3. Wait for DNS propagation (5-30 minutes)"
        print_warning "  4. Then run: sudo certbot --nginx -d $DOMAIN"
        print_warning ""
        print_warning "See DNS_SETUP.md for detailed instructions"
    fi
fi

# Step 13: Verify deployment for fexen-apis only
print_message "Step 13: Verifying deployment for $APP_NAME..."
sleep 3

# Check PM2 status for our app only
if pm2 list | grep -q "$APP_NAME.*online"; then
    print_message "✓ $APP_NAME PM2 process is running"
else
    print_error "$APP_NAME PM2 process is not running!"
    pm2 logs "$APP_NAME" --lines 20
    exit 1
fi

# Check if port is listening
if netstat -tuln 2>/dev/null | grep -q ":$PORT " || ss -tuln 2>/dev/null | grep -q ":$PORT "; then
    print_message "✓ Application is listening on port $PORT"
else
    print_warning "Application may not be listening on port $PORT yet"
fi

# Verify Nginx configuration is correct and only for our domain
print_message "Verifying Nginx configuration..."
if [ -f "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    if grep -q "server_name $DOMAIN" "/etc/nginx/sites-available/$DOMAIN" && grep -q "proxy_pass http://localhost:$PORT" "/etc/nginx/sites-available/$DOMAIN"; then
        print_message "✓ Nginx is correctly configured for $DOMAIN -> $APP_NAME (port $PORT)"
    else
        print_error "Nginx configuration verification failed!"
        exit 1
    fi
else
    print_error "Nginx site not enabled for $DOMAIN!"
    exit 1
fi

# Final verification: Ensure no other apps are using our domain
print_message "Final check: Ensuring domain isolation..."
CONFLICTING_CONFIGS=$(grep -r "server_name.*$DOMAIN" /etc/nginx/sites-available/ 2>/dev/null | grep -v "backup" | grep -v "^/etc/nginx/sites-available/$DOMAIN:" | wc -l)
if [ "$CONFLICTING_CONFIGS" -gt 0 ]; then
    print_warning "Found $CONFLICTING_CONFIGS other config(s) that might reference $DOMAIN"
    print_warning "Please verify these don't conflict:"
    grep -r "server_name.*$DOMAIN" /etc/nginx/sites-available/ 2>/dev/null | grep -v "backup" | grep -v "^/etc/nginx/sites-available/$DOMAIN:"
else
    print_message "✓ No conflicting domain configurations found"
fi

# Final status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application Details (fexen-apis only):"
echo "  - Name: $APP_NAME"
echo "  - Directory: $APP_DIR"
echo "  - Domain: https://$DOMAIN"
echo "  - Port: $PORT"
echo ""
echo "✓ This deployment only affects $APP_NAME"
echo "✓ Other applications on the server are unaffected"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs $APP_NAME"
echo "  - Restart: pm2 restart $APP_NAME"
echo "  - Status: pm2 status"
echo "  - Monitor: pm2 monit"
echo ""
echo "Note: Each app should have its own domain and deployment script."
echo ""

