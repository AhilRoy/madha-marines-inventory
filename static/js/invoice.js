document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // GET INVOICE NUMBER FROM FLASK
    // ==========================================

    const invoiceNumber =
        document.body.dataset.invoiceNumber;

    // ==========================================
    // HTML ELEMENTS
    // ==========================================

    const invoiceNumberElement =
        document.getElementById("invoiceNumber");

    const invoiceDate =
        document.getElementById("invoiceDate");

    const invoiceCustomerName =
        document.getElementById("invoiceCustomerName");

    const invoiceCustomerPhone =
        document.getElementById("invoiceCustomerPhone");

    const invoicePaymentMethod =
        document.getElementById("invoicePaymentMethod");

    const invoicePaymentStatus =
        document.getElementById("invoicePaymentStatus");

    const invoiceItemsBody =
        document.getElementById("invoiceItemsBody");

    const invoiceSubtotal =
        document.getElementById("invoiceSubtotal");

    const invoiceDiscountAmount =
        document.getElementById("invoiceDiscountAmount");

    const invoiceTaxAmount =
        document.getElementById("invoiceTaxAmount");

    const invoiceGrandTotal =
        document.getElementById("invoiceGrandTotal");

    const invoiceNotes =
        document.getElementById("invoiceNotes");

    const invoiceErrorMessage =
        document.getElementById("invoiceErrorMessage");

    const printInvoiceButton =
        document.getElementById("printInvoiceButton");

    const downloadInvoiceButton =
        document.getElementById("downloadInvoiceButton");

    // ==========================================
    // DATA
    // ==========================================

    let invoice = null;

    let items = [];

    // ==========================================
    // FORMAT CURRENCY
    // ==========================================

    function formatCurrency(amount) {

        const value =
            Number(amount) || 0;

        return value.toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }

    // ==========================================
    // FORMAT QUANTITY
    // ==========================================

    function formatQuantity(quantity) {

        const value =
            Number(quantity);

        if (
            Number.isNaN(value) ||
            !Number.isFinite(value)
        ) {

            return "0";

        }

        return Number(
            value.toFixed(2)
        ).toString();

    }

    // ==========================================
    // FORMAT UNIT
    // ==========================================

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

        return units[unit] || unit || "Piece";

    }

    // ==========================================
    // FORMAT DATE
    // ==========================================

    function formatDate(dateValue) {

        if (!dateValue) {

            return "-";

        }

        const date =
            new Date(dateValue);

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }

    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value ?? "");

        return div.innerHTML;

    }

    // ==========================================
    // SHOW ERROR
    // ==========================================

    function showError(message) {

        invoiceErrorMessage.style.display =
            "block";

        invoiceErrorMessage.textContent =
            message;

    }

    // ==========================================
    // LOAD INVOICE FROM API
    // ==========================================

    async function loadInvoice() {

        try {

            const response =
                await fetch(
                    `/api/invoices/${encodeURIComponent(invoiceNumber)}`
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message
                );

            }

            invoice =
                result.invoice;

            items =
                result.items || [];

            displayInvoice();

        }

        catch (error) {

            showError(
                error.message
            );

        }

    }
        // ==========================================
    // DISPLAY INVOICE
    // ==========================================

    function displayInvoice() {

        invoiceNumberElement.textContent =
            invoice.invoiceNumber || "-";

        invoiceDate.textContent =
            formatDate(
                invoice.invoiceDate
            );

        invoiceCustomerName.textContent =
            invoice.customerName ||
            "Walk-in Customer";

        invoiceCustomerPhone.textContent =
            invoice.customerPhone ||
            "-";

        invoicePaymentMethod.textContent =
            invoice.paymentMethod ||
            "-";

        invoicePaymentStatus.textContent =
            invoice.paymentStatus ||
            "Paid";

        invoiceNotes.textContent =
            invoice.notes ||
            "Thank you for your purchase.";

        invoiceSubtotal.textContent =
            formatCurrency(
                invoice.subtotal
            );

        invoiceDiscountAmount.textContent =
            formatCurrency(
                invoice.discountAmount
            );

        invoiceTaxAmount.textContent =
            formatCurrency(
                invoice.taxAmount
            );

        invoiceGrandTotal.textContent =
            formatCurrency(
                invoice.grandTotal
            );

        displayInvoiceItems();

    }


    // ==========================================
    // DISPLAY INVOICE ITEMS
    // ==========================================

    function displayInvoiceItems() {

        invoiceItemsBody.innerHTML = "";

        if (items.length === 0) {

            invoiceItemsBody.innerHTML = `

                <tr>

                    <td colspan="5">

                        No invoice items found.

                    </td>

                </tr>

            `;

            return;

        }

        items.forEach(function (item) {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>

                    ${escapeHtml(
                        item.productName
                    )}

                </td>

                <td>

                    ${formatQuantity(
                        item.quantity
                    )}

                </td>

                <td>

                    ${escapeHtml(
                        formatUnit(
                            item.unit
                        )
                    )}

                </td>

                <td>

                    ${formatCurrency(
                        item.pricePerUnit
                    )}

                </td>

                <td>

                    ${formatCurrency(
                        item.itemTotal
                    )}

                </td>

            `;

            invoiceItemsBody.appendChild(
                row
            );

        });

    }


    // ==========================================
    // CHANGE PAGE TITLE
    // ==========================================

    document.title =
        invoiceNumber +
        " - Madha Marines Invoice";


    // ==========================================
    // CREATE PDF FILE NAME
    // ==========================================

    function createPdfName() {

        if (
            !invoice ||
            !invoice.invoiceNumber
        ) {

            return "Invoice";

        }

        return (
            "Invoice-" +
            invoice.invoiceNumber
        );

    }
        // ==========================================
    // PRINT INVOICE
    // ==========================================

    if (printInvoiceButton) {

        printInvoiceButton.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    }


    // ==========================================
    // DOWNLOAD PDF
    // ==========================================

    if (downloadInvoiceButton) {

        downloadInvoiceButton.addEventListener(
            "click",
            function () {

                const originalTitle =
                    document.title;

                document.title =
                    createPdfName();

                window.print();

                setTimeout(
                    function () {

                        document.title =
                            originalTitle;

                    },
                    1000
                );

            }
        );

    }


    // ==========================================
    // LOAD INVOICE
    // ==========================================

    if (!invoiceNumber) {

        showError(
            "Invoice number was not provided."
        );

    } else {

        loadInvoice();

    }

});