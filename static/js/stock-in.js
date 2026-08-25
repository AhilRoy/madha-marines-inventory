document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // HTML ELEMENTS
    // ==========================================

    const stockInForm =
        document.getElementById("stockInForm");

    const stockProduct =
        document.getElementById("stockProduct");

    const stockQuantity =
        document.getElementById("stockQuantity");

    const stockQuantityUnit =
        document.getElementById("stockQuantityUnit");

    const stockSupplier =
        document.getElementById("stockSupplier");

    const invoiceNumber =
        document.getElementById("invoiceNumber");

    const stockDate =
        document.getElementById("stockDate");

    const stockNotes =
        document.getElementById("stockNotes");

    const productStockInfo =
        document.getElementById("productStockInfo");

    const selectedProductName =
        document.getElementById("selectedProductName");

    const selectedProductCategory =
        document.getElementById("selectedProductCategory");

    const selectedProductUnit =
        document.getElementById("selectedProductUnit");

    const selectedProductPrice =
        document.getElementById("selectedProductPrice");

    const selectedCurrentStock =
        document.getElementById("selectedCurrentStock");

    const selectedQuantityAdded =
        document.getElementById("selectedQuantityAdded");

    const stockAfterAdding =
        document.getElementById("stockAfterAdding");

    const stockInMessage =
        document.getElementById("stockInMessage");

    const stockInTableBody =
        document.getElementById("stockInTableBody");

    const stockInSearch =
        document.getElementById("stockInSearch");

    const clearStockHistory =
        document.getElementById("clearStockHistory");

    const stockTotalProducts =
        document.getElementById("stockTotalProducts");

    const stockTotalQuantity =
        document.getElementById("stockTotalQuantity");

    const totalStockAdded =
        document.getElementById("totalStockAdded");

    const stockInButton =
        document.getElementById("stockInButton");


    let products = [];
    let suppliers = [];
    let stockInHistory = [];


    // ==========================================
    // SET TODAY
    // ==========================================

    function setTodayDate() {

        stockDate.value =
            new Date().toISOString().split("T")[0];
    }


    // ==========================================
    // FORMAT HELPERS
    // ==========================================

    function formatQuantity(quantity) {

        const number = Number(quantity);

        if (!Number.isFinite(number)) {
            return "0";
        }

        return Number(
            number.toFixed(2)
        ).toString();
    }


    function formatUnit(unit) {

        const unitNames = {
            kg: "kg",
            gram: "g",
            meter: "m",
            roll: "Roll",
            piece: "Piece",
            pair: "Pair",
            packet: "Packet",
            box: "Box",
            bundle: "Bundle",
            dozen: "Dozen"
        };

        return unitNames[unit] || unit || "Piece";
    }


    function formatQuantityWithUnit(
        quantity,
        unit
    ) {

        return (
            formatQuantity(quantity) +
            " " +
            formatUnit(unit)
        );
    }


    function formatCurrency(amount) {

        const number = Number(amount) || 0;

        return number.toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    function escapeHtml(value) {

        const div = document.createElement("div");

        div.textContent = String(value ?? "");

        return div.innerHTML;
    }


    function showMessage(message, type) {

        stockInMessage.textContent = message;

        stockInMessage.style.color =
            type === "success"
                ? "#15803d"
                : "#dc2626";

        setTimeout(function () {
            stockInMessage.textContent = "";
        }, 4000);
    }


    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    async function loadProducts() {

        const response =
            await fetch("/api/products");

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to load products."
            );
        }

        products =
            Array.isArray(result.products)
                ? result.products
                : [];

        loadProductOptions();

        updateSummary();
    }


    function loadProductOptions() {

        const previousValue =
            stockProduct.value;

        stockProduct.innerHTML = `

            <option value="">
                Select a product
            </option>

        `;

        const activeProducts =
            products.filter(function (product) {

                return product.status !== "Inactive";
            });

        activeProducts.forEach(function (product) {

            const option =
                document.createElement("option");

            option.value = product.id;

            option.textContent =
                product.name +
                " - Stock: " +
                formatQuantityWithUnit(
                    product.quantity,
                    product.unit
                );

            stockProduct.appendChild(option);
        });

        if (activeProducts.length === 0) {

            const option =
                document.createElement("option");

            option.textContent =
                "No active products available";

            option.disabled = true;

            stockProduct.appendChild(option);
        }

        const stillExists =
            activeProducts.some(function (product) {

                return String(product.id) ===
                    String(previousValue);
            });

        if (stillExists) {
            stockProduct.value = previousValue;
        }
    }


    // ==========================================
    // LOAD SUPPLIERS
    // ==========================================

    async function loadSuppliers() {

        const response =
            await fetch("/api/suppliers");

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to load suppliers."
            );
        }

        suppliers =
            Array.isArray(result.suppliers)
                ? result.suppliers
                : [];

        loadSupplierOptions();
    }


    function loadSupplierOptions() {

        const previousValue =
            stockSupplier.value;

        stockSupplier.innerHTML = `

            <option value="">
                Select Supplier
            </option>

        `;

        const activeSuppliers =
            suppliers.filter(function (supplier) {

                return supplier.status === "Active";
            });

        activeSuppliers.forEach(function (supplier) {

            const option =
                document.createElement("option");

            option.value = supplier.id;
            option.textContent = supplier.name;

            stockSupplier.appendChild(option);
        });

        if (activeSuppliers.length === 0) {

            const option =
                document.createElement("option");

            option.textContent =
                "No active suppliers available";

            option.disabled = true;

            stockSupplier.appendChild(option);
        }

        const stillExists =
            activeSuppliers.some(function (supplier) {

                return String(supplier.id) ===
                    String(previousValue);
            });

        if (stillExists) {
            stockSupplier.value = previousValue;
        }
    }


    // ==========================================
    // LOAD STOCK-IN HISTORY
    // ==========================================

    async function loadStockInHistory() {

        stockInTableBody.innerHTML = `

            <tr>
                <td
                    colspan="10"
                    class="empty-table-message">

                    Loading stock-in history...

                </td>
            </tr>

        `;

        const response =
            await fetch("/api/stock-in");

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to load stock-in history."
            );
        }

        stockInHistory =
            Array.isArray(result.history)
                ? result.history
                : [];

        displayStockHistory();

        updateSummary();
    }


    // ==========================================
    // SELECTED PRODUCT
    // ==========================================

    function getSelectedProduct() {

        return products.find(function (product) {

            return String(product.id) ===
                String(stockProduct.value);
        });
    }


    function selectProductSupplier(product) {

        if (!product || !product.supplierId) {
            return;
        }

        const supplierExists =
            Array.from(stockSupplier.options)
                .some(function (option) {

                    return String(option.value) ===
                        String(product.supplierId);
                });

        if (supplierExists) {

            stockSupplier.value =
                String(product.supplierId);
        }
    }


    function resetProductInformation() {

        productStockInfo.classList.remove("show");

        selectedProductName.textContent = "-";
        selectedProductCategory.textContent = "-";
        selectedProductUnit.textContent = "-";
        selectedProductPrice.textContent = "₹0.00";
        selectedCurrentStock.textContent = "0";
        selectedQuantityAdded.textContent = "0";
        stockAfterAdding.textContent = "0";

        stockQuantityUnit.textContent =
            "Select a product to view its unit";
    }


    function updateProductInformation() {

        const selectedProduct =
            getSelectedProduct();

        if (!selectedProduct) {

            resetProductInformation();

            return;
        }

        const unit =
            selectedProduct.unit || "piece";

        const enteredQuantity =
            Number(stockQuantity.value);

        const quantityToAdd =
            Number.isFinite(enteredQuantity) &&
            enteredQuantity > 0
                ? enteredQuantity
                : 0;

        const currentStock =
            Number(selectedProduct.quantity) || 0;

        const newStock =
            currentStock + quantityToAdd;

        productStockInfo.classList.add("show");

        selectedProductName.textContent =
            selectedProduct.name || "-";

        selectedProductCategory.textContent =
            selectedProduct.category || "-";

        selectedProductUnit.textContent =
            formatUnit(unit);

        selectedProductPrice.textContent =
            formatCurrency(selectedProduct.price);

        selectedCurrentStock.textContent =
            formatQuantityWithUnit(
                currentStock,
                unit
            );

        selectedQuantityAdded.textContent =
            formatQuantityWithUnit(
                quantityToAdd,
                unit
            );

        stockAfterAdding.textContent =
            formatQuantityWithUnit(
                newStock,
                unit
            );

        stockQuantityUnit.textContent =
            "Enter quantity in " +
            formatUnit(unit);

        if (!stockSupplier.value) {

            selectProductSupplier(
                selectedProduct
            );
        }
    }


    // ==========================================
    // SUMMARY
    // ==========================================

    function updateSummary() {

        stockTotalProducts.textContent =
            products.length;

        stockTotalQuantity.textContent =
            products.filter(function (product) {

                return Number(product.quantity) > 0;
            }).length;

        totalStockAdded.textContent =
            stockInHistory.length;
    }


    // ==========================================
    // DISPLAY HISTORY
    // ==========================================

    function displayStockHistory(
        historyList = stockInHistory
    ) {

        stockInTableBody.innerHTML = "";

        if (historyList.length === 0) {

            stockInTableBody.innerHTML = `

                <tr>
                    <td
                        colspan="10"
                        class="empty-table-message">

                        No stock-in history found

                    </td>
                </tr>

            `;

            return;
        }

        historyList.forEach(function (history) {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHtml(history.id)}
                </td>

                <td>
                    ${escapeHtml(history.date || "-")}
                </td>

                <td>
                    ${escapeHtml(
                        history.productName || "-"
                    )}
                </td>

                <td>
                    ${formatQuantity(
                        history.previousStock
                    )}
                </td>

                <td>
                    <span class="quantity-added">
                        +${formatQuantity(
                            history.quantityAdded
                        )}
                    </span>
                </td>

                <td class="current-stock">
                    ${formatQuantity(
                        history.newStock
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        formatUnit(history.unit)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        history.supplier || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        history.invoice || "-"
                    )}
                </td>

                <td class="stock-added">

                    <i class="fa-solid fa-circle-check"></i>

                    ${escapeHtml(
                        history.status || "Completed"
                    )}

                </td>

            `;

            stockInTableBody.appendChild(row);
        });
    }


    // ==========================================
    // ADD STOCK
    // ==========================================

    stockInForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const selectedProduct =
                getSelectedProduct();

            const quantityToAdd =
                Number(stockQuantity.value);

            const supplierId =
                Number(stockSupplier.value);

            if (!selectedProduct) {

                showMessage(
                    "Please select a product.",
                    "error"
                );

                return;
            }

            if (
                !Number.isFinite(quantityToAdd) ||
                quantityToAdd <= 0
            ) {

                showMessage(
                    "Quantity must be greater than zero.",
                    "error"
                );

                return;
            }

            if (
                Math.round(quantityToAdd * 100) !==
                quantityToAdd * 100
            ) {

                showMessage(
                    "Quantity can have a maximum of two decimal places.",
                    "error"
                );

                return;
            }

            if (!supplierId) {

                showMessage(
                    "Please select a supplier.",
                    "error"
                );

                return;
            }

            if (!stockDate.value) {

                showMessage(
                    "Please select the received date.",
                    "error"
                );

                return;
            }

            const stockData = {
                productId:
                    Number(selectedProduct.id),

                supplierId:
                    supplierId,

                quantityAdded:
                    Number(quantityToAdd.toFixed(2)),

                invoice:
                    invoiceNumber.value.trim(),

                date:
                    stockDate.value,

                notes:
                    stockNotes.value.trim()
            };

            stockInButton.disabled = true;

            stockInButton.textContent =
                "Adding Stock...";

            try {

                const response =
                    await fetch(
                        "/api/stock-in",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(stockData)
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Unable to add stock."
                    );
                }

                showMessage(
                    result.message,
                    "success"
                );

                stockInForm.reset();

                setTodayDate();

                resetProductInformation();

                await loadProducts();

                await loadSuppliers();

                await loadStockInHistory();

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            } finally {

                stockInButton.disabled = false;

                stockInButton.innerHTML = `

                    <i class="fa-solid fa-plus"></i>
                    Add Stock

                `;
            }
        }
    );


    // ==========================================
    // SEARCH
    // ==========================================

    stockInSearch.addEventListener(
        "input",
        function () {

            const searchValue =
                stockInSearch.value
                    .trim()
                    .toLowerCase();

            const filteredHistory =
                stockInHistory.filter(
                    function (history) {

                        const searchableText = [

                            history.id,
                            history.date,
                            history.productName,
                            history.category,
                            history.previousStock,
                            history.quantityAdded,
                            history.newStock,
                            history.unit,
                            formatUnit(history.unit),
                            history.supplier,
                            history.invoice,
                            history.notes,
                            history.status

                        ]
                            .join(" ")
                            .toLowerCase();

                        return searchableText
                            .includes(searchValue);
                    }
                );

            displayStockHistory(
                filteredHistory
            );
        }
    );


    // ==========================================
    // CLEAR HISTORY
    // ==========================================

    clearStockHistory.addEventListener(
        "click",
        async function () {

            if (stockInHistory.length === 0) {

                showMessage(
                    "There is no stock history to clear.",
                    "error"
                );

                return;
            }

            const confirmation =
                confirm(
                    "Clear all stock-in history? Product quantities will not be changed."
                );

            if (!confirmation) {
                return;
            }

            clearStockHistory.disabled = true;

            try {

                const response =
                    await fetch(
                        "/api/stock-in",
                        {
                            method: "DELETE"
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Unable to clear history."
                    );
                }

                showMessage(
                    result.message,
                    "success"
                );

                await loadStockInHistory();

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            } finally {

                clearStockHistory.disabled = false;
            }
        }
    );


    // ==========================================
    // EVENTS
    // ==========================================

    stockProduct.addEventListener(
        "change",
        function () {

            stockQuantity.value = "";

            updateProductInformation();
        }
    );

    stockQuantity.addEventListener(
        "input",
        updateProductInformation
    );


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    async function initializePage() {

        setTodayDate();

        resetProductInformation();

        try {

            await Promise.all([
                loadProducts(),
                loadSuppliers(),
                loadStockInHistory()
            ]);

        } catch (error) {

            showMessage(
                error.message,
                "error"
            );
        }
    }

    initializePage();

});