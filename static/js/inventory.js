document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // DATA
    // ==========================================

    let products = [];
    let filteredProducts = [];


    // ==========================================
    // HTML ELEMENTS
    // ==========================================

    const dateElement =
        document.getElementById("date");

    const totalProductsElement =
        document.getElementById(
            "inventoryTotalProducts"
        );

    const availableProductsElement =
        document.getElementById(
            "inventoryAvailableProducts"
        );

    const lowStockProductsElement =
        document.getElementById(
            "inventoryLowStockProducts"
        );

    const outOfStockElement =
        document.getElementById(
            "inventoryOutOfStock"
        );

    const totalStockValueElement =
        document.getElementById(
            "inventoryTotalValue"
        );

    const searchInput =
        document.getElementById(
            "inventorySearch"
        );

    const categoryFilter =
        document.getElementById(
            "inventoryCategoryFilter"
        );

    const statusFilter =
        document.getElementById(
            "inventoryStatusFilter"
        );

    const resetFilterButton =
        document.getElementById(
            "inventoryResetFilter"
        );

    const inventoryTableBody =
        document.getElementById(
            "inventoryTableBody"
        );

    const resultCountElement =
        document.getElementById(
            "inventoryResultCount"
        );


    // ==========================================
    // HELPERS
    // ==========================================

    function parseNumber(value) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    function formatQuantity(value) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(
            parseNumber(value)
        );
    }


    function formatCurrency(value) {

        const amount =
            parseNumber(value);

        return amount.toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    function formatUnit(unit) {

        const units = {

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

        return (
            units[unit] ||
            unit ||
            "Piece"
        );
    }


    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;
    }


    // ==========================================
    // PRODUCT STATUS
    // ==========================================

    function getProductStatus(product) {

        const quantity =
            parseNumber(
                product.quantity
            );

        const minimumStock =
            parseNumber(
                product.minimumStock
            ) || 5;


        if (quantity <= 0) {

            return {

                key: "out",

                text: "Out of Stock",

                className:
                    "inventory-out",

                rowClassName:
                    "inventory-out-row"

            };
        }


        if (quantity <= minimumStock) {

            return {

                key: "low",

                text: "Low Stock",

                className:
                    "inventory-low",

                rowClassName:
                    "inventory-low-row"

            };
        }


        return {

            key: "available",

            text: "Available",

            className:
                "inventory-available",

            rowClassName:
                "inventory-available-row"

        };
    }


    // ==========================================
    // CURRENT DATE
    // ==========================================

    function displayCurrentDate() {

        if (!dateElement) {
            return;
        }

        dateElement.textContent =
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );
    }


    // ==========================================
    // LOAD PRODUCTS FROM MYSQL API
    // ==========================================

    async function loadProducts() {

        inventoryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="empty-table-message">

                    Loading inventory...

                </td>

            </tr>

        `;


        try {

            const response =
                await fetch(
                    "/api/products"
                );

            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Unable to load inventory."
                );
            }


            products =
                Array.isArray(
                    result.products
                )
                    ? result.products
                    : [];


            normalizeProducts();

            loadInventory();

        } catch (error) {

            console.error(
                "Inventory error:",
                error
            );


            inventoryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="empty-table-message">

                        Unable to load inventory data.

                    </td>

                </tr>

            `;


            if (resultCountElement) {

                resultCountElement.textContent =
                    "Unable to load products";
            }
        }
    }


    // ==========================================
    // NORMALIZE PRODUCT DATA
    // ==========================================

    function normalizeProducts() {

        products =
            products.map(
                function (product) {

                    return {

                        id:
                            product.id,

                        name:
                            product.name ||
                            "Unnamed Product",

                        category:
                            product.category ||
                            "General",

                        brand:
                            product.brand ||
                            "",

                        quantity:
                            parseNumber(
                                product.quantity
                            ),

                        unit:
                            product.unit ||
                            "piece",

                        price:
                            parseNumber(
                                product.price
                            ),

                        sellingPrice:
                            parseNumber(
                                product.sellingPrice
                            ),

                        minimumStock:
                            parseNumber(
                                product.minimumStock
                            ) || 5,

                        supplierId:
                            product.supplierId,

                        supplier:
                            product.supplier ||
                            "Not specified",

                        status:
                            product.status ||
                            "Active",

                        createdAt:
                            product.createdAt,

                        updatedAt:
                            product.updatedAt

                    };
                }
            );
    }


    // ==========================================
    // SUMMARY CARDS
    // ==========================================

    function updateSummaryCards() {

        const availableProducts =
            products.filter(
                function (product) {

                    const status =
                        getProductStatus(
                            product
                        );

                    return (
                        status.key ===
                        "available"
                    );
                }
            );


        const lowStockProducts =
            products.filter(
                function (product) {

                    const status =
                        getProductStatus(
                            product
                        );

                    return (
                        status.key ===
                        "low"
                    );
                }
            );


        const outOfStockProducts =
            products.filter(
                function (product) {

                    const status =
                        getProductStatus(
                            product
                        );

                    return (
                        status.key ===
                        "out"
                    );
                }
            );


        const totalStockValue =
            products.reduce(
                function (
                    total,
                    product
                ) {

                    return (
                        total +
                        (
                            parseNumber(
                                product.quantity
                            ) *
                            parseNumber(
                                product.price
                            )
                        )
                    );
                },
                0
            );


        totalProductsElement.textContent =
            products.length;


        availableProductsElement.textContent =
            availableProducts.length;


        lowStockProductsElement.textContent =
            lowStockProducts.length;


        outOfStockElement.textContent =
            outOfStockProducts.length;


        totalStockValueElement.textContent =
            formatCurrency(
                totalStockValue
            );
    }


    // ==========================================
    // CATEGORY FILTER OPTIONS
    // ==========================================

    function loadCategoryOptions() {

        const selectedValue =
            categoryFilter.value;


        const categories = [

            ...new Set(

                products
                    .map(
                        function (product) {

                            return (
                                product.category ||
                                "General"
                            ).trim();
                        }
                    )

                    .filter(Boolean)

            )

        ].sort(
            function (a, b) {

                return a.localeCompare(b);
            }
        );


        categoryFilter.innerHTML = `

            <option value="">
                All Categories
            </option>

        `;


        categories.forEach(
            function (category) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    category;

                option.textContent =
                    category;

                categoryFilter.appendChild(
                    option
                );
            }
        );


        if (
            categories.includes(
                selectedValue
            )
        ) {

            categoryFilter.value =
                selectedValue;
        }
    }


    // ==========================================
    // APPLY FILTERS
    // ==========================================

    function applyFilters() {

        const searchValue =
            searchInput.value
                .trim()
                .toLowerCase();


        const selectedCategory =
            categoryFilter.value;


        const selectedStatus =
            statusFilter.value;


        filteredProducts =
            products.filter(
                function (product) {

                    const productStatus =
                        getProductStatus(
                            product
                        );


                    const searchableText = [

                        product.id,

                        product.name,

                        product.category,

                        product.brand,

                        product.quantity,

                        product.unit,

                        product.price,

                        product.supplier,

                        productStatus.text

                    ]
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !searchValue ||
                        searchableText.includes(
                            searchValue
                        );


                    const matchesCategory =
                        !selectedCategory ||
                        String(
                            product.category
                        ).toLowerCase() ===
                        selectedCategory
                            .toLowerCase();


                    const matchesStatus =
                        !selectedStatus ||
                        productStatus.key ===
                        selectedStatus;


                    return (

                        matchesSearch &&

                        matchesCategory &&

                        matchesStatus

                    );
                }
            );


        renderInventoryTable(
            filteredProducts
        );
    }


    // ==========================================
    // RESET FILTERS
    // ==========================================

    function resetFilters() {

        searchInput.value = "";

        categoryFilter.value = "";

        statusFilter.value = "";


        filteredProducts =
            [...products];


        renderInventoryTable(
            filteredProducts
        );
    }


    // ==========================================
    // INVENTORY TABLE
    // ==========================================

    function renderInventoryTable(
        inventoryProducts
    ) {

        inventoryTableBody.innerHTML =
            "";


        const sortedProducts =
            [...inventoryProducts].sort(
                function (a, b) {

                    const statusA =
                        getProductStatus(a);

                    const statusB =
                        getProductStatus(b);


                    const statusPriority = {

                        out: 1,

                        low: 2,

                        available: 3

                    };


                    const statusDifference =

                        statusPriority[
                            statusA.key
                        ] -

                        statusPriority[
                            statusB.key
                        ];


                    if (
                        statusDifference !== 0
                    ) {

                        return statusDifference;
                    }


                    return String(
                        a.name
                    ).localeCompare(
                        String(b.name)
                    );
                }
            );


        resultCountElement.textContent =
            `Showing ${sortedProducts.length} of ${products.length} products`;


        if (
            sortedProducts.length === 0
        ) {

            inventoryTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="empty-table-message">

                        No inventory products found.

                    </td>

                </tr>

            `;

            return;
        }


        sortedProducts.forEach(
            function (product) {

                const quantity =
                    parseNumber(
                        product.quantity
                    );


                const price =
                    parseNumber(
                        product.price
                    );


                const stockValue =
                    quantity *
                    price;


                const status =
                    getProductStatus(
                        product
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                row.classList.add(
                    status.rowClassName
                );


                row.innerHTML = `

                    <td>

                        ${escapeHTML(
                            product.id
                        )}

                    </td>


                    <td>

                        <strong>

                            ${escapeHTML(
                                product.name
                            )}

                        </strong>

                    </td>


                    <td>

                        ${escapeHTML(
                            product.category
                        )}

                    </td>


                    <td class="inventory-quantity">

                        ${formatQuantity(
                            quantity
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            formatUnit(
                                product.unit
                            )
                        )}

                    </td>


                    <td>

                        ${formatCurrency(
                            price
                        )}

                    </td>


                    <td class="inventory-stock-value">

                        ${formatCurrency(
                            stockValue
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            product.supplier ||
                            "Not specified"
                        )}

                    </td>


                    <td>

                        <span
                            class="inventory-status ${status.className}">

                            ${escapeHTML(
                                status.text
                            )}

                        </span>

                    </td>

                `;


                inventoryTableBody
                    .appendChild(row);
            }
        );
    }


    // ==========================================
    // EVENTS
    // ==========================================

    searchInput.addEventListener(
        "input",
        applyFilters
    );


    categoryFilter.addEventListener(
        "change",
        applyFilters
    );


    statusFilter.addEventListener(
        "change",
        applyFilters
    );


    resetFilterButton.addEventListener(
        "click",
        resetFilters
    );


    // ==========================================
    // REFRESH WHEN PAGE GETS FOCUS
    // ==========================================

    window.addEventListener(
        "focus",
        function () {

            loadProducts();
        }
    );


    // ==========================================
    // INITIALIZE INVENTORY
    // ==========================================

    function loadInventory() {

        filteredProducts =
            [...products];


        updateSummaryCards();

        loadCategoryOptions();

        applyFilters();
    }


    displayCurrentDate();

    loadProducts();

});