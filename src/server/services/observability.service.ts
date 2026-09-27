export interface TelemetryEvent {
  id: string;
  timestamp: string;
  endpoint: string;
  modelUsed: string;
  latencyMs: number;
  tokensPrompt: number;
  tokensCompletion: number;
  estimatedCostUsd: number;
  success: boolean;
  citationFailuresCount: number;
  ragQualityScore: number;
}

export class ObservabilityService {
  private events: TelemetryEvent[] = [];
  private readonly maxEvents = 200;

  public logEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): TelemetryEvent {
    const fullEvent: TelemetryEvent = {
      ...event,
      id: `TEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };

    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
    return fullEvent;
  }

  public getSummary() {
    const totalRequests = this.events.length;
    const failures = this.events.filter(e => !e.success).length;
    const avgLatency = totalRequests > 0
      ? Math.round(this.events.reduce((acc, e) => acc + e.latencyMs, 0) / totalRequests)
      : 0;
    const totalTokens = this.events.reduce((acc, e) => acc + e.tokensPrompt + e.tokensCompletion, 0);
    const totalCostUsd = this.events.reduce((acc, e) => acc + e.estimatedCostUsd, 0);

    return {
      totalRequests,
      failedRequestsCount: failures,
      averageLatencyMs: avgLatency,
      totalTokensUsed: totalTokens,
      estimatedTotalCostUsd: Number(totalCostUsd.toFixed(5)),
      recentEvents: this.events.slice(0, 20)
    };
  }
}

export const observabilityService = new ObservabilityService();
