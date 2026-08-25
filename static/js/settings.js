document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // MADHA MARINES SETTINGS
    // Flask + MySQL Version
    // =========================================================


    // =========================================================
    // ELEMENTS
    // =========================================================

    const shopSettingsForm =
        document.getElementById("shopSettingsForm");

    const inventorySettingsForm =
        document.getElementById("inventorySettingsForm");

    const settingsShopName =
        document.getElementById("settingsShopName");

    const settingsOwnerName =
        document.getElementById("settingsOwnerName");

    const settingsPhone =
        document.getElementById("settingsPhone");

    const settingsEmail =
        document.getElementById("settingsEmail");

    const settingsGstNumber =
        document.getElementById("settingsGstNumber");

    const settingsAddress =
        document.getElementById("settingsAddress");

    const lowStockLimit =
        document.getElementById("lowStockLimit");

    const currencySymbol =
        document.getElementById("currencySymbol");

    const dateFormat =
        document.getElementById("dateFormat");

    const invoicePrefix =
        document.getElementById("invoicePrefix");

    const shopSettingsMessage =
        document.getElementById("shopSettingsMessage");

    const inventorySettingsMessage =
        document.getElementById("inventorySettingsMessage");

    const downloadBackupButton =
        document.getElementById("downloadBackupButton");

    const restoreBackupFile =
        document.getElementById("restoreBackupFile");

    const selectBackupButton =
        document.getElementById("selectBackupButton");

    const restoreBackupButton =
        document.getElementById("restoreBackupButton");

    const selectedBackupFileName =
        document.getElementById("selectedBackupFileName");

    const backupMessage =
        document.getElementById("backupMessage");

    const resetAllDataButton =
        document.getElementById("resetAllDataButton");

    const resetMessage =
        document.getElementById("resetMessage");

    const settingsProductCount =
        document.getElementById("settingsProductCount");

    const settingsStockInCount =
        document.getElementById("settingsStockInCount");

    const settingsStockOutCount =
        document.getElementById("settingsStockOutCount");

    const settingsSupplierCount =
        document.getElementById("settingsSupplierCount");

    const settingsCustomerCount =
        document.getElementById("settingsCustomerCount");


    // =========================================================
    // DEFAULT SETTINGS
    // =========================================================

    const defaultShopSettings = {

        shopName:
            "Madha Marines",

        ownerName:
            "",

        phone:
            "",

        email:
            "",

        gstNumber:
            "",

        address:
            ""

    };


    const defaultInventorySettings = {

        lowStockLimit:
            5,

        currencySymbol:
            "₹",

        dateFormat:
            "DD-MM-YYYY",

        invoicePrefix:
            "MM"

    };


    // =========================================================
    // MESSAGE
    // =========================================================

    function showMessage(
        element,
        message,
        type = "success"
    ) {

        if (!element) {
            return;
        }

        element.textContent =
            message;

        element.classList.remove(
            "success-message",
            "error-message"
        );


        if (type === "success") {

            element.classList.add(
                "success-message"
            );

        } else {

            element.classList.add(
                "error-message"
            );

        }


        setTimeout(
            function () {

                element.textContent =
                    "";

                element.classList.remove(
                    "success-message",
                    "error-message"
                );

            },
            4000
        );

    }


    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    function isValidEmail(email) {

        const pattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return pattern.test(
            email
        );

    }


    // =========================================================
    // SAFE JSON RESPONSE
    // =========================================================

    async function readJsonResponse(
        response
    ) {

        try {

            return await response.json();

        } catch (error) {

            throw new Error(
                "Invalid response received from the server."
            );

        }

    }


    // =========================================================
    // LOAD SETTINGS
    // =========================================================

    async function loadSettings() {

        try {

            const response =
                await fetch(
                    "/api/settings"
                );

            const result =
                await readJsonResponse(
                    response
                );


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Unable to load settings."
                );

            }


            const shop =
                {
                    ...defaultShopSettings,
                    ...(result.shop || {})
                };


            const inventory =
                {
                    ...defaultInventorySettings,
                    ...(result.inventory || {})
                };


            settingsShopName.value =
                shop.shopName || "";

            settingsOwnerName.value =
                shop.ownerName || "";

            settingsPhone.value =
                shop.phone || "";

            settingsEmail.value =
                shop.email || "";

            settingsGstNumber.value =
                shop.gstNumber || "";

            settingsAddress.value =
                shop.address || "";


            lowStockLimit.value =
                Number(
                    inventory.lowStockLimit
                ) || 5;

            currencySymbol.value =
                inventory.currencySymbol ||
                "₹";

            dateFormat.value =
                inventory.dateFormat ||
                "DD-MM-YYYY";

            invoicePrefix.value =
                inventory.invoicePrefix ||
                "MM";

        } catch (error) {

            console.error(
                "Settings load error:",
                error
            );


            showMessage(
                shopSettingsMessage,
                error.message,
                "error"
            );

        }

    }


    // =========================================================
    // SAVE SHOP SETTINGS
    // =========================================================

    shopSettingsForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const shopName =
                settingsShopName.value
                    .trim();

            const ownerName =
                settingsOwnerName.value
                    .trim();

            const phone =
                settingsPhone.value
                    .trim();

            const email =
                settingsEmail.value
                    .trim();

            const gstNumber =
                settingsGstNumber.value
                    .trim()
                    .toUpperCase();

            const address =
                settingsAddress.value
                    .trim();


            if (!shopName) {

                showMessage(
                    shopSettingsMessage,
                    "Please enter the shop name.",
                    "error"
                );

                settingsShopName.focus();

                return;

            }


            if (
                phone &&
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                showMessage(
                    shopSettingsMessage,
                    "Phone number must contain exactly 10 digits.",
                    "error"
                );

                settingsPhone.focus();

                return;

            }


            if (
                email &&
                !isValidEmail(
                    email
                )
            ) {

                showMessage(
                    shopSettingsMessage,
                    "Please enter a valid email address.",
                    "error"
                );

                settingsEmail.focus();

                return;

            }


            if (
                gstNumber &&
                !/^[0-9A-Z]{15}$/.test(
                    gstNumber
                )
            ) {

                showMessage(
                    shopSettingsMessage,
                    "GST number must contain exactly 15 letters/numbers.",
                    "error"
                );

                settingsGstNumber.focus();

                return;

            }


            const submitButton =
                shopSettingsForm.querySelector(
                    "button[type='submit']"
                );


            submitButton.disabled =
                true;


            try {

                const response =
                    await fetch(
                        "/api/settings/shop",
                        {

                            method:
                                "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    {

                                        shopName,

                                        ownerName,

                                        phone,

                                        email,

                                        gstNumber,

                                        address

                                    }
                                )

                        }
                    );


                const result =
                    await readJsonResponse(
                        response
                    );


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to save shop details."
                    );

                }


                showMessage(
                    shopSettingsMessage,
                    result.message ||
                    "Shop details saved successfully."
                );

            } catch (error) {

                showMessage(
                    shopSettingsMessage,
                    error.message,
                    "error"
                );

            } finally {

                submitButton.disabled =
                    false;

            }

        }
    );


    // =========================================================
    // SAVE INVENTORY SETTINGS
    // =========================================================

    inventorySettingsForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const enteredLowStockLimit =
                Number(
                    lowStockLimit.value
                );

            const enteredCurrency =
                currencySymbol.value;

            const enteredDateFormat =
                dateFormat.value;

            const enteredInvoicePrefix =
                invoicePrefix.value
                    .trim()
                    .toUpperCase();


            if (
                !Number.isFinite(
                    enteredLowStockLimit
                ) ||
                enteredLowStockLimit < 0
            ) {

                showMessage(
                    inventorySettingsMessage,
                    "Low-stock limit cannot be negative.",
                    "error"
                );

                lowStockLimit.focus();

                return;

            }


            if (
                enteredInvoicePrefix === ""
            ) {

                showMessage(
                    inventorySettingsMessage,
                    "Please enter an invoice prefix.",
                    "error"
                );

                invoicePrefix.focus();

                return;

            }


            const submitButton =
                inventorySettingsForm
                    .querySelector(
                        "button[type='submit']"
                    );


            submitButton.disabled =
                true;


            try {

                const response =
                    await fetch(
                        "/api/settings/inventory",
                        {

                            method:
                                "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    {

                                        lowStockLimit:
                                            enteredLowStockLimit,

                                        currencySymbol:
                                            enteredCurrency,

                                        dateFormat:
                                            enteredDateFormat,

                                        invoicePrefix:
                                            enteredInvoicePrefix

                                    }
                                )

                        }
                    );


                const result =
                    await readJsonResponse(
                        response
                    );


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to save inventory settings."
                    );

                }


                showMessage(
                    inventorySettingsMessage,
                    result.message ||
                    "Inventory settings saved successfully."
                );

            } catch (error) {

                showMessage(
                    inventorySettingsMessage,
                    error.message,
                    "error"
                );

            } finally {

                submitButton.disabled =
                    false;

            }

        }
    );


    // =========================================================
    // PHONE INPUT
    // =========================================================

    settingsPhone.addEventListener(
        "input",
        function () {

            settingsPhone.value =
                settingsPhone.value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        10
                    );

        }
    );


    // =========================================================
    // GST INPUT
    // =========================================================

    settingsGstNumber.addEventListener(
        "input",
        function () {

            settingsGstNumber.value =
                settingsGstNumber.value
                    .toUpperCase()
                    .replace(
                        /[^0-9A-Z]/g,
                        ""
                    )
                    .slice(
                        0,
                        15
                    );

        }
    );


    // =========================================================
    // INVOICE PREFIX INPUT
    // =========================================================

    invoicePrefix.addEventListener(
        "input",
        function () {

            invoicePrefix.value =
                invoicePrefix.value
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9-]/g,
                        ""
                    )
                    .slice(
                        0,
                        10
                    );

        }
    );


    // =========================================================
    // RECORD SUMMARY
    // =========================================================

    async function loadDataSummary() {

        try {

            const responses =
                await Promise.all(
                    [

                        fetch(
                            "/api/products"
                        ),

                        fetch(
                            "/api/stock-in"
                        ),

                        fetch(
                            "/api/stock-out"
                        ),

                        fetch(
                            "/api/suppliers"
                        ),

                        fetch(
                            "/api/customers"
                        )

                    ]
                );


            const results =
                await Promise.all(
                    responses.map(
                        function (response) {

                            return response.json();

                        }
                    )
                );


            const productResult =
                results[0];

            const stockInResult =
                results[1];

            const stockOutResult =
                results[2];

            const supplierResult =
                results[3];

            const customerResult =
                results[4];


            settingsProductCount.textContent =
                Array.isArray(
                    productResult.products
                )
                    ? productResult.products.length
                    : 0;


            settingsStockInCount.textContent =
                Array.isArray(
                    stockInResult.history
                )
                    ? stockInResult.history.length
                    : 0;


            settingsStockOutCount.textContent =
                Array.isArray(
                    stockOutResult.sales
                )
                    ? stockOutResult.sales.length
                    : 0;


            settingsSupplierCount.textContent =
                Array.isArray(
                    supplierResult.suppliers
                )
                    ? supplierResult.suppliers.length
                    : 0;


            settingsCustomerCount.textContent =
                Array.isArray(
                    customerResult.customers
                )
                    ? customerResult.customers.length
                    : 0;

        } catch (error) {

            console.error(
                "Unable to load data summary:",
                error
            );

        }

    }


    // =========================================================
    // FORMAT BACKUP FILE DATE
    // =========================================================

    function formatDateForFilename(
        date
    ) {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );

        const hours =
            String(
                date.getHours()
            ).padStart(
                2,
                "0"
            );

        const minutes =
            String(
                date.getMinutes()
            ).padStart(
                2,
                "0"
            );


        return (
            `${year}-${month}-${day}-${hours}-${minutes}`
        );

    }


    // =========================================================
    // DOWNLOAD MYSQL BACKUP
    // =========================================================

    downloadBackupButton.addEventListener(
        "click",
        async function () {

            downloadBackupButton.disabled =
                true;


            try {

                const response =
                    await fetch(
                        "/api/backup"
                    );


                const result =
                    await readJsonResponse(
                        response
                    );


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to create backup."
                    );

                }


                const backupData = {

                    application:
                        "Madha Marines Inventory System",

                    backupVersion:
                        2,

                    createdAt:
                        new Date().toISOString(),

                    data:
                        result.data

                };


                const backupJSON =
                    JSON.stringify(
                        backupData,
                        null,
                        2
                    );


                const blob =
                    new Blob(
                        [
                            backupJSON
                        ],
                        {
                            type:
                                "application/json"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const downloadLink =
                    document.createElement(
                        "a"
                    );


                downloadLink.href =
                    url;


                downloadLink.download =
                    (
                        "madha-marines-backup-" +
                        formatDateForFilename(
                            new Date()
                        ) +
                        ".json"
                    );


                document.body.appendChild(
                    downloadLink
                );


                downloadLink.click();


                document.body.removeChild(
                    downloadLink
                );


                URL.revokeObjectURL(
                    url
                );


                showMessage(
                    backupMessage,
                    "Database backup downloaded successfully."
                );

            } catch (error) {

                showMessage(
                    backupMessage,
                    error.message,
                    "error"
                );

            } finally {

                downloadBackupButton.disabled =
                    false;

            }

        }
    );


    // =========================================================
    // SELECT BACKUP FILE
    // =========================================================

    selectBackupButton.addEventListener(
        "click",
        function () {

            restoreBackupFile.click();

        }
    );


    // =========================================================
    // BACKUP FILE CHANGED
    // =========================================================

    restoreBackupFile.addEventListener(
        "change",
        function () {

            const selectedFile =
                restoreBackupFile.files[0];


            if (!selectedFile) {

                selectedBackupFileName.textContent =
                    "No file selected";

                restoreBackupButton.disabled =
                    true;

                return;

            }


            if (
                !selectedFile.name
                    .toLowerCase()
                    .endsWith(
                        ".json"
                    )
            ) {

                selectedBackupFileName.textContent =
                    "Invalid file type";

                restoreBackupButton.disabled =
                    true;


                showMessage(
                    backupMessage,
                    "Please select a JSON backup file.",
                    "error"
                );

                return;

            }


            selectedBackupFileName.textContent =
                selectedFile.name;


            restoreBackupButton.disabled =
                false;


            showMessage(
                backupMessage,
                "Backup selected. Click Restore Data to continue."
            );

        }
    );


    // =========================================================
    // RESTORE MYSQL BACKUP
    // =========================================================

    restoreBackupButton.addEventListener(
        "click",
        async function () {

            const selectedFile =
                restoreBackupFile.files[0];


            if (!selectedFile) {

                showMessage(
                    backupMessage,
                    "Please select a backup file.",
                    "error"
                );

                return;

            }


            const confirmed =
                confirm(
                    "Restoring this backup will replace the current database records. Continue?"
                );


            if (!confirmed) {

                return;

            }


            restoreBackupButton.disabled =
                true;


            try {

                const fileText =
                    await selectedFile.text();


                let backupData;


                try {

                    backupData =
                        JSON.parse(
                            fileText
                        );

                } catch (error) {

                    throw new Error(
                        "The selected backup file contains invalid JSON."
                    );

                }


                if (
                    !backupData ||
                    backupData.application !==
                        "Madha Marines Inventory System" ||
                    !backupData.data
                ) {

                    throw new Error(
                        "The selected file is not a valid Madha Marines database backup."
                    );

                }


                const response =
                    await fetch(
                        "/api/restore",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    backupData
                                )

                        }
                    );


                const result =
                    await readJsonResponse(
                        response
                    );


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to restore backup."
                    );

                }


                showMessage(
                    backupMessage,
                    result.message ||
                    "Database restored successfully."
                );


                restoreBackupFile.value =
                    "";


                selectedBackupFileName.textContent =
                    "No file selected";


                await loadSettings();

                await loadDataSummary();

            } catch (error) {

                showMessage(
                    backupMessage,
                    error.message,
                    "error"
                );

            } finally {

                restoreBackupButton.disabled =
                    true;

            }

        }
    );


    // =========================================================
    // RESET ALL MYSQL DATA
    // =========================================================

    resetAllDataButton.addEventListener(
        "click",
        async function () {

            const firstConfirmation =
                confirm(
                    "WARNING: This will permanently delete products, sales, stock history, invoices, suppliers, customers and settings from MySQL. Continue?"
                );


            if (!firstConfirmation) {

                return;

            }


            const confirmationText =
                prompt(
                    'Type "DELETE" to permanently reset all application data.'
                );


            if (
                confirmationText !==
                "DELETE"
            ) {

                showMessage(
                    resetMessage,
                    "Reset cancelled. You must type DELETE exactly.",
                    "error"
                );

                return;

            }


            const finalConfirmation =
                confirm(
                    "Final warning: this action cannot be undone unless you have a backup. Delete everything?"
                );


            if (!finalConfirmation) {

                return;

            }


            resetAllDataButton.disabled =
                true;


            try {

                const response =
                    await fetch(
                        "/api/reset-data",
                        {

                            method:
                                "DELETE",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            }

                        }
                    );


                const result =
                    await readJsonResponse(
                        response
                    );


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to reset application data."
                    );

                }


                showMessage(
                    resetMessage,
                    result.message ||
                    "Application data reset successfully."
                );


                await loadSettings();

                await loadDataSummary();


                setTimeout(
                    function () {

                        window.location.reload();

                    },
                    1500
                );

            } catch (error) {

                showMessage(
                    resetMessage,
                    error.message,
                    "error"
                );

                resetAllDataButton.disabled =
                    false;

            }

        }
    );


    // =========================================================
    // REFRESH COUNTS WHEN WINDOW REGAINS FOCUS
    // =========================================================

    window.addEventListener(
        "focus",
        function () {

            loadDataSummary();

        }
    );


    // =========================================================
    // INITIALIZE SETTINGS PAGE
    // =========================================================

    async function initializeSettingsPage() {

        await Promise.all(
            [

                loadSettings(),

                loadDataSummary()

            ]
        );

    }


    initializeSettingsPage();

});