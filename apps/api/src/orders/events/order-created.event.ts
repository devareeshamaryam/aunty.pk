// events/order-created.event.ts
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly total: number,
    public readonly items: any[],
  ) {}
}

// events/order-status-updated.event.ts
export class OrderStatusUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly newStatus: string,   // 'processing' | 'shipped' | 'delivered' | 'cancelled'
    public readonly previousStatus?: string,
  ) {}
}