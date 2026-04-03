// ==========================================
// LOAN PWA - BACKEND SERVER (Termux Compatible)
// Features: Express server, SQLite CRM, WhatsApp Webhook, Marketing API
// ==========================================

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import cron from 'node-cron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';
import initSqlJs from 'sql.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// ==========================================
// 1. EXPRESS APP INITIALIZATION
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));
app.use('/src', express.static(join(__dirname, 'src')));

console.log('[Server] Express app initialized');

// ==========================================
// 2. SQLITE DATABASE SETUP (Local CRM using sql.js)
// ==========================================
// sql.js is a pure JavaScript SQLite implementation - no native compilation needed!
// Perfect for Termux environments where native modules fail

const DB_PATH = join(__dirname, 'db', 'crm.sqlite');

// Ensure db directory exists
const dbDir = join(__dirname, 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

let db; // SQLite database instance

// Helper: Save database to file
function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.error('[DB] Error saving database:', error.message);
  }
}

// Helper: Run a query (no results)
function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
    return { changes: db.getRowsModified() };
  } catch (error) {
    console.error('[DB] Run error:', error.message);
    throw error;
  }
}

// Helper: Get single row
function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      return stmt.getAsObject();
    }
    return null;
  } catch (error) {
    console.error('[DB] Get error:', error.message);
    throw error;
  }
}

// Helper: Get all rows
function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    return results;
  } catch (error) {
    console.error('[DB] All error:', error.message);
    throw error;
  }
}

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(new Uint8Array(buffer));
    console.log('[DB] Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new database');
  }

  // Create tables if they don't exist
  const createTables = () => {
    // Leads table - stores all lead information
    run(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        loan_type TEXT NOT NULL,
        amount TEXT NOT NULL,
        location TEXT,
        source TEXT DEFAULT 'website' CHECK(source IN ('website', 'whatsapp', 'referral')),
        status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'in_progress', 'closed', 'rejected')),
        notes TEXT,
        follow_up_sent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // WhatsApp messages log - track all WhatsApp interactions
    run(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        direction TEXT CHECK(direction IN ('inbound', 'outbound')),
        message_type TEXT DEFAULT 'text',
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Marketing campaigns - track broadcast messages
    run(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        sent_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[DB] Tables created/verified');
  };

  createTables();
}

// Initialize database before starting server
await initDatabase();

// ==========================================
// 3. CRM API ROUTES
// ==========================================

// POST /api/lead - Create new lead (from website form)
app.post('/api/lead', async (req, res) => {
  try {
    const { name, phone, loanType, amount, location } = req.body;

    // Validate required fields
    if (!name || !phone || !loanType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, loanType, amount'
      });
    }

    // Insert lead into database
    run(`
      INSERT INTO leads (name, phone, loan_type, amount, location, source)
      VALUES (?, ?, ?, ?, ?, 'website')
    `, [name, phone, loanType, amount, location || null]);

    // Get the last inserted ID
    const lastLead = get('SELECT id FROM leads ORDER BY id DESC LIMIT 1');
    const leadId = lastLead ? lastLead.id : 0;

    console.log(`[CRM] New lead created: ${name} (${phone}) - ${loanType}`);

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      leadId
    });
  } catch (error) {
    console.error('[CRM] Error creating lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/leads - Get all leads (for admin dashboard)
app.get('/api/leads', (req, res) => {
  try {
    const { status, source, page = 1, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    // Filter by status if provided
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Filter by source if provided
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const leads = all(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (source) {
      countQuery += ' AND source = ?';
      countParams.push(source);
    }

    const countResult = get(countQuery, countParams);
    const total = countResult ? countResult.total : 0;

    return res.json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[CRM] Error fetching leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/leads/:id - Get single lead
app.get('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const lead = get('SELECT * FROM leads WHERE id = ?', [id]);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    return res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('[CRM] Error fetching lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/leads/:id - Update lead
app.put('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, loan_type, amount, location, status, notes } = req.body;

    // Check if lead exists
    const existingLead = get('SELECT * FROM leads WHERE id = ?', [id]);
    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (loan_type !== undefined) { updates.push('loan_type = ?'); params.push(loan_type); }
    if (amount !== undefined) { updates.push('amount = ?'); params.push(amount); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;
    run(query, params);

    console.log(`[CRM] Lead updated: ${id}`);

    return res.json({
      success: true,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('[CRM] Error updating lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/leads/:id - Delete lead
app.delete('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;

    const result = run('DELETE FROM leads WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    console.log(`[CRM] Lead deleted: ${id}`);

    return res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('[CRM] Error deleting lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==========================================
// 4. WHATSAPP BUSINESS API INTEGRATION
// ==========================================

// WhatsApp Webhook - Meta Cloud API verification
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if mode and token are present
  if (mode && token) {
    // Check the mode and token sentiment
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp] Webhook verified successfully');
      // Respond with the challenge from the request
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if token doesn't match
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// WhatsApp Webhook - Receive messages
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if this is an event for a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;
      const messages = value.messages;

      if (messages) {
        const message = messages[0];
        const from = message.from; // Sender's phone number
        const messageBody = message.text?.body || '';

        console.log(`[WhatsApp] Message from ${from}: ${messageBody}`);

        // Log message to database
        db.prepare(`
          INSERT INTO whatsapp_messages (phone, direction, message_type, content)
          VALUES (?, 'inbound', 'text', ?)
        `).run(from, messageBody);

        // Auto-responder logic
        await handleWhatsAppMessage(from, messageBody);
      }

      // Return a 200 OK to acknowledge receipt
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('[WhatsApp] Error handling webhook:', error);
    res.sendStatus(500);
  }
});

// Handle incoming WhatsApp messages
async function handleWhatsAppMessage(phone, message) {
  const lowerMessage = message.toLowerCase().trim();

  // If user sends "hi" or "hello" - send greeting menu
  if (lowerMessage === 'hi' || lowerMessage === 'hello' || lowerMessage === 'hey') {
    const greeting = `Welcome to Loan PWA! 🎉

We're here to help you with fast and easy loans across Tamil Nadu.

Please select a loan type by replying with the number:

1️⃣ Personal Loan
2️⃣ Business Loan
3️⃣ Home Loan
4️⃣ Mortgage Loan
5️⃣ Vehicle Loan (New/Used/Takeover)

Or type "help" for more options.`;

    await sendWhatsAppMessage(phone, greeting);
    return;
  }

  // If user sends "help" - send detailed menu
  if (lowerMessage === 'help') {
    const helpMessage = `Here's how we can help you:

💰 LOAN TYPES:
Reply with a number to learn more:
1 - Personal Loan
2 - Business Loan
3 - Home Loan
4 - Mortgage Loan
5 - Vehicle Loan

📞 CONTACT:
Call us: +91 95005 26217
Email: nlr66438@gmail.com

⏰ Working Hours: Mon-Sat, 9 AM - 7 PM`;

    await sendWhatsAppMessage(phone, helpMessage);
    return;
  }

  // Handle loan type selections
  if (['1', '2', '3', '4', '5'].includes(lowerMessage)) {
    const loanTypes = {
      '1': { name: 'Personal Loan', details: 'Flexible loans for personal needs - medical, travel, education, or emergencies.\n\nAmount: ₹50,000 to ₹25 Lakhs\nNo collateral required\nQuick approval in 24hrs' },
      '2': { name: 'Business Loan', details: 'Grow your business with customized financing solutions.\n\nAmount: ₹2 Lakhs to ₹50 Lakhs\nFlexible repayment terms\nMinimal documentation' },
      '3': { name: 'Home Loan', details: 'Make your dream home a reality.\n\nUp to 90% of property value\nTenure up to 30 years\nTax benefits available' },
      '4': { name: 'Mortgage Loan', details: 'Unlock the value of your property.\n\nAmount: ₹5 Lakhs to ₹5 Crores\nLower interest rates\nFlexible end-use' },
      '5': { name: 'Vehicle Loan', details: 'New or used, buy your dream vehicle.\n\nNew & Used vehicles\nLoan takeover available\nUp to 100% on-road funding' }
    };

    const selectedLoan = loanTypes[lowerMessage];
    
    const response = `${selectedLoan.name}\n\n${selectedLoan.details}\n\nWould you like to apply?\nReply with:\n- Your NAME\n- LOAN AMOUNT needed\n- Your LOCATION

Or call us: +91 95005 26217`;

    await sendWhatsAppMessage(phone, response);
    
    // Create lead in CRM automatically
    db.prepare(`
      INSERT INTO leads (name, phone, loan_type, amount, source, status)
      VALUES (?, ?, ?, 'pending', 'whatsapp', 'new')
    `).run('WhatsApp Inquiry', phone, selectedLoan.name);

    console.log(`[WhatsApp] Auto-created lead for ${phone} - ${selectedLoan.name}`);
    return;
  }

  // Default response - capture inquiry and prompt for more info
  const defaultResponse = `Thank you for your message! 😊

Our team will review your inquiry and get back to you within 24 hours.

For immediate assistance:
📞 Call: +91 95005 26217
💬 Or type "help" to see our loan options

We're here to help!`;

  await sendWhatsAppMessage(phone, defaultResponse);
}

// Send WhatsApp message via Meta Cloud API
async function sendWhatsAppMessage(phone, message) {
  try {
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.warn('[WhatsApp] Missing credentials - message not sent');
      console.log('[WhatsApp] Would send to', phone, ':', message);
      return;
    }

    // Format phone number (remove + and spaces)
    const formattedPhone = phone.replace(/[\+\s\-]/g, '');

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log message to database
    db.prepare(`
      INSERT INTO whatsapp_messages (phone, direction, message_type, content)
      VALUES (?, 'outbound', 'text', ?)
    `).run(phone, message);

    console.log(`[WhatsApp] Message sent to ${phone}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error.response?.data || error.message);
    throw error;
  }
}

// ==========================================
// 5. MARKETING API (Broadcast Messages)
// ==========================================

// POST /api/marketing/broadcast - Send broadcast to all leads
app.post('/api/marketing/broadcast', async (req, res) => {
  try {
    const { name, message, filter } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get leads to send messages to
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    // Optional filter by status
    if (filter?.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }

    // Only send to leads with valid phone numbers
    const leads = db.prepare(query).all(...params);

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No leads found to send messages to'
      });
    }

    // Log the campaign
    const campaignResult = db.prepare(`
      INSERT INTO marketing_campaigns (name, message, sent_count)
      VALUES (?, ?, ?)
    `).run(name || 'Broadcast Campaign', message, leads.length);

    // Send messages to each lead
    let sentCount = 0;
    const failedNumbers = [];

    for (const lead of leads) {
      try {
        // Personalize message with lead's name
        const personalizedMessage = `Hi ${lead.name}! 👋\n\n${message}\n\nReply to this message or call us at +91 95005 26217 to proceed.`;
        
        await sendWhatsAppMessage(lead.phone, personalizedMessage);
        sentCount++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Marketing] Failed to send to ${lead.phone}:`, error.message);
        failedNumbers.push(lead.phone);
      }
    }

    // Update campaign with actual sent count
    db.prepare(`
      UPDATE marketing_campaigns SET sent_count = ? WHERE id = ?
    `).run(sentCount, campaignResult.lastInsertRowid);

    console.log(`[Marketing] Broadcast sent: ${sentCount}/${leads.length} successful`);

    return res.json({
      success: true,
      message: `Broadcast sent to ${sentCount} leads`,
      totalLeads: leads.length,
      successful: sentCount,
      failed: failedNumbers.length,
      failedNumbers
    });
  } catch (error) {
    console.error('[Marketing] Error sending broadcast:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/marketing/campaigns - Get all campaigns
app.get('/api/marketing/campaigns', (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT * FROM marketing_campaigns ORDER BY created_at DESC
    `).all();

    return res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('[Marketing] Error fetching campaigns:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==========================================
// 6. AUTOMATED MARKETING CRON JOB
// ==========================================

// Run every 24 hours at 10 AM IST
cron.schedule('0 10 * * *', async () => {
  console.log('[Cron] Running daily marketing follow-up...');

  try {
    // Get leads older than 24 hours that haven't been contacted
    const oldLeads = db.prepare(`
      SELECT * FROM leads 
      WHERE status = 'new' 
      AND follow_up_sent = 0 
      AND created_at < datetime('now', '-24 hours')
    `).all();

    console.log(`[Cron] Found ${oldLeads.length} leads for follow-up`);

    for (const lead of oldLeads) {
      try {
        const followUpMessage = `Hi ${lead.name}! 👋

This is a friendly follow-up regarding your ${lead.loan_type} inquiry.

We're still here to help you get the best loan deal! 

Reply to this message or call us at +91 95005 26217 to proceed.

Special offer this week: Lower interest rates available! 🎉`;

        await sendWhatsAppMessage(lead.phone, followUpMessage);

        // Mark follow-up as sent
        db.prepare(`
          UPDATE leads SET follow_up_sent = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(lead.id);

        console.log(`[Cron] Follow-up sent to ${lead.phone}`);
      } catch (error) {
        console.error(`[Cron] Failed to follow up with ${lead.phone}:`, error.message);
      }
    }

    console.log('[Cron] Daily marketing follow-up complete');
  } catch (error) {
    console.error('[Cron] Error in marketing cron job:', error);
  }
}, {
  timezone: 'Asia/Kolkata' // IST timezone
});

// ==========================================
// 7. HEALTH CHECK & UTILITY ROUTES
// ==========================================

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  const leadCount = db.prepare('SELECT COUNT(*) as count FROM leads').get();
  
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    leads: leadCount.count,
    timestamp: new Date().toISOString()
  });
});

// GET / - Serve the main page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ==========================================
// 8. START THE SERVER
// ==========================================
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🚀 Loan PWA Server Started');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`💾 Database: ${join(__dirname, 'db', 'crm.sqlite')}`);
  console.log('==========================================');
  console.log('📊 API Endpoints:');
  console.log('   POST /api/lead - Create new lead');
  console.log('   GET  /api/leads - Get all leads');
  console.log('   GET  /api/leads/:id - Get single lead');
  console.log('   PUT  /api/leads/:id - Update lead');
  console.log('   DELETE /api/leads/:id - Delete lead');
  console.log('   POST /api/marketing/broadcast - Send WhatsApp broadcast');
  console.log('   GET  /api/marketing/campaigns - Get campaigns');
  console.log('   GET  /webhook - WhatsApp verification');
  console.log('   POST /webhook - WhatsApp message handler');
  console.log('   GET  /api/health - Health check');
  console.log('==========================================');
  console.log('📱 Access the app:');
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://<your-ip>:${PORT}`);
  console.log('==========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Closing database...');
  db.close();
  process.exit(0);
});

export default app;
