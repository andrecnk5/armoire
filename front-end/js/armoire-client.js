/* ARMOIRE — configuração pública e cliente compartilhado. Não contém chave privada. */
(() => {
  "use strict";
  if (window.armoireServico) return;
  const url = "https://wcuutgmwlipshdpqxbim.supabase.co";
  const chavePublica = "sb_publishable_sbX0g8RVoczkFCE4rRtrzQ_n7xvWHL1";
  function cliente() {
    if (window.armoireSupabase) return window.armoireSupabase;
    if (!window.supabase?.createClient) return null;
    try {
      window.armoireSupabase = window.supabase.createClient(url, chavePublica, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      return window.armoireSupabase;
    } catch (erro) {
      console.error("Armoire: não foi possível inicializar o serviço.", erro);
      return null;
    }
  }
  async function executar(operacao, escrita = false) {
    let timer;
    try {
      return await Promise.race([operacao, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(escrita
          ? "Sem confirmação do serviço. Confira seus dados antes de repetir a operação."
          : "O serviço demorou a responder. Tente novamente.")), 8000);
      })]);
    } finally { clearTimeout(timer); }
  }
  function idProduto(valor) {
    if (typeof valor !== "string" && !(typeof valor === "number" && Number.isFinite(valor))) return "";
    const id = String(valor).trim();
    return !id || ["undefined", "null", "__proto__", "constructor", "toString"].includes(id) ? "" : id;
  }
  window.armoireServico = Object.freeze({ url, chavePublica, cliente, executar, idProduto });
})();
