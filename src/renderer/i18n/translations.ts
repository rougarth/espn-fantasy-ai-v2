export type Language = 'pt' | 'en';
export const translations = {
  pt: { connect: 'Conectar com ESPN', connected: 'Conectado com sucesso', idle: 'Conecte sua conta ESPN para continuar.', connecting: 'Aguardando login na ESPN…', cancelled: 'Login cancelado.', timeout: 'O tempo para login terminou. Tente novamente.', help: 'Ajuda', helpText: 'Uma janela segura da ESPN será aberta. Conclua o login nela.', logout: 'Sair da ESPN', clear: 'Limpar sessão', language: 'Idioma' },
  en: { connect: 'Connect with ESPN', connected: 'Connected successfully', idle: 'Connect your ESPN account to continue.', connecting: 'Waiting for ESPN login…', cancelled: 'Login cancelled.', timeout: 'Login timed out. Please try again.', help: 'Help', helpText: 'A secure ESPN window will open. Complete your login there.', logout: 'Sign out of ESPN', clear: 'Clear session', language: 'Language' }
} as const;

