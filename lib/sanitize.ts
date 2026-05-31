/**
 * Minimal HTML sanitizer for course content.
 * Strips dangerous tags and attributes while preserving safe formatting.
 */

const DANGEROUS_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta", "base"];
const DANGEROUS_ATTRS = ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit"];

export function sanitizeHtml(html: string): string {
  if (!html) return "";

  let cleaned = html;

  // Strip dangerous tags entirely
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    cleaned = cleaned.replace(regex, "");
    // Also strip self-closing variants
    const selfClosing = new RegExp(`<${tag}[^>]*\\/?>`, "gi");
    cleaned = cleaned.replace(selfClosing, "");
  }

  // Strip dangerous attributes
  for (const attr of DANGEROUS_ATTRS) {
    const regex = new RegExp(`\\s+${attr}\\s*=\\s*["'][^"']*["']`, "gi");
    cleaned = cleaned.replace(regex, "");
    const unquoted = new RegExp(`\\s+${attr}\\s*=\\s*\\S+`, "gi");
    cleaned = cleaned.replace(unquoted, "");
    const standalone = new RegExp(`\\s+${attr}(?=\\s|>)`, "gi");
    cleaned = cleaned.replace(standalone, "");
  }

  // Strip javascript: URLs
  cleaned = cleaned.replace(/\s+href\s*=\s*["']\s*javascript:/gi, ' href="#"');
  cleaned = cleaned.replace(/\s+src\s*=\s*["']\s*javascript:/gi, ' src=""');

  return cleaned;
}
