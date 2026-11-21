

/* =====================================
   PHASE 4: BILLING SYSTEM
===================================== */

let selectedBillingOrderId = null;

function getOrderSubtotal(order) {
    if (Array.isArray(order.items)) {
        return order.items.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
    }

    return Number(order.subtotal) || Number(order.amount) || 0;
}

function getBillingTotal(order) {
    const subtotal = getOrderSubtotal(order);
    const discount = Math.min(
        subtotal,
        Math.max(0, Number(order.billingDiscount) || 0)
    );

    return Math.max(0, subtotal - discount);
}

function getSelectedBillingOrder() {
    return dashboardData.orders.find(
        order => String(order.id) === String(selectedBillingOrderId)
    );
}

function saveRestaurantData() {
    localStorage.setItem(
        "restaurantPOS",
        JSON.stringify(dashboardData)
    );
}

function displayUnpaidOrders() {
    const container = document.getElementById("unpaidOrdersList");
    if (!container) return;

    const unpaidOrders = dashboardData.orders.filter(order => {
        return order.paymentStatus !== "Paid";
    });

    if (
        selectedBillingOrderId &&
        !unpaidOrders.some(order =>
            String(order.id) === String(selectedBillingOrderId)
        )
    ) {
        selectedBillingOrderId = null;
        document.getElementById("billingContent").style.display = "none";
        document.getElementById("billingEmptyMessage").style.display = "block";
    }

    if (unpaidOrders.length === 0) {
        container.innerHTML = `
            <div class="billing-no-orders">
                <p>No unpaid orders available.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = unpaidOrders.map(order => {
        const selected =
            String(order.id) === String(selectedBillingOrderId);

        return `
            <div class="billing-order-card ${selected ? "selected" : ""}"
                 data-billing-order-id="${escapeHTML(String(order.id))}">

                <strong>${escapeHTML(String(order.id))}</strong>

                <small>
                    Customer: ${escapeHTML(String(order.customer || "Walk-in"))}
                    <br>
                    Type: ${escapeHTML(String(order.type || "Not specified"))}
                    <br>
                    Amount: ${formatCurrency(getBillingTotal(order))}
                    <br>
                    Kitchen: ${escapeHTML(String(order.status || "Pending"))}
                </small>
            </div>
        `;
    }).join("");
}

function selectBillingOrder(orderId) {
    const order = dashboardData.orders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order || order.paymentStatus === "Paid") return;

    selectedBillingOrderId = orderId;

    document.getElementById("billingEmptyMessage").style.display = "none";
    document.getElementById("billingContent").style.display = "block";

    document.getElementById("billOrderId").textContent = order.id || "-";
    document.getElementById("billCustomer").textContent =
        order.customer || "Walk-in Customer";
    document.getElementById("billOrderType").textContent =
        order.type || "Not specified";

    const items = Array.isArray(order.items) ? order.items : [];

    document.getElementById("billingItems").innerHTML = items.map(item => {
        const name = item.name || item.title || item.productName || "Food item";
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const total = price * quantity;

        return `
            <tr>
                <td>${escapeHTML(String(name))}</td>
                <td>${quantity}</td>
                <td>${formatCurrency(price)}</td>
                <td>${formatCurrency(total)}</td>
            </tr>
        `;
    }).join("");

    document.getElementById("billDiscount").value =
        Number(order.billingDiscount) || 0;

    document.getElementById("amountReceived").value = "";

    updateBillingTotals();
    displayUnpaidOrders();
}

function updateBillingTotals() {
    const order = getSelectedBillingOrder();
    if (!order) return;

    const subtotal = getOrderSubtotal(order);

    let discount = Number(
        document.getElementById("billDiscount").value
    ) || 0;

    discount = Math.min(subtotal, Math.max(0, discount));

    const total = subtotal - discount;

    document.getElementById("billSubtotal").textContent =
        formatCurrency(subtotal);

    document.getElementById("billGrandTotal").textContent =
        formatCurrency(total);

    const received = Math.max(
        0,
        Number(document.getElementById("amountReceived").value) || 0
    );

    const change = Math.max(0, received - total);

    document.getElementById("paymentChange").textContent =
        formatCurrency(change);
}

function completeBillingPayment() {
    const order = getSelectedBillingOrder();

    if (!order) {
        alert("Please select an order first.");
        return;
    }

    const subtotal = getOrderSubtotal(order);

    let discount = Number(
        document.getElementById("billDiscount").value
    ) || 0;

    discount = Math.min(subtotal, Math.max(0, discount));

    const total = subtotal - discount;

    const received = Number(
        document.getElementById("amountReceived").value
    );

    const paymentMethod =
        document.getElementById("paymentMethod").value;

    if (!Number.isFinite(received) || received < total) {
        alert("The received amount must be equal to or greater than the bill total.");
        return;
    }

    if (total <= 0) {
        alert("The bill total must be greater than zero.");
        return;
    }

    if (order.paymentStatus === "Paid") {
        alert("This order has already been paid.");
        return;
    }

    // Save payment information separately from kitchen status
    order.billingDiscount = discount;
    order.amount = total;
    order.paymentStatus = "Paid";
    order.paymentMethod = paymentMethod;
    order.amountReceived = received;
    order.change = received - total;
    order.paidAt = new Date().toLocaleString();

    saveRestaurantData();

    // Create receipt before clearing the selected order
    generateReceipt(order);

    alert("Payment completed successfully!");

    selectedBillingOrderId = null;

    document.getElementById("billingContent").style.display = "none";
    document.getElementById("billingEmptyMessage").style.display = "block";

    displayUnpaidOrders();
    displayPaymentHistory();
    updateBillingDashboard();
}

function generateReceipt(order) {
    const receiptArea = document.getElementById("receiptPrintArea");

    const items = Array.isArray(order.items) ? order.items : [];

    const itemRows = items.map(item => {
        const name = item.name || item.title || item.productName || "Food item";
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;

        return `
            <tr>
                <td>${escapeHTML(String(name))}</td>
                <td>${quantity}</td>
                <td>${formatCurrency(price * quantity)}</td>
            </tr>
        `;
    }).join("");

    const subtotal = getOrderSubtotal(order);
    const discount = Number(order.billingDiscount) || 0;
    const total = getBillingTotal(order);

    receiptArea.innerHTML = `
        <div class="receipt-center">
            <h2>FoodPoint Restaurant</h2>
            <p>Payment Receipt</p>
            <p>Thank you for dining with us!</p>
        </div>

        <hr>

        <p><strong>Order:</strong> ${escapeHTML(String(order.id))}</p>
        <p><strong>Customer:</strong> ${escapeHTML(String(order.customer || "Walk-in"))}</p>
        <p><strong>Order Type:</strong> ${escapeHTML(String(order.type || "-"))}</p>
        <p><strong>Date:</strong> ${escapeHTML(String(order.paidAt || ""))}</p>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <div class="receipt-total">
            <div>Subtotal: ${formatCurrency(subtotal)}</div>
            <div>Discount: ${formatCurrency(discount)}</div>
            <h3>Grand Total: ${formatCurrency(total)}</h3>
            <div>Payment: ${escapeHTML(String(order.paymentMethod || ""))}</div>
            <div>Received: ${formatCurrency(order.amountReceived || total)}</div>
            <div>Change: ${formatCurrency(order.change || 0)}</div>
        </div>

        <hr>

        <div class="receipt-center">
            <p>*** Thank You! Visit Again ***</p>
        </div>
    `;

    window.print();
}

function displayPaymentHistory() {
    const body = document.getElementById("paymentHistoryBody");
    if (!body) return;

    const paidOrders = dashboardData.orders.filter(
        order => order.paymentStatus === "Paid"
    );

    if (paidOrders.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No payment records available.
                </td>
            </tr>
        `;
        return;
    }

    body.innerHTML = paidOrders.map(order => `
        <tr>
            <td>${escapeHTML(String(order.id || ""))}</td>
            <td>${escapeHTML(String(order.customer || "Walk-in"))}</td>
            <td>${escapeHTML(String(order.paymentMethod || ""))}</td>
            <td>${formatCurrency(Number(order.amount) || 0)}</td>
            <td><span class="kitchen-status completed">Paid</span></td>
            <td>
                <button class="kitchen-action-btn"
                    data-reprint-order="${escapeHTML(String(order.id))}"
                    style="padding:7px 10px;">
                    Print Receipt
                </button>
            </td>
        </tr>
    `).reverse().join("");
}

function updateBillingDashboard() {
    if (typeof updateStatistics === "function") {
        updateStatistics();
    }

    if (typeof displayRecentOrders === "function") {
        displayRecentOrders();
    }
}

// Select an unpaid order
const unpaidOrdersList = document.getElementById("unpaidOrdersList");

if (unpaidOrdersList) {
    unpaidOrdersList.addEventListener("click", function(event) {
        const card = event.target.closest(".billing-order-card");
        if (!card) return;

        selectBillingOrder(card.dataset.billingOrderId);
    });
}

// Recalculate bill when discount changes
const billDiscountInput = document.getElementById("billDiscount");

if (billDiscountInput) {
    billDiscountInput.addEventListener("input", updateBillingTotals);
}

// Calculate change when received amount changes
const amountReceivedInput = document.getElementById("amountReceived");

if (amountReceivedInput) {
    amountReceivedInput.addEventListener("input", updateBillingTotals);
}

// Complete payment
const completePaymentBtn = document.getElementById("completePaymentBtn");

if (completePaymentBtn) {
    completePaymentBtn.addEventListener("click", completeBillingPayment);
}

// Reprint an existing receipt
const paymentHistoryBody = document.getElementById("paymentHistoryBody");

if (paymentHistoryBody) {
    paymentHistoryBody.addEventListener("click", function(event) {
        const button = event.target.closest("[data-reprint-order]");
        if (!button) return;

        const order = dashboardData.orders.find(
            item => String(item.id) === button.dataset.reprintOrder
        );

        if (order && order.paymentStatus === "Paid") {
            generateReceipt(order);
        }
    });
}

// Initial billing display
displayUnpaidOrders();
displayPaymentHistory();
