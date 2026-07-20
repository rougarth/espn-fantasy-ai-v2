# ESPN Fantasy AI — Fase 1 / Phase 1

## Português

Aplicativo desktop Electron com a fundação segura e o fluxo de login real da ESPN. Esta fase não contém ligas, dashboard, IA, draft, waiver nem dados fictícios.

### Requisitos e desenvolvimento

- Node.js 20 e Windows para gerar o instalador NSIS.
- `npm ci` instala as dependências.
- `npm run dev` abre o ambiente de desenvolvimento.
- `npm run verify` executa typecheck, lint, testes unitários e testes Electron.
- `npm run dist:win` gera `dist/ESPN-Fantasy-AI-Setup-*.exe`.

O login abre `https://www.espn.com/login` em uma `BrowserWindow` separada com a partição persistente `persist:espn`. O app somente considera a sessão autenticada quando os cookies reais `espn_s2` e `SWID`, não vazios, existem na sessão da ESPN. Os valores nunca são enviados ao renderer nem registrados.

“Sair da ESPN” e “Limpar sessão” removem cookies e armazenamento persistente da partição. O login pode ser cancelado e expira após cinco minutos sem recarregar a página.

> A marca ESPN pertence aos seus respectivos proprietários. Este projeto não é afiliado nem endossado pela ESPN.

## English

Electron desktop application containing the secure foundation and real ESPN login flow. This phase intentionally has no leagues, dashboard, AI, draft, waivers, or fake data.

### Requirements and development

- Node.js 20 and Windows to produce the NSIS installer.
- `npm ci` installs dependencies.
- `npm run dev` starts the development environment.
- `npm run verify` runs type checking, linting, unit tests, and Electron tests.
- `npm run dist:win` creates `dist/ESPN-Fantasy-AI-Setup-*.exe`.

Login opens `https://www.espn.com/login` in a separate `BrowserWindow` using the persistent `persist:espn` partition. Authentication is accepted only when the real, non-empty `espn_s2` and `SWID` cookies exist in the ESPN session. Their values are never sent to the renderer or logged.

“Sign out of ESPN” and “Clear session” remove cookies and persistent storage from that partition. Login can be cancelled and times out after five minutes without reloading the page.

> ESPN trademarks belong to their respective owners. This project is not affiliated with or endorsed by ESPN.

