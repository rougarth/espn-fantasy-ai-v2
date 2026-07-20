import { describe, expect, it, vi } from 'vitest';
import { DiscoveryCollector } from '../../src/main/espn/discovery-collector';

describe('DiscoveryCollector request correlation', () => {
  it('emits one sanitized record per request id', async () => {
    const handlers: Record<string, (...args: never[]) => void> = {};
    const webRequest = {
      onBeforeRequest: vi.fn((_filter, handler) => { if (handler) handlers.before = handler; }),
      onBeforeSendHeaders: vi.fn((_filter, handler) => { if (handler) handlers.send = handler; }),
      onHeadersReceived: vi.fn((_filter, handler) => { if (handler) handlers.headers = handler; }),
      onCompleted: vi.fn((_filter, handler) => { if (handler) handlers.completed = handler; }),
      onErrorOccurred: vi.fn((_filter, handler) => { if (handler) handlers.error = handler; })
    };
    const collector = new DiscoveryCollector({ webRequest } as never, async () => true); collector.start();
    handlers.before({ id: 7, url: 'https://fantasy.espn.com/api/123456?season=2026&token=hidden', method: 'GET', resourceType: 'xhr', referrer: 'https://fantasy.espn.com/' } as never, vi.fn() as never);
    handlers.headers({ id: 7, statusCode: 200, responseHeaders: { 'content-type': ['application/json'] } } as never, vi.fn() as never);
    handlers.completed({ id: 7 } as never); handlers.completed({ id: 7 } as never); await new Promise((resolve) => setTimeout(resolve, 0));
    expect(collector.all()).toHaveLength(1);
    expect(collector.all()[0]).toMatchObject({ pathname: '/api/:id', queryKeys: ['season'], returnedJson: true, session: 'present' });
    expect(JSON.stringify(collector.all())).not.toContain('hidden');
  });
});
