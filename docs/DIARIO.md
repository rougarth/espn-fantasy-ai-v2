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

---

# Diário da Fase 2A

## Estado inicial — 20/07/2026

- PR #1 aprovado pela workflow `Build Windows`, retirado de draft e mesclado em `main` no commit `682dbde`.
- Branch `feature/fase-2a-login-validation` criada diretamente da `main` atualizada.
- `npm ci`, typecheck, lint, 7 testes unitários, 5 testes Electron e build passaram antes das alterações.
- Login ainda não validado com conta real; nenhuma requisição autenticada de ligas havia sido observada.

## Problemas encontrados e decisões

- A allowlist aceitava apenas `espn.com`, podendo bloquear redirects Disney. Foi centralizada com sufixos oficiais ESPN/Disney e extensões por variável de ambiente apenas em desenvolvimento.
- Uma segunda tentativa de login retornava `cancelled` enquanto a janela original seguia aberta. As chamadas agora compartilham a mesma Promise e focam a única janela.
- Não havia diagnóstico de rede seguro. Foi adicionado modo explícito `ESPN_DIAGNOSTICS=1`, desligado em builds empacotados.
- Nenhum endpoint de ligas pôde ser confirmado sem credenciais. `CONFIRMED_LEAGUES_ENDPOINT` permanece deliberadamente `null`; a aplicação não presume URL, não envia cookies para ferramentas externas e não inventa dados.
- O cliente isolado valida sessão, status, content-type, JSON e schema; HTML nunca é sucesso.

## Comportamento real observado

- Automatizado: janela única, ausência de reload provocado pelo app, cancelamento, timeout, reconhecimento por cookies na partição persistente e limpeza no logout.
- Conta real: não testada neste ambiente. MFA, CAPTCHA, redirects completos, persistência real e logout real continuam pendentes do checklist manual.
- Requisições observadas com conta real: nenhuma. Portanto, fluxo/endpoint de memberships ou ligas não confirmado.

## Diagnóstico seguro

- Registra somente evento, host, pathname, método, nomes de query não sensíveis, status, content-type, redirects, timestamp, presença/ausência geral da sessão e forma superficial do JSON.
- Não registra valores de query, corpos, cookies, tokens, credenciais ou dados pessoais.
- O checklist reproduzível está em `docs/REAL_ESPN_TEST_CHECKLIST.md`.

## Auditoria de dependências

- Baseline: `electron` 37.10.3 era dependência direta de desenvolvimento e estava no intervalo vulnerável `<=39.8.4`; `npm audit` reportou severidade alta e várias correções de segurança no runtime desktop.
- Correção: atualização explícita para Electron 40.10.6, compatível com Node.js 20, sem `--force`.
- Resultado posterior: `npm audit` sem vulnerabilidades conhecidas.

## Arquivos principais alterados

- `src/main/espn/*`: sessão, cliente, erros, tipos, allowlist, sanitização e descoberta.
- `src/main/auth/login-window.ts`: janela única estável, allowlist e diagnóstico.
- `src/main/ipc/leagues-ipc.ts`, `src/preload/preload.ts`: DTO seguro e IPC validado.
- `src/renderer/*`: loading, lista vazia, cards seguros e erros bilíngues.
- `tests/*`, workflow, README e checklist manual.

## Limitações e próximo passo

- Não afirmar que login real ou listagem real funciona antes de concluir o checklist.
- O botão de ligas retorna indisponibilidade enquanto não houver endpoint confirmado; isso é intencional.
- Próximo passo: executar diagnóstico com conta real no Windows, revisar somente eventos sanitizados, confirmar uma chamada reproduzível e então implementar o mapeamento Zod do payload real em um PR subsequente ou atualização desta Fase 2A.

## Resultados após as alterações — 20/07/2026

- `npm run typecheck`: passou.
- `npm run lint`: passou.
- `npm run test:unit`: 4 arquivos, 19 testes aprovados.
- `npm run test:electron`: 8 testes aprovados, incluindo persistência entre duas execuções com fixture restrita ao teste.
- `npm audit`: 0 vulnerabilidades conhecidas após Electron 40.10.6.
- `npm run dist:win`: passou; instalador NSIS x64 gerado em `dist/ESPN-Fantasy-AI-Setup-0.1.0-x64.exe`.
- Workflow da branch da Fase 2A: pendente até o push/PR.
