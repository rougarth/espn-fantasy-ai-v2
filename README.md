# ESPN Fantasy AI — Fase 2A / Phase 2A

## Português

Aplicativo desktop Electron com a fundação segura e o fluxo de login real da ESPN. Esta fase não contém ligas, dashboard, IA, draft, waiver nem dados fictícios.

A Fase 2A adiciona diagnóstico sanitizado em desenvolvimento e uma camada isolada para futuras chamadas autenticadas. Nenhum endpoint de ligas foi confirmado sem uma sessão real; por isso o aplicativo não faz chamadas presumidas nem retorna ligas fictícias.

### Requisitos e desenvolvimento

- Node.js 20 e Windows para gerar o instalador NSIS.
- `npm ci` instala as dependências.
- `npm run dev` abre o ambiente de desenvolvimento.
- `npm run dev:diagnostics` habilita observação sanitizada de tráfego ESPN em desenvolvimento.
- `npm run verify` executa typecheck, lint, testes unitários e testes Electron.
- `npm run dist:win` gera `dist/ESPN-Fantasy-AI-Setup-*.exe`.

O login abre `https://www.espn.com/login` em uma `BrowserWindow` separada com a partição persistente `persist:espn`. O app somente considera a sessão autenticada quando os cookies reais `espn_s2` e `SWID`, não vazios, existem na sessão da ESPN. Os valores nunca são enviados ao renderer nem registrados.

“Sair da ESPN” e “Limpar sessão” removem cookies e armazenamento persistente da partição. O login pode ser cancelado e expira após cinco minutos sem recarregar a página.

O diagnóstico registra somente host, pathname, método, chaves de query sem valores sensíveis, status, content-type, redirects, formato superficial do JSON, timestamp e presença/ausência geral da sessão. Nunca registra corpos, valores de cookies, tokens, credenciais ou dados pessoais. Consulte [docs/REAL_ESPN_TEST_CHECKLIST.md](docs/REAL_ESPN_TEST_CHECKLIST.md).

> A marca ESPN pertence aos seus respectivos proprietários. Este projeto não é afiliado nem endossado pela ESPN.

## English

Electron desktop application containing the secure foundation and real ESPN login flow. This phase intentionally has no leagues, dashboard, AI, draft, waivers, or fake data.

Phase 2A adds sanitized development diagnostics and an isolated layer for future authenticated requests. No leagues endpoint was confirmed without a real session, so the application makes no guessed request and returns no fabricated league.

### Requirements and development

- Node.js 20 and Windows to produce the NSIS installer.
- `npm ci` installs dependencies.
- `npm run dev` starts the development environment.
- `npm run dev:diagnostics` enables sanitized ESPN traffic observation in development.
- `npm run verify` runs type checking, linting, unit tests, and Electron tests.
- `npm run dist:win` creates `dist/ESPN-Fantasy-AI-Setup-*.exe`.

Login opens `https://www.espn.com/login` in a separate `BrowserWindow` using the persistent `persist:espn` partition. Authentication is accepted only when the real, non-empty `espn_s2` and `SWID` cookies exist in the ESPN session. Their values are never sent to the renderer or logged.

“Sign out of ESPN” and “Clear session” remove cookies and persistent storage from that partition. Login can be cancelled and times out after five minutes without reloading the page.

Diagnostics record only host, pathname, method, query keys without sensitive values, status, content type, redirects, shallow JSON shape, timestamp, and general session presence. Bodies, cookie values, tokens, credentials, and personal data are never logged. See [docs/REAL_ESPN_TEST_CHECKLIST.md](docs/REAL_ESPN_TEST_CHECKLIST.md).

> ESPN trademarks belong to their respective owners. This project is not affiliated with or endorsed by ESPN.

