

/* =====================================
   PHASE 5: INVENTORY MANAGEMENT
===================================== */

// Make sure inventory arrays exist
if (!Array.isArray(dashboardData.stock)) {
    dashboardData.stock = [];
}

if (!Array.isArray(dashboardData.stockTransactions)) {
    dashboardData.stockTransactions = [];
}

// Give existing stock items stable IDs and compatible fields
dashboardData.stock.forEach((item, index) => {
    if (!item.id) {
        item.id = "STOCK-" + (index + 1) + "-" + Date.now();
    }

    if (!item.name) {
        item.name = item.itemName || item.item || "Unnamed Item";
    }

    if (item.min === undefined) {
        item.min = Number(item.minimumStock || item.minStock || 0);
    }

    if (!item.unit) {
        item.unit = "pcs";
    }

    item.quantity = Number(item.quantity) || 0;
    item.min = Number(item.min) || 0;
});

saveRestaurantData();

function getInventoryStatus(item) {
    const quantity = Number(item.quantity) || 0;
    const minimum = Number(item.min) || 0;

    if (quantity <= 0) return "out-stock";
    if (quantity <= minimum) return "low-stock";

    return "in-stock";
}

function getInventoryStatusLabel(status) {
    const labels = {
        "in-stock": "In Stock",
        "low-stock": "Low Stock",
        "out-stock": "Out of Stock"
    };

    return labels[status] || "Unknown";
}

// Update inventory summary
function updateInventorySummary() {
    const stock = dashboardData.stock;

    const lowStock = stock.filter(item =>
        getInventoryStatus(item) === "low-stock"
    ).length;

    const outStock = stock.filter(item =>
        getInventoryStatus(item) === "out-stock"
    ).length;

    document.getElementById("inventoryTotalItems").textContent =
        stock.length;

    document.getElementById("inventoryLowStock").textContent =
        lowStock;

    document.getElementById("inventoryOutStock").textContent =
        outStock;
}

// Display inventory table
function displayInventory() {
    const tableBody = document.getElementById("inventoryTableBody");
    if (!tableBody) return;

    const searchValue = (
        document.getElementById("inventorySearch").value || ""
    ).toLowerCase();

    const filteredStock = dashboardData.stock.filter(item => {
        return (
            String(item.name).toLowerCase().includes(searchValue) ||
            String(item.category || "").toLowerCase().includes(searchValue)
        );
    });

    if (filteredStock.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="inventory-empty">
                    No inventory items found.
                </td>
            </tr>
        `;

        updateInventorySummary();
        return;
    }

    tableBody.innerHTML = filteredStock.map(item => {
        const status = getInventoryStatus(item);

        return `
            <tr>
                <td><strong>${escapeHTML(String(item.name))}</strong></td>
                <td>${escapeHTML(String(item.category || "Other"))}</td>
                <td>${Number(item.quantity)} ${escapeHTML(String(item.unit))}</td>
                <td>${Number(item.min)} ${escapeHTML(String(item.unit))}</td>
                <td>
                    <span class="inventory-status ${status}">
                        ${getInventoryStatusLabel(status)}
                    </span>
                </td>
                <td>
                    <button class="inventory-action-btn"
                        data-stock-action="transaction"
                        data-stock-id="${escapeHTML(String(item.id))}">
                        Manage
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    updateInventorySummary();
}

// Show add item form
const showAddStockBtn = document.getElementById("showAddStockBtn");

if (showAddStockBtn) {
    showAddStockBtn.addEventListener("click", function() {
        document.getElementById("addStockPanel").style.display = "block";
        document.getElementById("stockItemName").focus();
    });
}

// Cancel add item form
document.getElementById("cancelStockItemBtn").addEventListener("click", function() {
    document.getElementById("addStockPanel").style.display = "none";
});

// Save new inventory item
document.getElementById("saveStockItemBtn").addEventListener("click", function() {
    const name = document.getElementById("stockItemName").value.trim();
    const category = document.getElementById("stockItemCategory").value;
    const quantity = Number(document.getElementById("stockItemQuantity").value);
    const unit = document.getElementById("stockItemUnit").value;
    const minimum = Number(document.getElementById("stockMinimum").value);

    if (!name) {
        alert("Please enter an item name.");
        return;
    }

    if (
        dashboardData.stock.some(item =>
            String(item.name).toLowerCase() === name.toLowerCase()
        )
    ) {
        alert("This inventory item already exists. Use Manage to update its stock.");
        return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
        alert("Enter a valid opening quantity.");
        return;
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
        alert("Enter a valid minimum stock level.");
        return;
    }

    const newItem = {
        id: "STOCK-" + Date.now(),
        name: name,
        category: category,
        quantity: quantity,
        unit: unit,
        min: minimum
    };

    dashboardData.stock.push(newItem);

    // Record opening stock
    dashboardData.stockTransactions.unshift({
        id: "TXN-" + Date.now(),
        stockId: newItem.id,
        itemName: name,
        type: "Opening Stock",
        quantity: quantity,
        unit: unit,
        note: "Initial inventory entry",
        date: new Date().toLocaleString()
    });

    saveRestaurantData();

    document.getElementById("stockItemName").value = "";
    document.getElementById("stockItemQuantity").value = "";
    document.getElementById("stockMinimum").value = "";
    document.getElementById("addStockPanel").style.display = "none";

    displayInventory();
    displayStockHistory();
    refreshInventoryDashboard();

    alert("Inventory item added successfully!");
});

// Open stock transaction panel
function openStockTransaction(stockId) {
    const item = dashboardData.stock.find(
        stock => String(stock.id) === String(stockId)
    );

    if (!item) return;

    document.getElementById("transactionStockId").value = item.id;
    document.getElementById("stockTransactionItemName").textContent =
        `${item.name}: ${item.quantity} ${item.unit} currently available`;

    document.getElementById("stockTransactionTitle").textContent =
        "Manage " + item.name;

    document.getElementById("stockTransactionType").value = "Purchase";
    document.getElementById("stockTransactionQuantity").value = "";
    document.getElementById("stockTransactionNote").value = "";

    document.getElementById("stockTransactionPanel").style.display = "block";

    document.getElementById("stockTransactionPanel").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Inventory table action
document.getElementById("inventoryTableBody").addEventListener("click", function(event) {
    const button = event.target.closest("[data-stock-action]");
    if (!button) return;

    if (button.dataset.stockAction === "transaction") {
        openStockTransaction(button.dataset.stockId);
    }
});

// Cancel transaction
document.getElementById("cancelStockTransactionBtn").addEventListener("click", function() {
    document.getElementById("stockTransactionPanel").style.display = "none";
});

// Save stock transaction
document.getElementById("saveStockTransactionBtn").addEventListener("click", function() {
    const stockId = document.getElementById("transactionStockId").value;
    const type = document.getElementById("stockTransactionType").value;
    const quantity = Number(
        document.getElementById("stockTransactionQuantity").value
    );
    const note = document.getElementById("stockTransactionNote").value.trim();

    const item = dashboardData.stock.find(
        stock => String(stock.id) === String(stockId)
    );

    if (!item) {
        alert("Inventory item not found.");
        return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        alert("Please enter a quantity greater than zero.");
        return;
    }

    const currentQuantity = Number(item.quantity) || 0;
    let transactionQuantity = quantity;

    if (type === "Purchase") {
        item.quantity = currentQuantity + quantity;
    }

    else if (type === "Usage") {
        if (quantity > currentQuantity) {
            alert("Not enough stock available. Current stock: " +
                currentQuantity + " " + item.unit);
            return;
        }

        item.quantity = currentQuantity - quantity;
        transactionQuantity = -quantity;
    }

    else if (type === "Adjustment") {
        item.quantity = quantity;
        transactionQuantity = quantity - currentQuantity;
    }

    dashboardData.stockTransactions.unshift({
        id: "TXN-" + Date.now(),
        stockId: item.id,
        itemName: item.name,
        type: type,
        quantity: transactionQuantity,
        unit: item.unit,
        note: note || "-",
        date: new Date().toLocaleString()
    });

    saveRestaurantData();

    document.getElementById("stockTransactionPanel").style.display = "none";

    displayInventory();
    displayStockHistory();
    refreshInventoryDashboard();

    alert("Stock transaction saved successfully!");
});

// Display transaction history
function displayStockHistory() {
    const body = document.getElementById("stockHistoryBody");
    if (!body) return;

    const transactions = dashboardData.stockTransactions || [];

    if (transactions.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5" class="inventory-empty">
                    No stock transactions recorded.
                </td>
            </tr>
        `;
        return;
    }

    body.innerHTML = transactions.map(transaction => {
        const quantity = Number(transaction.quantity) || 0;
        const quantityText = quantity > 0
            ? "+" + quantity
            : String(quantity);

        return `
            <tr>
                <td>${escapeHTML(String(transaction.date || ""))}</td>
                <td>${escapeHTML(String(transaction.itemName || ""))}</td>
                <td>${escapeHTML(String(transaction.type || ""))}</td>
                <td>
                    ${quantityText} ${escapeHTML(String(transaction.unit || ""))}
                </td>
                <td>${escapeHTML(String(transaction.note || "-"))}</td>
            </tr>
        `;
    }).join("");
}

// Search inventory
document.getElementById("inventorySearch").addEventListener("input", displayInventory);

// Refresh dashboard stock information
function refreshInventoryDashboard() {
    if (typeof displayLowStock === "function") {
        displayLowStock();
    }

    if (typeof updateStatistics === "function") {
        updateStatistics();
    }
}

// Initial inventory display
displayInventory();
displayStockHistory();
updateInventorySummary();

// Refresh inventory if another tab changes Local Storage
window.addEventListener("storage", function(event) {
    if (event.key === "restaurantPOS" && event.newValue) {
        try {
            dashboardData = JSON.parse(event.newValue);

            if (!Array.isArray(dashboardData.stock)) {
                dashboardData.stock = [];
            }

            if (!Array.isArray(dashboardData.stockTransactions)) {
                dashboardData.stockTransactions = [];
            }

            displayInventory();
            displayStockHistory();
            refreshInventoryDashboard();
        } catch (error) {
            console.error("Could not refresh inventory:", error);
        }
    }
});
