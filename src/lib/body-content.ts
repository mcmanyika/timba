/** True when body looks like HTML from the rich editor. */
export function isHtmlBody(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.startsWith("<") && /<\/?[a-z][\s\S]*>/i.test(trimmed);
}

/** Convert legacy plain-text / markdown-ish body to HTML for the editor. */
export function plainToHtml(body: string): string {
  if (!body.trim()) return "";
  if (isHtmlBody(body)) return body;

  return body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("## ")) {
        return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
}

export function normalizeBodyForEditor(body: string | null | undefined): string {
  if (!body?.trim()) return "";
  return isHtmlBody(body) ? body : plainToHtml(body);
}

export function isEmptyEditorHtml(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text.length === 0;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
