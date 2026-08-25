document.addEventListener("DOMContentLoaded", function () {

    const productForm =
        document.getElementById("productForm");

    const productTableBody =
        document.getElementById("productTableBody");

    const productMessage =
        document.getElementById("productMessage");

    const productSearch =
        document.getElementById("productSearch");

    const submitButton =
        document.querySelector(".add-product-btn");

    const productNameInput =
        document.getElementById("productName");

    const categoryInput =
        document.getElementById("category");

    const brandInput =
        document.getElementById("brand");

    const quantityInput =
        document.getElementById("quantity");

    const unitInput =
        document.getElementById("unit");

    const priceInput =
        document.getElementById("price");

    const supplierSelect =
        document.getElementById("supplier");


    let products = [];
    let suppliers = [];
    let editingProductId = null;


    // ==========================================
    // SHOW MESSAGE
    // ==========================================

    function showMessage(message, type) {

        productMessage.textContent = message;

        productMessage.style.color =
            type === "success"
                ? "green"
                : "red";

        setTimeout(function () {
            productMessage.textContent = "";
        }, 3000);
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
    // FORMAT QUANTITY
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


    // ==========================================
    // FORMAT UNIT
    // ==========================================

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

        return unitNames[unit] || unit || "-";
    }


    // ==========================================
    // LOAD SUPPLIERS
    // ==========================================

    async function loadSuppliers(
        selectedSupplierId = ""
    ) {

        supplierSelect.innerHTML = `

            <option value="">
                Select Supplier
            </option>

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

            const activeSupplierList =
                suppliers.filter(
                    function (supplier) {

                        return (
                            supplier.status === "Active"
                        );
                    }
                );

            activeSupplierList.forEach(
                function (supplier) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        supplier.id;

                    option.textContent =
                        supplier.name;

                    supplierSelect.appendChild(
                        option
                    );
                }
            );

            if (activeSupplierList.length === 0) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.textContent =
                    "No active suppliers available";

                option.disabled = true;

                supplierSelect.appendChild(
                    option
                );
            }

            if (selectedSupplierId) {

                supplierSelect.value =
                    String(selectedSupplierId);
            }

        } catch (error) {

            showMessage(
                error.message,
                "error"
            );
        }
    }


    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    async function loadProducts() {

        productTableBody.innerHTML = `

            <tr>
                <td
                    colspan="9"
                    class="empty-table-message">

                    Loading products...

                </td>
            </tr>

        `;

        try {

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

            displayProducts();

        } catch (error) {

            productTableBody.innerHTML = `

                <tr>
                    <td
                        colspan="9"
                        class="empty-table-message">

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


    // ==========================================
    // DISPLAY PRODUCTS
    // ==========================================

    function displayProducts(
        productList = products
    ) {

        productTableBody.innerHTML = "";

        if (productList.length === 0) {

            productTableBody.innerHTML = `

                <tr>
                    <td
                        colspan="9"
                        class="empty-table-message">

                        No products added yet

                    </td>
                </tr>

            `;

            return;
        }

        productList.forEach(function (product) {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${escapeHtml(product.id)}
                </td>

                <td>
                    ${escapeHtml(product.name)}
                </td>

                <td>
                    ${escapeHtml(product.category)}
                </td>

                <td>
                    ${escapeHtml(product.brand || "-")}
                </td>

                <td>
                    ${formatQuantity(product.quantity)}
                </td>

                <td>
                    ${escapeHtml(
                        formatUnit(product.unit)
                    )}
                </td>

                <td>
                    ₹${Number(
                        product.price || 0
                    ).toFixed(2)}
                </td>

                <td>
                    ${escapeHtml(
                        product.supplier ||
                        "Not specified"
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        data-id="${product.id}"
                        title="Edit Product">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        data-id="${product.id}"
                        title="Delete Product">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            `;

            productTableBody.appendChild(row);
        });
    }


    // ==========================================
    // RESET FORM
    // ==========================================

    function resetProductForm() {

        productForm.reset();

        editingProductId = null;

        submitButton.disabled = false;

        submitButton.innerHTML = `

            <i class="fa-solid fa-plus"></i>
            Add Product

        `;

        loadSuppliers();
    }


    // ==========================================
    // ADD OR UPDATE PRODUCT
    // ==========================================

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const productName =
                productNameInput.value.trim();

            const category =
                categoryInput.value.trim();

            const brand =
                brandInput.value.trim();

            const quantityValue =
                quantityInput.value.trim();

            const unit =
                unitInput.value.trim();

            const priceValue =
                priceInput.value.trim();

            const supplierId =
                supplierSelect.value;

            if (
                !productName ||
                !category ||
                quantityValue === "" ||
                !unit ||
                priceValue === "" ||
                !supplierId
            ) {

                showMessage(
                    "Please fill all required fields.",
                    "error"
                );

                return;
            }

            const quantity =
                Number(quantityValue);

            const price =
                Number(priceValue);

            if (
                !Number.isFinite(quantity) ||
                quantity < 0
            ) {

                showMessage(
                    "Quantity cannot be negative.",
                    "error"
                );

                return;
            }

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                showMessage(
                    "Price cannot be negative.",
                    "error"
                );

                return;
            }

            const productData = {
                name: productName,
                category: category,
                brand: brand,
                quantity: Number(
                    quantity.toFixed(2)
                ),
                unit: unit,
                price: Number(
                    price.toFixed(2)
                ),
                supplierId: Number(
                    supplierId
                )
            };

            const isEditing =
                editingProductId !== null;

            const url =
                isEditing
                    ? `/api/products/${editingProductId}`
                    : "/api/products";

            const method =
                isEditing
                    ? "PUT"
                    : "POST";

            submitButton.disabled = true;

            submitButton.innerHTML =
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
                                    productData
                                )
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "Unable to save product."
                    );
                }

                showMessage(
                    result.message,
                    "success"
                );

                resetProductForm();

                await loadProducts();

            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            } finally {

                submitButton.disabled = false;

                if (
                    editingProductId === null
                ) {

                    submitButton.innerHTML = `

                        <i class="fa-solid fa-plus"></i>
                        Add Product

                    `;
                }
            }
        }
    );


    // ==========================================
    // EDIT AND DELETE BUTTONS
    // ==========================================

    productTableBody.addEventListener(
        "click",
        function (event) {

            const editButton =
                event.target.closest(".edit-btn");

            const deleteButton =
                event.target.closest(".delete-btn");

            if (editButton) {

                editProduct(
                    Number(editButton.dataset.id)
                );
            }

            if (deleteButton) {

                deleteProduct(
                    Number(deleteButton.dataset.id)
                );
            }
        }
    );


    // ==========================================
    // EDIT PRODUCT
    // ==========================================

    async function editProduct(id) {

        const product =
            products.find(function (item) {

                return Number(item.id) ===
                    Number(id);
            });

        if (!product) {

            showMessage(
                "Product not found.",
                "error"
            );

            return;
        }

        productNameInput.value =
            product.name || "";

        categoryInput.value =
            product.category || "";

        brandInput.value =
            product.brand || "";

        quantityInput.value =
            Number(product.quantity) || 0;

        unitInput.value =
            product.unit || "";

        priceInput.value =
            Number(product.price) || 0;

        editingProductId =
            product.id;

        await loadSuppliers(
            product.supplierId
        );

        submitButton.innerHTML = `

            <i class="fa-solid fa-pen"></i>
            Update Product

        `;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        productNameInput.focus();
    }


    // ==========================================
    // DELETE PRODUCT
    // ==========================================

    async function deleteProduct(id) {

        const product =
            products.find(function (item) {

                return Number(item.id) ===
                    Number(id);
            });

        if (!product) {

            showMessage(
                "Product not found.",
                "error"
            );

            return;
        }

        const confirmed =
            confirm(
                `Are you sure you want to delete "${product.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    `/api/products/${id}`,
                    {
                        method: "DELETE"
                    }
                );

            const result =
                await response.json();

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Unable to delete product."
                );
            }

            if (
                editingProductId !== null &&
                Number(editingProductId) ===
                    Number(id)
            ) {
                resetProductForm();
            }

            showMessage(
                result.message,
                "success"
            );

            await loadProducts();

        } catch (error) {

            showMessage(
                error.message,
                "error"
            );
        }
    }


    // ==========================================
    // SEARCH PRODUCTS
    // ==========================================

    productSearch.addEventListener(
        "input",
        function () {

            const searchValue =
                productSearch.value
                    .trim()
                    .toLowerCase();

            const filteredProducts =
                products.filter(
                    function (product) {

                        const searchableText = [

                            product.name,
                            product.category,
                            product.brand,
                            product.quantity,
                            product.unit,
                            formatUnit(product.unit),
                            product.price,
                            product.supplier

                        ]
                            .join(" ")
                            .toLowerCase();

                        return searchableText
                            .includes(searchValue);
                    }
                );

            displayProducts(
                filteredProducts
            );
        }
    );


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    async function initializePage() {

        await loadSuppliers();

        await loadProducts();
    }

    initializePage();

});