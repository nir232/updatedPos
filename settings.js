

/* ==========================================
   PHASE 8: SETTINGS MODULE
========================================== */

// Default settings
const defaultPOSSettings = {

    restaurant: {
        name: "FoodPoint Restaurant",
        phone: "",
        email: "",
        website: "",
        address: ""
    },

    business: {
        currency: "BDT",
        tax: 0,
        serviceCharge: 0,
        defaultOrderType: "Dine-in"
    },

    receipt: {
        header: "Welcome to FoodPoint!",
        footer: "Thank you for visiting us!",
        showCustomer: true,
        showPhone: true,
        showAddress: true
    },

    order: {
        prefix: "ORD-",
        defaultTable: "1"
    },

    system: {
        theme: "light",
        confirmDelete: true
    }

};


// Ensure settings object exists
if (
    !dashboardData.settings ||
    typeof dashboardData.settings !== "object"
) {
    dashboardData.settings = {};
}


// Merge defaults with saved settings
function loadPOSSettings() {

    dashboardData.settings = {

        ...defaultPOSSettings,

        ...dashboardData.settings,

        restaurant: {
            ...defaultPOSSettings.restaurant,
            ...(dashboardData.settings.restaurant || {})
        },

        business: {
            ...defaultPOSSettings.business,
            ...(dashboardData.settings.business || {})
        },

        receipt: {
            ...defaultPOSSettings.receipt,
            ...(dashboardData.settings.receipt || {})
        },

        order: {
            ...defaultPOSSettings.order,
            ...(dashboardData.settings.order || {})
        },

        system: {
            ...defaultPOSSettings.system,
            ...(dashboardData.settings.system || {})
        }

    };

}

loadPOSSettings();


// SAVE SETTINGS
function savePOSSettings() {

    localStorage.setItem(
        "restaurantPOS",
        JSON.stringify(dashboardData)
    );

}


// SHOW SETTINGS MESSAGE
function showSettingsMessage(message, type = "success") {

    const messageBox = document.getElementById(
        "settingsMessage"
    );

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = "settings-message " + type;

}


// SETTINGS TAB NAVIGATION
function initializeSettingsTabs() {

    const tabs = document.querySelectorAll(".settings-tab");
    const panels = document.querySelectorAll(".settings-panel");

    tabs.forEach(tab => {

        tab.addEventListener("click", function() {

            const target = this.dataset.settingsTab;

            tabs.forEach(item =>
                item.classList.remove("active")
            );

            panels.forEach(panel =>
                panel.classList.remove("active")
            );

            this.classList.add("active");

            const selectedPanel = document.getElementById(target);

            if (selectedPanel) {
                selectedPanel.classList.add("active");
            }

        });

    });

}


// LOAD SAVED SETTINGS INTO INPUTS
function displayPOSSettings() {

    const settings = dashboardData.settings;

    // Restaurant
    document.getElementById("settingRestaurantName").value =
        settings.restaurant.name;

    document.getElementById("settingPhone").value =
        settings.restaurant.phone;

    document.getElementById("settingEmail").value =
        settings.restaurant.email;

    document.getElementById("settingWebsite").value =
        settings.restaurant.website;

    document.getElementById("settingAddress").value =
        settings.restaurant.address;


    // Business
    document.getElementById("settingCurrency").value =
        settings.business.currency;

    document.getElementById("settingTax").value =
        settings.business.tax;

    document.getElementById("settingServiceCharge").value =
        settings.business.serviceCharge;

    document.getElementById("settingDefaultOrderType").value =
        settings.business.defaultOrderType;


    // Receipt
    document.getElementById("settingReceiptHeader").value =
        settings.receipt.header;

    document.getElementById("settingReceiptFooter").value =
        settings.receipt.footer;

    document.getElementById("settingShowCustomer").checked =
        settings.receipt.showCustomer;

    document.getElementById("settingShowPhone").checked =
        settings.receipt.showPhone;

    document.getElementById("settingShowAddress").checked =
        settings.receipt.showAddress;


    // Order
    document.getElementById("settingOrderPrefix").value =
        settings.order.prefix;

    document.getElementById("settingDefaultTable").value =
        settings.order.defaultTable;


    // System
    document.getElementById("settingTheme").value =
        settings.system.theme;

    document.getElementById("settingConfirmDelete").checked =
        settings.system.confirmDelete;

    applyPOSTheme();

}


// RESTAURANT PROFILE FORM
document.getElementById("restaurantProfileForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        dashboardData.settings.restaurant = {

            name: document.getElementById(
                "settingRestaurantName"
            ).value.trim(),

            phone: document.getElementById(
                "settingPhone"
            ).value.trim(),

            email: document.getElementById(
                "settingEmail"
            ).value.trim(),

            website: document.getElementById(
                "settingWebsite"
            ).value.trim(),

            address: document.getElementById(
                "settingAddress"
            ).value.trim()

        };

        savePOSSettings();

        showSettingsMessage(
            "Restaurant profile saved successfully!"
        );

    });


// BUSINESS SETTINGS FORM
document.getElementById("businessSettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const tax = Number(
            document.getElementById("settingTax").value
        );

        const serviceCharge = Number(
            document.getElementById("settingServiceCharge").value
        );

        if (
            !Number.isFinite(tax) ||
            !Number.isFinite(serviceCharge) ||
            tax < 0 || tax > 100 ||
            serviceCharge < 0 || serviceCharge > 100
        ) {

            showSettingsMessage(
                "Tax and service charge must be between 0 and 100.",
                "error"
            );

            return;
        }

        dashboardData.settings.business = {

            currency: document.getElementById(
                "settingCurrency"
            ).value,

            tax: tax,

            serviceCharge: serviceCharge,

            defaultOrderType: document.getElementById(
                "settingDefaultOrderType"
            ).value

        };

        savePOSSettings();

        showSettingsMessage(
            "Business settings saved successfully!"
        );

    });


// RECEIPT SETTINGS FORM
document.getElementById("receiptSettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        dashboardData.settings.receipt = {

            header: document.getElementById(
                "settingReceiptHeader"
            ).value.trim(),

            footer: document.getElementById(
                "settingReceiptFooter"
            ).value.trim(),

            showCustomer: document.getElementById(
                "settingShowCustomer"
            ).checked,

            showPhone: document.getElementById(
                "settingShowPhone"
            ).checked,

            showAddress: document.getElementById(
                "settingShowAddress"
            ).checked

        };

        savePOSSettings();

        showSettingsMessage(
            "Receipt settings saved successfully!"
        );

    });


// ORDER SETTINGS FORM
document.getElementById("orderSettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const prefix = document.getElementById(
            "settingOrderPrefix"
        ).value.trim();

        if (!prefix) {

            showSettingsMessage(
                "Please enter an order ID prefix.",
                "error"
            );

            return;
        }

        dashboardData.settings.order = {

            prefix: prefix,

            defaultTable: document.getElementById(
                "settingDefaultTable"
            ).value

        };

        savePOSSettings();

        showSettingsMessage(
            "Order settings saved successfully!"
        );

    });


// APPLY THEME
function applyPOSTheme() {

    const theme = dashboardData.settings.system.theme;

    document.body.classList.toggle(
        "dark-theme",
        theme === "dark"
    );

}


// SYSTEM PREFERENCES FORM
document.getElementById("systemPreferencesForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        dashboardData.settings.system = {

            theme: document.getElementById(
                "settingTheme"
            ).value,

            confirmDelete: document.getElementById(
                "settingConfirmDelete"
            ).checked

        };

        savePOSSettings();

        applyPOSTheme();

        showSettingsMessage(
            "System preferences saved successfully!"
        );

    });


// EXPORT POS DATA
function exportPOSBackup() {

    savePOSSettings();

    const backupData = JSON.stringify(
        dashboardData,
        null,
        2
    );

    const blob = new Blob(
        [backupData],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        "FoodPoint_POS_Backup_" +
        new Date().toISOString().slice(0, 10) +
        ".json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showSettingsMessage(
        "POS backup exported successfully!"
    );

}


// IMPORT POS DATA
function importPOSBackup() {

    const fileInput = document.getElementById(
        "importPOSFile"
    );

    const file = fileInput.files[0];

    if (!file) {

        showSettingsMessage(
            "Please select a JSON backup file.",
            "error"
        );

        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {

        try {

            const importedData = JSON.parse(
                event.target.result
            );

            // Basic backup validation
            if (
                !importedData ||
                typeof importedData !== "object" ||
                Array.isArray(importedData) ||
                !Array.isArray(importedData.orders)
            ) {

                throw new Error("Invalid POS backup file.");

            }

            const confirmed = confirm(
                "Importing this backup will replace your current POS data. Continue?"
            );

            if (!confirmed) return;

            // Restore data
            dashboardData = importedData;

            // Ensure required arrays exist
            if (!Array.isArray(dashboardData.menu)) {
                dashboardData.menu = [];
            }

            if (!Array.isArray(dashboardData.stock)) {
                dashboardData.stock = [];
            }

            if (!Array.isArray(dashboardData.stockTransactions)) {
                dashboardData.stockTransactions = [];
            }

            if (!Array.isArray(dashboardData.orders)) {
                dashboardData.orders = [];
            }

            loadPOSSettings();

            savePOSSettings();

            showSettingsMessage(
                "Backup imported successfully. Reloading POS..."
            );

            setTimeout(() => {
                location.reload();
            }, 1000);

        } catch (error) {

            showSettingsMessage(
                "Import failed: " + error.message,
                "error"
            );

        }

    };

    reader.onerror = function() {

        showSettingsMessage(
            "Unable to read the selected backup file.",
            "error"
        );

    };

    reader.readAsText(file);

}


// RESET POS DATA
function resetRestaurantPOS() {

    const confirmed = confirm(
        "This will delete your current POS data and reload the original sample data. Have you exported a backup?"
    );

    if (!confirmed) return;

    localStorage.removeItem("restaurantPOS");

    location.reload();

}


// CONNECT DATA MANAGEMENT BUTTONS
function initializeDataManagement() {

    document.getElementById("exportPOSData")
        .addEventListener("click", exportPOSBackup);

    document.getElementById("importPOSData")
        .addEventListener("click", importPOSBackup);

    document.getElementById("resetPOSData")
        .addEventListener("click", resetRestaurantPOS);

}


// INITIALIZE SETTINGS MODULE
function initializeSettingsModule() {

    initializeSettingsTabs();

    displayPOSSettings();

    initializeDataManagement();

}

initializeSettingsModule();
