const API_URL = '/api';

// State
let menuItems = [];
let cart = [];
let selectedPaymentMethod = 'STORE_QR';
let customerUPIQR = null;
let upiSettings = null;
let currentUpiUrl = '';
// DOM Elements - Store
const menuGrid = document.getElementById('menu-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total-price');
const placeOrderBtn = document.getElementById('place-order-btn');
const categoryFilters = document.getElementById('category-filters');
const storeQrBtn = document.getElementById('method-store-qr');
const storeQrDisplay = document.getElementById('store-qr-display');

const tableNumberInput = document.getElementById('tableNumber');

// UPI payment state
let upiPaymentConfirmed = false;

// Translations
const translations = {
    en: {
        heroTitle: "Traditional Taste of Tamil Nadu",
        heroSub: "Handcrafted sweets and savories, baked with honor.",
        startOrder: "Start Your Order",
        tableNum: "Table Number:",
        menuTitle: "Our Menu",
        cartTitle: "Your Order",
        total: "Total:",
        placeOrder: "Place Order",
        emptyCart: "Your cart is empty.",
        toastAdded: "added to cart",
        comboTitle: "🌟 Special Combo Offers"
    },
    hi: {
        heroTitle: "तमिलनाडु का पारंपरिक स्वाद",
        heroSub: "सम्मान के साथ पके हुए हस्तनिर्मित मिठाइयाँ और नमकीन।",
        startOrder: "अपना ऑर्डर शुरू करें",
        tableNum: "टेबल नंबर:",
        menuTitle: "हमारा मेनू",
        cartTitle: "आपका ऑर्डर",
        total: "कुल:",
        placeOrder: "ऑर्डर दें",
        emptyCart: "आपकी कार्ट खाली है।",
        toastAdded: "कार्ट में जोड़ा गया",
        comboTitle: "🌟 विशेष कॉम्बो ऑफर"
    },
    ta: {
        heroTitle: "தமிழ்நாட்டின் பாரம்பரிய சுவை",
        heroSub: "கௌரவத்துடன் சுடப்பட்ட கைவினை இனிப்புகள் மற்றும் காரவகைகள்.",
        startOrder: "உங்கள் ஆர்டரைத் தொடங்குங்கள்",
        tableNum: "மேஜை எண்:",
        menuTitle: "எங்கள் மெனு",
        cartTitle: "உங்கள் ஆர்டர்",
        total: "மொத்தம்:",
        placeOrder: "ஆர்டர் செய்ய",
        emptyCart: "உங்கள் கூடை காலியாக உள்ளது.",
        toastAdded: "கூடையில் சேர்க்கப்பட்டது",
        comboTitle: "🌟 சிறப்பு காம்போ சலுகைகள்"
    }
};

let currentLang = 'en';

// Utility Functions
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Store Frontend Logic
async function loadMenu() {
    if (!menuGrid) return; // Only run on index.html

    try {
        const response = await fetch(`${API_URL}/menu`);
        menuItems = await response.json();

        // Extract unique categories
        const categories = ['all', ...new Set(menuItems.map(item => item.category))];
        renderCategories(categories);

        renderMenu(menuItems);

        // Check for QR parameter
        checkQRParam();

        // Language Switcher
        const langSelect = document.getElementById('language-select');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                currentLang = e.target.value;
                updatePageLanguage();
            });
        }

        // setup placing order
        placeOrderBtn.addEventListener('click', placeOrder);
    } catch (error) {
        console.error('Error fetching menu:', error);
        showToast('Failed to load menu. Please try again later.', 'error');
    }
}

function renderCategories(categories) {
    if (!categoryFilters) return;

    // Filter out 'Combo' from standard categories
    const mainCategories = categories.filter(c => c.toLowerCase() !== 'combo');

    categoryFilters.innerHTML = '';
    mainCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${cat === 'all' ? 'active' : ''}`;
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (cat === 'all') {
                renderMenu(menuItems);
            } else {
                renderMenu(menuItems.filter(i => i.category === cat));
            }
        };
        categoryFilters.appendChild(btn);
    });
}

function updatePageLanguage() {
    const t = translations[currentLang];
    if (!t) return;

    const selectors = {
        '.hero-content h1': 'heroTitle',
        '.hero-content p': 'heroSub',
        '.ordering-setup h2': 'startOrder',
        '.ordering-setup label': 'tableNum',
        '.cart-header h3': 'cartTitle',
        '.cart-total span:first-child': 'total',
        '#place-order-btn': 'placeOrder',
        '.empty-cart-msg': 'emptyCart',
        '#combo-section h3': 'comboTitle'
    };

    for (const [selector, key] of Object.entries(selectors)) {
        const el = document.querySelector(selector);
        if (el) el.textContent = t[key];
    }
}

function checkQRParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');

    if (tableParam) {
        // A new direct QR scan to index.html (fallback): 
        // Force redirect to QRlogin.html to capture fresh details
        window.location.href = `QRlogin.html?table=${encodeURIComponent(tableParam)}`;
        return;
    }

    const savedName = localStorage.getItem('custName');
    const tableNo = localStorage.getItem('currentTableId') || 'Walk-in';

    // If no details and not on QRlogin page, redirect (optional but safer)
    if (!savedName && window.location.pathname.endsWith('index.html')) {
        // We let them stay if it's a walk-in, but the modal will prompt them
    }

    const badge = document.getElementById('active-table-badge');
    const lockedNo = document.getElementById('locked-table-no');
    const selectionPanel = document.getElementById('table-selection-panel');

    if (badge && lockedNo) {
        badge.style.display = 'flex';
        lockedNo.textContent = savedName ? `${savedName} (${tableNo})` : tableNo;
    }
    
    if (selectionPanel && (tableNo !== 'Walk-in' || savedName)) {
        selectionPanel.style.display = 'none';
    }
}

function saveCustomerInfo(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('custName').value;
    const dept = document.getElementById('custDept').value;
    const year = document.getElementById('custYear').value;

    localStorage.setItem('custName', name);
    localStorage.setItem('custDept', dept);
    localStorage.setItem('custYear', year);

    const modal = document.getElementById('customer-info-modal');
    if (modal) modal.style.display = 'none';

    // Update the live badge
    const tableNo = localStorage.getItem('currentTableId') || 'Walk-in';
    const lockedNo = document.getElementById('locked-table-no');
    if (lockedNo) lockedNo.textContent = `${name} (${tableNo})`;

    showToast(`Welcome ${name}! You can now start ordering.`);
}

function renderMenu(items) {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';

    const comboSection = document.getElementById('combo-section');
    const comboGrid = document.getElementById('combo-grid');

    // Separate Combo items
    const comboItems = menuItems.filter(i => i.category.toLowerCase() === 'combo' && (i.available !== false));
    const regularItems = items.filter(i => i.category.toLowerCase() !== 'combo' && (i.available !== false));

    // Render Combos
    if (comboGrid && comboItems.length > 0) {
        comboSection.style.display = 'block';
        comboGrid.innerHTML = '';
        comboItems.forEach(item => {
            comboGrid.appendChild(createMenuCard(item));
        });
    }

    // Render Regular items
    regularItems.forEach(item => {
        menuGrid.appendChild(createMenuCard(item));
    });
}

function createMenuCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.id = `menu-card-${item.id}`;
    card.innerHTML = `
        <div class="item-badge" id="badge-${item.id}">0</div>
        <div class="card-content">
            <h3 class="card-title">${item.name}</h3>
            <p class="card-desc">${item.description}</p>
            <div class="card-footer">
                <span class="card-price">${formatCurrency(item.price)}</span>
                <button class="add-btn" onclick="addToCart(${item.id})">+</button>
            </div>
        </div>
    `;
    return card;
}

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const existingCartItem = cart.find(ci => ci.menuItem.id === itemId);
    if (existingCartItem) {
        existingCartItem.quantity += 1;
    } else {
        cart.push({
            menuItem: item,
            quantity: 1
        });
    }

    updateCartUI();
    const t = translations[currentLang];
    showToast(`${item.name} ${t.toastAdded}`);
}

function updateCartQuantity(itemId, delta) {
    const itemIndex = cart.findIndex(ci => ci.menuItem.id === itemId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += delta;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        updateCartUI();
    }
}

function updateCartUI() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    // Reset all item badges
    document.querySelectorAll('.item-badge').forEach(b => {
        b.textContent = '0';
        b.style.display = 'none';
    });

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
        placeOrderBtn.disabled = true;
    } else {
        placeOrderBtn.disabled = false;
        cart.forEach(cartItem => {
            totalItems += cartItem.quantity;
            totalPrice += (cartItem.menuItem.price * cartItem.quantity);

            // Update badge on menu card
            const badge = document.getElementById(`badge-${cartItem.menuItem.id}`);
            if (badge) {
                badge.textContent = cartItem.quantity;
                badge.style.display = 'block';
            }

            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-info">
                    <h4>${cartItem.menuItem.name}</h4>
                    <span class="cart-item-price">${formatCurrency(cartItem.menuItem.price * cartItem.quantity)}</span>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="updateCartQuantity(${cartItem.menuItem.id}, -1)">-</button>
                    <span>${cartItem.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQuantity(${cartItem.menuItem.id}, 1)">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(el);
        });
    }

    cartCount.textContent = totalItems;
    cartTotal.textContent = formatCurrency(totalPrice);

    // Update modal total if visible
    const modalTotal = document.getElementById('modal-total-price');
    if (modalTotal) modalTotal.textContent = formatCurrency(totalPrice);
}

async function placeOrder() {
    if (cart.length === 0) return;

    // Final check for customer details before confirming order
    const savedName = localStorage.getItem('custName');
    if (!savedName) {
        const modal = document.getElementById('customer-info-modal');
        if (modal) {
            modal.style.display = 'flex';
            showToast('Please provide your details before ordering', 'error');
            return;
        }
    }

    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'flex';
        const totalPrice = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
        const modalTotal = document.getElementById('modal-total-price');
        if (modalTotal) modalTotal.textContent = formatCurrency(totalPrice);

        // Show customer info in summary
        const infoDiv = document.getElementById('payment-customer-info');
        if (infoDiv) {
            const name = localStorage.getItem('custName') || 'Guest';
            const dept = localStorage.getItem('custDept') || 'N/A';
            const year = localStorage.getItem('custYear') || 'N/A';
            infoDiv.innerHTML = `<strong>Ordering for:</strong> ${name} <br> <strong>Dept:</strong> ${dept} · <strong>Year:</strong> ${year}`;
        }

        const payBtn = document.getElementById('confirm-pay-btn');
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.textContent = 'Pay Now';
        }
        
        // Always default to UPI payment
        selectPaymentMethod('STORE_QR');
    }
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    upiPaymentConfirmed = false;
    const cashBtn = document.getElementById('method-cash');
    if (cashBtn) cashBtn.classList.toggle('active', method === 'CASH');
    if (storeQrBtn) storeQrBtn.classList.toggle('active', method === 'STORE_QR');

    const payBtn = document.getElementById('confirm-pay-btn');
    const openUpiBtn = document.getElementById('open-upi-app-btn');
    const screenshotSection = document.getElementById('screenshot-section');
    const fileInput = document.getElementById('payment-screenshot');
    const upiCheck = document.getElementById('upi-paid-check');

    if (method === 'STORE_QR') {
        if (storeQrDisplay) storeQrDisplay.style.display = 'none'; // Hide QR code box
        if (openUpiBtn) openUpiBtn.style.display = 'block';
        if (screenshotSection) screenshotSection.style.display = 'none';
        if (payBtn) {
            payBtn.style.display = 'none';
            payBtn.disabled = true;
            payBtn.style.opacity = '0.5';
            payBtn.textContent = 'Confirm Order';
        }
        if (fileInput) fileInput.value = '';
        if (upiCheck) upiCheck.checked = false;
        generatePaymentQR(); // Still generate UPI URL in background for Pay Now deep link
    } else {
        if (storeQrDisplay) storeQrDisplay.style.display = 'none';
        if (openUpiBtn) openUpiBtn.style.display = 'none';
        if (screenshotSection) screenshotSection.style.display = 'none';
        if (payBtn) {
            payBtn.style.display = 'block';
            payBtn.disabled = false;
            payBtn.style.opacity = '1';
            payBtn.textContent = 'Place Order (Cash)';
        }
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'none';
}

async function generatePaymentQR() {
    const qrContainer = document.getElementById('order-upi-qrcode');
    const detailsText = document.getElementById('upi-details-text');
    if (!qrContainer) return;

    try {
        // Fetch fresh settings if not yet loaded
        if (!upiSettings) {
            const response = await fetch(`${API_URL}/settings/upi`);
            if (response.ok) {
                upiSettings = await response.json();
            }
        }

        if (!upiSettings || !upiSettings.upiId) {
            qrContainer.innerHTML = '<p style="color:red; font-size:0.8rem;">UPI settings not configured.</p>';
            return;
        }

        qrContainer.innerHTML = '';
        const totalPrice = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
        
        // UPI URL format: upi://pay?pa=address@bank&pn=Name&am=Amount&cu=INR
        const upiUrl = `upi://pay?pa=${upiSettings.upiId}&pn=${encodeURIComponent(upiSettings.recipientName)}&am=${totalPrice.toFixed(2)}&cu=INR`;
        currentUpiUrl = upiUrl;
        
        new QRCode(qrContainer, {
            text: upiUrl,
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        if (detailsText) {
            detailsText.innerHTML = `
                <div style="font-size:0.9rem; color:#2d241c;">Pay to: <strong>${upiSettings.recipientName}</strong></div>
                <div style="font-size:0.8rem; color:#666;">UPI ID: ${upiSettings.upiId}</div>
            `;
        }
    } catch (error) {
        console.error('Error generating payment QR:', error);
        qrContainer.innerHTML = 'Error loading UPI details';
    }
}

function openUpiApp() {
    if (currentUpiUrl) {
        window.location.href = currentUpiUrl;
        
        // Change UI to ask for screenshot after returning
        document.getElementById('open-upi-app-btn').style.display = 'none';
        document.getElementById('screenshot-section').style.display = 'block';
        document.getElementById('confirm-pay-btn').style.display = 'block';
    } else {
        showToast('UPI URL not generated. Please try again.', 'error');
    }
}

// ─── Screenshot Security & EXIF Validation ───────────────────────────────────

/**
 * Reads raw EXIF bytes from a JPEG file and extracts DateTimeOriginal (tag 0x9003).
 * Returns a Date object or null if not found.
 */
async function extractExifDateTime(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const buf = new Uint8Array(e.target.result);
                // JPEG starts with FFD8
                if (buf[0] !== 0xFF || buf[1] !== 0xD8) { resolve(null); return; }

                let offset = 2;
                while (offset < buf.length - 2) {
                    if (buf[offset] !== 0xFF) break;
                    const marker = buf[offset + 1];
                    const segLen = (buf[offset + 2] << 8) | buf[offset + 3];

                    // APP1 marker = 0xE1, contains EXIF
                    if (marker === 0xE1) {
                        const exifHeader = String.fromCharCode(...buf.slice(offset + 4, offset + 10));
                        if (exifHeader.startsWith('Exif')) {
                            const tiffStart = offset + 10;
                            const isLE = buf[tiffStart] === 0x49; // 'II' = little-endian
                            const read16 = (o) => isLE ? (buf[tiffStart+o] | buf[tiffStart+o+1]<<8) : (buf[tiffStart+o]<<8 | buf[tiffStart+o+1]);
                            const read32 = (o) => isLE ? (buf[tiffStart+o] | buf[tiffStart+o+1]<<8 | buf[tiffStart+o+2]<<16 | buf[tiffStart+o+3]<<24) : (buf[tiffStart+o]<<24 | buf[tiffStart+o+1]<<16 | buf[tiffStart+o+2]<<8 | buf[tiffStart+o+3]);

                            const ifd0Offset = read32(4);
                            const ifd0Count = read16(ifd0Offset);

                            let exifIfdOffset = null;
                            for (let i = 0; i < ifd0Count; i++) {
                                const entryOffset = ifd0Offset + 2 + i * 12;
                                const tag = read16(entryOffset);
                                if (tag === 0x8769) { exifIfdOffset = read32(entryOffset + 8); break; }
                            }

                            if (exifIfdOffset !== null) {
                                const exifCount = read16(exifIfdOffset);
                                for (let i = 0; i < exifCount; i++) {
                                    const entryOffset = exifIfdOffset + 2 + i * 12;
                                    const tag = read16(entryOffset);
                                    // DateTimeOriginal = 0x9003, DateTimeDigitized = 0x9004
                                    if (tag === 0x9003 || tag === 0x9004) {
                                        const valOffset = read32(entryOffset + 8);
                                        const dtStr = String.fromCharCode(...buf.slice(tiffStart + valOffset, tiffStart + valOffset + 19));
                                        // Format: "YYYY:MM:DD HH:MM:SS"
                                        const parsed = dtStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                                        const date = new Date(parsed);
                                        if (!isNaN(date.getTime())) { resolve(date); return; }
                                    }
                                }
                            }
                        }
                    }
                    offset += 2 + segLen;
                }
                resolve(null);
            } catch (err) {
                console.warn('EXIF parse error:', err);
                resolve(null);
            }
        };
        reader.readAsArrayBuffer(file.slice(0, 65536)); // Read only first 64KB for EXIF
    });
}

/**
 * Computes a SHA-256 hex hash of a file's contents.
 */
async function computeFileHash(file) {
    const buf = await file.arrayBuffer();
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Tracks EXIF validation state
let screenshotValidationState = { valid: false, hash: null, exifTime: null, warningOnly: false };

/**
 * Validates the screenshot file:
 * 1. Checks EXIF DateTimeOriginal is within MAX_AGE_MINUTES of now
 * 2. Checks the file hasn't been used in a previous order (via localStorage hash cache)
 * Updates UI with result.
 */
async function checkScreenshot() {
    const fileInput = document.getElementById('payment-screenshot');
    const checkbox = document.getElementById('upi-paid-check');
    const confirmBtn = document.getElementById('confirm-pay-btn');
    const validationDiv = document.getElementById('screenshot-validation-msg');

    screenshotValidationState = { valid: false, hash: null, exifTime: null, warningOnly: false };
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';

    if (!fileInput || fileInput.files.length === 0) {
        if (validationDiv) validationDiv.innerHTML = '';
        return;
    }

    const file = fileInput.files[0];
    const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
    const now = new Date();

    // Show scanning state
    if (validationDiv) {
        validationDiv.innerHTML = `<div class="ss-checking">🔍 Verifying screenshot authenticity...</div>`;
    }

    // Compute hash to detect reuse
    let fileHash = null;
    try { fileHash = await computeFileHash(file); } catch(e) {}

    // Check if hash was already used
    const usedHashes = JSON.parse(localStorage.getItem('usedScreenshotHashes') || '[]');
    if (fileHash && usedHashes.includes(fileHash)) {
        if (validationDiv) {
            validationDiv.innerHTML = `<div class="ss-error">❌ <strong>Duplicate screenshot detected!</strong><br>This screenshot was already used for a previous order. Please take a new screenshot of your payment.</div>`;
        }
        screenshotValidationState.valid = false;
        return;
    }

    // Extract EXIF timestamp
    let exifDate = null;
    // Only attempt EXIF for JPEG images
    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
        exifDate = await extractExifDateTime(file);
    }

    const ageMs = exifDate ? (now - exifDate) : null;
    const ageMinutes = ageMs !== null ? Math.round(ageMs / 60000) : null;

    if (exifDate) {
        const timeStr = exifDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const dateStr = exifDate.toLocaleDateString();

        if (ageMs < 0) {
            // Screenshot timestamp is in the future — suspicious
            if (validationDiv) {
                validationDiv.innerHTML = `<div class="ss-error">❌ <strong>Invalid screenshot timestamp!</strong><br>Screenshot date/time is in the future (${dateStr} ${timeStr}). Please take a fresh screenshot.</div>`;
            }
            screenshotValidationState.valid = false;
            return;
        } else if (ageMs > MAX_AGE_MS) {
            // Screenshot is too old
            if (validationDiv) {
                validationDiv.innerHTML = `<div class="ss-error">❌ <strong>Screenshot too old!</strong><br>Taken at: <strong>${dateStr} ${timeStr}</strong> (${ageMinutes} min ago).<br>Please take a new screenshot within 10 minutes of payment.</div>`;
            }
            screenshotValidationState.valid = false;
            return;
        } else {
            // Valid time window
            if (validationDiv) {
                validationDiv.innerHTML = `<div class="ss-success">✅ <strong>Screenshot verified!</strong><br>📸 Taken at <strong>${timeStr}</strong> (${ageMinutes} min ago) — within valid window.</div>`;
            }
            screenshotValidationState.exifTime = exifDate.toISOString();
        }
    } else {
        // No EXIF data — could be PNG/screenshot from phone without EXIF, allow but warn
        if (validationDiv) {
            validationDiv.innerHTML = `<div class="ss-warning">⚠️ <strong>Could not verify timestamp from image.</strong><br>Make sure the screenshot is from your current payment. Non-JPEG or edited images may lack timestamp data.</div>`;
        }
        screenshotValidationState.warningOnly = true; // allow with warning
    }

    screenshotValidationState.hash = fileHash;
    screenshotValidationState.valid = true;

    // Enable confirm button only when both screenshot is valid AND checkbox is checked
    if (checkbox && checkbox.checked) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
    }
}

async function processPayment() {
    // If UPI selected, require confirmation checkbox, screenshot, and timestamp validation
    if (selectedPaymentMethod === 'STORE_QR') {
        const fileInput = document.getElementById('payment-screenshot');
        if (!fileInput || fileInput.files.length === 0) {
            showToast('Please attach the payment screenshot before confirming.', 'error');
            return;
        }

        // Enforce screenshot security validation
        if (!screenshotValidationState.valid) {
            showToast('❌ Screenshot validation failed. Please upload a valid, recent payment screenshot.', 'error');
            const section = document.getElementById('screenshot-section');
            if (section) {
                section.style.animation = 'none';
                section.offsetHeight;
                section.style.animation = 'shake 0.4s ease';
            }
            return;
        }

        const upiCheck = document.getElementById('upi-paid-check');
        if (upiCheck && !upiCheck.checked) {
            showToast('Please confirm you have completed the UPI payment', 'error');
            const row = document.getElementById('screenshot-section');
            if (row) {
                row.style.animation = 'none';
                row.offsetHeight;
                row.style.animation = 'shake 0.4s ease';
            }
            return;
        }
    }

    const tableNumber = tableNumberInput ? tableNumberInput.value : 'Walk-in';
    const payBtn = document.getElementById('confirm-pay-btn');

    payBtn.disabled = true;
    payBtn.textContent = 'Placing Your Order...';

    // Simulate order delay
    setTimeout(async () => {
        const orderRequest = {
            tableNumber: tableNumber,
            customerName: localStorage.getItem('custName') || 'Walk-in Guest',
            department: localStorage.getItem('custDept') || 'None',
            customerYear: localStorage.getItem('custYear') || 'None',
            paymentMethod: selectedPaymentMethod,
            screenshotHash: screenshotValidationState.hash || null,
            screenshotTimestamp: screenshotValidationState.exifTime || null,
            items: cart.map(item => ({
                menuItemId: item.menuItem.id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderRequest)
            });

            if (response.ok) {
                const result = await response.json();
                
                // For UPI: auto-confirm payment since customer checked the box
                // For Cash: admin must confirm payment in dashboard
                if (selectedPaymentMethod === 'STORE_QR') {
                    // Mark this screenshot hash as used to prevent reuse
                    if (screenshotValidationState.hash) {
                        const usedHashes = JSON.parse(localStorage.getItem('usedScreenshotHashes') || '[]');
                        usedHashes.push(screenshotValidationState.hash);
                        // Keep only recent 50 hashes
                        if (usedHashes.length > 50) usedHashes.shift();
                        localStorage.setItem('usedScreenshotHashes', JSON.stringify(usedHashes));
                    }
                    await fetch(`${API_URL}/orders/${result.id}/confirm-payment`, { method: 'POST' });
                    showToast('UPI Payment Confirmed! Order sent to kitchen 🎉');
                } else {
                    showToast('Order placed! Please pay at counter 💵');
                }
                
                // Get identifying term for tracking
                window.trackingTerm = tableNumber !== 'Walk-in' ? tableNumber : (localStorage.getItem('custName') || '');
                
                closePaymentModal();
                
                // Show Success Modal instead of auto-redirecting
                const successModal = document.getElementById('order-success-modal');
                if (successModal) {
                    const totalPrice = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
                    const successTotal = document.getElementById('success-total-price');
                    if (successTotal) successTotal.textContent = formatCurrency(totalPrice);
                    
                    const successPaymentMsg = document.getElementById('success-payment-msg');
                    if (successPaymentMsg) {
                        if (selectedPaymentMethod === 'STORE_QR') {
                            successPaymentMsg.textContent = '✅ UPI Payment confirmed! Kitchen notified.';
                            successPaymentMsg.style.color = '#27ae60';
                        } else {
                            successPaymentMsg.textContent = '💵 Please pay at counter to confirm order.';
                            successPaymentMsg.style.color = '#e67e22';
                        }
                    }
                    
                    successModal.style.display = 'flex';
                }
                
                // Clear cart after calculating total
                cart = [];
                updateCartUI();

            } else {
                // Parse backend security rejection
                let errMsg = 'Failed to place order. Please try again.';
                try {
                    const errBody = await response.json();
                    if (errBody && errBody.error) {
                        const validationDiv = document.getElementById('screenshot-validation-msg');
                        if (errBody.error === 'DUPLICATE_SCREENSHOT') {
                            errMsg = '❌ Duplicate screenshot rejected by server.';
                            if (validationDiv) {
                                validationDiv.innerHTML = `<div class="ss-error">❌ <strong>Server rejected this screenshot!</strong><br>${errBody.message}<br><em>Please take a completely new screenshot of your payment.</em></div>`;
                            }
                            // Force reset the file input
                            const fileInput = document.getElementById('payment-screenshot');
                            if (fileInput) fileInput.value = '';
                            screenshotValidationState = { valid: false, hash: null, exifTime: null, warningOnly: false };
                        } else if (errBody.error === 'SCREENSHOT_TOO_OLD') {
                            errMsg = '❌ Screenshot timestamp rejected by server.';
                            if (validationDiv) {
                                validationDiv.innerHTML = `<div class="ss-error">❌ <strong>Server rejected screenshot timing!</strong><br>${errBody.message}</div>`;
                            }
                            screenshotValidationState = { valid: false, hash: null, exifTime: null, warningOnly: false };
                        } else {
                            errMsg = errBody.message || errMsg;
                        }
                    }
                } catch(e) { /* not JSON */ }
                showToast(errMsg, 'error');
                payBtn.disabled = false;
                payBtn.style.opacity = '0.5';
                payBtn.textContent = selectedPaymentMethod === 'STORE_QR' ? 'Confirm Order' : 'Place Order (Cash)';
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Please check your connection.', 'error');
            payBtn.disabled = false;
            payBtn.textContent = selectedPaymentMethod === 'STORE_QR' ? 'Confirm Order' : 'Place Order (Cash)';
        }
    }, 1500);
}

function proceedToTracking() {
    const successModal = document.getElementById('order-success-modal');
    if (successModal) successModal.style.display = 'none';
    
    if (window.trackingTerm) {
        window.location.href = `table.html?search=${encodeURIComponent(window.trackingTerm)}`;
    } else {
        window.location.href = 'table.html';
    }
}

// Table Tracking Logic
async function loadTableOrders() {
    const searchTable = document.getElementById('searchTable');
    const tableOrdersList = document.getElementById('table-orders-list');

    if (!searchTable || !tableOrdersList) return;

    const searchTerm = searchTable.value.trim().toLowerCase();

    try {
        const response = await fetch(`${API_URL}/orders`);
        const allOrders = await response.json();

        let filteredOrders = allOrders;
        if (searchTerm) {
            filteredOrders = allOrders.filter(o => 
                (o.tableNumber && o.tableNumber.toLowerCase().includes(searchTerm)) ||
                (o.customerName && o.customerName.toLowerCase().includes(searchTerm)) ||
                (o.department && o.department.toLowerCase().includes(searchTerm)) ||
                (o.customerYear && o.customerYear.toLowerCase().includes(searchTerm))
            );
        }

        tableOrdersList.innerHTML = '';
        renderOrderHistory(filteredOrders, tableOrdersList);

    } catch (error) {
        console.error('Error fetching table orders:', error);
    }
}

async function loadAllUserOrders() {
    const tableOrdersList = document.getElementById('table-orders-list');
    if (!tableOrdersList) return;

    try {
        const response = await fetch(`${API_URL}/orders`);
        const orders = await response.json();
        
        tableOrdersList.innerHTML = '';
        renderOrderHistory(orders, tableOrdersList);
    } catch (e) {
        console.error(e);
    }
}

// Helper to keep logic DRY
function renderOrderHistory(orders, container) {
    if (orders.length === 0) {
        container.innerHTML = `<p class="empty-state">No orders found.</p>`;
        return;
    }
    
    orders.reverse().forEach(order => {
        const date = new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const itemsHtml = order.items.map(item =>
            `<li class="order-history-item">
                <span>${item.quantity}x ${item.menuItem.name}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
            </li>`
        ).join('');

        const card = document.createElement('div');
        card.className = `order-history-card status-${order.status}`;
        card.innerHTML = `
            <div class="order-history-header">
                <div>
                    <div style="font-size:1.1rem; font-weight:700; color:var(--primary-color);">👤 ${order.customerName || 'Guest'} (Order #${order.id})</div>
                    <div style="font-size:0.85rem; color:#d18d4f; font-weight:600; margin: 4px 0;">🏢 Dept: ${order.department || 'N/A'} · 🎓 Yr/Des: ${order.customerYear || 'N/A'}</div>
                    <div style="font-size:0.85rem; font-weight:600; color: #8B4513; margin-bottom: 5px;">
                        ${order.paymentMethod === 'STORE_QR' ? '💳 UPI Payment' : '💵 Cash Payment'}
                    </div>
                    <span style="font-size:0.8rem; color:#888;">⏰ ${date} · 🏷️ Table ${order.tableNumber}</span>
                </div>
                <span class="status-badge ${order.status}">${order.status === 'REFUNDED' ? 'REFUNDED (Item Unavailable)' : order.status}</span>
            </div>
            <ul class="order-history-items">
                ${itemsHtml}
            </ul>
            <div style="margin-top:1rem; text-align:right; font-weight:bold; border-top:1px solid #eee; padding-top:0.5rem;">
                Total: ${formatCurrency(order.totalPrice)}
            </div>
        `;
        container.appendChild(card);
    });
}

// Admin Logic
async function loadAllOrders() {
    const kanban = document.getElementById('orders-kanban');
    if (!kanban) return;

    try {
        const response = await fetch(`${API_URL}/orders`);
        const orders = await response.json();

        // Clear columns
        document.getElementById('col-PENDING').innerHTML = '';
        document.getElementById('col-PREPARING').innerHTML = '';
        document.getElementById('col-READY').innerHTML = '';

        orders.forEach(order => {
            if (order.status === 'COMPLETED') return; // Don't show completed in active kanban

            const col = document.getElementById(`col-${order.status}`);
            if (!col) return;

            const time = new Date(order.orderTime).toLocaleTimeString();
            let actionBtn = '';

            if (order.status === 'PENDING') {
                actionBtn = `<button class="btn-action prepare" onclick="updateOrderStatus(${order.id}, 'PREPARING')">Prepare</button>`;
            } else if (order.status === 'PREPARING') {
                actionBtn = `<button class="btn-action ready" onclick="updateOrderStatus(${order.id}, 'READY')">Ready</button>`;
            } else if (order.status === 'READY') {
                actionBtn = `<button class="btn-action complete" onclick="updateOrderStatus(${order.id}, 'COMPLETED')">Complete</button>`;
            }

            const itemsText = order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join('<br>');

            const card = document.createElement('div');
            card.className = 'admin-order-card';
            card.innerHTML = `
                <div class="admin-order-header">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; color:var(--primary-color);">#${order.id} - ${order.customerName}</span>
                        <small style="color:#666;">${order.department} - ${order.customerYear}</small>
                    </div>
                    <span class="admin-badge" style="background:var(--primary-color); color:white; font-size:0.75rem;">${order.tableNumber}</span>
                </div>
                <div class="admin-order-time" style="border-bottom: 1px dashed #eee; padding:5px 0;">⏰ ${time}</div>
                <div class="admin-order-items">${itemsText}</div>
                <div class="admin-actions">
                    ${actionBtn}
                </div>
            `;
            col.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching all orders:', error);
        showToast('Failed to fetch orders', 'error');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast(`Order #${orderId} marked as ${newStatus}`);
            loadAllOrders(); // Refresh board
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Failed to update status', 'error');
    }
}

// Admin Menu Management
async function loadAdminMenu() {
    const list = document.getElementById('admin-menu-list');
    if (!list) return;

    try {
        const response = await fetch(`${API_URL}/menu`);
        const items = await response.json();

        list.innerHTML = '';

        if (items.length === 0) {
            list.innerHTML = `<p style="color:#aaa; font-style:italic; padding:1rem;">No menu items yet. Add one!</p>`;
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'admin-order-card';
            card.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:0.5rem;';
            card.innerHTML = `
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <strong style="font-size:1rem; color:#2d241c;">${item.name}</strong>
                        <span style="background:#f5f0ea; color:#8B4513; border-radius:20px; padding:2px 10px; font-size:0.75rem; font-weight:700;">${item.category}</span>
                        ${!item.available ? '<span style="background:#fadbd8; color:#e56b55; border-radius:20px; padding:2px 10px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Out of Stock</span>' : ''}
                    </div>
                    <div style="font-size:0.9rem; color:#555; margin-top:3px;">${item.description || ''}</div>
                    <div style="font-size:1.05rem; font-weight:700; color:var(--primary-color,#d18d4f); margin-top:4px;">₹${parseFloat(item.price).toFixed(2)}</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; flex-shrink:0;">
                    <button
                        style="background:${item.available ? '#27ae60' : '#e67e22'}; color:#fff; border:none; padding:0.35rem 0.8rem; border-radius:6px; cursor:pointer;"
                        onclick="toggleItemAvailability(${item.id}, ${item.available}, '${item.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')"
                    >${item.available ? 'Mark Unavailable' : 'Mark Available'}</button>
                    <button
                        style="background:#3498db; color:#fff; border:none; padding:0.35rem 0.8rem; border-radius:6px; cursor:pointer; font-size:0.82rem; font-weight:600; font-family:inherit;"
                        onclick="editMenuItem(${item.id}, '${item.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${item.price}, '${item.category}', '${(item.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${item.available})"
                    >✏️ Edit</button>
                    <button
                        style="background:#e56b55; color:#fff; border:none; padding:0.35rem 0.8rem; border-radius:6px; cursor:pointer; font-size:0.82rem; font-weight:600; font-family:inherit;"
                        onclick="deleteMenuItem(${item.id})"
                    >🗑️ Delete</button>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load menu items:', error);
        showToast('Failed to load menu', 'error');
    }
}

/**
 * Unified submit handler for Add and Edit.
 * The hidden #itemId field distinguishes the two modes.
 */
async function handleMenuSubmit(event) {
    if (event) event.preventDefault();

    const id       = document.getElementById('itemId').value;
    const name     = document.getElementById('itemName').value.trim();
    const price     = document.getElementById('itemPrice').value;
    const category  = document.getElementById('itemCategory').value;
    const desc      = document.getElementById('itemDesc').value.trim();
    const available = document.getElementById('itemAvailable').checked;

    if (!name || !price || !category || !desc) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    const payload = { name, price: parseFloat(price), category, description: desc, available: available };

    try {
        let response;
        if (id) {
            // UPDATE existing item
            response = await fetch(`${API_URL}/menu/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showToast(`"${name}" updated successfully! ✅`);
            } else {
                showToast('Failed to update item', 'error');
                return;
            }
        } else {
            // CREATE new item
            response = await fetch(`${API_URL}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showToast(`"${name}" added to menu! 🎉`);
            } else {
                showToast('Failed to add item', 'error');
                return;
            }
        }

        resetMenuForm();
        loadAdminMenu();
    } catch (e) {
        console.error('Menu submit error:', e);
        showToast('Network error', 'error');
    }
}

/**
 * Populate the form with an existing item's data for editing.
 */
function editMenuItem(id, name, price, category, description, available) {
    document.getElementById('itemId').value       = id;
    document.getElementById('itemName').value     = name;
    document.getElementById('itemPrice').value    = price;
    document.getElementById('itemCategory').value = category;
    document.getElementById('itemDesc').value     = description;
    document.getElementById('itemAvailable').checked = available;

    // Switch form to edit mode
    document.getElementById('form-title').textContent    = '✏️ Edit Item';
    document.getElementById('submit-btn').textContent    = 'Save Changes';
    document.getElementById('submit-btn').style.background = '#3498db';
    document.getElementById('cancel-edit-btn').style.display = 'block';

    // Scroll form into view
    const panel = document.getElementById('add-item-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Reset the form back to "Add New Item" mode.
 */
function resetMenuForm() {
    document.getElementById('add-menu-form').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemAvailable').checked = true;

    document.getElementById('form-title').textContent       = 'Add New Item';
    document.getElementById('submit-btn').textContent       = 'Add Item';
    document.getElementById('submit-btn').style.background  = '';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

async function deleteMenuItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
        const response = await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Item deleted', 'error');
            // If we were editing this item, reset the form
            if (document.getElementById('itemId').value == id) resetMenuForm();
            loadAdminMenu();
        } else {
            showToast('Failed to delete item', 'error');
        }
    } catch (e) {
        console.error('Delete error:', e);
        showToast('Network error', 'error');
    }
}

async function toggleItemAvailability(id, currentStatus, name) {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const items = await response.json();
        const item = items.find(i => i.id === id);
        if (!item) return;

        item.available = !currentStatus;

        const updateResponse = await fetch(`${API_URL}/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });

        if (updateResponse.ok) {
            showToast(`"${name}" is now ${item.available ? 'Available' : 'Unavailable'}`);
            loadAdminMenu();
        }
    } catch (e) {
        console.error('Toggle error:', e);
    }
}
