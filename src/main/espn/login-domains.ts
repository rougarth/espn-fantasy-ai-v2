const DEFAULT_LOGIN_DOMAINS = ['espn.com', 'go.com', 'disney.com', 'disneyid.com'] as const;

export function configuredLoginDomains(): readonly string[] {
  const additions = process.env.NODE_ENV === 'development'
    ? (process.env.ESPN_LOGIN_DOMAINS ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
    : [];
  return [...new Set([...DEFAULT_LOGIN_DOMAINS, ...additions])];
}

export function isAllowedLoginUrl(urlString: string, domains = configuredLoginDomains()): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:' && domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

