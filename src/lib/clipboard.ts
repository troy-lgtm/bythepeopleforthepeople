/**
 * Copy text to the clipboard with a graceful fallback.
 *
 * `navigator.clipboard` is undefined on insecure (non-HTTPS) origins and in
 * some older/embedded browsers, so calling it unguarded throws. This feature-
 * detects, then falls back to a hidden-textarea + execCommand path, and finally
 * returns false so callers can surface an honest error state.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    if (typeof document === "undefined") return false;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
