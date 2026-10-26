import React from 'react';

/**
 * Parse inline formatting (bold, italic, code) into React JSX nodes.
 */
function renderInlineFormatting(text, isDark = false) {
  if (!text) return null;

  // Split by inline markdown: ***bold italic***, **bold**, *italic*, `code`
  const regex = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*|`[^`]+?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={index} className={`font-bold italic ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {part.slice(3, -3)}
        </strong>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] font-semibold border ${
            isDark
              ? 'bg-orange-600/40 border-orange-400 text-orange-100'
              : 'bg-slate-100 border-slate-200 text-orange-600'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Smart AI Text Formatter Component.
 * Transforms raw markdown (#, ##, ###, **, *, ---, lists) into clean, attractive JSX.
 */
export default function FormattedAiText({ content, className = '', isDark = false }) {
  if (!content) return null;

  const lines = String(content).split('\n');
  const blocks = [];
  let currentList = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      continue;
    }

    // Horizontal rule
    if (/^([-*]{3,}|_{3,})$/.test(trimmed)) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: 'hr' });
      continue;
    }

    // Heading (# to ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    // Unordered list item (- item, * item, + item)
    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Ordered list item (1. item, 2. item)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({ num: numMatch[1], text: numMatch[2] });
      continue;
    }

    // Normal paragraph text
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
    blocks.push({ type: 'p', text: trimmed });
  }

  if (currentList) {
    blocks.push(currentList);
  }

  return (
    <div className={`space-y-2 leading-relaxed text-inherit ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'hr') {
          return (
            <hr
              key={idx}
              className={`my-3 border-t ${isDark ? 'border-orange-400/30' : 'border-slate-200'}`}
            />
          );
        }

        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h2
                key={idx}
                className={`text-sm sm:text-base font-black mt-3 mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span className="w-1.5 h-3.5 rounded-full bg-orange-500 shrink-0" />
                <span>{renderInlineFormatting(block.text, isDark)}</span>
              </h2>
            );
          }
          if (block.level === 2) {
            return (
              <h3
                key={idx}
                className={`text-xs sm:text-sm font-bold mt-2.5 mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span className="w-1 h-3 rounded-full bg-orange-500 shrink-0" />
                <span>{renderInlineFormatting(block.text, isDark)}</span>
              </h3>
            );
          }
          // level 3 or 4
          return (
            <h4
              key={idx}
              className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-2 mb-0.5 ${
                isDark ? 'text-orange-200' : 'text-orange-600'
              }`}
            >
              {renderInlineFormatting(block.text, isDark)}
            </h4>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={idx} className="my-1.5 space-y-1.5 pl-0.5">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                      isDark ? 'bg-white' : 'bg-orange-500'
                    }`}
                  />
                  <div className="flex-1">{renderInlineFormatting(item, isDark)}</div>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx} className="my-1.5 space-y-1.5 pl-0.5">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
                  <span
                    className={`font-bold text-xs shrink-0 min-w-[1.25rem] pt-0.5 ${
                      isDark ? 'text-white' : 'text-orange-600'
                    }`}
                  >
                    {item.num}.
                  </span>
                  <div className="flex-1">{renderInlineFormatting(item.text, isDark)}</div>
                </li>
              ))}
            </ol>
          );
        }

        // Paragraph
        return (
          <p key={idx} className="my-1 text-xs sm:text-sm leading-relaxed">
            {renderInlineFormatting(block.text, isDark)}
          </p>
        );
      })}
    </div>
  );
}
