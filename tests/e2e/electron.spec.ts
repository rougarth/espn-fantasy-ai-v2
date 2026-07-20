import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import path from 'node:path';

let app: ElectronApplication; let page: Page; let userDataDir: string;
test.beforeEach(async ({ browserName }, testInfo) => {
  void browserName;
  userDataDir = testInfo.outputPath('user-data');
  app = await electron.launch({ args: [path.resolve('.'), `--user-data-dir=${userDataDir}`], env: { ...process.env, ESPN_LOGIN_TIMEOUT_MS: '800' } });
  page = await app.firstWindow(); await page.waitForLoadState('domcontentloaded');
});
test.afterEach(async () => { await app.close(); });

test('main window opens and language selector works', async () => {
  await expect(page).toHaveTitle('ESPN Fantasy AI');
  await page.getByLabel('Idioma').selectOption('en');
  await expect(page.getByRole('button', { name: 'Connect with ESPN' })).toBeVisible();
});
test('login click opens only one window and does not reload it on a second click', async () => {
  await page.getByRole('button', { name: 'Conectar com ESPN' }).click();
  await expect.poll(() => app.windows().length).toBe(2);
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().every((window) => window.isVisible()))).toBe(true);
  const login = app.windows().find((window) => window !== page)!;
  const firstId = await login.evaluate(() => performance.timeOrigin);
  await page.getByRole('button', { name: 'Conectar com ESPN' }).click({ force: true });
  expect(app.windows().length).toBe(2);
  expect(await login.evaluate(() => performance.timeOrigin)).toBe(firstId);
});
test('cancel closes login without authenticating', async () => {
  await page.getByRole('button', { name: 'Conectar com ESPN' }).click();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Login cancelado.')).toBeVisible();
  await expect.poll(() => app.windows().length).toBe(1);
});
test('login times out without page reload', async () => {
  await page.getByRole('button', { name: 'Conectar com ESPN' }).click();
  await expect(page.getByText('O tempo para login terminou. Tente novamente.')).toBeVisible({ timeout: 5_000 });
  await expect.poll(() => app.windows().length).toBe(1);
});
test('renderer API exposes no cookie values or Node primitives', async () => {
  const exposed = await page.evaluate(() => { const target = window as unknown as { espnAuth: object; process?: unknown; require?: unknown }; return { keys: Object.keys(target.espnAuth), process: typeof target.process, require: typeof target.require }; });
  expect(exposed.keys.sort()).toEqual(['cancel', 'clear', 'discoveryEnabled', 'discoverySnapshot', 'endDiscovery', 'exportDiscovery', 'listLeagues', 'login', 'logout', 'onDiscoveryStarted', 'openFantasyFootball', 'status']);
  expect(exposed.process).toBe('undefined'); expect(exposed.require).toBe('undefined');
});

test('production-like mode closes login after real-session cookies appear and hides diagnostics', async () => {
  await page.getByRole('button', { name: 'Conectar com ESPN' }).click();
  await expect.poll(() => app.windows().length).toBe(2);
  await app.evaluate(async ({ session }) => {
    const target = session.fromPartition('persist:espn');
    await target.cookies.set({ url: 'https://www.espn.com', name: 'espn_s2', value: 'e2e-test-only' });
    await target.cookies.set({ url: 'https://www.espn.com', name: 'SWID', value: 'e2e-test-only' });
  });
  await expect.poll(() => app.windows().length).toBe(1);
  await expect(page.getByText('Conectado com sucesso')).toBeVisible();
  await expect(page.getByText('Descoberta ESPN')).toHaveCount(0);
});

test('development diagnostics keeps login window open after session detection', async () => {
  await app.close();
  app = await electron.launch({ args: [path.resolve('.'), `--user-data-dir=${userDataDir}`], env: { ...process.env, NODE_ENV: 'development', ESPN_DIAGNOSTICS: '1', ESPN_LOGIN_TIMEOUT_MS: '5000' } });
  page = await app.firstWindow(); await page.getByRole('button', { name: 'Conectar com ESPN' }).click();
  await expect.poll(() => app.windows().length).toBe(2);
  await app.evaluate(async ({ session }) => {
    const target = session.fromPartition('persist:espn');
    await target.cookies.set({ url: 'https://www.espn.com', name: 'espn_s2', value: 'e2e-test-only' });
    await target.cookies.set({ url: 'https://www.espn.com', name: 'SWID', value: 'e2e-test-only' });
  });
  await expect(page.getByText('Login confirmado. Agora abra sua liga da ESPN nesta janela.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir Fantasy Football na janela monitorada' })).toBeVisible();
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(2);
  await page.getByRole('button', { name: 'Encerrar descoberta' }).click();
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
});

test('development diagnostics recognizes a session that already exists when login opens', async () => {
  await app.close();
  app = await electron.launch({ args: [path.resolve('.'), `--user-data-dir=${userDataDir}`], env: { ...process.env, NODE_ENV: 'development', ESPN_DIAGNOSTICS: '1', ESPN_LOGIN_TIMEOUT_MS: '5000' } });
  page = await app.firstWindow();
  await app.evaluate(async ({ session }) => {
    const target = session.fromPartition('persist:espn');
    await target.cookies.set({ url: 'https://www.espn.com', name: 'espn_s2', value: 'e2e-test-only' });
    await target.cookies.set({ url: 'https://www.espn.com', name: 'SWID', value: 'e2e-test-only' });
  });
  await page.evaluate(() => { void (window as unknown as { espnAuth: { login: () => Promise<string> } }).espnAuth.login(); });
  await expect(page.getByText('Login confirmado. Agora abra sua liga da ESPN nesta janela.')).toBeVisible();
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(2);
  await page.getByRole('button', { name: 'Encerrar descoberta' }).click();
});

test('authenticated discovery remains open after the login timeout elapses', async () => {
  await app.close();
  app = await electron.launch({ args: [path.resolve('.'), `--user-data-dir=${userDataDir}`], env: { ...process.env, NODE_ENV: 'development', ESPN_DIAGNOSTICS: '1', ESPN_LOGIN_TIMEOUT_MS: '800' } });
  page = await app.firstWindow(); await page.getByRole('button', { name: 'Conectar com ESPN' }).click();
  await app.evaluate(async ({ session }) => {
    const target = session.fromPartition('persist:espn');
    await target.cookies.set({ url: 'https://www.espn.com', name: 'espn_s2', value: 'e2e-test-only' });
    await target.cookies.set({ url: 'https://www.espn.com', name: 'SWID', value: 'e2e-test-only' });
  });
  await expect(page.getByText('Login confirmado. Agora abra sua liga da ESPN nesta janela.')).toBeVisible();
  await page.waitForTimeout(1_200);
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(2);
  await page.getByRole('button', { name: 'Encerrar descoberta' }).click();
});

test('connected interface shows loading, empty results, and no raw JSON', async () => {
  await app.evaluate(async ({ ipcMain, session }) => {
    const target = session.fromPartition('persist:espn');
    await target.cookies.set({ url: 'https://www.espn.com', name: 'espn_s2', value: 'e2e-test-only' });
    await target.cookies.set({ url: 'https://www.espn.com', name: 'SWID', value: 'e2e-test-only' });
    ipcMain.removeHandler('leagues:list');
    ipcMain.handle('leagues:list', async () => { await new Promise((resolve) => setTimeout(resolve, 150)); return { ok: true, leagues: [] }; });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Carregar minhas ligas' }).click();
  await expect(page.getByText('Carregando suas ligas…')).toBeVisible();
  await expect(page.getByText('Nenhuma liga foi encontrada para esta conta.')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toContain('{"');
});

test('connected interface localizes friendly errors and logout disconnects', async () => {
  await app.evaluate(async ({ ipcMain, session }) => {
    const target = session.fromPartition('persist:espn');
    await target.cookies.set({ url: 'https://www.espn.com', name: 'espn_s2', value: 'e2e-test-only' });
    await target.cookies.set({ url: 'https://www.espn.com', name: 'SWID', value: 'e2e-test-only' });
    ipcMain.removeHandler('leagues:list'); ipcMain.handle('leagues:list', () => ({ ok: false, error: 'no_internet' }));
  });
  await page.reload(); await page.getByRole('button', { name: 'Carregar minhas ligas' }).click();
  await expect(page.getByText('Sem conexão com a internet. Verifique sua conexão e tente novamente.')).toBeVisible();
  await page.getByLabel('Idioma').selectOption('en');
  await expect(page.getByText('No internet connection. Check your connection and try again.')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out of ESPN' }).click();
  await expect(page.getByRole('button', { name: 'Connect with ESPN' })).toBeVisible();
});

test('a valid persistent session is recognized after reopening', async () => {
  await app.evaluate(async ({ session }) => {
    const target = session.fromPartition('persist:espn');
    await target.cookies.set({ url: 'https://www.espn.com', name: 'espn_s2', value: 'e2e-test-only', expirationDate: Date.now() / 1000 + 3600 });
    await target.cookies.set({ url: 'https://www.espn.com', name: 'SWID', value: 'e2e-test-only', expirationDate: Date.now() / 1000 + 3600 });
    await target.flushStorageData();
  });
  await app.close();
  app = await electron.launch({ args: [path.resolve('.'), `--user-data-dir=${userDataDir}`], env: { ...process.env, ESPN_LOGIN_TIMEOUT_MS: '800' } });
  page = await app.firstWindow();
  await expect(page.getByText('Conectado com sucesso')).toBeVisible();
});
