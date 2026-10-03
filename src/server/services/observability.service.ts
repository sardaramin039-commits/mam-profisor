export interface TelemetryEvent {
  id: string;
  timestamp: string;
  endpoint: string;
  modelUsed: string;
  latencyMs: number;
  tokensPrompt: number | null;
  tokensCompletion: number | null;
  estimatedCostUsd: number | null;
  success: boolean;
  citationFailuresCount: number;
  ragQualityScore: number;
}

export class ObservabilityService {
  private events: TelemetryEvent[] = [];
  private sequence = 0;
  private readonly maxEvents = 200;

  public logEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): TelemetryEvent {
    const fullEvent: TelemetryEvent = {
      ...event,
      id: `TEL-${Date.now()}-${++this.sequence}`,
      timestamp: new Date().toISOString()
    };

    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) this.events.pop();
    return fullEvent;
  }

  public getSummary() {
    const totalRequests = this.events.length;
    const failures = this.events.filter(event => !event.success).length;
    const averageLatencyMs = totalRequests > 0
      ? Math.round(this.events.reduce((acc, event) => acc + event.latencyMs, 0) / totalRequests)
      : 0;

    const tokensKnown = this.events.every(
      event => event.tokensPrompt !== null && event.tokensCompletion !== null
    );
    const costKnown = this.events.every(event => event.estimatedCostUsd !== null);

    const totalTokensUsed = tokensKnown
      ? this.events.reduce(
          (acc, event) => acc + (event.tokensPrompt || 0) + (event.tokensCompletion || 0),
          0
        )
      : null;

    const estimatedTotalCostUsd = costKnown
      ? Number(
          this.events.reduce(
            (acc, event) => acc + (event.estimatedCostUsd || 0),
            0
          ).toFixed(5)
        )
      : null;

    return {
      totalRequests,
      failedRequestsCount: failures,
      averageLatencyMs,
      totalTokensUsed,
      estimatedTotalCostUsd,
      telemetryAccuracy: {
        tokens: tokensKnown ? 'reported' : 'unknown',
        cost: costKnown ? 'reported' : 'unknown'
      },
      recentEvents: this.events.slice(0, 20)
    };
  }
}

export const observabilityService = new ObservabilityService();
