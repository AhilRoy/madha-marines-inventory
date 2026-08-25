document.addEventListener("DOMContentLoaded", function () {

    const customerForm =
        document.getElementById("customerForm");

    const customerTableBody =
        document.getElementById("customerTableBody");

    const customerMessage =
        document.getElementById("customerMessage");

    const customerSearch =
        document.getElementById("customerSearch");

    const submitButton =
        document.querySelector(".add-product-btn");

    const customerName =
        document.getElementById("customerName");

    const customerPhone =
        document.getElementById("customerPhone");

    const customerEmail =
        document.getElementById("customerEmail");

    const customerType =
        document.getElementById("customerType");

    const customerStatus =
        document.getElementById("customerStatus");

    const customerAddress =
        document.getElementById("customerAddress");

    const totalCustomers =
        document.getElementById("totalCustomers");

    const activeCustomers =
        document.getElementById("activeCustomers");

    const regularCustomers =
        document.getElementById("regularCustomers");


    let customers = [];
    let editingCustomerId = null;


    function showMessage(message, type) {

        customerMessage.textContent = message;

        customerMessage.style.color =
            type === "success"
                ? "#15803d"
                : "#dc2626";

        setTimeout(function () {
            customerMessage.textContent = "";
        }, 3000);
    }


    function escapeHtml(value) {

        const div = document.createElement("div");

        div.textContent = String(value ?? "");

        return div.innerHTML;
    }


    function updateSummary() {

        totalCustomers.textContent =
            customers.length;

        activeCustomers.textContent =
            customers.filter(function (customer) {
                return customer.status === "Active";
            }).length;

        regularCustomers.textContent =
            customers.filter(function (customer) {
                return customer.type === "Regular";
            }).length;
    }


    async function loadCustomers() {

        customerTableBody.innerHTML = `

            <tr>
                <td colspan="8" class="empty-table-message">
                    Loading customers...
                </td>
            </tr>

        `;

        try {

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

            displayCustomers();
            updateSummary();

        } catch (error) {

            customerTableBody.innerHTML = `

                <tr>
                    <td colspan="8" class="empty-table-message">
                        ${escapeHtml(error.message)}
                    </td>
                </tr>

            `;

            showMessage(
                error.message,
                "error"
            );
        }
    }


    function displayCustomers(
        customerList = customers
    ) {

        customerTableBody.innerHTML = "";

        if (customerList.length === 0) {

            customerTableBody.innerHTML = `

                <tr>
                    <td colspan="8" class="empty-table-message">
                        No customers added yet
                    </td>
                </tr>

            `;

            return;
        }

        customerList.forEach(function (customer) {

            const row =
                document.createElement("tr");

            const statusClass =
                customer.status === "Active"
                    ? "active-status"
                    : "inactive-status";

            row.innerHTML = `

                <td>${escapeHtml(customer.id)}</td>

                <td>${escapeHtml(customer.name)}</td>

                <td>${escapeHtml(customer.phone)}</td>

                <td>
                    ${escapeHtml(customer.email || "-")}
                </td>

                <td>${escapeHtml(customer.type)}</td>

                <td>
                    ${escapeHtml(customer.address || "-")}
                </td>

                <td>
                    <span class="${statusClass}">
                        ${escapeHtml(customer.status)}
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        data-id="${customer.id}"
                        title="Edit Customer">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        data-id="${customer.id}"
                        title="Delete Customer">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            `;

            customerTableBody.appendChild(row);
        });
    }


    function resetCustomerForm() {

        customerForm.reset();

        customerStatus.value = "Active";

        editingCustomerId = null;

        submitButton.disabled = false;

        submitButton.innerHTML = `

            <i class="fa-solid fa-plus"></i>
            Add Customer

        `;
    }


    customerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                customerName.value.trim();

            const phone =
                customerPhone.value.trim();

            const email =
                customerEmail.value.trim();

            const type =
                customerType.value;

            const status =
                customerStatus.value;

            const address =
                customerAddress.value.trim();

            if (
                !name ||
                !phone ||
                !type ||
                !status
            ) {

                showMessage(
                    "Please fill all required fields.",
                    "error"
                );

                return;
            }

            if (!/^[0-9]{10}$/.test(phone)) {

                showMessage(
                    "Phone number must contain exactly 10 digits.",
                    "error"
                );

                return;
            }

            const customerData = {
                name: name,
                phone: phone,
                email: email,
                type: type,
                status: status,
                address: address
            };

            const isEditing =
                editingCustomerId !== null;

            const url =
                isEditing
                    ? `/api/customers/${editingCustomerId}`
                    : "/api/customers";

            const method =
                isEditing
                    ? "PUT"
                    : "POST";

            submitButton.disabled = true;

            submitButton.textContent =
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
                                    customerData
                                )
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Unable to save customer."
                    );
                }

                showMessage(
                    result.message,
                    "success"
                );

                resetCustomerForm();

                await loadCustomers();

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            } finally {

                submitButton.disabled = false;

                if (editingCustomerId === null) {

                    submitButton.innerHTML = `

                        <i class="fa-solid fa-plus"></i>
                        Add Customer

                    `;
                }
            }
        }
    );


    customerTableBody.addEventListener(
        "click",
        function (event) {

            const editButton =
                event.target.closest(".edit-btn");

            const deleteButton =
                event.target.closest(".delete-btn");

            if (editButton) {

                editCustomer(
                    Number(editButton.dataset.id)
                );
            }

            if (deleteButton) {

                deleteCustomer(
                    Number(deleteButton.dataset.id)
                );
            }
        }
    );


    function editCustomer(id) {

        const customer =
            customers.find(function (item) {

                return Number(item.id) ===
                    Number(id);
            });

        if (!customer) {

            showMessage(
                "Customer not found.",
                "error"
            );

            return;
        }

        customerName.value =
            customer.name || "";

        customerPhone.value =
            customer.phone || "";

        customerEmail.value =
            customer.email || "";

        customerType.value =
            customer.type || "";

        customerStatus.value =
            customer.status || "Active";

        customerAddress.value =
            customer.address || "";

        editingCustomerId =
            customer.id;

        submitButton.innerHTML = `

            <i class="fa-solid fa-pen"></i>
            Update Customer

        `;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        customerName.focus();
    }


    async function deleteCustomer(id) {

        const customer =
            customers.find(function (item) {

                return Number(item.id) ===
                    Number(id);
            });

        if (!customer) {

            showMessage(
                "Customer not found.",
                "error"
            );

            return;
        }

        const confirmed =
            confirm(
                `Are you sure you want to delete "${customer.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    `/api/customers/${id}`,
                    {
                        method: "DELETE"
                    }
                );

            const result =
                await response.json();

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Unable to delete customer."
                );
            }

            if (
                editingCustomerId !== null &&
                Number(editingCustomerId) ===
                    Number(id)
            ) {
                resetCustomerForm();
            }

            showMessage(
                result.message,
                "success"
            );

            await loadCustomers();

        } catch (error) {

            showMessage(
                error.message,
                "error"
            );
        }
    }


    customerSearch.addEventListener(
        "input",
        function () {

            const searchValue =
                customerSearch.value
                    .trim()
                    .toLowerCase();

            const filteredCustomers =
                customers.filter(
                    function (customer) {

                        const searchableText = [

                            customer.name,
                            customer.phone,
                            customer.email,
                            customer.type,
                            customer.status,
                            customer.address

                        ]
                            .join(" ")
                            .toLowerCase();

                        return searchableText
                            .includes(searchValue);
                    }
                );

            displayCustomers(
                filteredCustomers
            );
        }
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


    resetCustomerForm();

    loadCustomers();

});