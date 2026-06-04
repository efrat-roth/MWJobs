export function isFuture(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return d.getTime() >= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const diff = today.getTime() - d.getTime();
  return Math.floor(diff / (1000*60*60*24));
}
