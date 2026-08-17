export const STUDENT_TIMELINE_LABELS = [
  'Payment Successful',
  'Order Confirmed',
  'Preparing',
  'Ready at Counter',
  'Completed',
] as const;

export const STUDENT_TIMELINE_DESCRIPTIONS = [
  'Payment received',
  'Institution confirmed your order',
  'Kitchen is preparing your food',
  'Your order will be ready for pickup',
  'Picked up successfully',
] as const;

export type TimelineStage = 0 | 1 | 2 | 3 | 4 | -1;

export const ORDER_STATUS_TO_TIMELINE: Record<string, TimelineStage> = {
  pending: 0,
  payment_successful: 0,
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
  if (s === 'payment_successful' || s === 'paid') return 'Payment Successful';
  const stage = getTimelineStage(status);
  if (stage < 0) return 'Order Cancelled';
  return STUDENT_TIMELINE_LABELS[stage as number] ?? 'Payment Successful';
}

export function getTimelineDescription(status: unknown): string {
  const s = normalizeDbStatus(status);
  if (s === 'cancelled' || s === 'canceled' || s === 'refunded') return 'Order has been cancelled';
  if (s === 'payment_successful' || s === 'paid') return 'Payment received';
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
