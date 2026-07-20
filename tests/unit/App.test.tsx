import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/renderer/App';

const api = { status: vi.fn(), login: vi.fn(), cancel: vi.fn(), logout: vi.fn(), clear: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks(); api.status.mockResolvedValue(false); api.login.mockResolvedValue('cancelled'); api.logout.mockResolvedValue(true); api.clear.mockResolvedValue(true);
  Object.defineProperty(window, 'espnAuth', { configurable: true, value: api });
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
});
