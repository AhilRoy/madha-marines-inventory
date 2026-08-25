document.addEventListener("DOMContentLoaded", function () {

    const mobileMenuButton =
        document.getElementById("mobileMenuBtn");

    const sidebar =
        document.querySelector(".sidebar");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");
    
    const currentPage =
        window.location.pathname
        .split("/")
        .pop() || "dashboard.html";

    const sidebarLinks =
        document.querySelectorAll(".sidebar a");

    sidebarLinks.forEach(function (link) {

        const linkPage =
            link.getAttribute("href")
                 ?.split("/")
                 .pop();

        if (linkPage === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    function openMobileSidebar() {

        if (!sidebar || !sidebarOverlay || !mobileMenuButton) {
            return;
        }

        sidebar.classList.add("open");
        sidebarOverlay.classList.add("show");
        document.body.classList.add("sidebar-open");

        mobileMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closeMobileSidebar() {

        if (!sidebar || !sidebarOverlay || !mobileMenuButton) {
            return;
        }

        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("show");
        document.body.classList.remove("sidebar-open");

        mobileMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    if (mobileMenuButton && sidebar && sidebarOverlay) {

        mobileMenuButton.addEventListener(
            "click",
            function () {

                if (sidebar.classList.contains("open")) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            }
        );

        sidebarOverlay.addEventListener(
            "click",
            closeMobileSidebar
        );

        sidebar.querySelectorAll("a").forEach(
            function (link) {
                link.addEventListener(
                    "click",
                    closeMobileSidebar
                );
            }
        );

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {
                    closeMobileSidebar();
                }
            }
        );

        window.addEventListener(
            "resize",
            function () {

                if (window.innerWidth > 768) {
                    closeMobileSidebar();
                }
            }
        );
    }
});