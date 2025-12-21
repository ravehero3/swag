import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>
      {items.map((item, index) => (
        <div key={index}>
          <button
            onClick={() => toggleItem(index)}
            style={{
              width: '100%',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1a1a1a',
              border: 'none',
              borderBottom: '1px solid #ccc',
              cursor: 'pointer',
              fontFamily: '"Roboto Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#d4af37',
              textAlign: 'left',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#262626';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1a1a';
            }}
          >
            <span>{item.title}</span>
            <ChevronDown
              size={20}
              style={{
                transition: 'transform 0.3s ease',
                transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0,
                color: '#d4af37',
              }}
            />
          </button>

          {openIndex === index && (
            <div
              style={{
                padding: '16px',
                background: '#1a1a1a',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#ccc',
                animation: 'slideDown 0.3s ease',
                borderBottom: '1px solid #ccc',
              }}
            >
              {item.content}
            </div>
          )}
        </div>
      ))}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
