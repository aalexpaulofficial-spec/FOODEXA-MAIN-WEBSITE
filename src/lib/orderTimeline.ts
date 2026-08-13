export const STUDENT_TIMELINE_LABELS = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Ready',
  'Completed',
] as const;

export const STUDENT_TIMELINE_DESCRIPTIONS = [
  'Your order has been received',
  'Kitchen has confirmed your order',
  'Kitchen is preparing your order',
  'Ready for pickup at counter',
  'Enjoy your meal!',
] as const;

export type TimelineStage = 0 | 1 | 2 | 3 | 4 | -1;

export const ORDER_STATUS_TO_TIMELINE: Record<string, TimelineStage> = {
  pending: 0,
  accepted: 1,
  confirmed: 1,
  preparing: 2,
  cooking: 2,
  quality_check: 2,
  packed: 2,
  ready: 3,
  completed: 4,
  cancelled: -1,
};

export function normalizeDbStatus(status: unknown): string {
  return String(status || '').toLowerCase();
}

export function getTimelineStage(status: unknown): TimelineStage {
  return ORDER_STATUS_TO_TIMELINE[normalizeDbStatus(status)] ?? -1;
}

export function getTimelineLabel(status: unknown): string {
  const s = normalizeDbStatus(status);
  if (s === 'cancelled' || s === 'canceled' || s === 'refunded') return 'Order Cancelled';
  const stage = getTimelineStage(status);
  if (stage < 0) return 'Order Cancelled';
  return STUDENT_TIMELINE_LABELS[stage as number] ?? 'Order Placed';
}

export function getTimelineDescription(status: unknown): string {
  const s = normalizeDbStatus(status);
  if (s === 'cancelled' || s === 'canceled' || s === 'refunded') return 'Order has been cancelled';
  const stage = getTimelineStage(status);
  if (stage < 0) return 'Order has been cancelled';
  return STUDENT_TIMELINE_DESCRIPTIONS[stage as number] ?? '';
}

export function isOrderActive(status: unknown): boolean {
  const stage = getTimelineStage(status);
  return stage >= 0 && stage < 4;
}

export function isOrderCompleted(status: unknown): boolean {
  return getTimelineStage(status) === 4;
}

export function isOrderCancelled(status: unknown): boolean {
  const s = normalizeDbStatus(status);
  return s === 'cancelled' || s === 'canceled' || s === 'refunded';
}

export function isOrderPast(status: unknown): boolean {
  return isOrderCompleted(status) || isOrderCancelled(status);
}
