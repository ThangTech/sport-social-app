export async function shareWebPost(url: string, authorName: string) {
  if (window.navigator.share) {
    try {
      await window.navigator.share({
        title: "Chia sẻ bài viết",
        text: `${authorName} trên SocialSport`,
        url,
      });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      // A browser may expose sharing but deny it on local HTTP.
    }
  }

  try {
    if (window.navigator.clipboard?.writeText) {
      await window.navigator.clipboard.writeText(url);
      window.alert("Đã sao chép liên kết bài viết.");
      return;
    }
  } catch {
    // Fall back for LAN HTTP and browsers without clipboard permission.
  }

  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");
  field.value = url;
  field.style.position = "fixed";
  field.style.opacity = "0";
  field.setAttribute("readonly", "");
  document.body.appendChild(field);
  let copied = false;
  try {
    field.select();
    field.setSelectionRange(0, url.length);
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  if (copied) {
    window.alert("Đã sao chép liên kết bài viết.");
  } else {
    window.prompt("Sao chép liên kết này để chia sẻ bài viết:", url);
  }
}
