document.addEventListener("DOMContentLoaded", function () {

    const supplierForm =
        document.getElementById("supplierForm");

    const supplierEditId =
        document.getElementById("supplierEditId");

    const supplierName =
        document.getElementById("supplierName");

    const contactPerson =
        document.getElementById("contactPerson");

    const supplierPhone =
        document.getElementById("supplierPhone");

    const supplierEmail =
        document.getElementById("supplierEmail");

    const supplierAddress =
        document.getElementById("supplierAddress");

    const supplierCity =
        document.getElementById("supplierCity");

    const supplierState =
        document.getElementById("supplierState");

    const supplierGst =
        document.getElementById("supplierGst");

    const supplierStatus =
        document.getElementById("supplierStatus");

    const supplierNotes =
        document.getElementById("supplierNotes");

    const supplierMessage =
        document.getElementById("supplierMessage");

    const supplierTableBody =
        document.getElementById("supplierTableBody");

    const supplierSearch =
        document.getElementById("supplierSearch");

    const supplierSubmitButton =
        document.getElementById("supplierSubmitButton");

    const cancelSupplierEdit =
        document.getElementById("cancelSupplierEdit");

    const supplierFormTitle =
        document.getElementById("supplierFormTitle");

    const totalSuppliers =
        document.getElementById("totalSuppliers");

    const activeSuppliers =
        document.getElementById("activeSuppliers");

    const newSuppliers =
        document.getElementById("newSuppliers");


    let suppliers = [];


    // ==========================================
    // SHOW MESSAGE
    // ==========================================

    function showMessage(message, type) {

        supplierMessage.textContent = message;
        supplierMessage.className = type;

        setTimeout(function () {

            supplierMessage.textContent = "";
            supplierMessage.className = "";

        }, 3000);
    }


    // ==========================================
    // FORMAT SUPPLIER ID
    // ==========================================

    function formatSupplierId(id) {

        return `SUP-${String(id).padStart(3, "0")}`;
    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(value) {

        const div = document.createElement("div");

        div.textContent = String(value ?? "");

        return div.innerHTML;
    }


    // ==========================================
    // LOAD SUPPLIERS FROM MYSQL
    // ==========================================

    async function loadSuppliers() {

        supplierTableBody.innerHTML = `

            <tr>
                <td colspan="9" class="empty-table-message">
                    Loading suppliers...
                </td>
            </tr>

        `;

        try {

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

            renderSuppliers();

        } catch (error) {

            supplierTableBody.innerHTML = `

                <tr>
                    <td colspan="9" class="empty-table-message">
                        ${escapeHtml(error.message)}
                    </td>
                </tr>

            `;

            showMessage(
                error.message,
                "error-message"
            );
        }
    }


    // ==========================================
    // RENDER SUPPLIER TABLE
    // ==========================================

    function renderSuppliers(list = suppliers) {

        supplierTableBody.innerHTML = "";

        if (list.length === 0) {

            supplierTableBody.innerHTML = `

                <tr>
                    <td colspan="9" class="empty-table-message">
                        No suppliers found
                    </td>
                </tr>

            `;

            updateSummary();

            return;
        }

        list.forEach(function (supplier) {

            const row =
                document.createElement("tr");

            const statusClass =
                supplier.status === "Active"
                    ? "supplier-active"
                    : "supplier-inactive";

            row.innerHTML = `

                <td>
                    ${formatSupplierId(supplier.id)}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(supplier.name)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        supplier.contactPerson || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(supplier.phone || "-")}
                </td>

                <td>
                    ${escapeHtml(supplier.email || "-")}
                </td>

                <td>
                    ${escapeHtml(supplier.city || "-")}
                </td>

                <td>
                    ${escapeHtml(supplier.gst || "-")}
                </td>

                <td>
                    <span class="${statusClass}">
                        ${escapeHtml(
                            supplier.status || "Active"
                        )}
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        data-id="${supplier.id}"
                        title="Edit Supplier">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        data-id="${supplier.id}"
                        title="Delete Supplier">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            `;

            supplierTableBody.appendChild(row);
        });

        updateSummary();
    }


    // ==========================================
    // SUMMARY CARDS
    // ==========================================

    function updateSummary() {

        totalSuppliers.textContent =
            suppliers.length;

        activeSuppliers.textContent =
            suppliers.filter(function (supplier) {

                return supplier.status === "Active";

            }).length;

        const now = new Date();

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        newSuppliers.textContent =
            suppliers.filter(function (supplier) {

                if (!supplier.createdAt) {
                    return false;
                }

                const createdDate =
                    new Date(supplier.createdAt);

                return (
                    createdDate.getMonth() ===
                        currentMonth &&
                    createdDate.getFullYear() ===
                        currentYear
                );

            }).length;
    }


    // ==========================================
    // VALIDATION
    // ==========================================

    function isValidPhone(phone) {

        return /^[0-9]{10}$/.test(phone);
    }


    function isValidGst(gst) {

        if (gst === "") {
            return true;
        }

        return /^[0-9A-Z]{15}$/i.test(gst);
    }


    // ==========================================
    // ADD OR UPDATE SUPPLIER
    // ==========================================

    supplierForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                supplierName.value.trim();

            const phone =
                supplierPhone.value.trim();

            const gst =
                supplierGst.value
                    .trim()
                    .toUpperCase();

            const editId =
                supplierEditId.value.trim();

            if (name === "") {

                showMessage(
                    "Please enter the supplier name.",
                    "error-message"
                );

                supplierName.focus();

                return;
            }

            if (!isValidPhone(phone)) {

                showMessage(
                    "Please enter a valid 10-digit phone number.",
                    "error-message"
                );

                supplierPhone.focus();

                return;
            }

            if (!isValidGst(gst)) {

                showMessage(
                    "GST number must contain 15 characters.",
                    "error-message"
                );

                supplierGst.focus();

                return;
            }

            const supplierData = {

                name: name,

                contactPerson:
                    contactPerson.value.trim(),

                phone: phone,

                email:
                    supplierEmail.value.trim(),

                address:
                    supplierAddress.value.trim(),

                city:
                    supplierCity.value.trim(),

                state:
                    supplierState.value.trim(),

                gst: gst,

                status:
                    supplierStatus.value,

                notes:
                    supplierNotes.value.trim()
            };

            const isEditing =
                editId !== "";

            const url =
                isEditing
                    ? `/api/suppliers/${editId}`
                    : "/api/suppliers";

            const method =
                isEditing
                    ? "PUT"
                    : "POST";

            supplierSubmitButton.disabled = true;

            supplierSubmitButton.innerHTML =
                isEditing
                    ? "Updating..."
                    : "Adding...";

            try {

                const response =
                    await fetch(
                        url,
                        {
                            method: method,

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    supplierData
                                )
                        }
                    );

                const result =
                    await response.json();

                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Unable to save supplier."
                    );
                }

                showMessage(
                    result.message,
                    "success-message"
                );

                resetSupplierForm();

                await loadSuppliers();

            } catch (error) {

                showMessage(
                    error.message,
                    "error-message"
                );

            } finally {

                supplierSubmitButton.disabled =
                    false;

                if (
                    supplierEditId.value === ""
                ) {

                    supplierSubmitButton.innerHTML = `

                        <i class="fa-solid fa-plus"></i>
                        Add Supplier

                    `;
                }
            }
        }
    );


    // ==========================================
    // EDIT AND DELETE BUTTONS
    // ==========================================

    supplierTableBody.addEventListener(
        "click",
        function (event) {

            const editButton =
                event.target.closest(".edit-btn");

            const deleteButton =
                event.target.closest(".delete-btn");

            if (editButton) {

                editSupplier(
                    Number(editButton.dataset.id)
                );
            }

            if (deleteButton) {

                deleteSupplier(
                    Number(deleteButton.dataset.id)
                );
            }
        }
    );


    // ==========================================
    // EDIT SUPPLIER
    // ==========================================

    function editSupplier(id) {

        const supplier =
            suppliers.find(function (item) {

                return Number(item.id) ===
                    Number(id);
            });

        if (!supplier) {

            showMessage(
                "Supplier not found.",
                "error-message"
            );

            return;
        }

        supplierEditId.value =
            supplier.id;

        supplierName.value =
            supplier.name || "";

        contactPerson.value =
            supplier.contactPerson || "";

        supplierPhone.value =
            supplier.phone || "";

        supplierEmail.value =
            supplier.email || "";

        supplierAddress.value =
            supplier.address || "";

        supplierCity.value =
            supplier.city || "";

        supplierState.value =
            supplier.state || "";

        supplierGst.value =
            supplier.gst || "";

        supplierStatus.value =
            supplier.status || "Active";

        supplierNotes.value =
            supplier.notes || "";

        supplierFormTitle.textContent =
            "Edit Supplier";

        supplierSubmitButton.innerHTML = `

            <i class="fa-solid fa-floppy-disk"></i>
            Update Supplier

        `;

        cancelSupplierEdit.style.display =
            "inline-flex";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        supplierName.focus();
    }


    // ==========================================
    // DELETE SUPPLIER
    // ==========================================

    async function deleteSupplier(id) {

        const supplier =
            suppliers.find(function (item) {

                return Number(item.id) ===
                    Number(id);
            });

        if (!supplier) {

            showMessage(
                "Supplier not found.",
                "error-message"
            );

            return;
        }

        const confirmed =
            confirm(
                `Are you sure you want to delete "${supplier.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    `/api/suppliers/${id}`,
                    {
                        method: "DELETE"
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Unable to delete supplier."
                );
            }

            resetSupplierForm();

            showMessage(
                result.message,
                "success-message"
            );

            await loadSuppliers();

        } catch (error) {

            showMessage(
                error.message,
                "error-message"
            );
        }
    }


    // ==========================================
    // RESET FORM
    // ==========================================

    function resetSupplierForm() {

        supplierForm.reset();

        supplierEditId.value = "";

        supplierStatus.value = "Active";

        supplierFormTitle.textContent =
            "Add New Supplier";

        supplierSubmitButton.innerHTML = `

            <i class="fa-solid fa-plus"></i>
            Add Supplier

        `;

        supplierSubmitButton.disabled =
            false;

        cancelSupplierEdit.style.display =
            "none";
    }


    // ==========================================
    // CANCEL EDIT
    // ==========================================

    cancelSupplierEdit.addEventListener(
        "click",
        function () {

            resetSupplierForm();

            showMessage(
                "Editing cancelled.",
                "success-message"
            );
        }
    );


    // ==========================================
    // SEARCH
    // ==========================================

    supplierSearch.addEventListener(
        "input",
        function () {

            const searchValue =
                supplierSearch.value
                    .trim()
                    .toLowerCase();

            const filteredSuppliers =
                suppliers.filter(
                    function (supplier) {

                        const searchableText = [

                            supplier.name,
                            supplier.contactPerson,
                            supplier.phone,
                            supplier.email,
                            supplier.city,
                            supplier.state,
                            supplier.gst,
                            supplier.status

                        ]
                            .join(" ")
                            .toLowerCase();

                        return searchableText
                            .includes(searchValue);
                    }
                );

            renderSuppliers(
                filteredSuppliers
            );
        }
    );


    // ==========================================
    // PHONE INPUT
    // ==========================================

    supplierPhone.addEventListener(
        "input",
        function () {

            supplierPhone.value =
                supplierPhone.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
        }
    );


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    resetSupplierForm();

    loadSuppliers();

});