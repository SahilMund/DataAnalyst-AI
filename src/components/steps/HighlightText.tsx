interface HighlightTextProps {
  text: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text }) => {
  if (!text) return null;
  // Split text by lines to handle block-level elements like bullet points and headings
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-navy-700 leading-relaxed overflow-wrap-anywhere">
      {lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();

        // Handle Headings (### or ####)
        if (trimmedLine.startsWith('###')) {
          const headingText = trimmedLine.replace(/^#+\s*/, '');
          return (
            <h3 key={lineIndex} className="text-lg font-bold text-navy-800 mt-4 mb-2">
              {renderInlineMarkdown(headingText)}
            </h3>
          );
        }

        // Handle Bullet Points (* or -)
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          const bulletText = trimmedLine.replace(/^[*|-]\s*/, '');
          return (
            <div key={lineIndex} className="flex items-start ml-4 space-x-2">
              <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
              <span className="flex-1">{renderInlineMarkdown(bulletText)}</span>
            </div>
          );
        }

        // Skip empty lines or render them as spacers
        if (!trimmedLine) {
          return <div key={lineIndex} className="h-2" />;
        }

        // Default Paragraph
        return (
          <p key={lineIndex}>
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

// Helper function to render bold text within a line
const renderInlineMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={index} className="font-bold text-blue-600">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
};

export default HighlightText;