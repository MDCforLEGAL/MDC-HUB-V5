import { highlightLua } from "../lib/highlight";
import { cn } from "../lib/cn";

interface CodeBlockProps {
  code: string;
  className?: string;
}

export function CodeBlock({ code, className }: CodeBlockProps) {
  const lines = code.replace(/\n+$/, "").split("\n");

  return (
    <div className={cn("code-scroll overflow-auto", className)}>
      <pre className="min-w-max py-4 font-mono text-[12px] leading-[23px] sm:text-[12.5px]">
        <code className="block">
          {lines.map((line, index) => (
            <span key={index} className="flex px-4 hover:bg-white/[0.025]">
              <span
                aria-hidden="true"
                className="w-9 shrink-0 select-none pr-4 text-right text-[11px] leading-[23px] text-white/18"
              >
                {index + 1}
              </span>
              <span className="pr-6">{line.length > 0 ? highlightLua(line) : " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
