// ==========================================
// LOAN PWA - FRONTEND JAVASCRIPT
// Handles: PWA registration, install prompts, UI logic, form submission
// ==========================================

// ==========================================
// 1. SERVICE WORKER REGISTRATION
// ==========================================
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('[SW] Service Worker registered:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
      
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  } else {
    console.warn('[SW] Service Workers not supported');
  }
}

// ==========================================
// 2. PWA INSTALL PROMPT (Android)
// ==========================================
let deferredPrompt; // Store the event for later use
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');
const dismissInstallBtn = document.getElementById('dismissInstall');

// Listen for beforeinstallprompt event (Android Chrome)
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing automatically
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show our custom install prompt
  if (installPrompt) {
    installPrompt.style.display = 'block';
  }
  
  console.log('[PWA] Install prompt available');
});

// Handle install button click
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return;
    }
    
    // Show the install dialog
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    
    // We can't use deferredPrompt again, so clear it
    deferredPrompt = null;
    
    // Hide our custom prompt
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
  });
}

// Handle dismiss install button
if (dismissInstallBtn) {
  dismissInstallBtn.addEventListener('click', () => {
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
    // Optionally save to localStorage to not show again for a while
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  });
}

// ==========================================
// 3. iOS INSTALL INSTRUCTIONS
// ==========================================
function detectIOS() {
  const ua = navigator.userAgent;
  const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIPhone = /iPhone/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  return (isIPhone || isIPad) && isSafari;
}

function showIOSInstallInstructions() {
  if (!detectIOS()) return;
  
  // Check if already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return; // Already installed
  }
  
  // Check if user dismissed the prompt recently (within 7 days)
  const dismissed = localStorage.getItem('installPromptDismissed');
  if (dismissed) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      return; // Don't show again for 7 days
    }
  }
  
  // Show a custom message for iOS users
  if (installPrompt) {
    const installContent = installPrompt.querySelector('.install-content');
    if (installContent) {
      installContent.innerHTML = `
        <p>Install Loan PWA for quick access!</p>
        <p style="font-size: 0.875rem; color: var(--color-text-light); margin-bottom: 1rem;">
          Tap the share button <span style="font-size: 1.25rem;">⎋</span> and select "Add to Home Screen"
        </p>
        <div class="install-buttons">
          <button id="dismissIOS" class="btn btn-secondary">Got it</button>
        </div>
      `;
      
      const dismissBtn = document.getElementById('dismissIOS');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          installPrompt.style.display = 'none';
          localStorage.setItem('installPromptDismissed', Date.now().toString());
        });
      }
      
      installPrompt.style.display = 'block';
    }
  }
}

// ==========================================
// 4. MOBILE MENU TOGGLE
// ==========================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Create overlay if it doesn't exist
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      document.body.appendChild(overlay);
    }
    
    overlay.classList.toggle('active');
  });
  
  // Close menu when clicking on a link
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      const overlay = document.querySelector('.nav-overlay');
      if (overlay) {
        overlay.classList.remove('active');
      }
    });
  });
  
  // Close menu when clicking overlay
  document.addEventListener('click', (e) => {
    const overlay = document.querySelector('.nav-overlay');
    if (overlay && overlay.classList.contains('active') && !navMenu.contains(e.target)) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
}

// ==========================================
// 5. SMOOTH SCROLL FOR ANCHOR LINKS
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      
      // Account for fixed header
      const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
      const targetPosition = targetElement.offsetTop - headerHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ==========================================
// 6. LEAD FORM SUBMISSION
// ==========================================
const loanForm = document.getElementById('loanForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');

if (loanForm) {
  loanForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const loanType = document.getElementById('loanType').value;
    const amount = document.getElementById('amount').value.trim();

    // Validate form data
    if (!name || !phone || !loanType || !amount) {
      showFormMessage('Please fill in all required fields.', 'error');
      return;
    }

    // Validate phone number (basic validation for Indian numbers)
    const phoneRegex = /^[\+]?[0-9\s\-]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      showFormMessage('Please enter a valid phone number.', 'error');
      return;
    }

    // Format loan type display name
    const loanTypeNames = {
      'personal': 'Personal Loan',
      'business': 'Business Loan',
      'home': 'Home Loan',
      'mortgage': 'Mortgage Loan',
      'vehicle': 'Vehicle Loan'
    };
    const loanTypeDisplay = loanTypeNames[loanType] || loanType;

    // Build WhatsApp message
    const whatsappMessage = `📋 *New Loan Application*

👤 *Name:* ${name}
📱 *Phone:* ${phone}
💰 *Loan Type:* ${loanTypeDisplay}
💵 *Amount:* ₹${amount}

I'm interested in applying for this loan. Please contact me with next steps. Thank you!`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);

    // Business WhatsApp number
    const businessNumber = '919500526217';

    // Show success message
    showFormMessage('✅ Opening WhatsApp to send your application...', 'success');

    // Disable button briefly
    submitBtn.disabled = true;
    submitBtn.textContent = 'Redirecting to WhatsApp...';

    // Open WhatsApp after short delay
    setTimeout(() => {
      window.open(`https://wa.me/${businessNumber}?text=${encodedMessage}`, '_blank');

      // Reset form after redirect
      loanForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Application';
    }, 500);
  });
}

// Helper function to show form messages
function showFormMessage(message, type) {
  if (!formMessage) return;
  
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
  formMessage.style.display = 'block';
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 5000);
  }
}

// ==========================================
// 7. DETECT IF APP IS RUNNING IN STANDALONE MODE
// ==========================================
function checkStandaloneMode() {
  // Check if running as installed PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  
  if (isStandalone || isFullscreen || isMinimalUI) {
    console.log('[PWA] Running in standalone mode');
    // Hide install prompt if already installed
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
  }
}

// Listen for display mode changes
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  if (e.matches) {
    console.log('[PWA] App installed and launched from home screen');
  }
});

// ==========================================
// 8. REGISTER PUSH NOTIFICATIONS (Optional)
// ==========================================
async function registerPushNotifications() {
  if (!('PushManager' in window) || !('Notification' in window)) {
    console.log('[Push] Push notifications not supported');
    return;
  }
  
  // Check permission status
  const permission = Notification.permission;
  
  if (permission === 'granted') {
    // Already granted, subscribe user
    await subscribeUser();
  } else if (permission === 'default') {
    // Not yet asked, we can ask later when appropriate
    console.log('[Push] Permission not yet requested');
  } else {
    console.log('[Push] Permission denied');
  }
}

async function subscribeUser() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Replace with your VAPID key
    });
    
    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
    console.log('[Push] User subscribed to notifications');
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ==========================================
// 9. APP INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[App] Initializing Loan PWA...');
  
  // Register service worker
  await registerServiceWorker();
  
  // Check if already installed
  checkStandaloneMode();
  
  // Show iOS install instructions if needed
  showIOSInstallInstructions();
  
  // Register push notifications (optional, uncomment when ready)
  // await registerPushNotifications();
  
  // Add active state to bottom nav based on scroll position
  setupScrollSpy();
  
  console.log('[App] Initialization complete');
});

// ==========================================
// 10. SCROLL SPY FOR BOTTOM NAV
// ==========================================
function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  
  if (!sections.length || !bottomNavItems.length) return;
  
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -80% 0px',
    threshold: 0
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        
        // Update bottom nav active state
        bottomNavItems.forEach(item => {
          const href = item.getAttribute('href');
          if (href === `#${activeId}`) {
            item.style.color = 'var(--color-green)';
          } else {
            item.style.color = '';
          }
        });
      }
    });
  }, observerOptions);
  
  sections.forEach(section => observer.observe(section));
}

// ==========================================
// 11. OFFLINE DETECTION
// ==========================================
function setupOfflineDetection() {
  function updateOnlineStatus() {
    if (navigator.onLine) {
      console.log('[Network] Back online');
      // Optionally show a toast message
    } else {
      console.log('[Network] Offline');
      // Optionally show offline banner
    }
  }
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// Initialize offline detection
setupOfflineDetection();

// ==========================================
// 12. PERFORMANCE: LAZY LOAD IMAGES (if any external images added later)
// ==========================================
function setupLazyImageLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// Export functions for potential use in other scripts
window.LoanPWA = {
  registerServiceWorker,
  showIOSInstallInstructions,
  registerPushNotifications
};
