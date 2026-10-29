import type { Server } from 'node:http';
import type { Express } from 'express';

export interface ServerRuntimeConfig {
  port: number;
  host: string;
}

export function resolveServerRuntimeConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env
): ServerRuntimeConfig {
  const rawPort = environment['PORT']?.trim();
  let port = 3000;

  if (rawPort) {
    if (!/^\d+$/u.test(rawPort)) {
      throw new Error('PORT must be a numeric TCP port between 1 and 65535.');
    }
    port = Number(rawPort);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be a numeric TCP port between 1 and 65535.');
    }
  }

  const host = environment['HOST']?.trim() || '0.0.0.0';
  if (host.includes('\0')) {
    throw new Error('HOST contains an invalid null character.');
  }

  return { port, host };
}

/**
 * Start the Express/Angular SSR HTTP server using a numeric port.
 * This avoids passing process.env.PORT as a string, which Node can interpret
 * as a Unix-socket path instead of a TCP port.
 */
export function startHttpServer(
  app: Express,
  config: ServerRuntimeConfig = resolveServerRuntimeConfig()
): Server {
  const server = app.listen(config.port, config.host, () => {
    console.info('[server] listening on host=' + config.host + ' port=' + config.port);
  });

  const removeSignalHandlers = (): void => {
    process.off('SIGTERM', onSigterm);
    process.off('SIGINT', onSigint);
  };

  const shutdown = (signal: NodeJS.Signals): void => {
    console.info('[server] received ' + signal + '; closing HTTP listener.');
    server.close(error => {
      removeSignalHandlers();
      if (error) {
        console.error('[server] graceful shutdown failed (' + error.name + ').');
        process.exitCode = 1;
        return;
      }
      console.info('[server] HTTP listener closed.');
    });
  };

  const onSigterm = (): void => shutdown('SIGTERM');
  const onSigint = (): void => shutdown('SIGINT');

  process.once('SIGTERM', onSigterm);
  process.once('SIGINT', onSigint);
  server.once('close', removeSignalHandlers);
  server.once('error', (error: NodeJS.ErrnoException) => {
    removeSignalHandlers();
    console.error('[server] failed to listen (' + (error.code || error.name) + ').');
    process.exitCode = 1;
  });

  return server;
}
