const API_URL = '/api';

// State
let menuItems = [];
let cart = [];
let selectedPaymentMethod = 'CASH';
let customerUPIQR = null;

// DOM Elements - Store
const menuGrid = document.getElementById('menu-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total-price');
const placeOrderBtn = document.getElementById('place-order-btn');
const categoryFilters = document.getElementById('category-filters');

const tableNumberInput = document.getElementById('tableNumber');

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
    const comboItems = menuItems.filter(i => i.category.toLowerCase() === 'combo');
    const regularItems = items.filter(i => i.category.toLowerCase() !== 'combo');

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
            payBtn.textContent = 'Place Order & Pay';
        }
        
        // Reset and generate QR if needed
        selectPaymentMethod('CASH');
    }
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    const cashBtn = document.getElementById('method-cash');
    if (cashBtn) cashBtn.classList.toggle('active', method === 'CASH');
    if (storeQrBtn) storeQrBtn.classList.toggle('active', method === 'STORE_QR');
    
    if (method === 'STORE_QR') {
        if (storeQrDisplay) storeQrDisplay.style.display = 'block';
    } else {
        if (storeQrDisplay) storeQrDisplay.style.display = 'none';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'none';
}

async function processPayment() {
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
                
                showToast('Order Placed Successfully! 🎉');
                // Get identifying term for tracking
                window.trackingTerm = tableNumber !== 'Walk-in' ? tableNumber : (localStorage.getItem('custName') || '');
                
                closePaymentModal();
                
                // Show Success Modal instead of auto-redirecting
                const successModal = document.getElementById('order-success-modal');
                if (successModal) {
                    // Calculate total from cart before clearing it
                    const totalPrice = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
                    const successTotal = document.getElementById('success-total-price');
                    if (successTotal) successTotal.textContent = formatCurrency(totalPrice);
                    
                    successModal.style.display = 'flex';
                }
                
                // Clear cart after calculating total
                cart = [];
                updateCartUI();
            } else {
                showToast('Failed to place order', 'error');
                payBtn.disabled = false;
                payBtn.textContent = 'Place Order & Pay';
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error', 'error');
            payBtn.disabled = false;
            payBtn.textContent = 'Place Order & Pay';
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
                <span class="status-badge ${order.status}">${order.status}</span>
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
        items.forEach(item => {
            list.innerHTML += `
                <div class="admin-order-card" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${item.name}</strong> - ₹${item.price} <br>
                        <small>${item.category}</small>
                    </div>
                    <div>
                        <button class="btn-primary" style="background:#e56b55; padding:0.3rem 0.5rem;" onclick="deleteMenuItem(${item.id})">Delete</button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Failed to load menu Items');
    }
}

async function addMenuItem(event) {
    if (event) event.preventDefault();
    const item = {
        name: document.getElementById('itemName').value,
        price: document.getElementById('itemPrice').value,
        category: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDesc').value
    };
    try {
        await fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        showToast('Item Added');
        loadAdminMenu();
        document.getElementById('add-menu-form').reset();
    } catch (e) { }
}

async function deleteMenuItem(id) {
    if (!confirm("Are you sure?")) return;
    try {
        await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
        showToast('Item Deleted', 'error');
        loadAdminMenu();
    } catch (e) { }
}
