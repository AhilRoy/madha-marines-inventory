document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // MADHA MARINES REPORTS
    // Flask + MySQL Version
    // =====================================================


    // =====================================================
    // DATA
    // =====================================================

    let products = [];

    let stockInHistory = [];

    let stockOutHistory = [];

    let filteredSales = [];


    // =====================================================
    // HTML ELEMENTS
    // =====================================================

    const dateElement =
        document.getElementById("date");


    const todaySalesElement =
        document.getElementById(
            "reportTodaySales"
        );


    const monthlySalesElement =
        document.getElementById(
            "reportMonthlySales"
        );


    const totalRevenueElement =
        document.getElementById(
            "reportTotalRevenue"
        );


    const salesEntriesElement =
        document.getElementById(
            "reportSalesEntries"
        );


    const stockInEntriesElement =
        document.getElementById(
            "reportStockInEntries"
        );


    const lowStockCountElement =
        document.getElementById(
            "reportLowStockCount"
        );


    const startDateInput =
        document.getElementById(
            "reportStartDate"
        );


    const endDateInput =
        document.getElementById(
            "reportEndDate"
        );


    const paymentMethodSelect =
        document.getElementById(
            "reportPaymentMethod"
        );


    const applyFilterButton =
        document.getElementById(
            "applyReportFilter"
        );


    const resetFilterButton =
        document.getElementById(
            "resetReportFilter"
        );


    const reportSearchInput =
        document.getElementById(
            "reportSearch"
        );


    const exportButton =
        document.getElementById(
            "exportSalesReport"
        );


    const printButton =
        document.getElementById(
            "printReport"
        );


    const salesReportTableBody =
        document.getElementById(
            "salesReportTableBody"
        );


    const bestSellingTableBody =
        document.getElementById(
            "bestSellingTableBody"
        );


    const stockInReportTableBody =
        document.getElementById(
            "stockInReportTableBody"
        );


    const lowStockReportTableBody =
        document.getElementById(
            "lowStockReportTableBody"
        );


    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    function parseNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;

    }


    function formatCurrency(value) {

        return parseNumber(value)
            .toLocaleString(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }


    function formatQuantity(value) {

        return parseNumber(value)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );

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


        const safeUnit =
            String(
                unit || "piece"
            )
                .trim()
                .toLowerCase();


        return (
            unitNames[safeUnit] ||
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


    // =====================================================
    // DATE HELPERS
    // =====================================================

    function normalizeDate(dateValue) {

        if (!dateValue) {

            return null;

        }


        const value =
            String(dateValue)
                .trim();


        /*
            API dates normally arrive as:

            YYYY-MM-DD
        */

        const parts =
            value.split("-");


        if (
            parts.length === 3 &&
            parts[0].length === 4
        ) {

            const year =
                Number(parts[0]);

            const month =
                Number(parts[1]) - 1;

            const day =
                Number(parts[2]);


            const date =
                new Date(
                    year,
                    month,
                    day
                );


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                return date;

            }

        }


        const fallback =
            new Date(value);


        if (
            !Number.isNaN(
                fallback.getTime()
            )
        ) {

            return fallback;

        }


        return null;

    }


    function getLocalDateKey(dateValue) {

        const date =
            normalizeDate(
                dateValue
            );


        if (!date) {

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
            `${year}-${month}-${day}`
        );

    }


    function formatDisplayDate(dateValue) {

        const date =
            normalizeDate(
                dateValue
            );


        if (!date) {

            return (
                dateValue || "-"
            );

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    function getTodayKey() {

        return getLocalDateKey(
            new Date()
        );

    }


    function isCurrentMonth(dateValue) {

        const date =
            normalizeDate(
                dateValue
            );


        if (!date) {

            return false;

        }


        const today =
            new Date();


        return (

            date.getFullYear() ===
                today.getFullYear()

            &&

            date.getMonth() ===
                today.getMonth()

        );

    }


    function getTimestamp(dateValue) {

        const date =
            normalizeDate(
                dateValue
            );


        if (!date) {

            return 0;

        }


        return date.getTime();

    }


    // =====================================================
    // LOW STOCK LIMIT
    // =====================================================

    function getLowStockLimit(product) {

        const minimumStock =
            parseNumber(
                product.minimumStock
            );


        if (minimumStock > 0) {

            return minimumStock;

        }


        return 5;

    }


    // =====================================================
    // CURRENT DATE
    // =====================================================

    function displayCurrentDate() {

        if (!dateElement) {

            return;

        }


        dateElement.textContent =
            new Date()
                .toLocaleDateString(
                    "en-IN",
                    {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }
                );

    }


    // =====================================================
    // LOAD PRODUCTS FROM MYSQL
    // =====================================================

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


        products =
            products.map(
                function (product) {

                    return {

                        ...product,


                        quantity:
                            parseNumber(
                                product.quantity
                            ),


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


                        category:
                            product.category ||
                            "General",


                        unit:
                            product.unit ||
                            "piece"

                    };

                }
            );

    }


    // =====================================================
    // LOAD STOCK IN FROM MYSQL
    // =====================================================

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
                "Unable to load stock-in records."
            );

        }


        stockInHistory =
            Array.isArray(
                result.history
            )
                ? result.history
                : [];


        stockInHistory =
            stockInHistory.map(
                function (entry) {

                    return {

                        ...entry,


                        quantityAdded:
                            parseNumber(
                                entry.quantityAdded
                            ),


                        previousStock:
                            parseNumber(
                                entry.previousStock
                            ),


                        newStock:
                            parseNumber(
                                entry.newStock
                            ),


                        productName:
                            entry.productName ||
                            "Unknown Product",


                        supplier:
                            entry.supplier ||
                            "Not specified",


                        unit:
                            entry.unit ||
                            "piece"

                    };

                }
            );

    }


    // =====================================================
    // LOAD SALES FROM MYSQL
    // =====================================================

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
                "Unable to load sales."
            );

        }


        stockOutHistory =
            Array.isArray(
                result.sales
            )
                ? result.sales
                : [];


        stockOutHistory =
            stockOutHistory.map(
                function (sale) {

                    return {

                        ...sale,


                        quantitySold:
                            parseNumber(
                                sale.quantitySold
                            ),


                        sellingPrice:
                            parseNumber(
                                sale.sellingPrice
                            ),


                        totalAmount:
                            parseNumber(
                                sale.totalAmount
                            ),


                        invoiceNumber:
                            sale.invoice ||
                            sale.invoiceNumber ||
                            "-",


                        productName:
                            sale.productName ||
                            "Unknown Product",


                        category:
                            sale.category ||
                            "General",


                        customerName:
                            sale.customerName ||
                            "Walk-in Customer",


                        paymentMethod:
                            sale.paymentMethod ||
                            "Cash",


                        unit:
                            sale.unit ||
                            "piece"

                    };

                }
            );

    }


    // =====================================================
    // SUMMARY CARDS
    // =====================================================

    function updateSummaryCards() {

        const todayKey =
            getTodayKey();


        // Today's sales

        const todaySales =
            stockOutHistory

                .filter(
                    function (sale) {

                        return (
                            getLocalDateKey(
                                sale.date
                            ) ===
                            todayKey
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
                            parseNumber(
                                sale.totalAmount
                            )
                        );

                    },
                    0
                );


        // Monthly sales

        const monthlySales =
            stockOutHistory

                .filter(
                    function (sale) {

                        return (
                            isCurrentMonth(
                                sale.date
                            )
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
                            parseNumber(
                                sale.totalAmount
                            )
                        );

                    },
                    0
                );


        // Total revenue

        const totalRevenue =
            stockOutHistory.reduce(
                function (
                    total,
                    sale
                ) {

                    return (
                        total +
                        parseNumber(
                            sale.totalAmount
                        )
                    );

                },
                0
            );


        // Low stock + out of stock

        const lowStockProducts =
            products.filter(
                function (product) {

                    return (

                        parseNumber(
                            product.quantity
                        )
                        <=
                        getLowStockLimit(
                            product
                        )

                    );

                }
            );


        todaySalesElement.textContent =
            formatCurrency(
                todaySales
            );


        monthlySalesElement.textContent =
            formatCurrency(
                monthlySales
            );


        totalRevenueElement.textContent =
            formatCurrency(
                totalRevenue
            );


        salesEntriesElement.textContent =
            stockOutHistory.length;


        stockInEntriesElement.textContent =
            stockInHistory.length;


        lowStockCountElement.textContent =
            lowStockProducts.length;

    }


    // =====================================================
    // APPLY SALES FILTERS
    // =====================================================

    function applyFilters() {

        const startDate =
            startDateInput.value;


        const endDate =
            endDateInput.value;


        const paymentMethod =
            paymentMethodSelect.value;


        const searchValue =
            reportSearchInput.value
                .trim()
                .toLowerCase();


        if (
            startDate &&
            endDate &&
            startDate > endDate
        ) {

            alert(
                "Start date cannot be after end date."
            );

            return;

        }


        filteredSales =
            stockOutHistory.filter(
                function (sale) {

                    const saleDate =
                        getLocalDateKey(
                            sale.date
                        );


                    const matchesStart =

                        !startDate ||

                        (
                            saleDate &&
                            saleDate >=
                                startDate
                        );


                    const matchesEnd =

                        !endDate ||

                        (
                            saleDate &&
                            saleDate <=
                                endDate
                        );


                    const matchesPayment =

                        !paymentMethod ||

                        String(
                            sale.paymentMethod
                        )
                            .toLowerCase() ===

                        paymentMethod
                            .toLowerCase();


                    const searchableText = [

                        sale.date,

                        formatDisplayDate(
                            sale.date
                        ),

                        sale.invoiceNumber,

                        sale.productName,

                        sale.category,

                        sale.quantitySold,

                        sale.unit,

                        sale.sellingPrice,

                        sale.totalAmount,

                        sale.customerName,

                        sale.customerPhone,

                        sale.paymentMethod,

                        sale.notes

                    ]
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =

                        !searchValue ||

                        searchableText.includes(
                            searchValue
                        );


                    return (

                        matchesStart &&

                        matchesEnd &&

                        matchesPayment &&

                        matchesSearch

                    );

                }
            );


        renderSalesReport(
            filteredSales
        );


        renderBestSellingProducts(
            filteredSales
        );

    }


    // =====================================================
    // RESET FILTERS
    // =====================================================

    function resetFilters() {

        startDateInput.value =
            "";


        endDateInput.value =
            "";


        paymentMethodSelect.value =
            "";


        reportSearchInput.value =
            "";


        filteredSales =
            [...stockOutHistory];


        renderSalesReport(
            filteredSales
        );


        renderBestSellingProducts(
            filteredSales
        );

    }


    // =====================================================
    // SALES REPORT TABLE
    // =====================================================

    function renderSalesReport(
        sales
    ) {

        salesReportTableBody.innerHTML =
            "";


        const sortedSales =
            [...sales].sort(
                function (a, b) {

                    return (

                        getTimestamp(
                            b.date
                        ) -

                        getTimestamp(
                            a.date
                        )

                    );

                }
            );


        if (
            sortedSales.length === 0
        ) {

            salesReportTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="report-empty-message">

                        No sales records found.

                    </td>

                </tr>

            `;

            return;

        }


        sortedSales.forEach(
            function (sale) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        ${escapeHTML(
                            formatDisplayDate(
                                sale.date
                            )
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            sale.invoiceNumber ||
                            "-"
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            sale.productName
                        )}

                    </td>


                    <td>

                        <span class="quantity-sold">

                            ${formatQuantity(
                                sale.quantitySold
                            )}

                        </span>

                    </td>


                    <td>

                        ${escapeHTML(
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


                    <td class="report-total">

                        ${formatCurrency(
                            sale.totalAmount
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            sale.customerName ||
                            "Walk-in Customer"
                        )}

                    </td>


                    <td>

                        <span class="report-sale-status">

                            ${escapeHTML(
                                sale.paymentMethod ||
                                "Cash"
                            )}

                        </span>

                    </td>

                `;


                salesReportTableBody
                    .appendChild(
                        row
                    );

            }
        );

    }


    // =====================================================
    // BEST SELLING PRODUCTS
    // =====================================================

    function renderBestSellingProducts(
        sales
    ) {

        const groupedProducts =
            {};


        sales.forEach(
            function (sale) {

                const productName =
                    sale.productName ||
                    "Unknown Product";


                const unit =
                    sale.unit ||
                    "piece";


                /*
                    Use product ID where possible so
                    similarly named products do not merge.
                */

                const key =
                    sale.productId
                        ? String(
                            sale.productId
                        )
                        : (
                            productName
                                .toLowerCase()
                            +
                            "|" +
                            unit.toLowerCase()
                        );


                if (
                    !groupedProducts[key]
                ) {

                    groupedProducts[key] = {

                        productName:
                            productName,


                        category:
                            sale.category ||
                            "General",


                        quantitySold:
                            0,


                        unit:
                            unit,


                        entries:
                            0,


                        revenue:
                            0

                    };

                }


                groupedProducts[
                    key
                ].quantitySold +=
                    parseNumber(
                        sale.quantitySold
                    );


                groupedProducts[
                    key
                ].entries +=
                    1;


                groupedProducts[
                    key
                ].revenue +=
                    parseNumber(
                        sale.totalAmount
                    );

            }
        );


        const bestSellingProducts =
            Object.values(
                groupedProducts
            ).sort(
                function (a, b) {

                    if (
                        b.quantitySold !==
                        a.quantitySold
                    ) {

                        return (
                            b.quantitySold -
                            a.quantitySold
                        );

                    }


                    return (
                        b.revenue -
                        a.revenue
                    );

                }
            );


        bestSellingTableBody.innerHTML =
            "";


        if (
            bestSellingProducts.length ===
            0
        ) {

            bestSellingTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="report-empty-message">

                        No sales data available.

                    </td>

                </tr>

            `;

            return;

        }


        bestSellingProducts

            .slice(
                0,
                10
            )

            .forEach(
                function (
                    product,
                    index
                ) {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>

                            ${index + 1}

                        </td>


                        <td>

                            ${escapeHTML(
                                product.productName
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                product.category
                            )}

                        </td>


                        <td>

                            <span class="best-selling-quantity">

                                ${formatQuantity(
                                    product.quantitySold
                                )}

                            </span>

                        </td>


                        <td>

                            ${escapeHTML(
                                formatUnit(
                                    product.unit
                                )
                            )}

                        </td>


                        <td>

                            ${product.entries}

                        </td>


                        <td class="report-total">

                            ${formatCurrency(
                                product.revenue
                            )}

                        </td>

                    `;


                    bestSellingTableBody
                        .appendChild(
                            row
                        );

                }
            );

    }


    // =====================================================
    // STOCK IN REPORT
    // =====================================================

    function renderStockInReport() {

        stockInReportTableBody.innerHTML =
            "";


        const sortedStockIn =
            [...stockInHistory]

                .sort(
                    function (a, b) {

                        return (

                            getTimestamp(
                                b.date
                            ) -

                            getTimestamp(
                                a.date
                            )

                        );

                    }
                )

                .slice(
                    0,
                    10
                );


        if (
            sortedStockIn.length === 0
        ) {

            stockInReportTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="report-empty-message">

                        No stock-in records available.

                    </td>

                </tr>

            `;

            return;

        }


        sortedStockIn.forEach(
            function (entry) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        ${escapeHTML(
                            formatDisplayDate(
                                entry.date
                            )
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            entry.productName ||
                            "Unknown Product"
                        )}

                    </td>


                    <td>

                        <span class="quantity-added">

                            +${formatQuantity(
                                entry.quantityAdded
                            )}

                        </span>

                    </td>


                    <td>

                        ${escapeHTML(
                            formatUnit(
                                entry.unit
                            )
                        )}

                    </td>


                    <td>

                        ${formatQuantity(
                            entry.previousStock
                        )}

                    </td>


                    <td class="current-stock">

                        ${formatQuantity(
                            entry.newStock
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            entry.supplier ||
                            "Not specified"
                        )}

                    </td>

                `;


                stockInReportTableBody
                    .appendChild(
                        row
                    );

            }
        );

    }


    // =====================================================
    // LOW STOCK REPORT
    // =====================================================

    function renderLowStockReport() {

        lowStockReportTableBody.innerHTML =
            "";


        const lowStockProducts =
            products

                .filter(
                    function (product) {

                        return (

                            parseNumber(
                                product.quantity
                            )
                            <=
                            getLowStockLimit(
                                product
                            )

                        );

                    }
                )

                .sort(
                    function (a, b) {

                        return (

                            parseNumber(
                                a.quantity
                            ) -

                            parseNumber(
                                b.quantity
                            )

                        );

                    }
                );


        if (
            lowStockProducts.length === 0
        ) {

            lowStockReportTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="report-empty-message">

                        No low-stock products found.

                    </td>

                </tr>

            `;

            return;

        }


        lowStockProducts.forEach(
            function (product) {

                const quantity =
                    parseNumber(
                        product.quantity
                    );


                const statusText =
                    quantity <= 0
                        ? "Out of Stock"
                        : "Low Stock";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        ${escapeHTML(
                            product.name ||
                            "Unnamed Product"
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            product.category ||
                            "General"
                        )}

                    </td>


                    <td class="status-danger">

                        ${formatQuantity(
                            product.quantity
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
                            product.price
                        )}

                    </td>


                    <td>

                        <span class="report-low-stock-status">

                            ${escapeHTML(
                                statusText
                            )}

                        </span>

                    </td>

                `;


                lowStockReportTableBody
                    .appendChild(
                        row
                    );

            }
        );

    }


    // =====================================================
    // CSV EXPORT
    // =====================================================

    function exportSalesToCSV() {

        if (
            filteredSales.length === 0
        ) {

            alert(
                "There are no sales records to export."
            );

            return;

        }


        const headers = [

            "Date",

            "Invoice",

            "Product",

            "Category",

            "Quantity",

            "Unit",

            "Price Per Unit",

            "Total",

            "Customer",

            "Payment Method"

        ];


        const rows =
            filteredSales.map(
                function (sale) {

                    return [

                        formatDisplayDate(
                            sale.date
                        ),

                        sale.invoiceNumber ||
                            "-",

                        sale.productName ||
                            "Unknown Product",

                        sale.category ||
                            "General",

                        formatQuantity(
                            sale.quantitySold
                        ),

                        formatUnit(
                            sale.unit
                        ),

                        parseNumber(
                            sale.sellingPrice
                        ).toFixed(2),

                        parseNumber(
                            sale.totalAmount
                        ).toFixed(2),

                        sale.customerName ||
                            "Walk-in Customer",

                        sale.paymentMethod ||
                            "Cash"

                    ];

                }
            );


        const csvContent =
            [

                headers,

                ...rows

            ]

                .map(
                    function (row) {

                        return row

                            .map(
                                function (value) {

                                    const safeValue =
                                        String(
                                            value ?? ""
                                        ).replace(
                                            /"/g,
                                            '""'
                                        );


                                    return (
                                        `"${safeValue}"`
                                    );

                                }
                            )

                            .join(",");

                    }
                )

                .join("\n");


        const blob =
            new Blob(
                [
                    "\uFEFF" +
                    csvContent
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
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
                "madha-marines-sales-report-" +
                getTodayKey() +
                ".csv"
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

    }


    // =====================================================
    // ERROR DISPLAY
    // =====================================================

    function displayLoadingError(
        message
    ) {

        console.error(
            "Reports error:",
            message
        );


        salesReportTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="report-empty-message">

                    Unable to load report data.

                </td>

            </tr>

        `;


        bestSellingTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="report-empty-message">

                    Unable to load report data.

                </td>

            </tr>

        `;


        stockInReportTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="report-empty-message">

                    Unable to load stock-in data.

                </td>

            </tr>

        `;


        lowStockReportTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="report-empty-message">

                    Unable to load inventory data.

                </td>

            </tr>

        `;

    }


    // =====================================================
    // RENDER REPORTS
    // =====================================================

    function renderReports() {

        filteredSales =
            [...stockOutHistory];


        updateSummaryCards();


        renderSalesReport(
            filteredSales
        );


        renderBestSellingProducts(
            filteredSales
        );


        renderStockInReport();


        renderLowStockReport();

    }


    // =====================================================
    // LOAD ALL REPORT DATA
    // =====================================================

    async function loadReports() {

        try {

            await Promise.all(
                [

                    loadProducts(),

                    loadStockIn(),

                    loadStockOut()

                ]
            );


            renderReports();

        } catch (error) {

            displayLoadingError(
                error.message
            );

        }

    }


    // =====================================================
    // EVENT LISTENERS
    // =====================================================

    applyFilterButton.addEventListener(
        "click",
        applyFilters
    );


    resetFilterButton.addEventListener(
        "click",
        resetFilters
    );


    reportSearchInput.addEventListener(
        "input",
        applyFilters
    );


    paymentMethodSelect.addEventListener(
        "change",
        applyFilters
    );


    exportButton.addEventListener(
        "click",
        exportSalesToCSV
    );


    printButton.addEventListener(
        "click",
        function () {

            window.print();

        }
    );


    // =====================================================
    // REFRESH WHEN USER RETURNS TO PAGE
    // =====================================================

    window.addEventListener(
        "focus",
        function () {

            loadReports();

        }
    );


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    displayCurrentDate();


    loadReports();

});