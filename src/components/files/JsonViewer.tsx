"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Minimal, dependency-free JSON syntax highlighter — tokenizes via regex and
 * wraps segments in colored spans. Sufficient for a read-only viewer without
 * pulling in a full syntax-highlighting library. */
function highlight(json: string): string {
  const escaped = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "text-amber-300"; // number
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "text-cyan-300" : "text-emerald-300";
      } else if (/true|false/.test(match)) {
        cls = "text-indigo-300";
      } else if (/null/.test(match)) {
        cls = "text-rose-300";
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}

export function JsonViewer({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const pretty = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const highlighted = useMemo(() => highlight(pretty), [pretty]);

  async function handleCopy() {
    await navigator.clipboard.writeText(pretty);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-10">
        <Button size="sm" variant="secondary" onClick={handleCopy} aria-label="Copy JSON to clipboard">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy JSON"}
        </Button>
      </div>
      <pre className="max-h-[480px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 pt-14 font-mono text-xs leading-relaxed text-slate-300">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
