document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("loginForm");

    const usernameInput =
        document.getElementById("username");

    const passwordInput =
        document.getElementById("password");

    const rememberMe =
        document.getElementById("rememberMe");

    const errorMessage =
        document.getElementById("errorMessage");

    const loginButton =
        document.getElementById("loginButton");

    const togglePassword =
        document.getElementById("togglePassword");


    // ==========================================
    // SHOW / HIDE PASSWORD
    // ==========================================

    togglePassword.addEventListener("click", () => {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            togglePassword.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';

        } else {

            passwordInput.type = "password";

            togglePassword.innerHTML =
                '<i class="fa-solid fa-eye"></i>';

        }

    });


    // ==========================================
    // LOGIN
    // ==========================================

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        errorMessage.textContent = "";

        loginButton.disabled = true;

        loginButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

        try {

            const response = await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    username: usernameInput.value.trim(),

                    password: passwordInput.value,

                    rememberMe: rememberMe.checked

                })

            });

            const result = await response.json();

            if (result.success) {

                window.location.href =
                    result.redirect || "/dashboard";

            } else {

                errorMessage.textContent =
                    result.message || "Invalid username or password.";

            }

        } catch (error) {

            console.error(error);

            errorMessage.textContent =
                "Unable to connect to the server.";

        }

        loginButton.disabled = false;

        loginButton.innerHTML =
            '<i class="fa-solid fa-right-to-bracket"></i> Login';

    });

});