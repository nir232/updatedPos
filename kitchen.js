


/* =====================================
   PHASE 3: KITCHEN DISPLAY SYSTEM
===================================== */

let kitchenFilter = "All";

function getKitchenStatus(order) {
    return String(order.status || "Pending").toLowerCase();
}

function getNextKitchenStatus(status) {
    const transitions = {
        pending: "Preparing",
        preparing: "Ready",
        ready: "Completed"
    };

    return transitions[status] || null;
}

function displayKitchenOrders() {
    const grid = document.getElementById("kitchenOrdersGrid");

    if (!grid) return;

    const orders = dashboardData.orders || [];

    // Update summary counts
    const counts = {
        pending: 0,
        preparing: 0,
        ready: 0,
        completed: 0
    };

    orders.forEach(order => {
        const status = getKitchenStatus(order);

        if (counts[status] !== undefined) {
            counts[status]++;
        }
    });

    document.getElementById("kitchenPendingCount").textContent = counts.pending;
    document.getElementById("kitchenPreparingCount").textContent = counts.preparing;
    document.getElementById("kitchenReadyCount").textContent = counts.ready;
    document.getElementById("kitchenCompletedCount").textContent = counts.completed;

    // Apply selected filter
    const filteredOrders = orders.filter(order => {
        if (kitchenFilter === "All") return true;

        return getKitchenStatus(order) === kitchenFilter.toLowerCase();
    });

    if (filteredOrders.length === 0) {
        grid.innerHTML = `
            <div class="kitchen-empty">
                <h3>No orders found</h3>
                <p>Orders matching this filter will appear here.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredOrders.map(order => {
        const status = getKitchenStatus(order);
        const nextStatus = getNextKitchenStatus(status);

        const items = Array.isArray(order.items) ? order.items : [];

        const itemsHTML = items.map(item => {
            const itemName = item.name || item.title || item.productName || "Food item";
            const quantity = Number(item.quantity) || 1;

            return `
                <div class="kitchen-item-row">
                    <span>${escapeHTML(itemName)}</span>
                    <strong>× ${quantity}</strong>
                </div>
            `;
        }).join("");

        const orderType = order.type || "Not specified";
        const tableInfo = order.tableNumber
            ? `Table: ${escapeHTML(String(order.tableNumber))}`
            : "";

        const customer = order.customer || "Walk-in Customer";

        const buttonHTML = nextStatus
            ? `<button class="kitchen-action-btn"
                    data-order-id="${escapeHTML(String(order.id))}"
                    data-next-status="${nextStatus}">
                    Mark as ${nextStatus}
               </button>`
            : `<button class="kitchen-action-btn" disabled
                    style="background:#999; cursor:not-allowed;">
                    Order Completed
               </button>`;

        return `
            <div class="kitchen-order-card">
                <div class="kitchen-order-top">
                    <div>
                        <h3>${escapeHTML(String(order.id || "New Order"))}</h3>
                        <small>${escapeHTML(String(order.createdAt || ""))}</small>
                    </div>

                    <span class="kitchen-status ${status}">
                        ${escapeHTML(status.charAt(0).toUpperCase() + status.slice(1))}
                    </span>
                </div>

                <div class="kitchen-order-info">
                    <div><strong>Customer:</strong> ${escapeHTML(String(customer))}</div>
                    <div><strong>Order type:</strong> ${escapeHTML(String(orderType))}</div>
                    ${tableInfo ? `<div>${tableInfo}</div>` : ""}
                </div>

                <div class="kitchen-items-title">Order Items</div>

                ${itemsHTML || '<p>No item details available.</p>'}

                <div class="kitchen-order-actions">
                    ${buttonHTML}
                </div>
            </div>
        `;
    }).join("");
}

function updateKitchenOrder(orderId, nextStatus) {
    const order = dashboardData.orders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order) return;

    const currentStatus = getKitchenStatus(order);
    const expectedNextStatus = getNextKitchenStatus(currentStatus);

    // Only allow the next step in the status sequence
    if (expectedNextStatus !== nextStatus) return;

    order.status = nextStatus;

    // Save updated orders to Local Storage
    localStorage.setItem("restaurantPOS", JSON.stringify(dashboardData));

    displayKitchenOrders();

    // Refresh the dashboard if these functions exist
    if (typeof updateStatistics === "function") {
        updateStatistics();
    }

    if (typeof displayRecentOrders === "function") {
        displayRecentOrders();
    }
}

// Filter buttons
const kitchenFilters = document.getElementById("kitchenFilters");

if (kitchenFilters) {
    kitchenFilters.addEventListener("click", function(event) {
        const button = event.target.closest(".kitchen-filter-btn");

        if (!button) return;

        kitchenFilter = button.dataset.filter;

        document.querySelectorAll(".kitchen-filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        displayKitchenOrders();
    });
}

// Update order status
const kitchenGrid = document.getElementById("kitchenOrdersGrid");

if (kitchenGrid) {
    kitchenGrid.addEventListener("click", function(event) {
        const button = event.target.closest(".kitchen-action-btn");

        if (!button || button.disabled) return;

        updateKitchenOrder(
            button.dataset.orderId,
            button.dataset.nextStatus
        );
    });
}

// Manual refresh
const refreshKitchenBtn = document.getElementById("refreshKitchenBtn");

if (refreshKitchenBtn) {
    refreshKitchenBtn.addEventListener("click", displayKitchenOrders);
}

// Initial display
displayKitchenOrders();

// Refresh when another tab on the same browser changes the data
window.addEventListener("storage", function(event) {
    if (event.key === "restaurantPOS" && event.newValue) {
        try {
            dashboardData = JSON.parse(event.newValue);
            displayKitchenOrders();

            if (typeof updateStatistics === "function") {
                updateStatistics();
            }

            if (typeof displayRecentOrders === "function") {
                displayRecentOrders();
            }
        } catch (error) {
            console.error("Could not refresh restaurant data:", error);
        }
    }
});
