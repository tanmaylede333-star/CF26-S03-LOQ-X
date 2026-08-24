import { SimulationEvent } from '../types/event';

export class EventQueue {
  private queue: SimulationEvent[] = [];

  public push(event: SimulationEvent): void {
    this.queue.push(event);
    this.sort();
  }

  public pushMany(events: SimulationEvent[]): void {
    this.queue.push(...events);
    this.sort();
  }

  public peek(): SimulationEvent | undefined {
    return this.queue[0];
  }

  public pop(): SimulationEvent | undefined {
    return this.queue.shift();
  }

  public popEventsAtOrBefore(timestamp: number): SimulationEvent[] {
    const ready: SimulationEvent[] = [];
    while (this.queue.length > 0 && this.queue[0].timestamp <= timestamp) {
      ready.push(this.queue.shift()!);
    }
    return ready;
  }

  public removeEventsForTarget(targetNodeId: string, typesToRemove?: string[]): void {
    this.queue = this.queue.filter(event => {
      if (event.targetNode !== targetNodeId) return true;
      if (typesToRemove && !typesToRemove.includes(event.type)) return true;
      return false; // Remove
    });
  }

  public getNextTimestamp(): number | null {
    return this.queue.length > 0 ? this.queue[0].timestamp : null;
  }

  public size(): number {
    return this.queue.length;
  }

  public clear(): void {
    this.queue = [];
  }

  public getAll(): SimulationEvent[] {
    return [...this.queue];
  }

  private sort(): void {
    this.queue.sort((a, b) => {
      // 1. Earliest timestamp first
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      // 2. Deterministic priority (lower priority number executes first)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // 3. Stable alphabetical order on targetNode
      if (a.targetNode !== b.targetNode) {
        return a.targetNode.localeCompare(b.targetNode);
      }
      // 4. Stable alphabetical order on event ID
      return a.id.localeCompare(b.id);
    });
  }
}
