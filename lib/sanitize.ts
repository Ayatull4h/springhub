/**
 * HTML sanitizer yang aman untuk konten kursus / konten admin.
 * DOMPurify parsial + hardened: block-jahat tag & atribut terlebih dahulu,
 * lalu kirim ke DOMPurify (jsdom) — dua lapis, tidak bisa di-bypass lewat
 * entitas HTML / svg onbegin / tag aneh.
 *
 * Catatan: modul ini tidak boleh dipakai di Edge runtime (pakai jsdom).
 */

const BLOCKED_HTML = /<(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math|template|noscript|applet|audio|video|source|track|embed|object)\b/i;

const BLOCKED_ATTR = /\son(?:error|load|click|mouseover|mouseout|mousedown|mouseup|focus|blur|change|submit|keydown|keyup|keypress|dblclick|contextmenu|drag|drop|paste|input|wheel|animationstart|animationend|transitionend|begin|end)\s*=/i;

const BLOCKED_PROTO = /(?:href|src|action|formaction|data|xlink:href)\s*=\s*(?:["']\s*)?(?:javascript|vbscript|data|file|jar|blob):/i;

type DomPurifyModule = {
  sanitize: (html: string, opts?: Record<string, unknown>) => string;
};

let purifyPromise: Promise<DomPurifyModule> | null = null;

async function getPurify(): Promise<DomPurifyModule> {
  if (!purifyPromise) {
    purifyPromise = (async () => {
      const { JSDOM } = await import("jsdom");
      const createDOMPurify = (await import("dompurify")).default;
      const dom = new JSDOM("<!DOCTYPE html><html></html>");
      const { window } = dom;
      const dp = createDOMPurify(window as unknown as Parameters<typeof createDOMPurify>[0]);
      return {
        sanitize: (html: string, opts?: Record<string, unknown>) =>
          dp.sanitize(html, {
            USE_PROFILES: { html: true },
            ALLOWED_TAGS: [
              "p", "br", "strong", "b", "em", "i", "u", "s", "del", "mark",
              "ul", "ol", "li", "blockquote", "pre", "code", "hr",
              "h1", "h2", "h3", "h4", "h5", "h6",
              "a", "table", "thead", "tbody", "tr", "th", "td",
              "span",
            ],
            ALLOWED_ATTR: ["href", "title", "target", "rel", "colspan", "rowspan"],
            ALLOW_ARIA_ATTR: false,
            ALLOW_DATA_ATTR: false,
            ...opts,
            ADD_ATTR: ["target"],
          })
      };
    })();
  }
  return purifyPromise;
}

export async function sanitizeHtml(html: string): Promise<string> {
  if (!html) return "";
  if (typeof html !== "string") return "";

  let cleaned = String(html);

  // Lapis 1 — jaring pengaman cepat sebelum DOMPurify:
  if (BLOCKED_HTML.test(cleaned)) {
    cleaned = cleaned.replace(/(<\/?(?:script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math|template|noscript|applet|audio|video|source|track)\b[^>]*>)/gi, "");
  }
  cleaned = cleaned.replace(BLOCKED_ATTR, (m) => m.replace(/=.*$/, '=""'));
  cleaned = cleaned.replace(BLOCKED_PROTO, (m) => m.replace(/:\s*.+$/i, ":\"\""));

  // Lapis 2 — DOMPurify penuh (parsing ulang, buang card/on*:
  try {
    const { sanitize } = await getPurify();
    return sanitize(cleaned, {
      FORBID_TAGS: ["style", "svg", "math", "form", "input", "button", "iframe", "object", "embed", "script", "template", "noscript", "audio", "video", "source", "track"],
      FORBID_ATTR: ["style", "class", "id", "name", "tabindex", "contenteditable", "draggable", "download", "ping"],
      SAFE_FOR_TEMPLATES: true,
    });
  } catch {
    return cleaned.replace(/[<>]/g, "");
  }
}

/**
 * Escape HTML untuk konteks non-HTML (email, log, dll).
 * Berbeda dari sanitizeHtml (yang mengizinkan subset tag aman),
 * escapeHtml menghilangkan SEMUA markup.
 */
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}