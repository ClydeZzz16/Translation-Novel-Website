import React from 'react';

interface ChapterContentRendererProps {
  content: string;
  theme?: 'light' | 'sepia' | 'dark' | 'pitch-black';
  className?: string;
}

function renderInlineContent(text: string): React.ReactNode[] {
  const tokenRegex = /(\[system\][\s\S]*?\[\/system\]|\[glow\][\s\S]*?\[\/glow\]|\*\*[\s\S]*?\*\*|\*[^\s*][\s\S]*?\*|\[b\][\s\S]*?\[\/b\]|\[i\][\s\S]*?\[\/i\])/g;

  const parts = text.split(tokenRegex);
  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith('[system]') && part.endsWith('[/system]')) {
      const inner = part.slice(8, -9);
      return (
        <span key={i} className="novel-system-glow px-1 inline-block">
          {inner}
        </span>
      );
    }
    if (part.startsWith('[glow]') && part.endsWith('[/glow]')) {
      const inner = part.slice(6, -7);
      return (
        <span key={i} className="novel-system-glow px-1 inline-block">
          {inner}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('[b]') && part.endsWith('[/b]')) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(3, -4)}
        </strong>
      );
    }
    if (part.startsWith('[i]') && part.endsWith('[/i]')) {
      return (
        <em key={i} className="italic">
          {part.slice(3, -4)}
        </em>
      );
    }

    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const ChapterContentRenderer: React.FC<ChapterContentRendererProps> = ({
  content,
  theme = 'dark',
  className = ''
}) => {
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <div className={`space-y-6 reader-theme-${theme} ${className}`}>
      {paragraphs.map((rawParagraph, idx) => {
        const trimmed = rawParagraph.trim();

        // 1. Explicit [system]...[/system] or [glow]...[/glow] block
        const isSystemBlock =
          (trimmed.startsWith('[system]') && trimmed.endsWith('[/system]')) ||
          (trimmed.startsWith('[glow]') && trimmed.endsWith('[/glow]'));

        if (isSystemBlock) {
          const rawInner = trimmed.startsWith('[system]')
            ? trimmed.slice(8, -9).trim()
            : trimmed.slice(6, -7).trim();

          const innerText = rawInner.replace(/\[\/(?:system|glow)\]\s*\[(?:system|glow)\]/gi, '\n');

          return (
            <div key={idx} className="novel-system-glow-block my-8 select-text">
              <div className="novel-system-glow text-center text-lg sm:text-xl font-serif italic tracking-wide whitespace-pre-line leading-relaxed">
                {innerText}
              </div>
            </div>
          );
        }

        // 2. Lenticular brackets system prompt (starts with 【 and ends with 】)
        if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
          return (
            <div key={idx} className="novel-system-glow-block my-8 select-text">
              <div className="novel-system-glow text-center text-lg sm:text-xl font-serif italic tracking-wide whitespace-pre-line leading-relaxed">
                {trimmed}
              </div>
            </div>
          );
        }

        // 3. Explicit [center]...[/center] block
        if (trimmed.startsWith('[center]') && trimmed.endsWith('[/center]')) {
          const innerText = trimmed.slice(8, -9).trim();
          return (
            <div key={idx} className="text-center my-4">
              <p className="whitespace-pre-line">{renderInlineContent(innerText)}</p>
            </div>
          );
        }

        // 4. Standard novel paragraph with inline formatting support
        return (
          <div key={idx} className="space-y-2">
            <p className="whitespace-pre-line leading-relaxed">{renderInlineContent(trimmed)}</p>
          </div>
        );
      })}
    </div>
  );
};
