/** Scroll progress 0–1; iOS Safari–safe (uses max of body/html metrics). */
export function getScrollProgress(): number {
  const scrollTop = Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  );
  const scrollHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );
  const clientHeight = window.innerHeight || document.documentElement.clientHeight;
  const scrollable = scrollHeight - clientHeight;
  if (scrollable <= 48) return 1;
  return scrollTop / scrollable;
}

export function hasReachedScrollThreshold(threshold: number): boolean {
  return getScrollProgress() >= threshold;
}
