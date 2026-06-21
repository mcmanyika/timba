export function getArticleUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/p/${slug}`;
  }
  return `/p/${slug}`;
}

export function buildWhatsAppShareUrl(title: string, url: string): string {
  const text = `${title} — The Timba Papers\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function buildXShareUrl(title: string, url: string): string {
  const text = `${title} — The Timba Papers`;
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
