// Gera os assets PNG do ControleObra a partir dos SVGs de logo em assets/.
// Fonte única da marca: assets/logo.svg (+ variantes maskable/foreground/monochrome).
// Rode após alterar qualquer um desses .svg:  node scripts/generate-assets.js
// Paleta: terracotta-500 (#C1694F), cream (#FAFAF8), moss-500 (#5B7553), sand-200 (#E8DCC8)

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

function readSvg(name) {
  return fs.readFileSync(path.join(ASSETS_DIR, name));
}

const logo = readSvg('logo.svg');
const foreground = readSvg('logo-foreground.svg');
const monochrome = readSvg('logo-monochrome.svg');

// Fundo sólido terracotta (background do adaptive icon Android)
const backgroundSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#C1694F"/></svg>`
);

async function generate() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const tasks = [
    { name: 'icon.png', svg: logo, size: 1024 },
    { name: 'splash-icon.png', svg: logo, size: 1024 },
    { name: 'favicon.png', svg: logo, size: 64 },
    { name: 'android-icon-foreground.png', svg: foreground, size: 1024 },
    { name: 'android-icon-background.png', svg: backgroundSvg, size: 1024 },
    { name: 'android-icon-monochrome.png', svg: monochrome, size: 1024 },
  ];

  for (const task of tasks) {
    const outPath = path.join(ASSETS_DIR, task.name);
    // Renderiza o SVG com density alta (supersample) e reduz com Lanczos
    // para evitar pixelação do rasterizador padrão em 72 DPI.
    await sharp(task.svg, { density: 384 })
      .resize(task.size, task.size, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✓ ${task.name} (${task.size}×${task.size})`);
  }

  console.log('\nTodos os assets gerados com sucesso em assets/');
}

generate().catch((err) => {
  console.error('Erro ao gerar assets:', err);
  process.exit(1);
});
