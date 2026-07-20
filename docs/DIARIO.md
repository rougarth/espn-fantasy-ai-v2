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

## Validação manual com conta ESPN real — 20/07/2026

- Login real: concluído. A janela fechou automaticamente e a interface mostrou `Conectado com sucesso`; isso comprova que os cookies esperados `espn_s2` e `SWID` estavam simultaneamente presentes, sem leitura ou registro de seus valores.
- MFA/CAPTCHA: não foi informado se foram apresentados; nenhuma interação da janela oficial nem conteúdo de formulário foi observado ou registrado pelo diagnóstico.
- Persistência: confirmada. Após fechar e reiniciar `npm run dev:diagnostics`, a sessão foi reconhecida sem novo login.
- Carregamento de ligas: não executou chamada externa porque nenhum endpoint está confirmado. A interface mostrou indisponibilidade, sem dados fictícios.
- Logout: confirmado. A interface voltou ao estado desconectado e, após nova reinicialização, a sessão permaneceu ausente.
- Endpoint de ligas: não identificado. Não há base para implementar listagem reproduzível ainda.

### Tráfego sanitizado efetivamente observado

- `2026-07-20T16:40:17.536Z` — evento `network-response`; host `log.go.com`; pathname `/log`; método `GET`; status `200`; content-type `application/octet-stream`; redirects `0`; sessão `absent`; sem JSON. Foram registrados somente nomes de query, nunca valores.
- Nenhuma resposta relacionada a `leagues`, `memberships`, `teams` ou `fantasy profile` foi observada.

### Problemas revelados pelo teste real e correções

- A janela aguardava `ready-to-show`, que não ocorreu de forma confiável na página real. Corrigido para mostrar a janela imediatamente; o login passou a ser utilizável.
- `npm run dev` usava bundles main/preload antigos até build manual. Corrigido para recompilá-los antes de iniciar.
- O CSP de produção bloqueava estilos injetados pelo Vite apenas em desenvolvimento. O servidor de desenvolvimento agora adiciona `unsafe-inline` somente ao HTML servido localmente; o build empacotado mantém a CSP estrita.
- O filtro diagnóstico não incluía rotas genéricas de login/identidade. Foi ampliado mantendo a mesma sanitização e sem registrar valores.

## Modo de descoberta pós-login

- Hipótese: a janela fechava antes que a navegação oficial de Fantasy gerasse chamadas de ligas.
- Implementação: em desenvolvimento com `ESPN_DIAGNOSTICS=1`, a sessão real mantém a janela aberta, envia uma mensagem segura ao painel e navega uma única vez para `https://fantasy.espn.com/football/`. Produção continua fechando imediatamente.
- Navegação posterior é totalmente manual; não há reload, polling de página ou clique automático.
- `webRequest` observa `onBeforeRequest`, `onBeforeSendHeaders`, `onHeadersReceived`, `onCompleted` e `onErrorOccurred` sem alterar requests e correlaciona por request id.
- Headers e bodies nunca entram no modelo exportado. Query values são descartados e segmentos de pathname semelhantes a IDs são substituídos por `:id`.
- O DevTools Protocol somente enriquece registros JSON com tipo, chaves de primeiro nível e quantidade de itens; respostas completas não são persistidas.
- O painel interno mostra contagens, hosts e requisições de alta relevância. Ele só aparece após o evento de descoberta em desenvolvimento.
- A exportação JSON contém apenas records validados por schema fechado e análise local. Candidatos usam `confirmed: false`; nomes sugestivos não confirmam endpoint.
- Endpoint de ligas continua não confirmado até a nova execução real descrita no checklist.

### Validação automatizada do modo de descoberta

- `npm run typecheck`: passou.
- `npm run lint`: passou.
- `npm run test:unit`: 6 arquivos, 26 testes aprovados.
- `npm run test:electron`: 10 testes aprovados, incluindo diferença entre produção e diagnóstico, janela persistente após autenticação e encerramento explícito.
- `npm audit`: 0 vulnerabilidades conhecidas.
- `npm run dist:win`: instalador NSIS x64 gerado com sucesso.
- Nova execução real de descoberta: ainda pendente; nenhum endpoint foi promovido ou configurado.

## Correção revelada pela reabertura do login real — 20/07/2026

- Observado: ao escolher `Fazer login novamente` com uma sessão persistente já válida, a janela oficial abria, mas o aplicativo permanecia em `Aguardando login na ESPN…`.
- Causa: a detecção aguardava somente o evento `cookies.changed`. Cookies reais que já existiam e não mudavam não geravam um novo evento.
- Correção: após a carga inicial da página oficial, o aplicativo executa uma única verificação da sessão persistente pelo mesmo critério estrito (`espn_s2` e `SWID` presentes). Valores continuam sem acesso pelo renderer e sem registro em logs.
- Teste adicionado: o modo diagnóstico reconhece uma sessão que já existia antes da abertura do login e mantém a janela de descoberta aberta.
- Endpoint de ligas: continua não confirmado; esta correção não adiciona nem presume endpoint.
- Validação após a correção: typecheck e ESLint passaram; Vitest passou com 26 testes; Playwright/Electron passou com 11 testes; build NSIS x64 passou; `npm audit` encontrou 0 vulnerabilidades.
