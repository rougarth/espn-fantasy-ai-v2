import type { EspnErrorCode } from './espn-types';

export class EspnClientError extends Error {
  constructor(public readonly code: EspnErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EspnClientError';
  }
}

export function mapEspnError(error: unknown): EspnErrorCode {
  if (error instanceof EspnClientError) return error.code;
  if (error instanceof TypeError) return 'no_internet';
  return 'endpoint_unavailable';
}

