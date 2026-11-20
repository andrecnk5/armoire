
document.addEventListener("DOMContentLoaded", () => {

    const catalogo = document.querySelector(".catalogo");

    const botao = document.getElementById("alternarFiltros");

    const painel = document.getElementById("painelFiltros");

    if (!catalogo || !botao || !painel) {
        return;
    }

    const texto = botao.querySelector("span");

    function atualizarFiltros(ocultos) {

        catalogo.classList.toggle(
            "filtros-ocultos",
            ocultos
        );

        botao.setAttribute(
            "aria-expanded",
            String(!ocultos)
        );

        if (texto) {
            texto.textContent = ocultos
                ? "MOSTRAR FILTROS"
                : "OCULTAR FILTROS";
        }

        painel.inert = ocultos;
    }

    // Estado inicial: filtros abertos
    atualizarFiltros(false);

    botao.addEventListener("click", () => {

        const ocultos = !catalogo.classList.contains(
            "filtros-ocultos"
        );

        atualizarFiltros(ocultos);

    });

});
