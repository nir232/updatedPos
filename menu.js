

/* ==========================================
   PHASE 6: MENU MANAGEMENT
========================================== */

// Make sure the menu array exists
if (!Array.isArray(dashboardData.menu)) {
    dashboardData.menu = [];
}

// Edit mode variable
let editingMenuId = null;


// SAVE MENU DATA
function saveMenuData() {

    if (typeof saveRestaurantData === "function") {
        saveRestaurantData();
    } else {
        localStorage.setItem(
            "restaurantPOS",
            JSON.stringify(dashboardData)
        );
    }

}


// DISPLAY MENU ITEMS
function displayMenuManagement() {

    const tableBody = document.getElementById(
        "menuManagementTableBody"
    );

    if (!tableBody) return;

    const searchInput = document.getElementById(
        "menuManagementSearch"
    );

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const menuItems = dashboardData.menu.filter(item => {

        const name = String(item.name || "").toLowerCase();
        const category = String(item.category || "").toLowerCase();

        return name.includes(search) ||
               category.includes(search);

    });

    // Summary
    document.getElementById("menuTotalItems").textContent =
        dashboardData.menu.length;

    document.getElementById("menuAvailableItems").textContent =
        dashboardData.menu.filter(item =>
            item.available !== false
        ).length;

    document.getElementById("menuUnavailableItems").textContent =
        dashboardData.menu.filter(item =>
            item.available === false
        ).length;


    if (menuItems.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="menu-empty-message">
                    No menu items found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = menuItems.map(item => {

        const id = String(item.id);

        const imageHTML = item.image
            ? `<img class="menu-product-image"
                    src="${escapeHTML(item.image)}"
                    alt="${escapeHTML(item.name || "Menu item")}"
                    onerror="this.outerHTML='<div class=&quot;menu-product-icon&quot;>🍽️</div>'">`
            : `<div class="menu-product-icon">
                    ${escapeHTML(item.icon || "🍽️")}
               </div>`;

        const isAvailable = item.available !== false;

        return `
            <tr>

                <td>${imageHTML}</td>

                <td>
                    <strong>${escapeHTML(item.name || "")}</strong>
                </td>

                <td>${escapeHTML(item.category || "Other")}</td>

                <td>৳${Number(item.price || 0).toFixed(2)}</td>

                <td>
                    <span class="menu-status ${
                        isAvailable ? "available" : "unavailable"
                    }">
                        ${isAvailable ? "Available" : "Unavailable"}
                    </span>
                </td>

                <td>

                    <button class="menu-action-btn menu-edit-btn"
                        onclick="editMenuItem('${id}')">
                        Edit
                    </button>

                    <button class="menu-action-btn menu-toggle-btn"
                        onclick="toggleMenuAvailability('${id}')">
                        ${isAvailable ? "Disable" : "Enable"}
                    </button>

                    <button class="menu-action-btn menu-delete-btn"
                        onclick="deleteMenuItem('${id}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


// ADD OR UPDATE MENU ITEM
document.getElementById("menuItemForm").addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const name = document.getElementById(
            "menuItemName"
        ).value.trim();

        const category = document.getElementById(
            "menuItemCategory"
        ).value;

        const price = Number(document.getElementById(
            "menuItemPrice"
        ).value);

        const icon = document.getElementById(
            "menuItemIcon"
        ).value.trim() || "🍽️";

        const image = document.getElementById(
            "menuItemImage"
        ).value.trim();

        if (!name || !category || !Number.isFinite(price) || price < 0) {
            alert("Please enter a valid name, category and price.");
            return;
        }

        if (editingMenuId !== null) {

            const existingItem = dashboardData.menu.find(
                item => String(item.id) === String(editingMenuId)
            );

            if (existingItem) {

                existingItem.name = name;
                existingItem.category = category;
                existingItem.price = price;
                existingItem.icon = icon;
                existingItem.image = image;

            }

            alert("Menu item updated successfully!");

        } else {

            const newItem = {

                id: "MENU-" + Date.now(),

                name: name,
                category: category,
                price: price,
                icon: icon,
                image: image,
                available: true

            };

            dashboardData.menu.push(newItem);

            alert("New menu item added successfully!");

        }

        saveMenuData();

        resetMenuForm();

        refreshMenuModule();

    }
);


// EDIT MENU ITEM
function editMenuItem(id) {

    const item = dashboardData.menu.find(
        product => String(product.id) === String(id)
    );

    if (!item) return;

    editingMenuId = id;

    document.getElementById("menuItemId").value = id;
    document.getElementById("menuItemName").value = item.name || "";
    document.getElementById("menuItemCategory").value =
        item.category || "";
    document.getElementById("menuItemPrice").value = item.price || 0;
    document.getElementById("menuItemIcon").value = item.icon || "🍽️";
    document.getElementById("menuItemImage").value = item.image || "";

    document.getElementById("menuFormTitle").textContent =
        "Edit Menu Item";

    document.getElementById("menuSaveBtn").textContent =
        "Update Menu Item";

    document.getElementById("menuFormTitle").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// DELETE MENU ITEM
function deleteMenuItem(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this menu item?"
    );

    if (!confirmed) return;

    dashboardData.menu = dashboardData.menu.filter(
        item => String(item.id) !== String(id)
    );

    saveMenuData();

    if (String(editingMenuId) === String(id)) {
        resetMenuForm();
    }

    refreshMenuModule();

}


// ENABLE / DISABLE MENU ITEM
function toggleMenuAvailability(id) {

    const item = dashboardData.menu.find(
        product => String(product.id) === String(id)
    );

    if (!item) return;

    item.available = item.available === false;

    saveMenuData();

    refreshMenuModule();

}


// RESET MENU FORM
function resetMenuForm() {

    document.getElementById("menuItemForm").reset();

    document.getElementById("menuItemId").value = "";

    document.getElementById("menuItemIcon").value = "🍽️";

    editingMenuId = null;

    document.getElementById("menuFormTitle").textContent =
        "Add New Menu Item";

    document.getElementById("menuSaveBtn").textContent =
        "Add Menu Item";

}


// REFRESH MENU AND ORDERING SYSTEM
function refreshMenuModule() {

    displayMenuManagement();

    // Refresh ordering system
    if (typeof displayCategories === "function") {
        displayCategories();
    }

    if (typeof displayProducts === "function") {
        displayProducts();
    }

    if (typeof displayCart === "function") {
        displayCart();
    }

    // Refresh dashboard
    if (typeof updateStatistics === "function") {
        updateStatistics();
    }

}


// MENU SEARCH
document.getElementById("menuManagementSearch").addEventListener(
    "input",
    displayMenuManagement
);


// INITIALIZE MENU MANAGEMENT
function initializeMenuManagement() {

    displayMenuManagement();

    const cancelButton = document.getElementById(
        "menuCancelBtn"
    );

    if (cancelButton) {
        cancelButton.addEventListener("click", resetMenuForm);
    }

}

initializeMenuManagement();
