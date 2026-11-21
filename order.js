

// =========================================
// ORDERING SYSTEM
// =========================================

// Sample restaurant menu
const defaultMenu = [
    { id: 1, name: "Chicken Burger", category: "Burgers", price: 250, icon: "🍔" },
    { id: 2, name: "Beef Burger", category: "Burgers", price: 320, icon: "🍔" },
    { id: 3, name: "Cheese Burger", category: "Burgers", price: 350, icon: "🍔" },

    { id: 4, name: "Chicken Pizza", category: "Pizza", price: 650, icon: "🍕" },
    { id: 5, name: "Beef Pizza", category: "Pizza", price: 750, icon: "🍕" },
    { id: 6, name: "Cheese Pizza", category: "Pizza", price: 600, icon: "🍕" },

    { id: 7, name: "Fried Chicken", category: "Chicken", price: 180, icon: "🍗" },
    { id: 8, name: "Chicken Wings", category: "Chicken", price: 280, icon: "🍗" },

    { id: 9, name: "French Fries", category: "Snacks", price: 150, icon: "🍟" },
    { id: 10, name: "Sandwich", category: "Snacks", price: 200, icon: "🥪" },

    { id: 11, name: "Cold Coffee", category: "Drinks", price: 180, icon: "🥤" },
    { id: 12, name: "Fresh Juice", category: "Drinks", price: 120, icon: "🧃" }
];


// Add menu to existing saved data without removing old orders
if (!Array.isArray(dashboardData.menu)) {
    dashboardData.menu = defaultMenu;
    saveDashboardData();
}


// Current cart
let cart = [];

let selectedCategory = "All";


// =========================================
// MENU CATEGORY DISPLAY
// =========================================

function displayCategories() {

    const categoryList = document.getElementById("categoryList");

    const categories = [
        "All",
        ...new Set(dashboardData.menu.map(item => item.category))
    ];

    categoryList.innerHTML = categories.map(category => {

        return `
            <button class="category-btn ${
                selectedCategory === category ? "active" : ""
            }" data-category="${escapeHTML(category)}">
                ${escapeHTML(category)}
            </button>
        `;

    }).join("");

}


// =========================================
// FOOD PRODUCT DISPLAY
// =========================================

function displayProducts() {

    const productGrid = document.getElementById("productGrid");

    const searchValue = document
        .getElementById("menuSearch")
        .value.trim().toLowerCase();

    const filteredProducts = dashboardData.menu.filter(item => {

        const matchesCategory =
            selectedCategory === "All" ||
            item.category === selectedCategory;

        const matchesSearch =
            item.name.toLowerCase().includes(searchValue);

        return matchesCategory && matchesSearch;

    });

    if (!filteredProducts.length) {

        productGrid.innerHTML = `
            <div class="no-products">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>No food items found.</p>
            </div>
        `;

        return;
    }

    productGrid.innerHTML = filteredProducts.map(item => {

        return `
            <div class="product-card">

                <div class="product-image">
                    ${escapeHTML(item.icon)}
                </div>

                <div class="product-details">

                    <h4>${escapeHTML(item.name)}</h4>

                    <p>${formatCurrency(item.price)}</p>

                    <button class="add-product-btn"
                        data-add-product="${item.id}">
                        <i class="fa-solid fa-plus"></i>
                        Add to Order
                    </button>

                </div>

            </div>
        `;

    }).join("");

}


// =========================================
// ADD PRODUCT TO CART
// =========================================

function addToCart(productId) {

    const product = dashboardData.menu.find(item =>
        Number(item.id) === Number(productId)
    );

    if (!product) return;

    const existingItem = cart.find(item =>
        Number(item.id) === Number(productId)
    );

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1
        });

    }

    displayCart();

}


// =========================================
// CART DISPLAY
// =========================================

function displayCart() {

    const cartItems = document.getElementById("cartItems");

    const itemCount = cart.reduce(
        (sum, item) => sum + item.quantity, 0
    );

    document.getElementById("cartItemCount").textContent =
        `${itemCount} items`;

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Your cart is empty</p>
                <small>Select food items to get started.</small>
            </div>
        `;

        updateCartTotals();

        return;
    }

    cartItems.innerHTML = cart.map(item => {

        return `
            <div class="cart-item">

                <div class="cart-item-info">
                    <strong>${escapeHTML(item.name)}</strong>
                    <small>${formatCurrency(item.price)} each</small>
                </div>

                <div class="quantity-controls">

                    <button data-cart-action="decrease"
                        data-cart-id="${item.id}">−</button>

                    <span>${item.quantity}</span>

                    <button data-cart-action="increase"
                        data-cart-id="${item.id}">+</button>

                </div>

            </div>
        `;

    }).join("");

    updateCartTotals();

}


// =========================================
// CHANGE CART QUANTITY
// =========================================

function changeCartQuantity(productId, action) {

    const item = cart.find(item =>
        Number(item.id) === Number(productId)
    );

    if (!item) return;

    if (action === "increase") {

        item.quantity++;

    } else if (action === "decrease") {

        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(cartItem =>
                Number(cartItem.id) !== Number(productId)
            );
        }

    }

    displayCart();

}


// =========================================
// CALCULATE SUBTOTAL AND TOTAL
// =========================================

function calculateCartSubtotal() {

    return cart.reduce((sum, item) => {

        return sum + (item.price * item.quantity);

    }, 0);

}


function updateCartTotals() {

    const subtotal = calculateCartSubtotal();

    const discountInput = document.getElementById("discountInput");

    let discount = Math.max(0, Number(discountInput.value) || 0);

    // Discount cannot exceed the subtotal
    discount = Math.min(discount, subtotal);

    document.getElementById("cartSubtotal").textContent =
        formatCurrency(subtotal);

    document.getElementById("cartTotal").textContent =
        formatCurrency(subtotal - discount);

}


// =========================================
// ORDER TYPE AND TABLE
// =========================================

const orderTypeSelect = document.getElementById("orderType");

const tableGroup = document.getElementById("tableGroup");

function updateOrderType() {

    if (orderTypeSelect.value === "Dine-in") {

        tableGroup.style.display = "block";

    } else {

        tableGroup.style.display = "none";

        document.getElementById("tableNumber").value = "";

    }

}

orderTypeSelect.addEventListener("change", updateOrderType);


// =========================================
// CLEAR CART
// =========================================

document.getElementById("clearCartBtn").addEventListener("click", () => {

    if (cart.length === 0) return;

    if (!confirm("Are you sure you want to clear the cart?")) {
        return;
    }

    cart = [];

    document.getElementById("discountInput").value = 0;

    displayCart();

});


// =========================================
// SUBMIT ORDER
// =========================================

document.getElementById("submitOrderBtn").addEventListener("click", () => {

    if (cart.length === 0) {

        alert("Please add at least one food item.");

        return;
    }

    const orderType = orderTypeSelect.value;

    const tableNumber = document.getElementById("tableNumber").value;

    const customerInput = document.getElementById("customerName");

    const customerName =
        customerInput.value.trim() || "Walk-in Customer";

    if (orderType === "Dine-in" && !tableNumber) {

        alert("Please select a table for dine-in.");

        document.getElementById("tableNumber").focus();

        return;
    }

    const subtotal = calculateCartSubtotal();

    let discount = Math.max(
        0,
        Number(document.getElementById("discountInput").value) || 0
    );

    if (!Number.isFinite(discount)) {
        discount = 0;
    }

    discount = Math.min(discount, subtotal);

    const total = subtotal - discount;

    // Create unique order ID
    const orderId = "ORD-" + Date.now().toString().slice(-8);

    // Save a separate copy of the cart items
    const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.price * item.quantity
    }));

    const newOrder = {

        id: orderId,

        customer: customerName,

        type: orderType,

        table: tableNumber || "N/A",

        items: orderItems,

        subtotal: subtotal,

        discount: discount,

        amount: total,

        status: "Pending",

        createdAt: new Date().toISOString()

    };

    // Add the new order to the beginning of the order history
    dashboardData.orders.unshift(newOrder);

    // Save data
    saveDashboardData();

    // Refresh dashboard information
    updateStatistics();

    displayRecentOrders();

    // Reset cart and form
    cart = [];

    customerInput.value = "";

    document.getElementById("tableNumber").value = "";

    document.getElementById("discountInput").value = 0;

    updateOrderType();

    displayCart();

    // Confirmation
    alert(
        "Order submitted successfully!\n\n" +
        "Order ID: " + orderId + "\n" +
        "Customer: " + customerName + "\n" +
        "Total: " + formatCurrency(total)
    );

});


// =========================================
// EVENT LISTENERS
// =========================================

// Category selection
document.getElementById("categoryList").addEventListener("click", event => {

    const button = event.target.closest("[data-category]");

    if (!button) return;

    selectedCategory = button.dataset.category;

    displayCategories();

    displayProducts();

});


// Product selection
document.getElementById("productGrid").addEventListener("click", event => {

    const button = event.target.closest("[data-add-product]");

    if (!button) return;

    addToCart(button.dataset.addProduct);

});


// Cart quantity controls
document.getElementById("cartItems").addEventListener("click", event => {

    const button = event.target.closest("[data-cart-action]");

    if (!button) return;

    changeCartQuantity(
        button.dataset.cartId,
        button.dataset.cartAction
    );

});


// Search food items
document.getElementById("menuSearch").addEventListener("input", () => {

    displayProducts();

});


// Discount calculation
document.getElementById("discountInput").addEventListener("input", () => {

    updateCartTotals();

});


// =========================================
// INITIALIZE ORDERING SYSTEM
// =========================================

function initializeOrderingSystem() {

    displayCategories();

    displayProducts();

    displayCart();

    updateOrderType();

}

initializeOrderingSystem();
