// Gera os assets PNG do ControleObra a partir do SVG da logo
// Paleta: terracotta-500 (#C1694F), cream (#FAFAF8), moss-500 (#5B7553), sand-200 (#E8DCC8)
// Uso: node scripts/generate-assets.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// SVG da logo principal (1024×1024)
const logoSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo terracotta com cantos arredondados -->
  <rect width="1024" height="1024" rx="180" fill="#C1694F"/>

  <!-- Sombra suave da casa -->
  <ellipse cx="512" cy="820" rx="240" ry="24" fill="#A85740" opacity="0.4"/>

  <!-- Telhado (triângulo cream) -->
  <polygon points="512,185 820,460 204,460" fill="#FAFAF8"/>

  <!-- Detalhe de cumeeira (linha terracotta escura) -->
  <line x1="512" y1="185" x2="512" y2="220" stroke="#A85740" stroke-width="10" stroke-linecap="round"/>

  <!-- Chaminé (moss) -->
  <rect x="650" y="240" width="52" height="120" rx="10" fill="#5B7553"/>
  <rect x="638" y="235" width="76" height="20" rx="6" fill="#4A6043"/>

  <!-- Corpo da casa (cream) -->
  <rect x="234" y="450" width="556" height="360" rx="8" fill="#FAFAF8"/>

  <!-- Janela esquerda (sand-200 com contorno) -->
  <rect x="290" y="510" width="130" height="110" rx="14" fill="#E8DCC8"/>
  <line x1="355" y1="510" x2="355" y2="620" stroke="#C4B08E" stroke-width="4"/>
  <line x1="290" y1="565" x2="420" y2="565" stroke="#C4B08E" stroke-width="4"/>

  <!-- Janela direita (sand-200 com contorno) -->
  <rect x="604" y="510" width="130" height="110" rx="14" fill="#E8DCC8"/>
  <line x1="669" y1="510" x2="669" y2="620" stroke="#C4B08E" stroke-width="4"/>
  <line x1="604" y1="565" x2="734" y2="565" stroke="#C4B08E" stroke-width="4"/>

  <!-- Porta (moss-500, centralizada) -->
  <rect x="432" y="610" width="160" height="200" rx="22" fill="#5B7553"/>

  <!-- Detalhe da porta: maçaneta -->
  <circle cx="572" cy="716" r="10" fill="#4A6043"/>

  <!-- Elemento de obra: régua/nível (terracotta escuro) na base -->
  <rect x="650" y="754" width="120" height="26" rx="8" fill="#6C3628"/>
  <rect x="660" y="759" width="8" height="16" rx="3" fill="#FAFAF8" opacity="0.7"/>
  <rect x="680" y="759" width="8" height="16" rx="3" fill="#FAFAF8" opacity="0.7"/>
  <rect x="700" y="759" width="8" height="16" rx="3" fill="#FAFAF8" opacity="0.7"/>
  <rect x="720" y="759" width="8" height="16" rx="3" fill="#FAFAF8" opacity="0.7"/>
  <rect x="740" y="759" width="8" height="16" rx="3" fill="#FAFAF8" opacity="0.7"/>

  <!-- Gramado (moss claro) -->
  <rect x="0" y="810" width="1024" height="214" rx="0" fill="#5B7553" opacity="0.15"/>
</svg>`;

// SVG do foreground Android (sem fundo, para adaptive icon)
const androidForegroundSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Sombra suave da casa -->
  <ellipse cx="512" cy="820" rx="240" ry="24" fill="#A85740" opacity="0.3"/>

  <!-- Telhado (cream) -->
  <polygon points="512,200 800,450 224,450" fill="#FAFAF8"/>

  <!-- Chaminé (moss) -->
  <rect x="640" y="248" width="48" height="110" rx="10" fill="#5B7553"/>
  <rect x="630" y="243" width="68" height="18" rx="5" fill="#4A6043"/>

  <!-- Corpo da casa -->
  <rect x="254" y="440" width="516" height="360" rx="8" fill="#FAFAF8"/>

  <!-- Janela esquerda -->
  <rect x="308" y="498" width="120" height="100" rx="12" fill="#E8DCC8"/>
  <line x1="368" y1="498" x2="368" y2="598" stroke="#C4B08E" stroke-width="4"/>
  <line x1="308" y1="548" x2="428" y2="548" stroke="#C4B08E" stroke-width="4"/>

  <!-- Janela direita -->
  <rect x="596" y="498" width="120" height="100" rx="12" fill="#E8DCC8"/>
  <line x1="656" y1="498" x2="656" y2="598" stroke="#C4B08E" stroke-width="4"/>
  <line x1="596" y1="548" x2="716" y2="548" stroke="#C4B08E" stroke-width="4"/>

  <!-- Porta (moss) -->
  <rect x="442" y="600" width="140" height="200" rx="20" fill="#5B7553"/>
  <circle cx="568" cy="706" r="9" fill="#4A6043"/>

  <!-- Régua de obra -->
  <rect x="640" y="748" width="110" height="24" rx="7" fill="#6C3628"/>
  <rect x="650" y="753" width="7" height="14" rx="2" fill="#FAFAF8" opacity="0.7"/>
  <rect x="668" y="753" width="7" height="14" rx="2" fill="#FAFAF8" opacity="0.7"/>
  <rect x="686" y="753" width="7" height="14" rx="2" fill="#FAFAF8" opacity="0.7"/>
  <rect x="704" y="753" width="7" height="14" rx="2" fill="#FAFAF8" opacity="0.7"/>
  <rect x="722" y="753" width="7" height="14" rx="2" fill="#FAFAF8" opacity="0.7"/>
</svg>`;

// SVG do background Android (cor sólida terracotta)
const androidBackgroundSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#C1694F"/>
</svg>`;

// SVG do monochrome Android (branco sobre fundo transparente)
const androidMonochromeSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <polygon points="512,185 820,460 204,460" fill="white"/>
  <rect x="640" y="240" width="52" height="120" rx="10" fill="white"/>
  <rect x="628" y="235" width="76" height="20" rx="6" fill="white" opacity="0.8"/>
  <rect x="234" y="450" width="556" height="360" rx="8" fill="white"/>
  <rect x="290" y="510" width="130" height="110" rx="14" fill="black" opacity="0.15"/>
  <rect x="604" y="510" width="130" height="110" rx="14" fill="black" opacity="0.15"/>
  <rect x="432" y="610" width="160" height="200" rx="22" fill="black" opacity="0.2"/>
</svg>`;

async function generate() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const tasks = [
    {
      name: 'icon.png',
      svg: logoSvg,
      width: 1024,
      height: 1024,
    },
    {
      name: 'splash-icon.png',
      svg: logoSvg,
      width: 1024,
      height: 1024,
    },
    {
      name: 'favicon.png',
      svg: logoSvg,
      width: 64,
      height: 64,
    },
    {
      name: 'android-icon-foreground.png',
      svg: androidForegroundSvg,
      width: 1024,
      height: 1024,
    },
    {
      name: 'android-icon-background.png',
      svg: androidBackgroundSvg,
      width: 1024,
      height: 1024,
    },
    {
      name: 'android-icon-monochrome.png',
      svg: androidMonochromeSvg,
      width: 1024,
      height: 1024,
    },
  ];

  for (const task of tasks) {
    const outPath = path.join(ASSETS_DIR, task.name);
    // Renderiza o SVG com density=300 (supersample ~4×) e reduz com Lanczos
    // para evitar pixelação causada pelo rasterizador padrão em 72 DPI.
    await sharp(Buffer.from(task.svg), { density: 300 })
      .resize(task.width, task.height, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✓ ${task.name} (${task.width}×${task.height})`);
  }

  console.log('\nTodos os assets gerados com sucesso em assets/');
}

generate().catch((err) => {
  console.error('Erro ao gerar assets:', err);
  process.exit(1);
});
