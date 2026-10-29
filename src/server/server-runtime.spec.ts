import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveServerRuntimeConfig, startHttpServer } from './server-runtime';

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe('server runtime configuration', () => {
  it('defaults to a reachable TCP interface and the documented development port', () => {
    expect(resolveServerRuntimeConfig({})).toEqual({
      port: 3000,
      host: '0.0.0.0'
    });
  });

  it('parses PORT as a number rather than passing the environment string to Node', () => {
    expect(resolveServerRuntimeConfig({
      PORT: '4317',
      HOST: '127.0.0.1'
    })).toEqual({
      port: 4317,
      host: '127.0.0.1'
    });
  });

  it.each(['tcp://3000', '3000abc', '-1', '1.5', '0', '65536'])(
    'rejects invalid TCP port %s',
    PORT => {
      expect(() => resolveServerRuntimeConfig({ PORT })).toThrow(
        'PORT must be a numeric TCP port between 1 and 65535.'
      );
    }
  );

  it('rejects a host value containing a null character', () => {
    expect(() => resolveServerRuntimeConfig({ HOST: 'local\0host' })).toThrow(
      'HOST contains an invalid null character.'
    );
  });
});

describe('HTTP server startup', () => {
  it('binds a numeric TCP port and serves an HTTP health check', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const app = express();
    app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
    const server = startHttpServer(app, { port: 0, host: '127.0.0.1' });

    try {
      await new Promise<void>((resolve, reject) => {
        if (server.listening) {
          resolve();
          return;
        }
        server.once('listening', resolve);
        server.once('error', reject);
      });

      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected an internet TCP address from the test server.');
      }

      const response = await fetch('http://127.0.0.1:' + address.port + '/healthz');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    } finally {
      await new Promise<void>((resolve, reject) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.close(error => error ? reject(error) : resolve());
      });
    }
  });
});
