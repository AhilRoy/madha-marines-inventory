document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // HTML ELEMENTS
    // ==========================================

    const dateElement =
        document.getElementById("date");

    const dashboardSearch =
        document.getElementById("dashboardSearch");

    const dashboardSearchButton =
        document.getElementById("dashboardSearchButton");

    const totalProducts =
        document.getElementById("totalProducts");

    const availableStock =
        document.getElementById("availableStock");

    const todaySales =
        document.getElementById("todaySales");

    const monthlySales =
        document.getElementById("monthlySales");

    const salesChartCanvas =
        document.getElementById("salesChart");

    const lowStockCount =
        document.getElementById("lowStockCount");

    const recentProductsTableBody =
        document.getElementById("recentProductsTableBody");

    const recentStockInTableBody =
        document.getElementById("recentStockInTableBody");

    const recentSalesTableBody =
        document.getElementById("recentSalesTableBody");

    const lowStockTableBody =
        document.getElementById("lowStockTableBody");


    // ==========================================
    // DATA
    // ==========================================

    let products = [];

    let stockInHistory = [];

    let stockOutHistory = [];

    let salesChart = null;


    // ==========================================
    // DATE
    // ==========================================

    function showCurrentDate() {

        const now = new Date();

        if (!dateElement) {
            return;
        }

        dateElement.textContent =
            now.toLocaleDateString(
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
    // HELPERS
    // ==========================================

    function formatCurrency(amount) {

        const number =
            Number(amount) || 0;

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


    function formatQuantity(quantity) {

        const number =
            Number(quantity);

        if (!Number.isFinite(number)) {

            return "0";
        }

        return Number(
            number.toFixed(2)
        ).toString();
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


    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;
    }


    function formatDate(dateValue) {

        if (!dateValue) {

            return "-";
        }

        const dateText =
            String(dateValue)
                .slice(0, 10);

        const parts =
            dateText.split("-");

        if (parts.length !== 3) {

            return String(dateValue);
        }

        return (
            parts[2] +
            "-" +
            parts[1] +
            "-" +
            parts[0]
        );
    }


    // ==========================================
    // CREATE LOCAL DATE KEY
    // ==========================================

    function getDateKey(dateValue) {

        const date =
            dateValue instanceof Date
                ? dateValue
                : new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";
        }

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

        return (
            year +
            "-" +
            month +
            "-" +
            day
        );
    }


    function getTodayDate() {

        return getDateKey(
            new Date()
        );
    }


    // ==========================================
    // NORMALIZE API DATE
    // ==========================================

    function normalizeApiDate(dateValue) {

        if (!dateValue) {

            return "";
        }

        const text =
            String(dateValue);

        // Already YYYY-MM-DD

        const match =
            text.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (match) {

            return (
                match[1] +
                "-" +
                match[2] +
                "-" +
                match[3]
            );
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";
        }

        return getDateKey(date);
    }


    // ==========================================
    // CURRENT MONTH CHECK
    // ==========================================

    function isCurrentMonth(dateValue) {

        const normalizedDate =
            normalizeApiDate(
                dateValue
            );

        if (!normalizedDate) {

            return false;
        }

        const now =
            new Date();

        const currentYear =
            String(
                now.getFullYear()
            );

        const currentMonth =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        return normalizedDate.startsWith(
            currentYear +
            "-" +
            currentMonth +
            "-"
        );
    }


    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    async function loadProducts() {

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
                "Unable to load products."
            );
        }

        products =
            Array.isArray(
                result.products
            )
                ? result.products
                : [];
    }


    // ==========================================
    // LOAD STOCK IN
    // ==========================================

    async function loadStockIn() {

        const response =
            await fetch(
                "/api/stock-in"
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to load stock-in history."
            );
        }

        stockInHistory =
            Array.isArray(
                result.history
            )
                ? result.history
                : [];
    }


    // ==========================================
    // LOAD STOCK OUT
    // ==========================================

    async function loadStockOut() {

        const response =
            await fetch(
                "/api/stock-out"
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to load sales history."
            );
        }

        stockOutHistory =
            Array.isArray(
                result.sales
            )
                ? result.sales
                : [];
    }


    // ==========================================
    // SUMMARY CARDS
    // ==========================================

    function updateSummary() {

        if (totalProducts) {

            totalProducts.textContent =
                products.length;
        }


        // --------------------------------------
        // AVAILABLE PRODUCTS
        // --------------------------------------

        const availableProducts =
            products.filter(
                function (product) {

                    return (
                        Number(
                            product.quantity
                        ) > 0
                    );
                }
            );

        if (availableStock) {

            availableStock.textContent =
                availableProducts.length;
        }


        // --------------------------------------
        // TODAY SALES
        // --------------------------------------

        const today =
            getTodayDate();

        const todaySalesAmount =
            stockOutHistory
                .filter(
                    function (sale) {

                        return (
                            normalizeApiDate(
                                sale.date
                            ) === today
                        );
                    }
                )
                .reduce(
                    function (
                        total,
                        sale
                    ) {

                        return (
                            total +
                            (
                                Number(
                                    sale.totalAmount
                                ) || 0
                            )
                        );
                    },
                    0
                );

        if (todaySales) {

            todaySales.textContent =
                formatCurrency(
                    todaySalesAmount
                );
        }


        // --------------------------------------
        // THIS MONTH SALES
        // --------------------------------------

        const monthlySalesAmount =
            stockOutHistory
                .filter(
                    function (sale) {

                        return isCurrentMonth(
                            sale.date
                        );
                    }
                )
                .reduce(
                    function (
                        total,
                        sale
                    ) {

                        return (
                            total +
                            (
                                Number(
                                    sale.totalAmount
                                ) || 0
                            )
                        );
                    },
                    0
                );

        if (monthlySales) {

            monthlySales.textContent =
                formatCurrency(
                    monthlySalesAmount
                );
        }


        // --------------------------------------
        // LOW STOCK
        // --------------------------------------

        const lowStockProducts =
            products.filter(
                function (product) {

                    const quantity =
                        Number(
                            product.quantity
                        ) || 0;

                    const minimumStock =
                        Number(
                            product.minimumStock
                        ) || 5;

                    return (
                        quantity > 0 &&
                        quantity <=
                            minimumStock
                    );
                }
            );

        if (lowStockCount) {

            lowStockCount.textContent =
                lowStockProducts.length;
        }
    }


    // ==========================================
    // RECENT PRODUCTS
    // ==========================================

    function displayRecentProducts() {

        if (!recentProductsTableBody) {

            return;
        }

        recentProductsTableBody.innerHTML =
            "";

        if (products.length === 0) {

            recentProductsTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-table-message">

                        No products found

                    </td>

                </tr>

            `;

            return;
        }


        const recentProducts =
            products.slice(
                0,
                5
            );


        recentProducts.forEach(
            function (product) {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            product.name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            product.category ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formatQuantity(
                            product.quantity
                        )}
                        ${escapeHtml(
                            formatUnit(
                                product.unit
                            )
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            product.price
                        )}
                    </td>

                `;

                recentProductsTableBody
                    .appendChild(
                        row
                    );
            }
        );
    }


    // ==========================================
    // RECENT STOCK IN
    // ==========================================

    function displayRecentStockIn() {

        if (!recentStockInTableBody) {

            return;
        }

        recentStockInTableBody.innerHTML =
            "";

        if (
            stockInHistory.length === 0
        ) {

            recentStockInTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="empty-table-message">

                        No stock-in history found

                    </td>

                </tr>

            `;

            return;
        }


        const recentStockIn =
            stockInHistory.slice(
                0,
                5
            );


        recentStockIn.forEach(
            function (record) {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            formatDate(
                                record.date
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.productName ||
                            "-"
                        )}
                    </td>

                    <td>
                        +${formatQuantity(
                            record.quantityAdded
                        )}
                        ${escapeHtml(
                            formatUnit(
                                record.unit
                            )
                        )}
                    </td>

                    <td>
                        ${formatQuantity(
                            record.previousStock
                        )}
                    </td>

                    <td>
                        ${formatQuantity(
                            record.newStock
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.supplier ||
                            "-"
                        )}
                    </td>

                `;

                recentStockInTableBody
                    .appendChild(
                        row
                    );
            }
        );
    }


    // ==========================================
    // RECENT SALES
    // ==========================================

    function displayRecentSales() {

        if (!recentSalesTableBody) {

            return;
        }

        recentSalesTableBody.innerHTML =
            "";

        if (
            stockOutHistory.length === 0
        ) {

            recentSalesTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="empty-table-message">

                        No sales found

                    </td>

                </tr>

            `;

            return;
        }


        const recentSales =
            stockOutHistory.slice(
                0,
                5
            );


        recentSales.forEach(
            function (sale) {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            formatDate(
                                sale.date
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            sale.productName ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formatQuantity(
                            sale.quantitySold
                        )}
                        ${escapeHtml(
                            formatUnit(
                                sale.unit
                            )
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            sale.sellingPrice
                        )}
                    </td>

                    <td>
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
                            sale.paymentMethod ||
                            "-"
                        )}
                    </td>

                `;

                recentSalesTableBody
                    .appendChild(
                        row
                    );
            }
        );
    }


    // ==========================================
    // LOW STOCK
    // ==========================================

    function displayLowStock() {

        if (!lowStockTableBody) {

            return;
        }

        lowStockTableBody.innerHTML =
            "";


        const lowStockProducts =
            products.filter(
                function (product) {

                    const quantity =
                        Number(
                            product.quantity
                        ) || 0;

                    const minimumStock =
                        Number(
                            product.minimumStock
                        ) || 5;

                    return (
                        quantity <=
                        minimumStock
                    );
                }
            );


        if (
            lowStockProducts.length === 0
        ) {

            lowStockTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-table-message">

                        No low-stock products

                    </td>

                </tr>

            `;

            return;
        }


        lowStockProducts.forEach(
            function (product) {

                const quantity =
                    Number(
                        product.quantity
                    ) || 0;


                const status =
                    quantity <= 0
                        ? "Out of Stock"
                        : "Low Stock";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            product.name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            product.category ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formatQuantity(
                            product.quantity
                        )}
                        ${escapeHtml(
                            formatUnit(
                                product.unit
                            )
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            product.price
                        )}
                    </td>

                    <td>

                        <span class="${
                            quantity <= 0
                                ? "inactive-status"
                                : "low-stock-status"
                        }">

                            ${status}

                        </span>

                    </td>

                `;


                lowStockTableBody
                    .appendChild(
                        row
                    );
            }
        );
    }


    // ==========================================
    // SALES CHART - LAST 7 DAYS
    // ==========================================

    function displaySalesChart() {

        if (!salesChartCanvas) {

            return;
        }


        if (
            typeof Chart ===
            "undefined"
        ) {

            console.error(
                "Chart.js is not loaded."
            );

            return;
        }


        const labels = [];

        const dateKeys = [];

        const totals = [];


        // --------------------------------------
        // CREATE LAST 7 DAYS
        // --------------------------------------

        for (
            let offset = 6;
            offset >= 0;
            offset--
        ) {

            const date =
                new Date();

            date.setHours(
                0,
                0,
                0,
                0
            );

            date.setDate(
                date.getDate() -
                offset
            );


            dateKeys.push(
                getDateKey(
                    date
                )
            );


            labels.push(
                date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short"
                    }
                )
            );


            totals.push(0);
        }


        // --------------------------------------
        // CALCULATE SALES
        // --------------------------------------

        stockOutHistory.forEach(
            function (sale) {

                const saleDate =
                    normalizeApiDate(
                        sale.date
                    );

                const index =
                    dateKeys.indexOf(
                        saleDate
                    );


                if (index !== -1) {

                    totals[index] +=
                        Number(
                            sale.totalAmount
                        ) || 0;
                }
            }
        );


        // --------------------------------------
        // DESTROY OLD CHART
        // --------------------------------------

        if (salesChart) {

            salesChart.destroy();
        }


        // --------------------------------------
        // CREATE CHART
        // --------------------------------------

        salesChart =
            new Chart(
                salesChartCanvas,
                {

                    type: "line",

                    data: {

                        labels:
                            labels,

                        datasets: [

                            {

                                label:
                                    "Sales",

                                data:
                                    totals,

                                borderWidth:
                                    3,

                                tension:
                                    0.35,

                                fill:
                                    true,

                                pointRadius:
                                    4,

                                pointHoverRadius:
                                    6

                            }

                        ]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,


                        interaction: {

                            mode:
                                "index",

                            intersect:
                                false

                        },


                        plugins: {

                            legend: {

                                display:
                                    false

                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function (
                                            context
                                        ) {

                                            return (
                                                "Sales: " +
                                                formatCurrency(
                                                    context.raw
                                                )
                                            );
                                        }

                                }

                            }

                        },


                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    callback:
                                        function (
                                            value
                                        ) {

                                            return (
                                                "₹" +
                                                Number(
                                                    value
                                                )
                                                    .toLocaleString(
                                                        "en-IN"
                                                    )
                                            );
                                        }

                                }

                            }

                        }

                    }

                }
            );
    }


    // ==========================================
    // DASHBOARD SEARCH
    // ==========================================

    function searchProducts() {

        if (
            !dashboardSearch ||
            !recentProductsTableBody
        ) {

            return;
        }


        const searchValue =
            dashboardSearch.value
                .trim()
                .toLowerCase();


        if (!searchValue) {

            displayRecentProducts();

            return;
        }


        const filteredProducts =
            products.filter(
                function (product) {

                    const searchableText = [

                        product.name,
                        product.category,
                        product.brand,
                        product.supplier,
                        product.unit

                    ]
                        .join(" ")
                        .toLowerCase();


                    return searchableText
                        .includes(
                            searchValue
                        );
                }
            );


        recentProductsTableBody.innerHTML =
            "";


        if (
            filteredProducts.length === 0
        ) {

            recentProductsTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-table-message">

                        No matching products found

                    </td>

                </tr>

            `;

            return;
        }


        filteredProducts.forEach(
            function (product) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            product.name ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            product.category ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formatQuantity(
                            product.quantity
                        )}
                        ${escapeHtml(
                            formatUnit(
                                product.unit
                            )
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            product.price
                        )}
                    </td>

                `;


                recentProductsTableBody
                    .appendChild(
                        row
                    );
            }
        );
    }


    // ==========================================
    // SEARCH EVENTS
    // ==========================================

    if (dashboardSearchButton) {

        dashboardSearchButton
            .addEventListener(
                "click",
                searchProducts
            );
    }


    if (dashboardSearch) {

        dashboardSearch
            .addEventListener(
                "input",
                searchProducts
            );


        dashboardSearch
            .addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        searchProducts();
                    }
                }
            );
    }


    // ==========================================
    // RENDER EVERYTHING
    // ==========================================

    function renderDashboard() {

        updateSummary();

        displayRecentProducts();

        displayRecentStockIn();

        displayRecentSales();

        displayLowStock();

        displaySalesChart();
    }


    // ==========================================
    // DASHBOARD ERROR
    // ==========================================

    function showDashboardError() {

        if (
            recentProductsTableBody
        ) {

            recentProductsTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-table-message">

                        Unable to load dashboard data

                    </td>

                </tr>

            `;
        }


        if (
            recentStockInTableBody
        ) {

            recentStockInTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="empty-table-message">

                        Unable to load stock-in data

                    </td>

                </tr>

            `;
        }


        if (
            recentSalesTableBody
        ) {

            recentSalesTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="empty-table-message">

                        Unable to load sales data

                    </td>

                </tr>

            `;
        }


        if (
            lowStockTableBody
        ) {

            lowStockTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-table-message">

                        Unable to load stock data

                    </td>

                </tr>

            `;
        }
    }


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    async function initializeDashboard() {

        showCurrentDate();


        try {

            await Promise.all([

                loadProducts(),

                loadStockIn(),

                loadStockOut()

            ]);


            renderDashboard();


        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );


            showDashboardError();
        }
    }


    // ==========================================
    // START DASHBOARD
    // ==========================================

    initializeDashboard();

});