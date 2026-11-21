

/* =================================
   RESTAURANT POS DASHBOARD
================================= */

// Sample dashboard data
const defaultData = {
    orders: [
        {
            id: "ORD-1005",
            customer: "Rahim Ahmed",
            type: "Dine-in",
            amount: 850,
            status: "Completed"
        },
        {
            id: "ORD-1004",
            customer: "Karim Hasan",
            type: "Takeaway",
            amount: 450,
            status: "Preparing"
        },
        {
            id: "ORD-1003",
            customer: "Sadia Akter",
            type: "Delivery",
            amount: 1200,
            status: "Pending"
        },
        {
            id: "ORD-1002",
            customer: "Tanvir Islam",
            type: "Dine-in",
            amount: 650,
            status: "Completed"
        },
        {
            id: "ORD-1001",
            customer: "Nusrat Jahan",
            type: "Takeaway",
            amount: 380,
            status: "Completed"
        }
    ],

    stock: [
        {
            name: "Chicken",
            quantity: 2,
            unit: "kg",
            minimum: 5
        },
        {
            name: "Cooking Oil",
            quantity: 3,
            unit: "liters",
            minimum: 5
        },
        {
            name: "Cheese",
            quantity: 1,
            unit: "kg",
            minimum: 3
        },
        {
            name: "Rice",
            quantity: 20,
            unit: "kg",
            minimum: 5
        },
        {
            name: "Flour",
            quantity: 2,
            unit: "kg",
            minimum: 5
        }
    ]
};


// Load existing data or initialize sample data
function loadDashboardData() {

    const savedData = localStorage.getItem("restaurantPOS");

    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (error) {
            console.error("Saved dashboard data is invalid:", error);
        }
    }

    localStorage.setItem(
        "restaurantPOS",
        JSON.stringify(defaultData)
    );

    return JSON.parse(JSON.stringify(defaultData));
}

let dashboardData = loadDashboardData();


// Save dashboard data
function saveDashboardData() {

    localStorage.setItem(
        "restaurantPOS",
        JSON.stringify(dashboardData)
    );

}


// Currency formatter
function formatCurrency(amount) {

    return "৳ " + Number(amount).toLocaleString(
        "en-BD",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// =================================
// DASHBOARD STATISTICS
// =================================

function updateStatistics() {

    const orders = dashboardData.orders;

    const totalSales = orders
        .filter(order => order.status === "Completed")
        .reduce((sum, order) => sum + Number(order.amount), 0);

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(order =>
        order.status === "Pending" ||
        order.status === "Preparing"
    ).length;

    const lowStock = dashboardData.stock.filter(item =>
        Number(item.quantity) <= Number(item.minimum)
    ).length;


    document.getElementById("totalSales").textContent =
        formatCurrency(totalSales);

    document.getElementById("totalOrders").textContent =
        totalOrders;

    document.getElementById("pendingOrders").textContent =
        pendingOrders;

    document.getElementById("lowStockCount").textContent =
        lowStock;

}


// =================================
// RECENT ORDERS TABLE
// =================================

function displayRecentOrders() {

    const table = document.getElementById("recentOrdersTable");

    if (!dashboardData.orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No orders available.
                </td>
            </tr>
        `;

        return;
    }

    const recentOrders = [...dashboardData.orders].slice(0, 5);

    table.innerHTML = recentOrders.map(order => {

        const statusClass = order.status.toLowerCase();

        return `
            <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customer)}</td>
                <td>${escapeHTML(order.type)}</td>
                <td>${formatCurrency(order.amount)}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${escapeHTML(order.status)}
                    </span>
                </td>
            </tr>
        `;

    }).join("");

}


// =================================
// LOW STOCK LIST
// =================================

function displayLowStock() {

    const stockList = document.getElementById("lowStockList");

    const lowStockItems = dashboardData.stock.filter(item =>
        Number(item.quantity) <= Number(item.minimum)
    );

    if (!lowStockItems.length) {

        stockList.innerHTML = `
            <div class="stock-item">
                <span class="stock-ok">
                    <i class="fa-solid fa-circle-check"></i>
                    All stock levels are sufficient.
                </span>
            </div>
        `;

        return;
    }

    stockList.innerHTML = lowStockItems.map(item => {

        return `
            <div class="stock-item">
                <div>
                    <strong>${escapeHTML(item.name)}</strong>
                    <small>Minimum: ${escapeHTML(item.minimum)} ${escapeHTML(item.unit)}</small>
                </div>

                <span class="stock-quantity">
                    ${escapeHTML(item.quantity)} ${escapeHTML(item.unit)}
                </span>
            </div>
        `;

    }).join("");

}


// Prevent HTML injection in displayed data
function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });

}


// =================================
// NAVIGATION SYSTEM
// =================================

const navigationLinks = document.querySelectorAll(".nav-link");

const pageSections = document.querySelectorAll(".page-section");

const pageInformation = {

    dashboard: {
        title: "Dashboard",
        subtitle: "Welcome back! Here's your restaurant overview."
    },

    orders: {
        title: "New Order",
        subtitle: "Manage customer orders."
    },

    kitchen: {
        title: "Kitchen Display",
        subtitle: "Monitor food preparation."
    },

    billing: {
        title: "Billing",
        subtitle: "Manage customer payments and receipts."
    },

    menu: {
        title: "Menu Management",
        subtitle: "Manage food items and categories."
    },

    inventory: {
        title: "Inventory",
        subtitle: "Monitor ingredients and stock."
    },

    reports: {
        title: "Reports & Records",
        subtitle: "Review restaurant performance."
    },

    settings: {
        title: "Settings",
        subtitle: "Configure your restaurant system."
    },

    suppliers: {
        title: "Supplier Management",
        subtitle: "Manage suppliers, purchases and outstanding balances."
    },

    customers: {
        title: "Customer Management",
        subtitle: "Manage customer profiles, orders and spending history."
    }

};


function openSection(sectionName) {

    // Hide all sections
    pageSections.forEach(section => {
        section.classList.remove("active");
    });

    // Remove active state from all navigation links
    navigationLinks.forEach(link => {
        link.classList.remove("active");
    });

    // Display selected section
    const selectedSection = document.getElementById(sectionName);

    if (!selectedSection || !pageInformation[sectionName]) {
        return;
    }

    selectedSection.classList.add("active");

    // Update sidebar
    const activeLink = document.querySelector(
        `.nav-link[data-section="${sectionName}"]`
    );

    if (activeLink) {
        activeLink.classList.add("active");
    }

    // Update header
    document.getElementById("pageTitle").textContent =
        pageInformation[sectionName].title;

    document.getElementById("pageSubtitle").textContent =
        pageInformation[sectionName].subtitle;

    closeMobileSidebar();

}


// Sidebar navigation
navigationLinks.forEach(link => {

    link.addEventListener("click", () => {

        const sectionName = link.dataset.section;

        openSection(sectionName);

    });

});


// Quick action navigation and View All buttons
document.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", () => {

        openSection(button.dataset.go);

    });

});


// =================================
// MOBILE SIDEBAR
// =================================

const sidebar = document.getElementById("sidebar");

const overlay = document.getElementById("sidebarOverlay");

document.getElementById("menuToggle").addEventListener("click", () => {

    sidebar.classList.add("open");

    overlay.classList.add("show");

});

document.getElementById("closeSidebar").addEventListener("click", closeMobileSidebar);

overlay.addEventListener("click", closeMobileSidebar);


function closeMobileSidebar() {

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}


// =================================
// DATE AND FOOTER
// =================================

function displayDate() {

    const today = new Date();

    document.getElementById("currentDate").textContent =
        today.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    document.getElementById("year").textContent =
        today.getFullYear();

}


// =================================
// INITIALIZE DASHBOARD
// =================================

function initializeDashboard() {

    displayDate();

    updateStatistics();

    displayRecentOrders();

    displayLowStock();

    saveDashboardData();

}

initializeDashboard();
