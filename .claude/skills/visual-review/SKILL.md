---
name: visual-review
description: >-
  Revisão visual do app ControleObra com Playwright — sobe o app web, faz login,
  captura screenshots de todas as telas (light + dark) e as analisa contra
  heurísticas de UX e vieses cognitivos, reportando bugs visuais e melhorias
  priorizadas. Use quando o usuário pedir "review visual", "revisão visual",
  "revisar o visual do app", "checar o layout com playwright", "tirar screenshots
  das telas", "ver ajustes visuais", "auditar a UI" ou similar.
---

# Revisão visual (Playwright)

Automatiza a captura e a análise visual do ControleObra (Expo web em
`localhost:8081`). Cobre onboarding, login, cadastro, dashboard, cômodos, itens,
financeiro, ajustes, detalhe do cômodo e detalhe do item — em **light e dark**.

## Passo a passo

### 1. Garanta o servidor web (porta 8081)
Cheque se já está no ar; se não, suba em background e espere ficar pronto.
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081    # 200 = no ar
```
Se não estiver: rode `EXPO_NO_INTERACTIVE=1 BROWSER=none npx expo start --web --port 8081`
em background e aguarde a linha `Waiting on http://localhost:8081` no log (o
primeiro bundle demora ~1 min). Se a porta estiver ocupada por um Metro velho,
finalize o processo dono da porta antes.

### 2. Credenciais (para as telas internas)
As telas internas exigem uma sessão logada. O cadastro do app pede confirmação de
e-mail, então **use uma conta já confirmada**.
- **NUNCA** escreva credenciais neste repositório. Passe-as por variável de
  ambiente só no momento de rodar (`VR_EMAIL`, `VR_PASS`).
- Se o usuário não fornecer credenciais, rode mesmo assim: o script captura só as
  telas públicas (onboarding, login, cadastro). Avise que as internas ficaram de fora.
- Peça as credenciais ao usuário se ele não as tiver dado nesta conversa.

### 3. Instale o Playwright da skill (uma vez)
```bash
npm install --prefix .claude/skills/visual-review/scripts
```
O script usa o Edge/Chrome do sistema (sem download). Se o navegador não abrir,
rode `npx playwright install chromium` e tente de novo.

### 4. Capture os screenshots
```bash
VR_EMAIL='<email>' VR_PASS='<senha>' node .claude/skills/visual-review/scripts/shoot.mjs
```
Sem credenciais, é só `node .claude/skills/visual-review/scripts/shoot.mjs`.
Saída (gitignorada): `.visual-review/shots/` + `manifest.json` com a lista de arquivos.

### 5. Analise as imagens
Leia cada PNG de `.visual-review/shots/` com a ferramenta **Read** (ela mostra a
imagem) — priorize dashboard, itens, detalhe do item e um par light/dark. Avalie:

- **Bugs visuais primeiro**: telas em branco/erro, elementos invisíveis, texto
  ilegível (contraste), corte de conteúdo, DOM inválido (ex.: botão aninhado),
  layout quebrado. Confirme no código antes de afirmar.
- **Heurísticas / vieses cognitivos**: Lei de Prägnanz (sinal‑ruído), Aesthetic‑
  Usability, Lei de Hick, Fitts (alvos de toque), Von Restorff (destaque do que
  importa), Zeigarnik/Endowed Progress (progresso motivador), Ancoragem.
- **Consistência do design system**: paleta `sand`/`terracotta`/`moss`/`cream`;
  usar `colors.accent` em vez de cores fixas divergentes; funcionar em light **e**
  dark; espaçamento e hierarquia dos cards.
- **Acessibilidade**: contraste, tamanho de toque, `accessibilityLabel`.

### 6. Reporte e ofereça implementar
Liste os achados priorizados (bug > melhoria) com `arquivo:linha` quando possível
e uma proposta objetiva por item. Ofereça implementar; ao implementar, valide com
`npx tsc --noEmit` e **recapture** para comparar antes/depois.

## Observações
- O script conhece os seletores/rotas atuais (placeholder do login, "Pular" do
  onboarding, abas `/rooms` `/items` `/financial` `/settings`, labels de tema
  `Tema Claro`/`Tema Escuro`, `aria-label` "Abrir cômodo/item/projeto"). Se a UI
  mudar, ajuste `scripts/shoot.mjs`.
- Viewport mobile (402×874 @2x) porque o uso principal é no celular.
- A pasta `.visual-review/` é ignorada pelo git (não versione screenshots).
- `node_modules/` da skill também é ignorado; só `package.json` fica versionado.
