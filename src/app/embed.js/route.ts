export const dynamic = "force-static";
export const revalidate = 3600;

const SCRIPT = `(function(){
  if (window.__btpftpEmbedInitialized) return;
  window.__btpftpEmbedInitialized = true;
  var BASE = "https://bythepeopleforthepeople.com";
  function build(node) {
    var type = node.getAttribute("data-type");
    var slug = node.getAttribute("data-slug");
    if (!type || !slug) return;
    var height = parseInt(node.getAttribute("data-height") || "120", 10);
    var iframe = document.createElement("iframe");
    iframe.src = BASE + "/embed/" + encodeURIComponent(type) + "/" + encodeURIComponent(slug);
    iframe.style.width = "100%";
    iframe.style.maxWidth = "640px";
    iframe.style.height = height + "px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "10px";
    iframe.style.colorScheme = "light";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("title", "Civic-record citation badge");
    iframe.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox");
    iframe.setAttribute("referrerpolicy", "strict-origin");
    node.innerHTML = "";
    node.appendChild(iframe);
  }
  function init() {
    var nodes = document.querySelectorAll('[data-btpftp-embed]');
    for (var i = 0; i < nodes.length; i++) build(nodes[i]);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
`;

export async function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
