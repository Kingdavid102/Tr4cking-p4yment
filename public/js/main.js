// Load products for dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('productsGrid');
    
    try {
        const response = await fetch('/products');
        const products = await response.json();
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<p class="no-products">No products available at the moment.</p>';
            return;
        }
        
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image || '/placeholder-product.jpg'}" alt="${product.productName}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.productName}</h3>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <span class="product-stock ${product.quantity > 0 ? 'in-stock' : 'sold-out'}">
                        ${product.quantity > 0 ? `${product.quantity} in stock` : 'Sold Out'}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load products:', error);
        productsGrid.innerHTML = '<p class="error-message">Failed to load products. Please try again later.</p>';
    }
    
    // Tracking form submission
    const trackingForm = document.getElementById('trackingForm');
    if (trackingForm) {
        trackingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const trackingId = document.getElementById('trackingId').value.trim();
            window.location.href = `/track.html?id=${encodeURIComponent(trackingId)}`;
        });
    }
});
