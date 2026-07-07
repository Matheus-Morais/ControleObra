/**
 * Captura de screenshots para a revisão visual do ControleObra (Playwright).
 *
 * Uso (via a skill visual-review):
 *   VR_EMAIL=... VR_PASS=... node .claude/skills/visual-review/scripts/shoot.mjs
 *
 * Variáveis de ambiente:
 *   VR_BASE   URL do app web (default http://localhost:8081)
 *   VR_EMAIL  e-mail de uma conta CONFIRMADA (opcional; sem ele captura só as telas públicas)
 *   VR_PASS   senha dessa conta
 *   VR_OUT    pasta de saída (default <cwd>/.visual-review/shots)
 *
 * NUNCA coloque credenciais neste arquivo — passe sempre por variável de ambiente.
 * A saída inclui manifest.json com a lista de screenshots gerados.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.VR_BASE || 'http://localhost:8081';
const EMAIL = process.env.VR_EMAIL || '';
const PASS = process.env.VR_PASS || '';
const OUT = process.env.VR_OUT || path.join(process.cwd(), '.visual-review', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log('[visual-review]', ...a);
const saved = [];

async function launch() {
  // Prefere o Edge/Chrome do sistema (sem download). Cai para o Chromium do
  // Playwright se necessário (requer `npx playwright install chromium`).
  for (const opts of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
    try {
      return await chromium.launch({ ...opts, headless: true });
    } catch {}
  }
  throw new Error('Não foi possível abrir um navegador. Rode: npx playwright install chromium');
}

async function shoot(page, name) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  saved.push(`${name}.png`);
  log('saved', name);
}

const waitText = (page, txt, t = 40000) =>
  page.locator(`text=${txt}`).first().waitFor({ state: 'visible', timeout: t });

async function gotoScreen(page, route, marker, name) {
  try {
    await page.goto(BASE + route, { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, marker);
    await shoot(page, name);
  } catch (e) {
    log(`FALHA ${name}: ${e.message.slice(0, 90)}`);
    await page.screenshot({ path: path.join(OUT, `${name}-FALLBACK.png`), fullPage: true }).catch(() => {});
  }
}

async function setTheme(page, label) {
  await page.goto(BASE + '/settings', { waitUntil: 'commit', timeout: 60000 });
  await waitText(page, 'Aparência').catch(() => {});
  await page.locator(`[aria-label="Tema ${label}"]`).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function capturePass(page, scheme) {
  await shoot(page, `settings-${scheme}`);
  await gotoScreen(page, '/', 'Resumo Financeiro', `dashboard-${scheme}`);
  await gotoScreen(page, '/rooms', 'Cômodos', `rooms-${scheme}`);
  await gotoScreen(page, '/items', 'no projeto', `items-${scheme}`);
  await gotoScreen(page, '/financial', 'Financeiro', `financial-${scheme}`);
  try {
    await page.goto(BASE + '/rooms', { waitUntil: 'commit', timeout: 60000 });
    await waitText(page, 'Cômodos');
    await page.locator('[aria-label^="Abrir cômodo"]').first().click({ timeout: 10000 });
    await waitText(page, 'Todos', 20000);
    await shoot(page, `room-items-${scheme}`);
    await page.locator('[aria-label^="Abrir item"]').first().click({ timeout: 10000 });
    await waitText(page, 'Opções de Produto', 20000);
    await shoot(page, `item-detail-${scheme}`);
  } catch (e) {
    log(`FALHA drill-down ${scheme}: ${e.message.slice(0, 90)}`);
  }
}

async function clickPularIfPresent(page) {
  const pular = page.locator('text=Pular').first();
  if (await pular.isVisible().catch(() => false)) {
    await pular.click().catch(() => {});
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

const browser = await launch();
const ctx = await browser.newContext({
  viewport: { width: 402, height: 874 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
page.on('pageerror', (e) => log('pageerror:', String(e).slice(0, 140)));

log(`BASE=${BASE} · auth=${EMAIL ? 'sim' : 'não (só telas públicas)'}`);
log(`OUT=${OUT}`);

// ---- Telas públicas: onboarding (1º acesso) + login + cadastro ----
try {
  await page.goto(BASE, { waitUntil: 'commit', timeout: 90000 });
  await Promise.race([
    page.locator('text=Pular').first().waitFor({ state: 'visible', timeout: 120000 }),
    page.getByPlaceholder('seu@email.com').waitFor({ state: 'visible', timeout: 120000 }),
  ]).catch(() => {});
  if (await page.locator('text=Pular').first().isVisible().catch(() => false)) {
    await shoot(page, 'onboarding-light');
    await clickPularIfPresent(page);
  }
  await page.getByPlaceholder('seu@email.com').waitFor({ state: 'visible', timeout: 60000 });
  await shoot(page, 'login-light');
  await page.locator('text=Cadastre-se').first().click({ timeout: 8000 });
  await waitText(page, 'Criar Conta', 15000);
  await shoot(page, 'register-light');
} catch (e) {
  log('captura pública parcial:', e.message.slice(0, 100));
}

// ---- Telas internas (requer credenciais) ----
if (EMAIL && PASS) {
  let loggedIn = false;
  try {
    await page.goto(BASE, { waitUntil: 'commit', timeout: 60000 });
    await Promise.race([
      page.locator('text=Pular').first().waitFor({ state: 'visible', timeout: 30000 }),
      page.getByPlaceholder('seu@email.com').waitFor({ state: 'visible', timeout: 30000 }),
    ]).catch(() => {});
    await clickPularIfPresent(page);
    await page.getByPlaceholder('seu@email.com').waitFor({ state: 'visible', timeout: 30000 });
    await page.getByPlaceholder('seu@email.com').fill(EMAIL);
    await page.getByPlaceholder('Sua senha').fill(PASS);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await Promise.race([
      waitText(page, 'Resumo Financeiro', 40000),
      waitText(page, 'Configurar Projeto', 40000),
      waitText(page, 'Bem-vindo', 40000),
    ]);
    loggedIn = true;
  } catch (e) {
    log('LOGIN FALHOU (verifique as credenciais / conta confirmada):', e.message.slice(0, 120));
  }

  if (loggedIn) {
    // Seleciona um projeto se o app abrir na tela de boas-vindas.
    const needsProject =
      (await page.locator('text=Configurar Projeto').first().isVisible().catch(() => false)) ||
      (await page.locator('text=Bem-vindo').first().isVisible().catch(() => false));
    let hasProject = !needsProject;
    if (needsProject) {
      await page.goto(BASE + '/project-setup', { waitUntil: 'commit', timeout: 60000 });
      const card = page.locator('[aria-label^="Abrir projeto"]').first();
      await card.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});
      if (await card.isVisible().catch(() => false)) {
        await card.click();
        await waitText(page, 'Resumo Financeiro', 40000).catch(() => {});
        hasProject = true;
      } else {
        log('conta sem projetos — capturando apenas project-setup');
        await shoot(page, 'project-setup-vazio');
      }
    }

    if (hasProject) {
      await setTheme(page, 'Claro');
      await capturePass(page, 'light');
      await setTheme(page, 'Escuro');
      await capturePass(page, 'dark');
    }
  }
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(saved, null, 2));
await browser.close();
log(`DONE — ${saved.length} screenshots em ${OUT}`);
