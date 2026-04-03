# LOAN PWA - Complete Setup Guide for Termux

## 📋 TABLE OF CONTENTS
1. [Prerequisites](#prerequisites)
2. [Termux Setup Commands](#termux-setup-commands)
3. [Project Initialization](#project-initialization)
4. [WhatsApp Business API Setup](#whatsapp-business-api-setup)
5. [Running the Application](#running-the-application)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)

---

## 📦 PREREQUISITES

### Required Software
- **Termux** (latest version from F-Droid, NOT Play Store)
- **Node.js** 18+ (installed via Termux)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)

### WhatsApp Business API Requirements
- Meta Developer Account (https://developers.facebook.com/)
- WhatsApp Business Account
- Verified phone number

---

## 🚀 TERMUX SETUP COMMANDS

### Step 1: Update Termux Packages
```bash
pkg update && pkg upgrade -y
```

### Step 2: Install Node.js and Required Packages
```bash
pkg install nodejs -y
pkg install git -y
pkg install python -y  # Required for better-sqlite3 compilation
pkg install build-essential -y  # Compiler tools for native modules
```

### Step 3: Verify Installation
```bash
node --version  # Should show v18+ 
npm --version   # Should show 9+
```

---

## 📁 PROJECT INITIALIZATION

### Step 1: Navigate to Project Directory
```bash
cd /storage/emulated/0/loan-pwa-v0.0.1
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web server framework
- `axios` - HTTP client for WhatsApp API
- `dotenv` - Environment variable management
- `better-sqlite3` - Fast SQLite3 driver (local CRM database)
- `cors` - Cross-origin resource sharing middleware
- `node-cron` - Scheduled tasks (marketing automation)

### Step 3: Create Environment File
```bash
cp .env.template .env
```

### Step 4: Edit Environment Variables
```bash
nano .env
```

Fill in your WhatsApp API credentials (see next section).

---

## 💬 WHATSAPP BUSINESS API SETUP

### Step 1: Create Meta Developer Account
1. Go to https://developers.facebook.com/
2. Click "Get Started" and create a developer account
3. Verify your account with phone/email

### Step 2: Create a New App
1. Click "My Apps" → "Create App"
2. Select "Other" → "Next"
3. Select "Business" → "Continue"
4. Fill in app details:
   - **App Name**: Loan PWA WhatsApp Bot
   - **App Contact Email**: nlr66438@gmail.com

### Step 3: Add WhatsApp Product
1. In your app dashboard, scroll down and add "WhatsApp" product
2. Click "Set up" on WhatsApp product
3. You'll get a **temporary access token** (valid for 24 hours)

### Step 4: Get Your Credentials
From the WhatsApp > API Setup page:
1. **Access Token**: Copy the temporary or permanent token
2. **Phone Number ID**: Copy the ID (looks like: 123456789012345)
3. **Verify Token**: Create your own (e.g., `my_custom_token_123`)

### Step 5: Configure Webhook
1. In WhatsApp > Configuration, click "Edit" on Webhook
2. **Callback URL**: `https://your-domain.com/webhook`
   - For local testing on Termux, use ngrok:
   ```bash
   pkg install ngrok -y
   ngrok http 3000
   ```
   - Copy the ngrok URL and use: `https://xxxx.ngrok.io/webhook`
3. **Verify Token**: Enter the same token from your .env file
4. Click "Verify and Save"
5. Subscribe to these webhook events:
   - ✅ `messages`

### Step 6: Add Phone Number to Test List
1. Go to WhatsApp > API Setup
2. Add your personal WhatsApp number to "Recipient Numbers"
3. This number can receive test messages

### Step 7: Update .env File
```bash
nano .env
```

Fill in:
```env
WHATSAPP_ACCESS_TOKEN=your_temporary_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_123456
```

---

## ▶️ RUNNING THE APPLICATION

### Start the Server
```bash
npm start
```

Or with auto-reload for development:
```bash
npm run dev
```

### Expected Output
```
===========================================
🚀 Loan PWA Server Started
📍 Server running on http://localhost:3000
💾 Database: /path/to/db/crm.sqlite
===========================================
📊 API Endpoints:
   POST /api/lead - Create new lead
   GET  /api/leads - Get all leads
   ...
===========================================
```

### Access the App

**On Device:**
- Open browser and go to: `http://localhost:3000`

**From Other Devices on Same Network:**
1. Find your IP: `ifconfig` or `ip addr`
2. Access: `http://<your-ip>:3000`

**Via ngrok (for WhatsApp webhooks):**
```bash
ngrok http 3000
```
Then use the ngrok URL in your WhatsApp webhook configuration.

---

## 📚 API DOCUMENTATION

### CRM Endpoints

#### Create Lead (Website Form)
```bash
POST /api/lead
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+919500526217",
  "loanType": "personal",
  "amount": "500000",
  "location": "Chennai"
}
```

#### Get All Leads
```bash
GET /api/leads?status=new&page=1&limit=50
```

#### Get Single Lead
```bash
GET /api/leads/:id
```

#### Update Lead
```bash
PUT /api/leads/:id
Content-Type: application/json

{
  "status": "contacted",
  "notes": "Customer interested in personal loan"
}
```

#### Delete Lead
```bash
DELETE /api/leads/:id
```

### WhatsApp Webhooks

#### Verification (GET)
```bash
GET /webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

#### Receive Messages (POST)
Automatically triggered by Meta when user sends WhatsApp message.

### Marketing API

#### Send Broadcast
```bash
POST /api/marketing/broadcast
Content-Type: application/json

{
  "name": "Summer Campaign",
  "message": "Special offer! Get your loan with 0.5% lower interest this week. Reply now!",
  "filter": {
    "status": "new"
  }
}
```

#### Get Campaigns
```bash
GET /api/marketing/campaigns
```

### Health Check
```bash
GET /api/health
```

---

## 🤖 WHATSAPP BOT CONVERSATION FLOW

### User sends "Hi" → Bot responds:
```
Welcome to Loan PWA! 🎉

We're here to help you with fast and easy loans across Tamil Nadu.

Please select a loan type by replying with the number:

1️⃣ Personal Loan
2️⃣ Business Loan
3️⃣ Home Loan
4️⃣ Mortgage Loan
5️⃣ Vehicle Loan (New/Used/Takeover)

Or type "help" for more options.
```

### User sends "1" → Bot responds:
```
Personal Loan

Flexible loans for personal needs - medical, travel, education, or emergencies.

Amount: ₹50,000 to ₹25 Lakhs
No collateral required
Quick approval in 24hrs

Would you like to apply?
Reply with:
- Your NAME
- LOAN AMOUNT needed
- Your LOCATION

Or call us: +91 95005 26217
```

### Auto-CRM:
- All WhatsApp inquiries automatically create leads in SQLite database
- Lead status: "new"
- Source: "whatsapp"
- 24-hour follow-up automation via cron job

---

## ⚙️ AUTOMATED MARKETING (Cron Job)

### Schedule
- **Runs**: Every day at 10:00 AM IST
- **Timezone**: Asia/Kolkata

### Logic
1. Finds leads older than 24 hours with status="new"
2. Sends personalized WhatsApp follow-up
3. Marks `follow_up_sent = 1` in database
4. Logs success/failure

### Custom Schedule
Edit in `server.js`:
```javascript
cron.schedule('0 10 * * *', async () => {
  // Your cron logic here
}, {
  timezone: 'Asia/Kolkata'
});
```

**Cron Patterns:**
- Every 6 hours: `0 */6 * * *`
- Every Monday 9 AM: `0 9 * * 1`
- Every 30 minutes: `*/30 * * * *`

---

## 🔧 TROUBLESHOOTING

### Issue: better-sqlite3 fails to install
**Solution:**
```bash
pkg install python build-essential -y
npm rebuild better-sqlite3
```

### Issue: Port 3000 already in use
**Solution:**
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Issue: WhatsApp webhook not receiving messages
**Checklist:**
1. ✅ Webhook URL is accessible (use ngrok for local testing)
2. ✅ Verify token matches in .env and Meta dashboard
3. ✅ Subscribed to `messages` webhook event
4. ✅ Access token is valid (temporary tokens expire in 24h)
5. ✅ Test number is added in Meta dashboard

### Issue: Can't access from other devices
**Solution:**
```bash
# Check if server is listening on all interfaces
netstat -tulpn | grep 3000

# Should show 0.0.0.0:3000, not 127.0.0.1:3000
# If it shows 127.0.0.1, update server.js:
app.listen(PORT, '0.0.0.0', () => { ... });
```

### Issue: Database file not found
**Solution:**
```bash
# Create db directory
mkdir -p db

# Check file permissions
chmod 755 db/
```

### Issue: Service Worker not registering
**Solution:**
1. Must be served over HTTPS (except localhost)
2. Use ngrok for testing: `ngrok http 3000`
3. Check browser console for errors

---

## 📱 PWA INSTALLATION

### Android
1. Open app in Chrome
2. Tap "Add to Home Screen" banner
3. Or: Menu (⋮) → "Install App"

### iOS
1. Open app in Safari
2. Tap Share button (⎋)
3. Select "Add to Home Screen"

### Desktop
1. Click install icon in address bar
2. Or: Browser menu → "Install Loan PWA"

---

## 💾 DATABASE MANAGEMENT

### View Database (SQLite CLI)
```bash
pkg install sqlite -y
sqlite3 db/crm.sqlite

# List tables
.tables

# View all leads
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;

# View WhatsApp messages
SELECT * FROM whatsapp_messages ORDER BY timestamp DESC LIMIT 10;

# Exit
.exit
```

### Backup Database
```bash
cp db/crm.sqlite db/crm-backup-$(date +%Y%m%d).sqlite
```

### Reset Database
```bash
rm db/crm.sqlite
# Restart server - tables will be recreated automatically
npm start
```

---

## 🔐 SECURITY BEST PRACTICES

### Production Checklist
- [ ] Use HTTPS (Let's Encrypt or Cloudflare)
- [ ] Set `NODE_ENV=production`
- [ ] Use permanent WhatsApp access token
- [ ] Enable webhook signature verification
- [ ] Add rate limiting
- [ ] Set up firewall rules
- [ ] Regular database backups
- [ ] Monitor server logs

### Webhook Signature Verification
Add to `/webhook` route:
```javascript
const signature = req.headers['x-hub-signature-256'];
const expectedSignature = `sha256=${crypto
  .createHmac('sha256', APP_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex')}`;

if (signature !== expectedSignature) {
  return res.sendStatus(401);
}
```

---

## 📊 MONITORING & LOGS

### View Server Logs
```bash
npm start 2>&1 | tee server.log
```

### Monitor Database Queries
In development, SQLite logs all queries. To disable:
```javascript
const db = new Database(path, { 
  verbose: null // Disable query logging
});
```

### Check Lead Statistics
```sql
-- Total leads
SELECT COUNT(*) FROM leads;

-- Leads by status
SELECT status, COUNT(*) as count FROM leads GROUP BY status;

-- Leads by source
SELECT source, COUNT(*) as count FROM leads GROUP BY source;

-- Leads today
SELECT * FROM leads WHERE date(created_at) = date('now');
```

---

## 🆘 SUPPORT & RESOURCES

### Official Documentation
- **Express.js**: https://expressjs.com/
- **better-sqlite3**: https://github.com/WiseLibs/better-sqlite3
- **WhatsApp Cloud API**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Node-cron**: https://github.com/kelektiv/node-cron

### Contact
- **Phone**: +91 95005 26217
- **Email**: nlr66438@gmail.com

---

## 📝 LICENSE

MIT License - Feel free to use this project for your business needs.

---

**Happy Coding! 🚀**
