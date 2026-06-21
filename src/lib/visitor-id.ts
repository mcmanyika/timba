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
