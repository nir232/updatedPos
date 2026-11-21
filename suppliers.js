

/* ==========================================
   PHASE 9: SUPPLIER MANAGEMENT
========================================== */

// Initialize supplier data
if (!Array.isArray(dashboardData.suppliers)) {
    dashboardData.suppliers = [];
}

if (!Array.isArray(dashboardData.supplierPurchases)) {
    dashboardData.supplierPurchases = [];
}

let editingSupplierId = null;


// SAVE POS DATA
function saveBusinessRecords() {
    localStorage.setItem(
        "restaurantPOS",
        JSON.stringify(dashboardData)
    );
}


// CHECK DELETE CONFIRMATION PREFERENCE
function shouldConfirmRecordDelete() {
    return !(
        dashboardData.settings &&
        dashboardData.settings.system &&
        dashboardData.settings.system.confirmDelete === false
    );
}


// SUPPLIER PURCHASE TOTALS
function getSupplierPurchaseTotals(supplierId) {

    const purchases = dashboardData.supplierPurchases.filter(
        purchase => String(purchase.supplierId) === String(supplierId)
    );

    const total = purchases.reduce(
        (sum, purchase) => sum + Number(purchase.amount || 0),
        0
    );

    const paid = purchases.reduce(
        (sum, purchase) => sum + Number(purchase.paid || 0),
        0
    );

    return {
        total: total,
        paid: paid,
        due: Math.max(0, total - paid)
    };

}


// DISPLAY SUPPLIER SUMMARY
function updateSupplierSummary() {

    const totalSuppliers = dashboardData.suppliers.length;

    let totalPurchases = 0;
    let totalDue = 0;

    dashboardData.suppliers.forEach(supplier => {

        const totals = getSupplierPurchaseTotals(supplier.id);

        totalPurchases += totals.total;
        totalDue += totals.due;

    });

    document.getElementById("totalSuppliers").textContent =
        totalSuppliers;

    document.getElementById("supplierTotalPurchases").textContent =
        formatCurrency(totalPurchases);

    document.getElementById("supplierOutstanding").textContent =
        formatCurrency(totalDue);

}


// DISPLAY SUPPLIER TABLE
function displaySuppliers() {

    const table = document.getElementById("supplierTableBody");

    if (!table) return;

    const search = document.getElementById("supplierSearch")
        .value.toLowerCase().trim();

    const suppliers = dashboardData.suppliers.filter(supplier => {

        return [
            supplier.name,
            supplier.contact,
            supplier.phone,
            supplier.email,
            supplier.category
        ].some(value =>
            String(value || "").toLowerCase().includes(search)
        );

    });


    if (!suppliers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="supplier-empty">
                    No suppliers found.
                </td>
            </tr>
        `;

        updateSupplierSummary();
        return;
    }


    table.innerHTML = suppliers.map(supplier => {

        const totals = getSupplierPurchaseTotals(supplier.id);

        return `
            <tr>

                <td>
                    <strong>${escapeHTML(supplier.name)}</strong>
                </td>

                <td>${escapeHTML(supplier.contact || "-")}</td>

                <td>${escapeHTML(supplier.phone || "-")}</td>

                <td>${escapeHTML(supplier.category || "Other")}</td>

                <td>${formatCurrency(totals.total)}</td>

                <td class="${totals.due > 0 ? "supplier-due" : "supplier-paid"}">
                    ${formatCurrency(totals.due)}
                </td>

                <td>

                    <button class="supplier-action-btn supplier-edit-btn"
                        onclick="editSupplier('${escapeHTML(supplier.id)}')">
                        Edit
                    </button>

                    <button class="supplier-action-btn supplier-delete-btn"
                        onclick="deleteSupplier('${escapeHTML(supplier.id)}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");

    updateSupplierSummary();

}


// RESET SUPPLIER FORM
function resetSupplierForm() {

    document.getElementById("supplierForm").reset();

    document.getElementById("supplierId").value = "";

    editingSupplierId = null;

    document.getElementById("supplierFormTitle").textContent =
        "Add New Supplier";

    document.getElementById("supplierSaveBtn").textContent =
        "Save Supplier";

}


// ADD OR UPDATE SUPPLIER
document.getElementById("supplierForm").addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const name = document.getElementById(
            "supplierName"
        ).value.trim();

        const phone = document.getElementById(
            "supplierPhone"
        ).value.trim();

        const email = document.getElementById(
            "supplierEmail"
        ).value.trim();

        const duplicate = dashboardData.suppliers.some(supplier => {

            return (
                supplier.phone === phone &&
                String(supplier.id) !== String(editingSupplierId)
            );

        });

        if (duplicate) {
            alert("A supplier with this phone number already exists.");
            return;
        }


        const supplierData = {

            name: name,

            contact: document.getElementById(
                "supplierContact"
            ).value.trim(),

            phone: phone,

            email: email,

            category: document.getElementById(
                "supplierCategory"
            ).value,

            address: document.getElementById(
                "supplierAddress"
            ).value.trim(),

            notes: document.getElementById(
                "supplierNotes"
            ).value.trim()

        };


        if (editingSupplierId !== null) {

            const supplier = dashboardData.suppliers.find(
                item => String(item.id) === String(editingSupplierId)
            );

            if (supplier) {
                Object.assign(supplier, supplierData);
            }

            alert("Supplier updated successfully!");

        } else {

            dashboardData.suppliers.push({

                id: "SUP-" + Date.now(),

                ...supplierData,

                createdAt: new Date().toISOString()

            });

            alert("Supplier added successfully!");

        }

        saveBusinessRecords();

        resetSupplierForm();

        refreshSupplierModule();

    }

);


// EDIT SUPPLIER
function editSupplier(id) {

    const supplier = dashboardData.suppliers.find(
        item => String(item.id) === String(id)
    );

    if (!supplier) return;

    editingSupplierId = id;

    document.getElementById("supplierId").value = id;
    document.getElementById("supplierName").value = supplier.name || "";
    document.getElementById("supplierContact").value = supplier.contact || "";
    document.getElementById("supplierPhone").value = supplier.phone || "";
    document.getElementById("supplierEmail").value = supplier.email || "";
    document.getElementById("supplierCategory").value = supplier.category || "Other";
    document.getElementById("supplierAddress").value = supplier.address || "";
    document.getElementById("supplierNotes").value = supplier.notes || "";

    document.getElementById("supplierFormTitle").textContent =
        "Edit Supplier";

    document.getElementById("supplierSaveBtn").textContent =
        "Update Supplier";

    document.getElementById("supplierFormTitle").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// DELETE SUPPLIER
function deleteSupplier(id) {

    const hasPurchases = dashboardData.supplierPurchases.some(
        purchase => String(purchase.supplierId) === String(id)
    );

    if (hasPurchases) {
        alert(
            "This supplier has purchase records. Keep the supplier record to preserve purchase history."
        );
        return;
    }

    if (
        shouldConfirmRecordDelete() &&
        !confirm("Are you sure you want to delete this supplier?")
    ) {
        return;
    }

    dashboardData.suppliers = dashboardData.suppliers.filter(
        supplier => String(supplier.id) !== String(id)
    );

    saveBusinessRecords();

    refreshSupplierModule();

}


// POPULATE SUPPLIER SELECT
function populateSupplierSelect() {

    const select = document.getElementById("purchaseSupplier");

    const previousValue = select.value;

    select.innerHTML = `
        <option value="">Select Supplier</option>
    `;

    dashboardData.suppliers.forEach(supplier => {

        const option = document.createElement("option");

        option.value = supplier.id;
        option.textContent = supplier.name;

        select.appendChild(option);

    });

    if (
        dashboardData.suppliers.some(
            supplier => String(supplier.id) === String(previousValue)
        )
    ) {
        select.value = previousValue;
    }

}


// RECORD SUPPLIER PURCHASE
document.getElementById("supplierPurchaseForm").addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const supplierId = document.getElementById(
            "purchaseSupplier"
        ).value;

        const amount = Number(document.getElementById(
            "purchaseAmount"
        ).value);

        const paid = Number(document.getElementById(
            "purchasePaid"
        ).value);

        const supplier = dashboardData.suppliers.find(
            item => String(item.id) === String(supplierId)
        );

        if (!supplier) {
            alert("Please select a valid supplier.");
            return;
        }

        if (
            !Number.isFinite(amount) ||
            !Number.isFinite(paid) ||
            amount <= 0 ||
            paid < 0 ||
            paid > amount
        ) {
            alert("Enter a valid purchase amount and payment.");
            return;
        }


        const purchase = {

            id: "PUR-" + Date.now(),

            supplierId: supplier.id,

            supplierName: supplier.name,

            reference: document.getElementById(
                "purchaseReference"
            ).value.trim(),

            date: document.getElementById(
                "purchaseDate"
            ).value,

            amount: amount,

            paid: paid,

            due: amount - paid,

            paymentMethod: document.getElementById(
                "purchasePaymentMethod"
            ).value,

            notes: document.getElementById(
                "purchaseNotes"
            ).value.trim(),

            createdAt: new Date().toISOString()

        };


        dashboardData.supplierPurchases.unshift(purchase);

        saveBusinessRecords();

        document.getElementById("supplierPurchaseForm").reset();

        setDefaultPurchaseDate();

        refreshSupplierModule();

        alert("Supplier purchase recorded successfully!");

    }

);


// SET DEFAULT PURCHASE DATE
function setDefaultPurchaseDate() {

    const dateInput = document.getElementById("purchaseDate");

    if (dateInput) {
        dateInput.value = new Date().toLocaleDateString("en-CA");
    }

}


// DISPLAY PURCHASE HISTORY
function displaySupplierPurchases() {

    const table = document.getElementById("supplierPurchaseTable");

    if (!table) return;

    const purchases = dashboardData.supplierPurchases || [];

    if (!purchases.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="supplier-empty">
                    No purchase records found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = purchases.map(purchase => {

        const supplier = dashboardData.suppliers.find(
            item => String(item.id) === String(purchase.supplierId)
        );

        const supplierName =
            purchase.supplierName ||
            (supplier ? supplier.name : "Deleted Supplier");

        const due = Math.max(
            0,
            Number(purchase.amount || 0) -
            Number(purchase.paid || 0)
        );

        return `
            <tr>

                <td>${escapeHTML(purchase.date || "-")}</td>

                <td>${escapeHTML(supplierName)}</td>

                <td>${escapeHTML(purchase.reference || "-")}</td>

                <td>${formatCurrency(purchase.amount)}</td>

                <td>${formatCurrency(purchase.paid)}</td>

                <td class="${due > 0 ? "supplier-due" : "supplier-paid"}">
                    ${formatCurrency(due)}
                </td>

                <td>${escapeHTML(purchase.paymentMethod || "-")}</td>

            </tr>
        `;

    }).join("");

}


// REFRESH SUPPLIER MODULE
function refreshSupplierModule() {

    displaySuppliers();

    populateSupplierSelect();

    displaySupplierPurchases();

}


// INITIALIZE SUPPLIER MODULE
function initializeSupplierModule() {

    document.getElementById("supplierSearch")
        .addEventListener("input", displaySuppliers);

    setDefaultPurchaseDate();

    refreshSupplierModule();

}


/* ==========================================
   PHASE 10: CUSTOMER MANAGEMENT
========================================== */

// Initialize customer data
if (!Array.isArray(dashboardData.customers)) {
    dashboardData.customers = [];
}

let selectedCustomerId = null;
let editingCustomerId = null;


// NORMALIZE CUSTOMER PHONE
function normalizeCustomerPhone(phone) {
    return String(phone || "").replace(/\s+/g, "").trim();
}


// GET CUSTOMER ORDERS
function getCustomerOrders(customer) {

    const customerName = String(customer.name || "")
        .trim()
        .toLowerCase();

    const customerPhone = normalizeCustomerPhone(customer.phone);

    return dashboardData.orders.filter(order => {

        const orderName = String(order.customer || "")
            .trim()
            .toLowerCase();

        // Current ordering module stores customer name on orders.
        // Phone matching is used when an order has a customerPhone field.
        const orderPhone = normalizeCustomerPhone(
            order.customerPhone || order.phone || ""
        );

        return (
            orderName === customerName ||
            (
                customerPhone &&
                orderPhone &&
                orderPhone === customerPhone
            )
        );

    });

}


// GET CUSTOMER SPENDING
function getCustomerSpending(customer) {

    const orders = getCustomerOrders(customer);

    const paidOrders = orders.filter(order => {

        return (
            order.paymentStatus === "Paid" ||
            order.status === "Completed"
        );

    });

    return paidOrders.reduce(
        (total, order) => total + reportOrderAmount(order),
        0
    );

}


// CUSTOMER SUMMARY
function updateCustomerSummary() {

    const totalCustomers = dashboardData.customers.length;

    const totalOrders = dashboardData.customers.reduce(
        (total, customer) =>
            total + getCustomerOrders(customer).length,
        0
    );

    const totalSpending = dashboardData.customers.reduce(
        (total, customer) =>
            total + getCustomerSpending(customer),
        0
    );


    document.getElementById("totalCustomers").textContent =
        totalCustomers;

    document.getElementById("customerTotalOrders").textContent =
        totalOrders;

    document.getElementById("customerTotalSpending").textContent =
        formatCurrency(totalSpending);

}


// DISPLAY CUSTOMER RECORDS
function displayCustomers() {

    const table = document.getElementById("customerTableBody");

    if (!table) return;

    const search = document.getElementById("customerSearch")
        .value.toLowerCase().trim();

    const customers = dashboardData.customers.filter(customer => {

        return [
            customer.name,
            customer.phone,
            customer.email,
            customer.type
        ].some(value =>
            String(value || "").toLowerCase().includes(search)
        );

    });


    if (!customers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="customer-empty">
                    No customers found.
                </td>
            </tr>
        `;

        updateCustomerSummary();
        return;
    }


    table.innerHTML = customers.map(customer => {

        const orders = getCustomerOrders(customer);

        const spending = getCustomerSpending(customer);

        const typeClass = customer.type === "VIP" ? "vip" : "";

        return `
            <tr>

                <td>
                    <strong>${escapeHTML(customer.name)}</strong>
                </td>

                <td>${escapeHTML(customer.phone)}</td>

                <td>${escapeHTML(customer.email || "-")}</td>

                <td>
                    <span class="customer-type-badge ${typeClass}">
                        ${escapeHTML(customer.type || "Regular")}
                    </span>
                </td>

                <td>${orders.length}</td>

                <td>${formatCurrency(spending)}</td>

                <td>

                    <button class="customer-action-btn customer-history-btn"
                        onclick="viewCustomerHistory('${escapeHTML(customer.id)}')">
                        History
                    </button>

                    <button class="customer-action-btn customer-edit-btn"
                        onclick="editCustomer('${escapeHTML(customer.id)}')">
                        Edit
                    </button>

                    <button class="customer-action-btn customer-delete-btn"
                        onclick="deleteCustomer('${escapeHTML(customer.id)}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");

    updateCustomerSummary();

}


// RESET CUSTOMER FORM
function resetCustomerForm() {

    document.getElementById("customerForm").reset();

    document.getElementById("customerId").value = "";

    editingCustomerId = null;

    document.getElementById("customerFormTitle").textContent =
        "Add New Customer";

    document.getElementById("customerSaveBtn").textContent =
        "Save Customer";

}


// ADD OR UPDATE CUSTOMER
document.getElementById("customerForm").addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const name = document.getElementById(
            "customerNameInput"
        ).value.trim();

        const phone = normalizeCustomerPhone(
            document.getElementById("customerPhoneInput").value
        );

        const duplicate = dashboardData.customers.some(customer => {

            return (
                normalizeCustomerPhone(customer.phone) === phone &&
                String(customer.id) !== String(editingCustomerId)
            );

        });

        if (duplicate) {
            alert("A customer with this phone number already exists.");
            return;
        }


        const customerData = {

            name: name,

            phone: phone,

            email: document.getElementById(
                "customerEmailInput"
            ).value.trim(),

            type: document.getElementById(
                "customerType"
            ).value,

            address: document.getElementById(
                "customerAddressInput"
            ).value.trim(),

            notes: document.getElementById(
                "customerNotes"
            ).value.trim()

        };


        if (editingCustomerId !== null) {

            const customer = dashboardData.customers.find(
                item => String(item.id) === String(editingCustomerId)
            );

            if (customer) {
                Object.assign(customer, customerData);
            }

            alert("Customer updated successfully!");

        } else {

            dashboardData.customers.push({

                id: "CUS-" + Date.now(),

                ...customerData,

                createdAt: new Date().toISOString()

            });

            alert("Customer added successfully!");

        }

        saveBusinessRecords();

        resetCustomerForm();

        refreshCustomerModule();

    }

);


// EDIT CUSTOMER
function editCustomer(id) {

    const customer = dashboardData.customers.find(
        item => String(item.id) === String(id)
    );

    if (!customer) return;

    editingCustomerId = id;

    document.getElementById("customerId").value = id;
    document.getElementById("customerNameInput").value = customer.name || "";
    document.getElementById("customerPhoneInput").value = customer.phone || "";
    document.getElementById("customerEmailInput").value = customer.email || "";
    document.getElementById("customerType").value = customer.type || "Regular";
    document.getElementById("customerAddressInput").value = customer.address || "";
    document.getElementById("customerNotes").value = customer.notes || "";

    document.getElementById("customerFormTitle").textContent =
        "Edit Customer";

    document.getElementById("customerSaveBtn").textContent =
        "Update Customer";

    document.getElementById("customerFormTitle").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// DELETE CUSTOMER
function deleteCustomer(id) {

    if (
        shouldConfirmRecordDelete() &&
        !confirm(
            "Delete this customer profile? Existing order records will remain."
        )
    ) {
        return;
    }

    dashboardData.customers = dashboardData.customers.filter(
        customer => String(customer.id) !== String(id)
    );

    if (String(selectedCustomerId) === String(id)) {
        clearCustomerHistory();
    }

    if (String(editingCustomerId) === String(id)) {
        resetCustomerForm();
    }

    saveBusinessRecords();

    refreshCustomerModule();

}


// VIEW CUSTOMER ORDER HISTORY
function viewCustomerHistory(id) {

    const customer = dashboardData.customers.find(
        item => String(item.id) === String(id)
    );

    if (!customer) return;

    selectedCustomerId = id;

    const orders = getCustomerOrders(customer);

    document.getElementById("customerHistoryTitle").textContent =
        "Order History: " + customer.name;

    const table = document.getElementById("customerHistoryTable");

    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="customer-empty">
                    This customer has no matching orders yet.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = orders.map(order => {

        const date = reportGetDate(order);

        const orderId = order.id || order.orderId || "N/A";

        const paid = (
            order.paymentStatus === "Paid" ||
            order.status === "Completed"
        );

        return `
            <tr>

                <td>${escapeHTML(orderId)}</td>

                <td>${date ? escapeHTML(date.toLocaleString()) : "Not recorded"}</td>

                <td>${escapeHTML(order.type || "-")}</td>

                <td>${formatCurrency(reportOrderAmount(order))}</td>

                <td>${paid ? "Paid" : "Unpaid"}</td>

                <td>${escapeHTML(order.status || "Pending")}</td>

            </tr>
        `;

    }).join("");

}


// CLEAR CUSTOMER HISTORY
function clearCustomerHistory() {

    selectedCustomerId = null;

    document.getElementById("customerHistoryTitle").textContent =
        "Customer Order History";

    document.getElementById("customerHistoryTable").innerHTML = `
        <tr>
            <td colspan="6">
                Select a customer to view order history.
            </td>
        </tr>
    `;

}


// REFRESH CUSTOMER MODULE
function refreshCustomerModule() {

    displayCustomers();

    if (selectedCustomerId !== null) {
        viewCustomerHistory(selectedCustomerId);
    }

}


// INITIALIZE CUSTOMER MODULE
function initializeCustomerModule() {

    document.getElementById("customerSearch")
        .addEventListener("input", displayCustomers);

    refreshCustomerModule();

}


// INITIALIZE BOTH MODULES
function initializeSupplierAndCustomerModules() {

    initializeSupplierModule();

    initializeCustomerModule();

}

initializeSupplierAndCustomerModules();
