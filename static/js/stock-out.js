document.addEventListener("DOMContentLoaded", function () {

    const stockOutForm =
        document.getElementById("stockOutForm");

    const stockOutProduct =
        document.getElementById("stockOutProduct");

    const stockOutQuantity =
        document.getElementById("stockOutQuantity");

    const stockOutQuantityUnit =
        document.getElementById("stockOutQuantityUnit");

    const sellingPrice =
        document.getElementById("sellingPrice");

    const sellingPriceUnit =
        document.getElementById("sellingPriceUnit");

    const totalAmount =
        document.getElementById("totalAmount");

    const customerSelect =
        document.getElementById("customerSelect");

    const customerName =
        document.getElementById("customerName");

    const customerPhone =
        document.getElementById("customerPhone");

    const stockOutInvoice =
        document.getElementById("stockOutInvoice");

    const stockOutDate =
        document.getElementById("stockOutDate");

    const paymentMethod =
        document.getElementById("paymentMethod");

    const stockOutNotes =
        document.getElementById("stockOutNotes");

    const stockOutProductInfo =
        document.getElementById("stockOutProductInfo");

    const outSelectedProductName =
        document.getElementById("outSelectedProductName");

    const outSelectedCategory =
        document.getElementById("outSelectedCategory");

    const outSelectedUnit =
        document.getElementById("outSelectedUnit");

    const outAvailableStock =
        document.getElementById("outAvailableStock");

    const outPurchasePrice =
        document.getElementById("outPurchasePrice");

    const outSellingPrice =
        document.getElementById("outSellingPrice");

    const outQuantitySold =
        document.getElementById("outQuantitySold");

    const outTotalSaleAmount =
        document.getElementById("outTotalSaleAmount");

    const stockAfterSale =
        document.getElementById("stockAfterSale");

    const stockOutMessage =
        document.getElementById("stockOutMessage");

    const stockOutTableBody =
        document.getElementById("stockOutTableBody");

    const stockOutSearch =
        document.getElementById("stockOutSearch");

    const clearStockOutHistory =
        document.getElementById("clearStockOutHistory");

    const stockOutTotalProducts =
        document.getElementById("stockOutTotalProducts");

    const availableStockQuantity =
        document.getElementById("availableStockQuantity");

    const totalStockSold =
        document.getElementById("totalStockSold");

    const totalSalesAmount =
        document.getElementById("totalSalesAmount");

    const stockOutButton =
        document.getElementById("stockOutButton");


    let products = [];
    let customers = [];
    let stockOutHistory = [];


    function setTodayDate() {

        stockOutDate.value =
            new Date().toISOString().split("T")[0];
    }


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

        stockOutMessage.textContent = message;

        stockOutMessage.style.color =
            type === "success"
                ? "#15803d"
                : "#dc2626";

        setTimeout(function () {
            stockOutMessage.textContent = "";
        }, 4500);
    }


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
            stockOutProduct.value;

        stockOutProduct.innerHTML = `

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
                " - Available: " +
                formatQuantityWithUnit(
                    product.quantity,
                    product.unit
                );

            if (Number(product.quantity) <= 0) {

                option.disabled = true;

                option.textContent +=
                    " - Out of Stock";
            }

            stockOutProduct.appendChild(option);
        });

        const stillExists =
            activeProducts.some(function (product) {

                return (
                    String(product.id) ===
                    String(previousValue) &&
                    Number(product.quantity) > 0
                );
            });

        if (stillExists) {
            stockOutProduct.value = previousValue;
        }
    }


    async function loadCustomers() {

        const response =
            await fetch("/api/customers");

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to load customers."
            );
        }

        customers =
            Array.isArray(result.customers)
                ? result.customers
                : [];

        loadCustomerOptions();
    }


    function loadCustomerOptions() {

        customerSelect.innerHTML = `

            <option value="">
                Walk-in Customer
            </option>

        `;

        const activeCustomers =
            customers.filter(function (customer) {

                return customer.status === "Active";
            });

        activeCustomers.forEach(function (customer) {

            const option =
                document.createElement("option");

            option.value = customer.id;

            option.textContent =
                customer.phone
                    ? `${customer.name} - ${customer.phone}`
                    : customer.name;

            option.dataset.name =
                customer.name || "";

            option.dataset.phone =
                customer.phone || "";

            customerSelect.appendChild(option);
        });
    }


    async function loadStockOutHistory() {

        stockOutTableBody.innerHTML = `

            <tr>
                <td
                    colspan="12"
                    class="empty-table-message">

                    Loading sales history...

                </td>
            </tr>

        `;

        const response =
            await fetch("/api/stock-out");

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to load sales history."
            );
        }

        stockOutHistory =
            Array.isArray(result.sales)
                ? result.sales
                : [];

        displayStockOutHistory();

        updateSummary();
    }


    function getSelectedProduct() {

        return products.find(function (product) {

            return String(product.id) ===
                String(stockOutProduct.value);
        });
    }


    function resetProductInformation() {

        stockOutProductInfo.classList.remove("show");

        outSelectedProductName.textContent = "-";
        outSelectedCategory.textContent = "-";
        outSelectedUnit.textContent = "-";
        outAvailableStock.textContent = "0";
        outPurchasePrice.textContent = "₹0.00";
        outSellingPrice.textContent = "₹0.00";
        outQuantitySold.textContent = "0";
        outTotalSaleAmount.textContent = "₹0.00";
        stockAfterSale.textContent = "0";

        stockAfterSale.style.color =
            "#0A3D62";

        stockOutQuantityUnit.textContent =
            "Select a product to view its unit";

        sellingPriceUnit.textContent =
            "Price for one selected unit";

        totalAmount.value = "₹0.00";
    }


    function calculateTotal() {

        const quantity =
            Number(stockOutQuantity.value);

        const price =
            Number(sellingPrice.value);

        const validQuantity =
            Number.isFinite(quantity) &&
            quantity > 0
                ? quantity
                : 0;

        const validPrice =
            Number.isFinite(price) &&
            price >= 0
                ? price
                : 0;

        const amount =
            validQuantity * validPrice;

        totalAmount.value =
            formatCurrency(amount);

        outSellingPrice.textContent =
            formatCurrency(validPrice);

        outTotalSaleAmount.textContent =
            formatCurrency(amount);

        return amount;
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

        const availableStock =
            Number(selectedProduct.quantity) || 0;

        const quantityValue =
            Number(stockOutQuantity.value);

        const quantitySold =
            Number.isFinite(quantityValue) &&
            quantityValue > 0
                ? quantityValue
                : 0;

        const remainingStock =
            availableStock - quantitySold;

        stockOutProductInfo.classList.add("show");

        outSelectedProductName.textContent =
            selectedProduct.name || "-";

        outSelectedCategory.textContent =
            selectedProduct.category || "-";

        outSelectedUnit.textContent =
            formatUnit(unit);

        outAvailableStock.textContent =
            formatQuantityWithUnit(
                availableStock,
                unit
            );

        outPurchasePrice.textContent =
            formatCurrency(
                selectedProduct.price
            );

        outQuantitySold.textContent =
            formatQuantityWithUnit(
                quantitySold,
                unit
            );

        stockOutQuantityUnit.textContent =
            "Enter quantity in " +
            formatUnit(unit);

        sellingPriceUnit.textContent =
            "Selling price for one " +
            formatUnit(unit);

        if (quantitySold > availableStock) {

            stockAfterSale.textContent =
                "Insufficient Stock";

            stockAfterSale.style.color =
                "#dc2626";

        } else {

            stockAfterSale.textContent =
                formatQuantityWithUnit(
                    remainingStock,
                    unit
                );

            stockAfterSale.style.color =
                "#0A3D62";
        }

        calculateTotal();
    }


    function updateSummary() {

        stockOutTotalProducts.textContent =
            products.length;

        availableStockQuantity.textContent =
            products.filter(function (product) {

                return Number(product.quantity) > 0;
            }).length;

        totalStockSold.textContent =
            stockOutHistory.length;

        const salesAmount =
            stockOutHistory.reduce(
                function (total, sale) {

                    return (
                        total +
                        (Number(sale.totalAmount) || 0)
                    );
                },
                0
            );

        totalSalesAmount.textContent =
            formatCurrency(salesAmount);
    }


    function displayStockOutHistory(
        historyList = stockOutHistory
    ) {

        stockOutTableBody.innerHTML = "";

        if (historyList.length === 0) {

            stockOutTableBody.innerHTML = `

                <tr>
                    <td
                        colspan="12"
                        class="empty-table-message">

                        No stock-out history found

                    </td>
                </tr>

            `;

            return;
        }

        historyList.forEach(function (sale) {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHtml(sale.id)}
                </td>

                <td>
                    ${escapeHtml(sale.date || "-")}
                </td>

                <td>
                    ${escapeHtml(
                        sale.productName || "-"
                    )}
                </td>

                <td>
                    <span class="quantity-sold">
                        -${formatQuantity(
                            sale.quantitySold
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHtml(
                        formatUnit(sale.unit)
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        sale.sellingPrice
                    )}
                </td>

                <td class="sale-total">
                    ${formatCurrency(
                        sale.totalAmount
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        sale.customerName ||
                        "Walk-in Customer"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        sale.paymentMethod || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        sale.invoice || "-"
                    )}
                </td>

                <td class="sale-completed">

                    <i class="fa-solid fa-circle-check"></i>

                    ${escapeHtml(
                        sale.status || "Completed"
                    )}

                </td>

                <td>

                    <button
                        type="button"
                        class="print-invoice-btn"
                        data-invoice-id="${escapeHtml(
                            sale.invoice || ""
                        )}">

                        <i class="fa-solid fa-print"></i>

                        Print

                    </button>

                </td>

            `;

            stockOutTableBody.appendChild(row);
        });
    }


    stockOutForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const selectedProduct =
                getSelectedProduct();

            const quantityValue =
                stockOutQuantity.value.trim();

            const priceValue =
                sellingPrice.value.trim();

            const quantitySold =
                Number(quantityValue);

            const unitSellingPrice =
                Number(priceValue);

            const enteredCustomerPhone =
                customerPhone.value.trim();

            if (!selectedProduct) {

                showMessage(
                    "Please select a product.",
                    "error"
                );

                return;
            }

            if (
                quantityValue === "" ||
                !Number.isFinite(quantitySold) ||
                quantitySold <= 0
            ) {

                showMessage(
                    "Quantity must be greater than zero.",
                    "error"
                );

                return;
            }

            if (
                Math.round(quantitySold * 100) !==
                quantitySold * 100
            ) {

                showMessage(
                    "Quantity can have a maximum of two decimal places.",
                    "error"
                );

                return;
            }

            const availableStock =
                Number(selectedProduct.quantity) || 0;

            if (quantitySold > availableStock) {

                showMessage(
                    "Insufficient stock. Only " +
                    formatQuantityWithUnit(
                        availableStock,
                        selectedProduct.unit
                    ) +
                    " is available.",
                    "error"
                );

                return;
            }

            if (
                priceValue === "" ||
                !Number.isFinite(unitSellingPrice) ||
                unitSellingPrice <= 0
            ) {

                showMessage(
                    "Selling price must be greater than zero.",
                    "error"
                );

                return;
            }

            if (
                enteredCustomerPhone !== "" &&
                !/^\d{10}$/.test(
                    enteredCustomerPhone
                )
            ) {

                showMessage(
                    "Customer phone must contain exactly 10 digits.",
                    "error"
                );

                return;
            }

            if (!stockOutDate.value) {

                showMessage(
                    "Please select the sale date.",
                    "error"
                );

                return;
            }

            const saleData = {
                productId:
                    Number(selectedProduct.id),

                quantitySold:
                    Number(quantitySold.toFixed(2)),

                sellingPrice:
                    Number(unitSellingPrice.toFixed(2)),

                customerId:
                    customerSelect.value
                        ? Number(customerSelect.value)
                        : null,

                customerName:
                    customerName.value.trim(),

                customerPhone:
                    enteredCustomerPhone,

                date:
                    stockOutDate.value,

                paymentMethod:
                    paymentMethod.value,

                notes:
                    stockOutNotes.value.trim()
            };

            stockOutButton.disabled = true;

            stockOutButton.textContent =
                "Completing Sale...";

            try {

                const response =
                    await fetch(
                        "/api/stock-out",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(saleData)
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Unable to complete sale."
                    );
                }

                stockOutInvoice.value =
                    result.invoice_number || "";

                showMessage(
                    result.message +
                    " Total: " +
                    formatCurrency(
                        result.total_amount
                    ),
                    "success"
                );

                const invoiceNumber =
                    result.invoice_number;

                stockOutForm.reset();

                setTodayDate();

                totalAmount.value = "₹0.00";

                resetProductInformation();

                await loadProducts();

                await loadCustomers();

                await loadStockOutHistory();

                const openInvoice =
                    confirm(
                        "Sale completed successfully. Do you want to print the invoice?"
                    );

                if (
                    openInvoice &&
                    invoiceNumber
                ) {

                    window.open(
                        `/invoice/${encodeURIComponent(
                            invoiceNumber
                        )}`,
                        "_blank"
                    );
                }

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            } finally {

                stockOutButton.disabled = false;

                stockOutButton.innerHTML = `

                    <i class="fa-solid fa-cart-shopping"></i>
                    Complete Sale

                `;
            }
        }
    );


    customerSelect.addEventListener(
        "change",
        function () {

            const selectedOption =
                customerSelect.options[
                    customerSelect.selectedIndex
                ];

            if (!customerSelect.value) {

                customerName.value = "";
                customerPhone.value = "";

                return;
            }

            customerName.value =
                selectedOption.dataset.name || "";

            customerPhone.value =
                selectedOption.dataset.phone || "";
        }
    );


    stockOutSearch.addEventListener(
        "input",
        function () {

            const searchValue =
                stockOutSearch.value
                    .trim()
                    .toLowerCase();

            const filteredHistory =
                stockOutHistory.filter(
                    function (sale) {

                        const searchableText = [

                            sale.id,
                            sale.date,
                            sale.productName,
                            sale.category,
                            sale.quantitySold,
                            sale.unit,
                            formatUnit(sale.unit),
                            sale.sellingPrice,
                            sale.totalAmount,
                            sale.customerName,
                            sale.customerPhone,
                            sale.paymentMethod,
                            sale.invoice,
                            sale.notes,
                            sale.status

                        ]
                            .join(" ")
                            .toLowerCase();

                        return searchableText
                            .includes(searchValue);
                    }
                );

            displayStockOutHistory(
                filteredHistory
            );
        }
    );


    stockOutTableBody.addEventListener(
        "click",
        function (event) {

            const printButton =
                event.target.closest(
                    ".print-invoice-btn"
                );

            if (!printButton) {
                return;
            }

            const invoiceNumber =
                printButton.dataset.invoiceId;

            if (!invoiceNumber) {

                showMessage(
                    "Invoice information was not found.",
                    "error"
                );

                return;
            }

            window.open(
                `/invoice/${encodeURIComponent(
                    invoiceNumber
                )}`,
                "_blank"
            );
        }
    );


    clearStockOutHistory.addEventListener(
        "click",
        async function () {

            if (stockOutHistory.length === 0) {

                showMessage(
                    "There is no sales history to clear.",
                    "error"
                );

                return;
            }

            const confirmation =
                confirm(
                    "Clear all stock-out history? Product quantities will not be restored."
                );

            if (!confirmation) {
                return;
            }

            clearStockOutHistory.disabled = true;

            try {

                const response =
                    await fetch(
                        "/api/stock-out",
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

                await loadStockOutHistory();

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            } finally {

                clearStockOutHistory.disabled = false;
            }
        }
    );


    stockOutProduct.addEventListener(
        "change",
        function () {

            stockOutQuantity.value = "";

            const selectedProduct =
                getSelectedProduct();

            if (selectedProduct) {

                const defaultPrice =
                    Number(
                        selectedProduct.sellingPrice ||
                        selectedProduct.price ||
                        0
                    );

                sellingPrice.value =
                    defaultPrice.toFixed(2);

            } else {

                sellingPrice.value = "";
            }

            updateProductInformation();
        }
    );


    stockOutQuantity.addEventListener(
        "input",
        updateProductInformation
    );


    sellingPrice.addEventListener(
        "input",
        updateProductInformation
    );


    customerPhone.addEventListener(
        "input",
        function () {

            customerPhone.value =
                customerPhone.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
        }
    );


    async function initializePage() {

        setTodayDate();

        resetProductInformation();

        try {

            await Promise.all([
                loadProducts(),
                loadCustomers(),
                loadStockOutHistory()
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