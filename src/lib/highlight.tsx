import type { ReactNode } from "react";

const KEYWORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while",
]);

const BUILTINS = new Set([
  "game",
  "workspace",
  "script",
  "shared",
  "task",
  "print",
  "warn",
  "error",
  "pcall",
  "xpcall",
  "require",
  "typeof",
  "loadstring",
  "getgenv",
  "Players",
  "ReplicatedStorage",
  "RunService",
  "Workspace",
  "Camera",
  "CFrame",
  "Vector2",
  "Vector3",
  "Color3",
  "Enum",
  "math",
  "table",
  "string",
  "os",
  "tick",
  "wait",
  "spawn",
  "Instance",
  "ipairs",
  "pairs",
]);

const STYLES = {
  comment: "text-[#4c6478] italic",
  string: "text-[#79e8c9]",
  number: "text-[#f3ad6b]",
  keyword: "text-[#5b9dff]",
  builtin: "text-[#22dff0]",
  fn: "text-[#c7b3ff]",
  constant: "text-[#9ed8ff]",
  punct: "text-[#647d93]",
  plain: "text-[#c4d2e2]",
} as const;

export function highlightLua(line: string): ReactNode[] {
  const pattern =
    /(--.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z0-9_])/g;

  const nodes: ReactNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    const [raw, comment, str, num, ident] = match;
    const key = `${match.index}-${raw}`;

    if (comment) {
      nodes.push(
        <span key={key} className={STYLES.comment}>
          {comment}
        </span>,
      );
      continue;
    }

    if (str) {
      nodes.push(
        <span key={key} className={STYLES.string}>
          {str}
        </span>,
      );
      continue;
    }

    if (num) {
      nodes.push(
        <span key={key} className={STYLES.number}>
          {num}
        </span>,
      );
      continue;
    }

    if (ident) {
      if (KEYWORDS.has(ident)) {
        nodes.push(
          <span key={key} className={STYLES.keyword}>
            {ident}
          </span>,
        );
        continue;
      }

      if (BUILTINS.has(ident)) {
        nodes.push(
          <span key={key} className={STYLES.builtin}>
            {ident}
          </span>,
        );
        continue;
      }

      const before = line.slice(0, match.index).trimEnd();
      const after = line.slice(pattern.lastIndex).trimStart();
      const isCall = before.endsWith(":") || after.startsWith("(");

      if (isCall) {
        nodes.push(
          <span key={key} className={STYLES.fn}>
            {ident}
          </span>,
        );
        continue;
      }

      if (/^[A-Z][A-Z0-9_]+$/.test(ident)) {
        nodes.push(
          <span key={key} className={STYLES.constant}>
            {ident}
          </span>,
        );
        continue;
      }

      nodes.push(
        <span key={key} className={STYLES.plain}>
          {ident}
        </span>,
      );
      continue;
    }

    if (raw.trim() === "") {
      nodes.push(raw);
      continue;
    }

    nodes.push(
      <span key={key} className={STYLES.punct}>
        {raw}
      </span>,
    );
  }

  return nodes.length > 0 ? nodes : [" "];
}
