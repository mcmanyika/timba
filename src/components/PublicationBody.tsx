import DOMPurify from "dompurify";

import { isHtmlBody } from "@/lib/body-content";

interface PublicationBodyProps {
  body: string | null;
  className?: string;
}

export function PublicationBody({ body, className = "prose-paper text-lg" }: PublicationBodyProps) {
  if (!body?.trim()) return null;

  if (isHtmlBody(body)) {
    const safe = DOMPurify.sanitize(body, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        "p",
        "br",
        "h1",
        "h2",
        "h3",
        "h4",
        "strong",
        "em",
        "u",
        "s",
        "ul",
        "ol",
        "li",
        "blockquote",
        "a",
        "hr",
      ],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });

    return (
      <div
        className={`${className} publication-body-html`}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  return (
    <div className={className}>
      {body.split(/\n+/).map((para, i) =>
        para.startsWith("## ") ? (
          <h2 key={i}>{para.replace(/^##\s+/, "")}</h2>
        ) : (
          <p key={i}>{para}</p>
        ),
      )}
    </div>
  );
}
