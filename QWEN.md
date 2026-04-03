# Loan PWA (Progressive Web App)

## Project Overview

**Project Name:** Loan PWA  
**Version:** 0.0.1  
**Status:** Active development

A comprehensive, high-converting Progressive Web App (PWA) for a loan and finance agency operating across Tamil Nadu, India. The app features a mobile-first frontend with a fully automated backend CRM and WhatsApp Business API chatbot integration.

### Business Context
- **Business Phone:** +919500526217
- **Business Email:** nlr66438@gmail.com
- **Service Region:** All over Tamil Nadu
- **Loan Types:** Personal Loan, Business Loan, Home Loan, Mortgage Loan, Vehicle Loan

---

## Tech Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** — No framework dependencies for maximum performance
- **Tailwind CSS** (v3.4) — Utility-first CSS framework with custom theme colors
- **PWA** — Service Worker, Web App Manifest, offline support, installable on Android (WebAPK) and iOS (standalone)

### Backend
- **Node.js + Express** (v4.18) — REST API server
- **Firebase Admin SDK** (v12) — Firestore CRM for lead management
- **Twilio WhatsApp API** (v4.20) — WhatsApp Business chatbot
- **Nodemailer** (v6.9) — Admin email notifications
- **node-cron** (v3.0) — Automated marketing follow-ups
- **Axios** (v1.6) — HTTP client for API calls
- **dotenv** (v16) — Environment variable management
- **cors** + **body-parser** — Middleware

### Design System
- **Color Palette:**
  - Deep Navy Blue: `#1e3a5f` (primary)
  - Forest Green: `#16a34a` (secondary)
  - Vibrant Orange: `#f97316` (accent)
- **Fonts:** Inter (body), Poppins (headings) — via Google Fonts
- **Mobile-First:** Minimum 48x48px tap targets, safe-area insets for iOS, responsive breakpoints (`md:`, `lg:`)

---

## Project Structure

```
loan-pwa-v0.0.1/
├── index.html                      # Main SPA - all sections
├── package.json                    # Dependencies and scripts
├── tailwind.config.js              # Tailwind theme configuration
├── postcss.config.js               # PostCSS setup for Tailwind
├── QWEN.md                         # This file
│
├── public/
│   ├── manifest.json               # PWA Web App Manifest
│   ├── service-worker.js           # PWA Service Worker (caching, offline)
│   ├── offline.html                # Offline fallback page
│   └── icons/                      # PWA icons (various sizes)
│
├── src/
│   ├── css/
│   │   ├── input.css               # Tailwind source + custom styles
│   │   └── style.css               # Compiled CSS output
│   ├── js/
│   │   └── app.js                  # PWA registration, install prompt, UI logic
│   └── assets/
│       ├── icons/                  # SVG/PNG icons for UI
│       └── images/                 # Images (hero, steps, screenshots)
│
└── backend/
    ├── server.js                   # Express server entry point
    ├── routes/
    │   └── leads.js                # Lead submission API routes
    ├── services/
    │   ├── whatsappBot.js          # WhatsApp Business API chatbot logic
    │   ├── firebase.js             # Firebase Firestore CRM config
    │   └── emailNotifier.js        # Admin email notification service
    ├── cron/
    │   └── marketingFollowUp.js    # 24-hour automated follow-up cron job
    └── utils/
        └── helpers.js              # Shared utility functions
```

---

## Frontend Sections (Single Page App)

The `index.html` is a single-page application with these sections (in order):

1. **Header/Navigation**
   - Logo placeholder
   - Nav links: Home, Loan Types, Personal Loans, Contact Us
   - CTA button: "Get Started"
   - Mobile: Hamburger menu (top) or bottom navigation bar
   - Desktop: Standard horizontal header

2. **Hero Section**
   - Background: Happy family on a beach (placeholder image/SVG)
   - Headline: "The Right Loan For Your Financial Freedom"
   - Subheadline: "If you're looking to make a major change in your life, it's time to take control of your finances."
   - CTA Button: "GET YOUR LOAN NOW"
   - Trust bar with accreditation logos below

3. **How Our Loan Works (Features)**
   - Three icon-based columns:
     1. "No Initial Credit Check"
     2. "Free Consultation"
     3. "No Obligation To Sign Up"
   - Mobile: Stacked vertically
   - Desktop: Side-by-side (3 columns)

4. **Services Section**
   - Title: "All Over Tamil Nadu Loans Available"
   - Cards (swipeable on mobile, stacked on small screens):
     - Personal Loan
     - Business Loan
     - Home Loan
     - Mortgage Loan
     - Vehicle Loan

5. **Professional Solutions**
   - Title: "Count On Our Professional Solutions"
   - Three orange accent cards: "Lower Rates", "Trusted Brand", "Speed"

6. **Testimonial Section**
   - Orange gradient background
   - White quote box with 5-star rating graphic

7. **Call To Action Banner**
   - Dark green background
   - Text: "Gracefully Streamline Your Finances Without The Stress And Hassle."

8. **Getting Started Steps**
   - Three vertical image cards:
     1. "Call The Number On This Site" (+919500526217)
     2. "Apply For Our Personal Loan"
     3. "Get Back To Your Life"

9. **Footer**
   - Standard links
   - Copyright notice
   - Business email: nlr66438@gmail.com

---

## PWA Core Requirements

### manifest.json
- `display`: "standalone"
- `theme_color`: "#1e3a5f"
- `background_color`: "#ffffff"
- Full icon array with standard and maskable icons for Android
- Shortcuts for "Personal Loan" and "Contact Us"
- Screenshots for narrow form factor

### service-worker.js
- **Cache First** strategy for static assets (JS, CSS, images, fonts)
- **Network First** strategy for API/data requests
- Custom offline fallback page (`/offline.html`)
- Cache versioning for invalidation
- Pre-caching of critical resources on install

### app.js
- Service Worker registration with fallback
- Android install prompt: listens for `beforeinstallprompt` event, shows custom UI
- iOS install prompt: detects Safari, prompts user to tap "Share" → "Add to Home Screen"
- Bottom navigation for mobile, sticky header for desktop
- Smooth scroll for anchor links
- Contact form submission to backend API

---

## Backend Architecture

### server.js (Express Entry Point)
- Sets up Express app with CORS, body-parser middleware
- Mounts `/api/leads` route
- Initializes WhatsApp webhook endpoint (`/webhook/whatsapp`)
- Starts cron jobs
- Listens on `process.env.PORT` (default: 3000)

### WhatsApp Business API Bot (`services/whatsappBot.js`)
- Uses Twilio WhatsApp API wrapper
- **Conversation Flow:**
  1. **Greeting:** "Welcome! Interested in a loan? What type of loan are you looking for?"
  2. **Loan Type Selection:** User selects from (Personal, Business, Home, Mortgage, Vehicle)
  3. **Details Collection:** Name, Desired Amount, Location
  4. **Confirmation:** Saves lead to Firestore, sends confirmation message
  5. **Admin Notification:** Triggers email to nlr66438@gmail.com
- Handles inbound webhook from Twilio/Meta

### Firebase Firestore CRM (`services/firebase.js`)
- Firebase Admin SDK initialization
- **Leads Collection Schema:**
  ```
  leads/{leadId}
  ├── name: string
  ├── phone: string
  ├── loanType: string
  ├── amount: string
  ├── location: string
  ├── source: "website" | "whatsapp"
  ├── status: "new" | "contacted" | "in_progress" | "closed" | "rejected"
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── notes: string (optional)
  ```
- CRUD operations for leads

### Email Notifier (`services/emailNotifier.js`)
- Uses Nodemailer with SMTP
- Sends formatted email to admin on new lead
- Includes lead details and source

### Lead Routes (`routes/leads.js`)
- `POST /api/leads` — Submit new lead from website contact form
- `GET /api/leads` — List all leads (admin only)
- `GET /api/leads/:id` — Get single lead
- `PUT /api/leads/:id` — Update lead status
- Validates input, saves to Firestore, triggers email notification

### Marketing Follow-Up Cron (`cron/marketingFollowUp.js`)
- Runs every hour (cron: `0 * * * *`)
- Queries Firestore for leads created >24 hours ago with status != "closed"
- Sends WhatsApp template message: follow-up with CTA
- Updates lead with `followUpSent` flag

---

## Building and Running

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase service account key (JSON)
- Twilio account SID, auth token, WhatsApp number
- SMTP credentials for email notifications

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with required variables
cp .env.example .env
# Edit .env with your credentials

# 3. Build CSS (compile Tailwind)
npm run build:css

# 4. Start backend server
npm start
# or
npm run start:backend

# 5. For development (CSS watch + static server)
npm run dev

# 6. Run marketing cron job standalone
npm run cron:marketing
```

### Required Environment Variables (`.env`)

```env
# Server
PORT=3000
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
BUSINESS_PHONE=whatsapp:+919500526217

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nlr66438@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=nlr66438@gmail.com
```

---

## Development Conventions

### Frontend
- **Mobile-first CSS:** Default classes target mobile; use `md:` and `lg:` prefixes for larger screens
- **Tap targets:** All interactive elements minimum 48x48px
- **No inline styles:** Use Tailwind utility classes or custom CSS in `input.css`
- **Vanilla JS only:** No frontend frameworks — keep it lightweight
- **Accessibility:** Proper ARIA labels, semantic HTML, focus states, color contrast

### Backend
- **Async/await:** Use async/await over callbacks or `.then()` chains
- **Error handling:** All routes should have try/catch with proper HTTP status codes
- **Input validation:** Validate all incoming data before processing
- **Environment variables:** Never hardcode secrets; use `dotenv`

### PWA
- **Offline-first:** App should function (at minimum) with offline fallback page
- **Installability:** Must pass Lighthouse PWA audit (installable, manifest, service worker)
- **iOS compatibility:** Include all `apple-*` meta tags, handle safe area insets

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `index.html` | Main SPA with all UI sections |
| `src/css/input.css` | Tailwind source + custom component styles |
| `src/css/style.css` | Compiled CSS output (generated) |
| `public/manifest.json` | PWA Web App Manifest |
| `public/service-worker.js` | Service Worker for caching and offline |
| `src/js/app.js` | Frontend JS: SW registration, install prompts, UI logic |
| `backend/server.js` | Express server entry point |
| `backend/services/whatsappBot.js` | WhatsApp chatbot conversation flow |
| `backend/services/firebase.js` | Firebase Firestore initialization and lead CRUD |
| `backend/services/emailNotifier.js` | Admin email notifications |
| `backend/routes/leads.js` | REST API for lead management |
| `backend/cron/marketingFollowUp.js` | 24-hour automated follow-up cron job |

---

## Next Steps / TODOs

- [ ] Generate actual icon assets (or use placeholder SVGs)
- [ ] Generate hero background image (or use gradient/SVG placeholder)
- [ ] Create `offline.html` fallback page
- [ ] Set up Firebase project and download service account key
- [ ] Configure Twilio WhatsApp sandbox or production number
- [ ] Set up SMTP credentials for email notifications
- [ ] Add Lighthouse CI for PWA auditing
- [ ] Add unit tests for backend services
- [ ] Deploy to hosting (Firebase Hosting, Vercel, or custom server)
- [ ] Set up domain and SSL for production

---

## Notes

- Project is at version **0.0.1** — actively under development
- All phone numbers and emails are production targets (not placeholders)
- WhatsApp integration requires verified Meta Business account or Twilio sandbox
- Firebase Admin SDK requires service account credentials with Firestore permissions
- The backend server must run on HTTPS in production for WhatsApp webhooks to function
