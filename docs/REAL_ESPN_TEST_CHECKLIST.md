# Checklist manual — ESPN real

Use uma conta ESPN válida no Windows. Não copie cookies, tokens, respostas completas ou dados pessoais para este documento, issues ou pull requests.

## Preparação

- [ ] Baixar o `.exe` produzido pela workflow ou gerar com `npm run dist:win`.
- [ ] Instalar para o usuário atual com dois cliques.
- [ ] Confirmar os atalhos na área de trabalho e no menu Iniciar.
- [ ] Abrir o ESPN Fantasy AI.

## Login real

- [ ] Clicar em “Conectar com ESPN”.
- [ ] Confirmar que somente uma janela de login é aberta.
- [ ] Concluir login, MFA e/ou CAPTCHA, se apresentados, sem compartilhar credenciais.
- [ ] Confirmar que redirects e popups ESPN/Disney necessários abrem normalmente.
- [ ] Confirmar que um domínio inesperado é bloqueado.
- [ ] Confirmar que a página não recarrega periodicamente por ação do aplicativo.
- [ ] Confirmar que a janela fecha somente após o aplicativo detectar uma sessão válida.
- [ ] Confirmar que aparece apenas “Conectado com sucesso”, sem cookies ou IDs.

## Persistência e ligas

- [ ] Fechar completamente o aplicativo e abri-lo novamente.
- [ ] Confirmar que uma sessão ainda válida é reconhecida sem novo login.
- [ ] Clicar em “Carregar minhas ligas”.
- [ ] Se o diagnóstico ainda não confirmou o endpoint, registrar somente que a mensagem de indisponibilidade foi apresentada.
- [ ] Após um endpoint ser confirmado e revisado, confirmar que nomes e temporadas exibidos correspondem às ligas reais da conta.
- [ ] Confirmar que JSON bruto, endpoint e leagueId não aparecem na interface.
- [ ] Confirmar que uma conta sem ligas mostra a mensagem vazia, sem conteúdo inventado.

## Logout e falhas

- [ ] Clicar em “Sair da ESPN”.
- [ ] Fechar e reabrir o aplicativo e confirmar que a sessão não persiste.
- [ ] Desligar a internet e confirmar a mensagem “Sem conexão com a internet…”.
- [ ] Testar uma sessão realmente expirada e confirmar a solicitação de novo login.
- [ ] Confirmar que “Fazer login novamente” abre um novo fluxo sem travar.

## Descoberta reproduzível (desenvolvimento)

1. Executar `npm run dev:diagnostics`.
2. Fazer login real na janela oficial.
3. Navegar na página oficial da ESPN Fantasy até a área que lista ligas.
4. Guardar apenas linhas `[espn-diagnostic]` sanitizadas.
5. Identificar candidatos relacionados a `memberships`, `leagues`, `history`, `teams` ou `profile` pelo host, pathname, método, status, content-type e forma superficial.
6. Repetir em uma nova execução com a mesma sessão persistente.
7. Antes de configurar qualquer endpoint, confirmar que a chamada é oficial, reproduzível, retorna JSON e não depende de valores copiados manualmente.

Nunca anexar corpo da resposta, valores de query, cookies, tokens, credenciais ou informações pessoais.

