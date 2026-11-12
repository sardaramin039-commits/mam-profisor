declare module 'ws' {
  export class WebSocketServer {
    constructor(options?: Record<string, unknown>);
    handleUpgrade(request: unknown, socket: unknown, head: unknown, callback: (ws: unknown) => void): void;
    on(event: string, callback: (...args: unknown[]) => void): this;
    emit(event: string, ...args: unknown[]): boolean;
  }
}
