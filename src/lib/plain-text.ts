export function toPlainText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  let text = value.replace(/\r\n/g, "\n");

  text = text.replace(/```([\s\S]*?)```/g, (_, code: string) => code.trim());
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^\s*>\s?/gm, "");
  text = text.replace(/^\s*([-*+]|\d+[.)])\s+/gm, "");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}
