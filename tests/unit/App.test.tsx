import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/renderer/App';

const api = { status: vi.fn(), login: vi.fn(), cancel: vi.fn(), logout: vi.fn(), clear: vi.fn(), listLeagues: vi.fn(), discoveryEnabled: vi.fn(), discoverySnapshot: vi.fn(), exportDiscovery: vi.fn(), endDiscovery: vi.fn(), onDiscoveryStarted: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks(); api.status.mockResolvedValue(false); api.login.mockResolvedValue('cancelled'); api.logout.mockResolvedValue(true); api.clear.mockResolvedValue(true);
  Object.defineProperty(window, 'espnAuth', { configurable: true, value: api });
  api.listLeagues.mockResolvedValue({ ok: true, leagues: [] });
  api.discoveryEnabled.mockResolvedValue(false); api.discoverySnapshot.mockResolvedValue({ totalRequests: 0, jsonResponses: 0, hosts: [], highRelevance: [] }); api.exportDiscovery.mockResolvedValue(true); api.endDiscovery.mockResolvedValue(true); api.onDiscoveryStarted.mockReturnValue(() => undefined);
});
afterEach(cleanup);

describe('App', () => {
  it('changes between Portuguese and English', async () => {
    render(<App />); await waitFor(() => expect(api.status).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } });
    expect(screen.getByRole('button', { name: 'Connect with ESPN' })).toBeVisible();
  });
  it('reports a real authenticated result as connected', async () => {
    api.login.mockResolvedValue('authenticated'); render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Conectar com ESPN' }));
    expect(await screen.findByText('Conectado com sucesso')).toBeVisible();
  });
  it('does not authenticate on cancellation', async () => {
    render(<App />); fireEvent.click(await screen.findByRole('button', { name: 'Conectar com ESPN' }));
    expect(await screen.findByText('Login cancelado.')).toBeVisible();
    expect(screen.queryByText('Conectado com sucesso')).not.toBeInTheDocument();
  });
  it('shows timeout and allows retry', async () => {
    api.login.mockResolvedValue('timeout'); render(<App />); fireEvent.click(await screen.findByRole('button', { name: 'Conectar com ESPN' }));
    expect(await screen.findByText('O tempo para login terminou. Tente novamente.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Conectar com ESPN' })).toBeEnabled();
  });
  it('logout and clear return to disconnected state', async () => {
    api.status.mockResolvedValue(true); render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Sair da ESPN' })); await waitFor(() => expect(api.logout).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Conectar com ESPN' })).toBeVisible();
  });
  it('shows loading and an empty result without invented leagues', async () => {
    api.status.mockResolvedValue(true);
    let finish!: (value: unknown) => void;
    api.listLeagues.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<App />); fireEvent.click(await screen.findByRole('button', { name: 'Carregar minhas ligas' }));
    expect(screen.getByText('Carregando suas ligas…')).toBeVisible();
    finish({ ok: true, leagues: [] });
    expect(await screen.findByText('Nenhuma liga foi encontrada para esta conta.')).toBeVisible();
  });
  it('shows localized friendly errors without raw payloads', async () => {
    api.status.mockResolvedValue(true); api.listLeagues.mockResolvedValue({ ok: false, error: 'no_internet' });
    render(<App />); fireEvent.click(await screen.findByRole('button', { name: 'Carregar minhas ligas' }));
    expect(await screen.findByText('Sem conexão com a internet. Verifique sua conexão e tente novamente.')).toBeVisible();
    expect(document.body.textContent).not.toContain('{"');
    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } });
    expect(screen.getByText('No internet connection. Check your connection and try again.')).toBeVisible();
  });
  it('does not show diagnostics until the development event occurs', async () => {
    let start!: () => void; api.onDiscoveryStarted.mockImplementation((callback) => { start = callback; return () => undefined; });
    render(<App />); expect(screen.queryByRole('region', { name: 'Diagnóstico ESPN' })).not.toBeInTheDocument();
    start(); expect(await screen.findByText('Login confirmado. Agora abra sua liga da ESPN nesta janela.')).toBeVisible();
  });
});
