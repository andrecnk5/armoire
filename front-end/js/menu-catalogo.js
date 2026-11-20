document.addEventListener("DOMContentLoaded", () => {
    const abrir = document.getElementById("abrirMenuCatalogo");
    const fechar = document.getElementById("fecharMenuCatalogo");
    const menu = document.getElementById("menuCatalogo");
    const overlay = document.getElementById("overlayMenuCatalogo");

    if (!abrir || !fechar || !menu || !overlay) return;

    function abrirMenu() {
        menu.inert = false;
        menu.classList.add("ativo");
        overlay.classList.add("ativo");

        menu.setAttribute("aria-hidden", "false");
        abrir.setAttribute("aria-expanded", "true");

        document.body.classList.add("menu-catalogo-aberto");
        fechar.focus();
    }

    function fecharMenu() {
        menu.classList.remove("ativo");
        overlay.classList.remove("ativo");

        menu.setAttribute("aria-hidden", "true");
        abrir.setAttribute("aria-expanded", "false");

        menu.inert = true;
        document.body.classList.remove("menu-catalogo-aberto");
        abrir.focus();
    }

    abrir.addEventListener("click", abrirMenu);
    fechar.addEventListener("click", fecharMenu);
    overlay.addEventListener("click", fecharMenu);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.classList.contains("ativo")) {
            fecharMenu();
        }
    });
});