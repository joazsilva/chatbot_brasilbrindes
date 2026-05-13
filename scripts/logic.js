// ===========================
//  CONFIGURAÇÃO — EDITE AQUI
// ===========================
const NOME_EMPRESA = 'Atendimento Online';
 
// ─── REGRAS DE ROTEAMENTO POR ESTADO ─────────────────────────────
// Cada estado pode ter múltiplos vendedores (rodízio por hora)
const VENDEDORES = {
  // Pará → Marcos (horas pares) | Rosana (horas ímpares)
  'PA': [
    { nome: 'Marcos', numero: '5591993124440' },
    { nome: 'Rosana', numero: '5599984023179' },
  ],
  // Maranhão → Cristina (horas pares) | Rosana (horas ímpares)
  'MA': [
    { nome: 'Cristina', numero: '5599991284929' },
    { nome: 'Rosana',   numero: '5599984023179' },
  ],
  // Fallback (outros estados) → rodízio entre todos
  'DEFAULT': [
    { nome: 'Rosana',   numero: '5599984023179' },
    { nome: 'Marcos',   numero: '5591993124440' },
    { nome: 'Cristina', numero: '5599991284929' },
  ],
};
 
// Mapa de siglas e variações de nome para o estado
const ESTADO_MAP = {
  'pa': 'PA', 'para': 'PA', 'belem': 'PA', 'santarem': 'PA',
  'maraba': 'PA', 'castanhal': 'PA', 'altamira': 'PA',
  'parauapebas': 'PA', 'ananindeua': 'PA',
  'ma': 'MA', 'maranhao': 'MA', 'sao luis': 'MA', 'imperatriz': 'MA',
  'timon': 'MA', 'caxias': 'MA', 'codo': 'MA', 'bacabal': 'MA',
  'acailandia': 'MA', 'balsas': 'MA', 'paco do lumiar': 'MA',
  'chapadinha': 'MA', 'santa ines': 'MA', 'zé doca': 'MA', 'ze doca': 'MA',
};
 
// ─── SELEÇÃO DO VENDEDOR ─────────────────────────────────────────
function normalizar(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '');
}
 
function selecionarVendedor(cidadeEstado) {
  const texto = normalizar(cidadeEstado);
  let estadoKey = 'DEFAULT';
  for (const [chave, sigla] of Object.entries(ESTADO_MAP)) {
    if (texto.includes(chave)) { estadoKey = sigla; break; }
  }
  const lista = VENDEDORES[estadoKey] || VENDEDORES['DEFAULT'];
  const hora  = new Date().getHours();
  return { vendedor: lista[hora % lista.length], estado: estadoKey };
}
// ===========================
 
// ─── CATÁLOGO DE PRODUTOS ────────────────────────────────────────
const CATALOGO = {
  embalagens: {
    label: '🛍️ Embalagens personalizadas',
    itens: {
      'Sacolas de papel':    { min: 200, unidade: 'unidades', pedirRamo: true },
      'Sacolas plásticas':   { min: 500, unidade: 'unidades', pedirRamo: true },
      'Caixas para presentes':{ min: 200, unidade: 'unidades', pedirRamo: true },
      'Ecobags':             { min: 50,  unidade: 'unidades', pedirRamo: true },
    }
  },
  brindes: {
    label: '🎁 Brindes',
    itens: {
      'Canetas':                { min: 50, unidade: 'unidades' },
      'Chaveiros':              { min: 50, unidade: 'unidades' },
      'Agendas':                { min: 50, unidade: 'unidades' },
      'Carteiras de despachante':{ min: 50, unidade: 'unidades' },
      'Escovinha com espelho':  { min: 50, unidade: 'unidades' },
    }
  },
  acessorios: {
    label: '✨ Acessórios',
    itens: {
      'Fitas de cetim':          { min: 1,   unidade: 'rolo (50 metros cada)' },
      'Papel seda':              { min: 500, unidade: 'unidades (60x50 cm cada)' },
      'Etiquetas para fechar sacola':{ min: 500, unidade: 'unidades (tamanhos/modelos variados à sua escolha)' },
    }
  }
};
 
const msgs = document.getElementById('chat-messages');
const input = document.getElementById('msg-input');
 
// Estado
let step = 'menu';
let userData = {};
let uploadedImg = null;
 
function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function scrollBottom() {
  setTimeout(() => msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' }), 60);
}
 
// ─── TYPING INDICATOR ────────────────────────────────────────────
function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'message bot';
  wrap.id = 'typing-indicator';
  wrap.style.position = 'relative';
  wrap.innerHTML = `<div class="typing-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  msgs.appendChild(wrap);
  scrollBottom();
}
function removeTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}
 
// ─── ADD MESSAGE ─────────────────────────────────────────────────
function addMessage(text, side = 'bot', delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      removeTyping();
      const wrap = document.createElement('div');
      wrap.className = `message ${side}`;
      wrap.style.position = 'relative';
      const checks = side === 'user' ? `<span class="check-icon">✓✓</span>` : '';
      wrap.innerHTML = `<div class="bubble">${text}<div class="bubble-time">${now()}${checks}</div></div>`;
      msgs.appendChild(wrap);
      scrollBottom();
      resolve();
    }, delay);
  });
}
 
// ─── ADD QUICK REPLIES ───────────────────────────────────────────
function addButtons(buttons, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      const wrap = document.createElement('div');
      wrap.className = 'quick-replies';
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'qr-btn';
        btn.textContent = b.label;
        btn.onclick = () => {
          wrap.remove();
          addMessage(b.label, 'user');
          b.action();
        };
        wrap.appendChild(btn);
      });
      msgs.appendChild(wrap);
      scrollBottom();
      resolve();
    }, delay);
  });
}
 
// ─── BOT SPEAK ───────────────────────────────────────────────────
async function botSay(text, typingDelay = 900) {
  showTyping();
  await new Promise(r => setTimeout(r, typingDelay));
  await addMessage(text, 'bot');
}
 
// ─── ENABLE/DISABLE INPUT ────────────────────────────────────────
function enableInput() {
  input.disabled = false;
  document.getElementById('send-btn').disabled = false;
  input.focus();
}
function disableInput() {
  input.disabled = true;
  document.getElementById('send-btn').disabled = true;
}
 
// ═══════════════════════════════════════════════════════════════
//  FLUXO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
 
async function startChat() {
  disableInput();
  await botSay('Olá, tudo bem? 😊', 1200);
  await botSay('Como posso te ajudar hoje?', 700);
  await addButtons([
    { label: '🛍️ Fazer um pedido',      action: startPedido },
    { label: '📦 Prazos de entrega',    action: showPrazos },
    { label: '👤 Falar com atendente',  action: falarAtendente },
  ], 300);
}
 
async function showMenu() {
  step = 'menu';
  await botSay('Como mais posso te ajudar? 😊', 700);
  await addButtons([
    { label: '🛍️ Fazer um pedido',      action: startPedido },
    { label: '📦 Prazos de entrega',    action: showPrazos },
    { label: '👤 Falar com atendente',  action: falarAtendente },
  ], 200);
}
 
// ── PRAZOS ───────────────────────────────────────────────────────
async function showPrazos() {
  step = 'prazos';
  await botSay('📦 <b>Prazos de produção e entrega</b><br><br>Após aprovação da arte:<br>🛠️ Produção: 15 a 20 dias úteis<br>⚡ Entrega: 2 a 5 dias úteis', 1000);
  await addButtons([
    { label: '🛍️ Fazer um pedido',      action: startPedido },
    { label: '👤 Falar com atendente',  action: falarAtendente },
    { label: '◀️ Voltar ao menu',        action: showMenu },
  ], 200);
}
 
// ── FALAR COM ATENDENTE ──────────────────────────────────────────
async function falarAtendente() {
  userData = {};
  step = 'atendente_nome';
  disableInput();
  await botSay('Claro! Vou te conectar com um de nossos atendentes. 😊', 900);
  await botSay('Para agilizar, me diga o seu <b>nome</b>:', 600);
  enableInput();
}
 
// ── INÍCIO DO PEDIDO ─────────────────────────────────────────────
async function startPedido() {
  userData = {};
  step = 'pedido_nome';
  disableInput();
  await botSay('Ótimo! Vou te ajudar a montar seu pedido. 📋', 900);
  await botSay('Primeiro, qual é o seu <b>nome</b>?', 600);
  enableInput();
}
 
// ── ESCOLHA DE CATEGORIA ─────────────────────────────────────────
async function escolherCategoria() {
  step = 'categoria';
  disableInput();
  await botSay(`Prazer, <b>${userData.nome}</b>! 😊`, 700);
  await botSay('Que tipo de produto você está buscando?', 600);
  await addButtons([
    { label: '🛍️ Embalagens personalizadas', action: () => escolherProduto('embalagens') },
    { label: '🎁 Brindes',                   action: () => escolherProduto('brindes') },
    { label: '✨ Acessórios',                 action: () => escolherProduto('acessorios') },
  ], 300);
}
 
// ── ESCOLHA DE PRODUTO DENTRO DA CATEGORIA ───────────────────────
async function escolherProduto(categoria) {
  userData.categoria = categoria;
  step = 'produto';
  disableInput();
 
  const cat = CATALOGO[categoria];
  const nomes = Object.keys(cat.itens);
 
  await botSay(`Ótima escolha! Trabalhamos com os seguintes itens de <b>${cat.label}</b>:`, 800);
 
  const btns = nomes.map(nome => ({
    label: nome,
    action: () => selecionarProduto(nome)
  }));
  btns.push({ label: '◀️ Voltar às categorias', action: escolherCategoria });
  await addButtons(btns, 300);
}
 
// ── PRODUTO SELECIONADO ──────────────────────────────────────────
async function selecionarProduto(nome) {
  const cat = CATALOGO[userData.categoria];
  const info = cat.itens[nome];
 
  // Produto não existe no catálogo (caso digitado manualmente)
  if (!info) {
    await botSay('Desculpe, não trabalhamos com esse produto. 😕', 800);
    await botSay('Mas posso te ajudar com um dos nossos itens disponíveis!', 600);
    await escolherCategoria();
    return;
  }
 
  userData.produto = nome;
  userData.minQtd = info.min;
  userData.unidade = info.unidade;
  userData.pedirRamo = info.pedirRamo || false;
 
  await botSay(`Perfeito! <b>${nome}</b> selecionado. ✅`, 700);
  await botSay(`ℹ️ A quantidade mínima para <b>${nome}</b> é de <b>${info.min} ${info.unidade}</b>.`, 800);
 
  if (info.pedirRamo) {
    step = 'ramo';
    await botSay('Para prepararmos um orçamento certeiro, qual é o <b>ramo da sua loja</b>? (ex: moda, cosméticos, papelaria, pet shop...)', 900);
    enableInput();
  } else {
    step = 'quantidade';
    await botSay('Qual a <b>quantidade</b> que você precisa?', 700);
    enableInput();
  }
}
 
// ─── SEND MESSAGE ────────────────────────────────────────────────
async function sendMessage(text) {
  const txt = (text ?? input.value).trim();
  if (!txt && !uploadedImg) return;
 
  disableInput();
  if (!text) {
    input.value = '';
    input.style.height = 'auto';
  }
 
  if (uploadedImg) {
    const wrap = document.createElement('div');
    wrap.className = 'message user';
    wrap.style.position = 'relative';
    wrap.innerHTML = `<div class="bubble"><img src="${uploadedImg}" class="img-preview" alt="imagem enviada">${txt ? txt : ''}<div class="bubble-time">${now()}<span class="check-icon">✓✓</span></div></div>`;
    msgs.appendChild(wrap);
    scrollBottom();
    uploadedImg = null;
    document.getElementById('file-input').value = '';
    if (step === 'logo') {
      userData.logo = 'Sim';
      await finalizarOrcamento();
      return;
    }
  } else if (txt) {
    await addMessage(txt, 'user');
  }
 
  await handleStep(txt);
}
 
// ─── HANDLE STEPS ────────────────────────────────────────────────
async function handleStep(txt) {
  switch(step) {
 
    // ── PEDIDO ──
    case 'pedido_nome':
      userData.nome = txt;
      await escolherCategoria();
      break;
 
    case 'ramo':
      userData.ramo = txt;
      step = 'quantidade';
      await botSay(`Anotado! 📝 Ramo: <b>${txt}</b>.`, 600);
      await botSay(`Qual a <b>quantidade</b> desejada? (mínimo: ${userData.minQtd} ${userData.unidade})`, 700);
      enableInput();
      break;
 
    case 'quantidade':
      userData.quantidade = txt;
      step = 'cidade';
      await botSay('Perfeito! ✅', 500);
      await botSay('Qual sua <b>cidade/estado</b>?', 600);
      enableInput();
      break;
 
    case 'cidade':
      userData.cidade = txt;
      step = 'logo';
      await botSay('Anotado! 📍', 500);
      await botSay('Você tem uma <b>logo ou referência</b> para enviar? Use o ícone de imagem ao lado 📎', 700);
      await addButtons([
        { label: '📎 Tenho logo/referência',  action: () => { step = 'logo'; enableInput(); } },
        { label: '❌ Não tenho no momento',   action: () => { userData.logo = 'Não'; finalizarOrcamento(); } },
      ], 300);
      break;
 
    case 'logo':
      userData.logo = 'Não';
      await finalizarOrcamento();
      break;
 
    // ── ATENDENTE ──
    case 'atendente_nome':
      userData.nome = txt;
      step = 'atendente_estado';
      await botSay(`Obrigado, <b>${txt}</b>! 😊`, 600);
      await botSay('E qual é o seu <b>estado</b> (ex: SP, RJ, MA...)?', 600);
      enableInput();
      break;
 
    case 'atendente_estado':
      userData.estado = txt;
      step = 'done_atendente';
      await encaminharAtendente();
      break;
 
    default:
      enableInput();
  }
}
 
// ─── ENCAMINHAR PARA ATENDENTE ────────────────────────────────────
async function encaminharAtendente() {
  await botSay('Perfeito! Encaminhando seus dados... ⏳', 800);
 
  // ── Roteamento por estado informado ──
  const { vendedor } = selecionarVendedor(userData.estado || '');
 
  const resumoWA =
`👤 *CLIENTE QUER ATENDIMENTO*
 
Nome: ${userData.nome || '-'}
Estado: ${userData.estado || '-'}`;
 
  const link = `https://wa.me/${vendedor.numero}?text=${encodeURIComponent(resumoWA)}`;
 
  const wrap = document.createElement('div');
  wrap.className = 'message bot';
  wrap.style.position = 'relative';
  wrap.innerHTML = `
    <div class="bubble">
      <div class="summary-card">
        <div class="summary-title">👤 Seus dados</div>
        👤 Nome: <b>${userData.nome||'-'}</b><br>
        📍 Estado: <b>${userData.estado||'-'}</b>
      </div>
      <div class="bubble-time">${now()}</div>
    </div>`;
  msgs.appendChild(wrap);
  scrollBottom();
 
  await new Promise(r => setTimeout(r, 600));
  await botSay('Um atendente vai te chamar em breve! Se preferir, já fale agora: 💬', 800);
 
  const wa = document.createElement('div');
  wa.className = 'message bot';
  wa.style.position = 'relative';
  wa.innerHTML = `
    <div class="bubble">
      <a class="wa-open-btn" href="${link}" target="_blank">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Falar com atendente agora
      </a>
      <div class="bubble-time">${now()}</div>
    </div>`;
  msgs.appendChild(wa);
  scrollBottom();
 
  setTimeout(async () => {
    await botSay('Posso te ajudar com mais alguma coisa? 😊', 800);
    await addButtons([
      { label: '🛍️ Fazer um pedido',     action: startPedido },
      { label: '📦 Prazos de entrega',   action: showPrazos },
    ], 200);
  }, 1500);
}
 
// ─── FINALIZAR ORÇAMENTO ─────────────────────────────────────────
async function finalizarOrcamento() {
  step = 'finalizado';
  await botSay('Perfeito! Organizando seu orçamento... ⏳', 900);
 
  const cat = CATALOGO[userData.categoria];
  const catLabel = cat ? cat.label : '-';
 
  // ── Roteamento inteligente ──
  const { vendedor } = selecionarVendedor(userData.cidade);
 
  const resumo =
`📋 *NOVO ORÇAMENTO*
 
👤 Nome: ${userData.nome || '-'}
🏷️ Categoria: ${catLabel}
📦 Produto: ${userData.produto || '-'}${userData.ramo ? `\n🏪 Ramo da loja: ${userData.ramo}` : ''}
🔢 Quantidade: ${userData.quantidade || '-'}
📍 Cidade/Estado: ${userData.cidade || '-'}
🖼️ Referência enviada: ${userData.logo || 'Não'}`;
 
  const waLink = `https://wa.me/${vendedor.numero}?text=${encodeURIComponent(resumo)}`;
 
  await botSay('Pronto! Confira o resumo do seu pedido: 📋', 800);
 
  const wrap = document.createElement('div');
  wrap.className = 'message bot';
  wrap.style.position = 'relative';
  wrap.innerHTML = `
    <div class="bubble">
      <div class="summary-card">
        <div class="summary-title">📋 Resumo do Pedido</div>
        👤 Nome: <b>${userData.nome||'-'}</b><br>
        🏷️ Categoria: <b>${catLabel}</b><br>
        📦 Produto: <b>${userData.produto||'-'}</b><br>
        ${userData.ramo ? `🏪 Ramo: <b>${userData.ramo}</b><br>` : ''}
        🔢 Quantidade: <b>${userData.quantidade||'-'}</b><br>
        📍 Cidade/Estado: <b>${userData.cidade||'-'}</b><br>
        🖼️ Referência: <b>${userData.logo||'Não'}</b>
      </div>
      <div class="bubble-time">${now()}</div>
    </div>`;
  msgs.appendChild(wrap);
  scrollBottom();
 
  await new Promise(r => setTimeout(r, 700));
  await botSay('Agora é só clicar abaixo para enviar para o WhatsApp do vendedor! 🚀', 800);
 
  const wa = document.createElement('div');
  wa.className = 'message bot';
  wa.style.position = 'relative';
  wa.innerHTML = `
    <div class="bubble">
      <a class="wa-open-btn" href="${waLink}" target="_blank">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Enviar orçamento pelo WhatsApp
      </a>
      <div class="bubble-time">${now()}</div>
    </div>`;
  msgs.appendChild(wa);
  scrollBottom();
 
  setTimeout(async () => {
    await botSay('Tem mais alguma dúvida? 😊', 800);
    await addButtons([
      { label: '🛍️ Novo pedido',          action: startPedido },
      { label: '📦 Prazos de entrega',    action: showPrazos },
      { label: '👤 Falar com atendente',  action: falarAtendente },
    ], 200);
  }, 1500);
}
 
// ─── FILE UPLOAD ─────────────────────────────────────────────────
function handleFileUpload(inp) {
  const file = inp.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImg = e.target.result;
    sendMessage('');
  };
  reader.readAsDataURL(file);
}
 
// ─── AUTO RESIZE TEXTAREA ────────────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}
 
// ─── INIT ────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(startChat, 600);
});