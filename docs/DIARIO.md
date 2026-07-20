# Diário da Fase 1

## Decisões

- Projeto criado do zero em repositório remoto vazio.
- Electron main e preload compilados pelo Vite em CommonJS; renderer React compilado pelo Vite.
- Renderer acessa somente cinco métodos tipados via `contextBridge`; não recebe cookies, IDs ou APIs Node.
- Sessão ESPN isolada em `persist:espn`; autenticação exige simultaneamente cookies reais, não vazios, `espn_s2` e `SWID`.
- Janela de login única, sem polling de navegação, recarga automática ou alteração de User-Agent.
- Popups HTTPS da ESPN usam a mesma partição; outros destinos são negados na janela e enviados ao navegador externo.
- Instalador por usuário com NSIS x64, atalhos na área de trabalho e menu Iniciar.

## Testes planejados

- Vitest: idioma, resultados de login, timeout, logout e regras de detecção/limpeza da sessão.
- Playwright + Electron: abertura da janela principal, idioma, janela única de login, ausência de recarga por segundo clique, cancelamento, timeout e superfície segura do preload.
- `electron-builder`: geração real do instalador `.exe`.

## Limitações honestas

- Testes automatizados não criam cookies falsos e, portanto, não afirmam validar uma autenticação real.
- A autenticação real exige teste manual com uma conta ESPN válida e conectividade, inclusive variações de MFA/CAPTCHA/popups que a ESPN possa apresentar.
- A disponibilidade e o comportamento da página externa da ESPN não estão sob controle do aplicativo.
- Nenhuma integração de dados ESPN faz parte desta fase.

## Execuções

- `npm run typecheck`: passou em 20/07/2026.
- `npm run lint`: passou em 20/07/2026.
- `npm run test:unit`: 2 arquivos, 7 testes aprovados em 20/07/2026.
- `npx playwright test`: 5 testes Electron aprovados em 20/07/2026.
- `npm run dist:win`: passou em 20/07/2026; gerou `dist/ESPN-Fantasy-AI-Setup-0.1.0-x64.exe`.

Não validado: login manual completo com credenciais reais, MFA/CAPTCHA e detecção dos cookies criados pela ESPN; instalação interativa por dois cliques; atalhos após instalação; execução da workflow no GitHub antes da abertura do PR.
