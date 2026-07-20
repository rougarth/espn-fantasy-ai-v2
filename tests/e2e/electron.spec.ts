import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import path from 'node:path';

let app: ElectronApplication; let page: Page;
test.beforeEach(async () => {
  app = await electron.launch({ args: [path.resolve('.')], env: { ...process.env, ESPN_LOGIN_TIMEOUT_MS: '800' } });
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
  expect(exposed.keys.sort()).toEqual(['cancel', 'clear', 'login', 'logout', 'status']);
  expect(exposed.process).toBe('undefined'); expect(exposed.require).toBe('undefined');
});
