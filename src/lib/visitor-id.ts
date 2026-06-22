const STORAGE_KEY = "timba-visitor-id";

/** Anonymous browser id — one like per visitor per article. */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

function likedKey(publicationId: string): string {
  return `timba-liked-${publicationId}`;
}

export function hasLikedPublication(publicationId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(likedKey(publicationId)) === "1";
}

export function markPublicationLiked(publicationId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(likedKey(publicationId), "1");
}

function pulseSubmittedKey(publicationId: string): string {
  return `timba-pulse-submitted-${publicationId}`;
}

function pulseDismissedKey(publicationId: string): string {
  return `timba-pulse-dismissed-${publicationId}`;
}

export function hasSubmittedArticlePulse(publicationId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(pulseSubmittedKey(publicationId)) === "1";
}

export function markArticlePulseSubmitted(publicationId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(pulseSubmittedKey(publicationId), "1");
}

export function hasDismissedArticlePulse(publicationId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(pulseDismissedKey(publicationId)) === "1";
}

export function markArticlePulseDismissed(publicationId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(pulseDismissedKey(publicationId), "1");
}
