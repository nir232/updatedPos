

/* ==========================================
   PHASE 7: REPORTS & RECORDS
========================================== */

// Ensure required data arrays exist
if (!Array.isArray(dashboardData.orders)) {
    dashboardData.orders = [];
}

if (!Array.isArray(dashboardData.stockTransactions)) {
    dashboardData.stockTransactions = [];
}


// Check whether an order has been paid
function reportIsPaid(order) {

    // New billing records
    if (order.paymentStatus === "Paid") {
        return true;
    }

    // Support older completed sample orders
    return order.status === "Completed";

}


// Get the order amount
function reportOrderAmount(order) {

    const amount = Number(
        order.amount ?? order.total ?? order.subtotal ?? 0
    );

    return Number.isFinite(amount) ? amount : 0;

}


// Get a valid date from a record
function reportGetDate(record) {

    const rawDate =
        record.paidAt ||
        record.createdAt ||
        record.date ||
        record.timestamp ||
        "";

    if (!rawDate) return null;

    const date = new Date(rawDate);

    return Number.isNaN(date.getTime()) ? null : date;

}


// Format date as YYYY-MM-DD
function reportDateKey(date) {

    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// Get orders after applying filters
function getFilteredReportOrders() {

    const startDate = document.getElementById(
        "reportStartDate"
    ).value;

    const endDate = document.getElementById(
        "reportEndDate"
    ).value;

    const orderType = document.getElementById(
        "reportOrderType"
    ).value;

    const orderStatus = document.getElementById(
        "reportOrderStatus"
    ).value;

    const search = document.getElementById(
        "reportSearch"
    ).value.toLowerCase().trim();


    return dashboardData.orders.filter(order => {

        const date = reportGetDate(order);
        const dateKey = reportDateKey(date);

        if (startDate && (!dateKey || dateKey < startDate)) {
            return false;
        }

        if (endDate && (!dateKey || dateKey > endDate)) {
            return false;
        }

        if (
            orderType !== "all" &&
            String(order.type || "") !== orderType
        ) {
            return false;
        }

        if (
            orderStatus !== "all" &&
            String(order.status || "") !== orderStatus
        ) {
            return false;
        }

        const customer = String(
            order.customer || ""
        ).toLowerCase();

        const orderId = String(
            order.id || order.orderId || ""
        ).toLowerCase();

        if (
            search &&
            !customer.includes(search) &&
            !orderId.includes(search)
        ) {
            return false;
        }

        return true;

    });

}


// DISPLAY REPORT SUMMARY
function displayReportSummary(orders) {

    const paidOrders = orders.filter(reportIsPaid);

    const unpaidOrders = orders.filter(order =>
        !reportIsPaid(order)
    );

    const revenue = paidOrders.reduce(
        (total, order) => total + reportOrderAmount(order),
        0
    );

    const average = paidOrders.length
        ? revenue / paidOrders.length
        : 0;


    document.getElementById("reportTotalRevenue").textContent =
        formatCurrency(revenue);

    document.getElementById("reportPaidOrders").textContent =
        paidOrders.length;

    document.getElementById("reportUnpaidOrders").textContent =
        unpaidOrders.length;

    document.getElementById("reportAverageOrder").textContent =
        formatCurrency(average);

}


// DISPLAY DAILY SALES
function displayDailySales(orders) {

    const table = document.getElementById("dailySalesTable");

    const dailyData = {};

    orders.filter(reportIsPaid).forEach(order => {

        const date = reportGetDate(order);

        if (!date) return;

        const key = reportDateKey(date);

        if (!dailyData[key]) {
            dailyData[key] = {
                count: 0,
                revenue: 0
            };
        }

        dailyData[key].count++;
        dailyData[key].revenue += reportOrderAmount(order);

    });


    const dates = Object.keys(dailyData).sort().reverse();

    if (!dates.length) {

        table.innerHTML = `
            <tr>
                <td colspan="3" class="report-empty">
                    No paid sales found for this period.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = dates.map(date => {

        const item = dailyData[date];

        return `
            <tr>
                <td>${escapeHTML(date)}</td>
                <td>${item.count}</td>
                <td>${formatCurrency(item.revenue)}</td>
            </tr>
        `;

    }).join("");

}


// DISPLAY BEST-SELLING PRODUCTS
function displayBestSellingProducts(orders) {

    const table = document.getElementById("bestSellingTable");

    const products = {};

    orders.filter(reportIsPaid).forEach(order => {

        (order.items || []).forEach(item => {

            const name = String(item.name || "Unknown Item");
            const quantity = Number(item.quantity || 0);
            const price = Number(item.price || 0);

            if (!products[name]) {
                products[name] = {
                    quantity: 0,
                    sales: 0
                };
            }

            products[name].quantity += quantity;
            products[name].sales += quantity * price;

        });

    });


    const sortedProducts = Object.entries(products)
        .sort((a, b) => b[1].quantity - a[1].quantity);

    if (!sortedProducts.length) {

        table.innerHTML = `
            <tr>
                <td colspan="3" class="report-empty">
                    No product sales found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = sortedProducts.map(([name, data]) => {

        return `
            <tr>
                <td>${escapeHTML(name)}</td>
                <td>${data.quantity}</td>
                <td>${formatCurrency(data.sales)}</td>
            </tr>
        `;

    }).join("");

}


// DISPLAY ORDER RECORDS
function displayOrderRecords(orders) {

    const table = document.getElementById("orderRecordsTable");

    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="report-empty">
                    No order records found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = orders.map(order => {

        const date = reportGetDate(order);
        const dateText = date ? date.toLocaleString() : "Not recorded";

        const paid = reportIsPaid(order);

        const orderId = order.id || order.orderId || "N/A";

        return `
            <tr>

                <td>${escapeHTML(orderId)}</td>

                <td>${escapeHTML(order.customer || "Walk-in Customer")}</td>

                <td>${escapeHTML(dateText)}</td>

                <td>${escapeHTML(order.type || "N/A")}</td>

                <td>${formatCurrency(reportOrderAmount(order))}</td>

                <td>
                    <span class="report-status ${paid ? "paid" : "unpaid"}">
                        ${paid ? "Paid" : "Unpaid"}
                    </span>
                </td>

                <td>${escapeHTML(order.status || "Pending")}</td>

            </tr>
        `;

    }).join("");

}


// DISPLAY PAYMENT RECORDS
function displayPaymentRecords(orders) {

    const table = document.getElementById("paymentRecordsTable");

    const paidOrders = orders.filter(reportIsPaid);

    if (!paidOrders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="report-empty">
                    No payment records found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = paidOrders.map(order => {

        const date = reportGetDate(order);
        const dateText = date ? date.toLocaleString() : "Not recorded";

        const orderId = order.id || order.orderId || "N/A";

        return `
            <tr>

                <td>${escapeHTML(orderId)}</td>

                <td>${escapeHTML(order.paymentMethod || "Not recorded")}</td>

                <td>${formatCurrency(reportOrderAmount(order))}</td>

                <td>${formatCurrency(Number(order.amountReceived || reportOrderAmount(order)))}</td>

                <td>${formatCurrency(Number(order.change || 0))}</td>

                <td>${escapeHTML(dateText)}</td>

            </tr>
        `;

    }).join("");

}


// DISPLAY INVENTORY TRANSACTIONS
function displayInventoryRecords() {

    const table = document.getElementById("stockRecordsTable");

    const transactions = Array.isArray(dashboardData.stockTransactions)
        ? [...dashboardData.stockTransactions]
        : [];

    const stockItems = Array.isArray(dashboardData.stock)
        ? dashboardData.stock
        : [];

    transactions.sort((a, b) => {

        const dateA = reportGetDate(a);
        const dateB = reportGetDate(b);

        return (dateB ? dateB.getTime() : 0) -
               (dateA ? dateA.getTime() : 0);

    });


    if (!transactions.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="report-empty">
                    No inventory transactions found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = transactions.map(transaction => {

        const stockItem = stockItems.find(item =>
            String(item.id) === String(transaction.stockId)
        );

        const itemName =
            transaction.itemName ||
            transaction.name ||
            (stockItem ? stockItem.name : "Unknown Item");

        const date = reportGetDate(transaction);

        const dateText = date
            ? date.toLocaleString()
            : "Not recorded";

        const quantity = Number(
            transaction.quantity ?? transaction.amount ?? 0
        );

        const type = String(
            transaction.type || "Adjustment"
        );

        return `
            <tr>

                <td>${escapeHTML(dateText)}</td>

                <td>${escapeHTML(itemName)}</td>

                <td>${escapeHTML(type)}</td>

                <td>${quantity}</td>

                <td>${escapeHTML(transaction.note || transaction.reason || "-")}</td>

            </tr>
        `;

    }).join("");

}


// REFRESH ALL REPORTS
function refreshReports() {

    const orders = getFilteredReportOrders();

    displayReportSummary(orders);
    displayDailySales(orders);
    displayBestSellingProducts(orders);
    displayOrderRecords(orders);
    displayPaymentRecords(orders);
    displayInventoryRecords();

}


// CSV EXPORT FUNCTION
function downloadReportCSV(filename, rows) {

    if (!rows.length) {
        alert("There are no records to export.");
        return;
    }

    const csvContent = rows.map(row => {

        return row.map(value => {

            const text = String(value ?? "");

            return '"' + text.replace(/"/g, '""') + '"';

        }).join(",");

    }).join("\r\n");


    // Add UTF-8 BOM for spreadsheet compatibility
    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);

}


// EXPORT ORDER REPORT
function exportOrderReportCSV() {

    const orders = getFilteredReportOrders();

    const rows = [[
        "Order ID",
        "Customer",
        "Date",
        "Type",
        "Amount",
        "Payment Status",
        "Payment Method",
        "Order Status"
    ]];

    orders.forEach(order => {

        const date = reportGetDate(order);

        rows.push([
            order.id || order.orderId || "",
            order.customer || "Walk-in Customer",
            date ? date.toLocaleString() : "",
            order.type || "",
            reportOrderAmount(order),
            reportIsPaid(order) ? "Paid" : "Unpaid",
            order.paymentMethod || "",
            order.status || ""
        ]);

    });

    downloadReportCSV("restaurant-orders.csv", rows);

}


// EXPORT PAYMENT REPORT
function exportPaymentReportCSV() {

    const orders = getFilteredReportOrders()
        .filter(reportIsPaid);

    const rows = [[
        "Order ID",
        "Payment Method",
        "Amount Paid",
        "Amount Received",
        "Change",
        "Payment Date"
    ]];

    orders.forEach(order => {

        const date = reportGetDate(order);

        rows.push([
            order.id || order.orderId || "",
            order.paymentMethod || "",
            reportOrderAmount(order),
            order.amountReceived || reportOrderAmount(order),
            order.change || 0,
            date ? date.toLocaleString() : ""
        ]);

    });

    downloadReportCSV("restaurant-payments.csv", rows);

}


// EXPORT INVENTORY REPORT
function exportStockReportCSV() {

    const transactions = dashboardData.stockTransactions || [];

    const rows = [[
        "Date",
        "Item",
        "Transaction Type",
        "Quantity",
        "Note"
    ]];

    transactions.forEach(transaction => {

        const date = reportGetDate(transaction);

        const stockItem = (dashboardData.stock || []).find(item =>
            String(item.id) === String(transaction.stockId)
        );

        rows.push([
            date ? date.toLocaleString() : "",
            transaction.itemName ||
                transaction.name ||
                (stockItem ? stockItem.name : "Unknown Item"),
            transaction.type || "",
            transaction.quantity ?? transaction.amount ?? 0,
            transaction.note || transaction.reason || ""
        ]);

    });

    downloadReportCSV("restaurant-inventory.csv", rows);

}


// CONNECT BUTTONS AND FILTERS
function initializeReportsModule() {

    const applyButton = document.getElementById("applyReportFilters");
    const resetButton = document.getElementById("resetReportFilters");
    const searchInput = document.getElementById("reportSearch");

    if (applyButton) {
        applyButton.addEventListener("click", refreshReports);
    }

    if (resetButton) {

        resetButton.addEventListener("click", function() {

            document.getElementById("reportStartDate").value = "";
            document.getElementById("reportEndDate").value = "";
            document.getElementById("reportOrderType").value = "all";
            document.getElementById("reportOrderStatus").value = "all";
            document.getElementById("reportSearch").value = "";

            refreshReports();

        });

    }

    if (searchInput) {
        searchInput.addEventListener("input", refreshReports);
    }

    document.getElementById("exportOrderReport")
        .addEventListener("click", exportOrderReportCSV);

    document.getElementById("exportPaymentReport")
        .addEventListener("click", exportPaymentReportCSV);

    document.getElementById("exportStockReport")
        .addEventListener("click", exportStockReportCSV);

    document.getElementById("printReport")
        .addEventListener("click", function() {
            window.print();
        });

    refreshReports();

}


// INITIALIZE REPORTS MODULE
initializeReportsModule();
