// Safe clipboard copy helper that works with and without the async Clipboard API.
// - Uses navigator.clipboard.writeText when available and in a secure context.
// - Falls back to a hidden textarea + document.execCommand('copy') otherwise.
// - Returns a boolean indicating success.

export async function copyTextToClipboard(text: string): Promise<boolean> {
  // Guard for SSR and extremely old browsers
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    // Prefer modern Clipboard API when supported and in a secure context
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Intentionally ignore and try fallback below
  }

  // Fallback: use a temporary textarea and execCommand('copy')
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "1px";
    textArea.style.height = "1px";
    textArea.style.padding = "0";
    textArea.style.border = "0";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";

    document.body.appendChild(textArea);
    textArea.focus({ preventScroll: true });
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

