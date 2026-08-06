export type Segment = 'morning' | 'afternoon' | 'evening';

export const SEGMENTS: Segment[] = ['morning', 'afternoon', 'evening'];

export const SEGMENT_LABELS: Record<Segment, string> = {
  morning: '早',
  afternoon: '午',
  evening: '晚',
};

export const SEGMENT_COLORS: Record<Segment, string> = {
  morning: '#F59E0B',
  afternoon: '#FB923C',
  evening: '#6366F1',
};

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function segmentOf(time: string, morningEndTime = '12:00', afternoonEndTime = '17:00'): Segment {
  const minutes = toMinutes(time);
  if (minutes < toMinutes(morningEndTime)) return 'morning';
  if (minutes < toMinutes(afternoonEndTime)) return 'afternoon';
  return 'evening';
}
