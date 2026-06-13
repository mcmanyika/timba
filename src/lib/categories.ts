export const CATEGORY_LABELS: Record<string, string> = {
  zimbabwe: "Zimbabwe",
  constitution_democracy: "Constitution & Democracy",
  africa: "Africa",
  global_affairs: "Global Affairs",
  political_economy: "Political Economy",
  statecraft: "Statecraft",
  parliament: "Parliament",
  conferences: "Conferences",
  international: "International Engagements",
  dcp: "DCP Addresses",
  interviews: "Interviews",
  podcasts: "Podcasts",
  television: "Television Appearances",
};

export const ESSAY_CATEGORIES = [
  "zimbabwe",
  "constitution_democracy",
  "africa",
  "global_affairs",
  "political_economy",
  "statecraft",
] as const;

export const SPEECH_CATEGORIES = [
  "parliament",
  "conferences",
  "international",
  "dcp",
] as const;

export const MEDIA_CATEGORIES = [
  "interviews",
  "podcasts",
  "television",
] as const;

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

export const TYPE_LABELS: Record<string, string> = {
  essay: "Essay",
  policy_paper: "Policy Paper",
  speech: "Speech",
  book: "Book",
  media: "Media",
};

export function formatDate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export interface Publication {
  id: string;
  publication_number: string;
  type: string;
  category: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_url: string | null;
  pdf_url: string | null;
  media_embed_url: string | null;
  location: string | null;
  occasion: string | null;
  published: boolean;
  is_featured: boolean;
  publication_date: string;
  created_at: string;
  updated_at: string;
}