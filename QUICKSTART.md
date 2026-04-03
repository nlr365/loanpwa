# LOAN PWA - QUICK REFERENCE CARD

## 🚀 QUICK START (3 Commands)
```bash
npm install
cp .env.template .env && nano .env  # Add your WhatsApp credentials
npm start
```

## 📱 ACCESS URLS
- **Local:** http://localhost:3000
- **Network:** http://<your-ip>:3000
- **Ngrok:** ngrok http 3000 (for WhatsApp webhooks)

## 🔑 API ENDPOINTS

### CRM
```bash
POST /api/lead              # Create lead
GET  /api/leads             # Get all leads
GET  /api/leads/:id         # Get single lead
PUT  /api/leads/:id         # Update lead
DELETE /api/leads/:id       # Delete lead
```

### WhatsApp
```bash
GET  /webhook               # Meta verification
POST /webhook               # Receive messages
```

### Marketing
```bash
POST /api/marketing/broadcast   # Send broadcast
GET  /api/marketing/campaigns   # Get campaigns
```

### Utility
```bash
GET /api/health             # Health check
```

## 💬 WHATSAPP BOT COMMANDS
```
User: "Hi" → Bot: Greeting + menu (1-5)
User: "1" → Bot: Personal Loan details
User: "2" → Bot: Business Loan details
User: "3" → Bot: Home Loan details
User: "4" → Bot: Mortgage Loan details
User: "5" → Bot: Vehicle Loan details
User: "help" → Bot: Complete help menu
```

## 🗄️ DATABASE QUERIES
```bash
sqlite3 db/crm.sqlite

SELECT COUNT(*) FROM leads;
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;
SELECT status, COUNT(*) FROM leads GROUP BY status;
SELECT * FROM leads WHERE date(created_at) = date('now');
.exit
```

## 🔧 COMMON COMMANDS

### Development
```bash
npm run dev        # Start with auto-reload
npm start          # Start production server
PORT=3001 npm start  # Use different port
```

### Database
```bash
cp db/crm.sqlite db/backup.sqlite  # Backup
rm db/crm.sqlite                   # Reset (auto-recreates on start)
sqlite3 db/crm.sqlite              # Open CLI
```

### Ngrok (WhatsApp Testing)
```bash
pkg install ngrok -y
ngrok http 3000
# Copy HTTPS URL to WhatsApp webhook config
```

## 📦 KEY FILES
```
server.js              # Complete backend
public/index.html      # Complete frontend
src/css/style.css      # Stylesheet
src/js/app.js          # PWA logic
.env                   # Your credentials (DO NOT COMMIT)
db/crm.sqlite          # Local database
```

## ⚙️ ENVIRONMENT VARIABLES
```env
PORT=3000
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
```

## 🐛 TROUBLESHOOTING

**Port in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**SQLite install fails:**
```bash
pkg install python build-essential -y
npm rebuild better-sqlite3
```

**WhatsApp not working:**
- Check ngrok is running
- Verify webhook URL in Meta dashboard
- Ensure access token is valid
- Test number must be added in Meta dashboard

## 📊 CRON SCHEDULE
- **Runs:** Daily 10:00 AM IST
- **Task:** Follow-up leads >24 hours old
- **Customize:** Edit cron pattern in server.js

## 🎨 BRAND COLORS
```
Deep Forest Green: #16a34a (primary)
Vibrant Orange: #f97316 (CTA)
White: #ffffff (background)
Dark Text: #1f2937
```

## 📞 BUSINESS INFO
```
Phone: +91 95005 26217
Email: nlr66438@gmail.com
Region: Tamil Nadu, India
```

## 📖 FULL DOCS
- **Setup Guide:** SETUP.md
- **Deliverables:** DELIVERABLES.md
- **Project Info:** QWEN.md

---
**Need help? Check SETUP.md for detailed instructions!**
