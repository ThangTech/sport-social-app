import words from "@/data/sensitive-words.json";

export const normalizeModerationText = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\p{Cf}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const terms = new Set(words.map(normalizeModerationText));
const maxWords = Math.max(
  ...Array.from(terms, (term) => term.split(" ").length),
);

export function ensureContentAllowed(content: string) {
  const tokens = normalizeModerationText(content).split(" ").filter(Boolean);
  for (let start = 0; start < tokens.length; start++) {
    for (
      let count = 1;
      count <= maxWords && start + count <= tokens.length;
      count++
    ) {
      if (terms.has(tokens.slice(start, start + count).join(" "))) {
        throw new Error(
          "Nội dung chứa ngôn từ không phù hợp. Vui lòng chỉnh sửa trước khi gửi.",
        );
      }
    }
  }
}
