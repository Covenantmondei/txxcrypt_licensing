const API_BASE_URL = 'https://txxcrypt-license.onrender.com';

// State
let products = [];
let licensesList = [];
let stats = {
    totalProducts: 0,
    activeLicenses: 0,
    expiredLicenses: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupForms();
    loadDashboardStats();
    loadProducts();
    loadLicenses();
    updateDashboard();
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function navigateTo(page) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');
}

// Forms Setup
function setupForms() {
    document.getElementById('create-product-form').addEventListener('submit', handleCreateProduct);
    document.getElementById('create-license-form').addEventListener('submit', handleCreateLicense);
    document.getElementById('verify-license-form').addEventListener('submit', handleVerifyLicense);
    document.getElementById('revoke-license-form').addEventListener('submit', handleRevokeLicense);
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/`);
        if (response.ok) {
            const data = await response.json();
            stats.totalProducts = data.total_products;
            stats.activeLicenses = data.active_licenses;
            stats.expiredLicenses = data.expired_licenses;
            updateDashboard();
            renderRecentProducts(data.recent_products);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}


// Render recent products on dashboard
function renderRecentProducts(products) {
    const container = document.getElementById('recent-products-list');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="response-item">No products yet.</div>';
        return;
    }
    
    let html = '<div class="products-grid">';
    products.forEach(product => {
        html += `
            <div class="product-card">
                <div class="product-header">
                    <h3>${escapeHtml(product.name)}</h3>
                    ${product.version ? `<span class="product-version">v${escapeHtml(product.version)}</span>` : ''}
                </div>
                ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}
                <div class="product-footer">
                    <span class="product-date">Created: ${new Date(product.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Load Products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/`);
        if (response.ok) {
            products = await response.json();
            updateProductDropdown();
            stats.totalProducts = products.length;
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load Licenses
async function loadLicenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/licenses/`);
        if (response.ok) {
            licensesList = await response.json();
            renderLicenses(licensesList);
            stats.activeLicenses = licensesList.filter(l => l.is_active).length;
            stats.expiredLicenses = licensesList.filter(l => {
                if (!l.expires_at) return false;
                return new Date(l.expires_at) < new Date();
            }).length;
            updateDashboard();
        } else {
            console.error('Failed to load licenses', await response.text());
        }
    } catch (error) {
        console.error('Error loading licenses:', error);
    }
}

// Render Licenses into a table
function renderLicenses(licenses) {
    const container = document.getElementById('licenses-list');
    if (!container) return;
    if (licenses.length === 0) {
        container.innerHTML = '<div class="response-item">No licenses found.</div>';
        return;
    }

    let html = '<table class="licenses-table"><thead><tr>' +
        '<th>License Key</th><th>Product</th><th>Account</th><th>Active</th><th>Expires At</th><th>Actions</th>' +
        '</tr></thead><tbody>';

    for (const l of licenses) {
        const productName = l.product && (l.product.name || l.product) ? (l.product.name || l.product) : '-';
        const expiresAt = l.expires_at ? new Date(l.expires_at).toLocaleString() : '-';
        html += `<tr class="license-row">
            <td class="license-key">${escapeHtml(l.license_key)}</td>
            <td>${escapeHtml(productName)}</td>
            <td>${escapeHtml(l.account_id || '')}</td>
            <td>${l.is_active ? 'Yes' : 'No'}</td>
            <td>${escapeHtml(expiresAt)}</td>
            <td class="licenses-actions">
                <button class="btn btn-small btn-copy" onclick="copyToClipboard('${escapeJs(l.license_key)}')">Copy</button>
                <button class="btn btn-small btn-secondary" onclick="viewLicenseDetails('${escapeJs(l.license_key)}')">View</button>
                <button class="btn btn-small btn-danger" onclick="revokeLicenseConfirm('${escapeJs(l.license_key)}')">Revoke</button>
            </td>
        </tr>`;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    // wire up client-side search if search input exists
    const search = document.getElementById('license-search');
    if (search) {
        search.removeEventListener('input', handleLicenseSearch);
        search.addEventListener('input', handleLicenseSearch);
    }
}

// Search handler
function handleLicenseSearch(e) {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
        renderLicenses(licensesList);
        return;
    }
    const filtered = licensesList.filter(l => {
        const productName = (l.product && (l.product.name || l.product)) || '';
        return (l.license_key || '').toLowerCase().includes(q) ||
               (l.account_id || '').toLowerCase().includes(q) ||
               (productName || '').toLowerCase().includes(q);
    });
    renderLicenses(filtered);
}


// Confirm and revoke
function revokeLicenseConfirm(license_key) {
    if (!confirm('Revoke license ' + license_key + '? This cannot be undone.')) return;
    revokeLicense(license_key);
}

async function revokeLicense(license_key) {
    try {
        const response = await fetch(`${API_BASE_URL}/license/revoke/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key })
        });
        const data = await response.json();
        if (response.ok) {
            showToast('License revoked', 'success');
            loadLicenses();
        } else {
            showResponse('licenses-response', 'error', 'Error Revoking License', data);
            showToast(data.detail || 'Failed to revoke license', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// View license details
async function viewLicenseDetails(license_key) {
    try {
        const response = await fetch(`${API_BASE_URL}/license/${encodeURIComponent(license_key)}/`);
        const data = await response.json();
        if (response.ok) {
            showResponse('licenses-response', 'success', 'License Details', data);
        } else {
            showResponse('licenses-response', 'error', 'Error fetching details', data);
            showToast(data.detail || 'Failed to get license details', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Utility small helpers to avoid XSS in generated HTML
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escapeJs(str) {
    return String(str).replace(/'/g, "\\'");
}

function updateProductDropdown() {
    const select = document.getElementById('license-product');
    select.innerHTML = '<option value="">-- Select a product --</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

// Create Product Handler
async function handleCreateProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/product/create/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResponse('product-response', 'success', 'Product Created Successfully!', data);
            document.getElementById('create-product-form').reset();
            loadProducts();
            loadDashboardStats(); 
            showToast('Product created successfully!', 'success');
        } else {
            showResponse('product-response', 'error', 'Error Creating Product', data);
            showToast(data.detail || 'Failed to create product', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Create License Handler
async function handleCreateLicense(e) {
    e.preventDefault();
    
    const product = document.getElementById('license-product').value;
    const account_id = document.getElementById('license-account-id').value;
    const expiry_date = document.getElementById('license-expiry').value;
    
    if (!product) {
        showToast('Please select a product', 'error');
        return;
    }
    
    try {
        const payload = {
            product: parseInt(product),
            account_id
        };
        
        if (expiry_date) {
            payload.expiry_date = new Date(expiry_date).toISOString();
        }
        
        const response = await fetch(`${API_BASE_URL}/license/create/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResponse('license-response', 'success', 'License Generated Successfully!', data);
            document.getElementById('create-license-form').reset();
            showToast('License created successfully!', 'success');
        } else {
            showResponse('license-response', 'error', 'Error Creating License', data);
            showToast(data.detail || 'Failed to create license', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Verify License Handler
async function handleVerifyLicense(e) {
    e.preventDefault();
    
    const license_key = document.getElementById('verify-license-key').value;
    const account_id = document.getElementById('verify-account-id').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/license/verify/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key, account_id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResponse('verify-response', 'success', 'License is Valid!', data);
            showToast('License verified successfully!', 'success');
        } else {
            showResponse('verify-response', 'error', 'License Verification Failed', data);
            showToast(data.detail || 'License verification failed', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Revoke License Handler
async function handleRevokeLicense(e) {
    e.preventDefault();
    
    const license_key = document.getElementById('revoke-license-key').value;
    
    if (!confirm('Are you sure you want to revoke this license? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/license/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResponse('revoke-response', 'success', 'License Revoked Successfully!', data);
            document.getElementById('revoke-license-form').reset();
            showToast('License revoked successfully!', 'success');
        } else {
            showResponse('revoke-response', 'error', 'Error Revoking License', data);
            showToast(data.detail || 'Failed to revoke license', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Show Response
function showResponse(containerId, type, title, data) {
    const container = document.getElementById(containerId);
    container.classList.remove('hidden', 'success', 'error');
    container.classList.add(type);
    
    let html = `<div class="response-header ${type}">`;
    html += type === 'success' ? '✓ ' : '✕ ';
    html += `${title}</div><div class="response-content">`;
    
    // Display all response fields
    for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
            html += `<div class="response-item">
                <span class="response-item-label">${formatLabel(key)}:</span>
                <span class="response-item-value">${formatValue(value)}</span>
            </div>`;
        }
    }
    
    // Add copy button for license keys
    if (data.license_key) {
        html += `<div class="response-actions">
            <button class="btn btn-copy btn-small" onclick="copyToClipboard('${data.license_key}')">
                📋 Copy License Key
            </button>
        </div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Utility Functions
function formatLabel(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(value) {
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateDashboard() {
    document.getElementById('total-products').textContent = stats.totalProducts;
    document.getElementById('active-licenses').textContent = stats.activeLicenses;
    document.getElementById('expired-licenses').textContent = stats.expiredLicenses;
}