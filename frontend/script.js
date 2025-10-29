// Configuration
const API_BASE_URL = 'http://localhost:8000'; // Change this to your backend URL

// State
let products = [];
let stats = {
    totalProducts: 0,
    activeLicenses: 0,
    expiredLicenses: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupForms();
    loadProducts();
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