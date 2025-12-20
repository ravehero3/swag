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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            border: '1px solid #000',
            borderRadius: '0px',
          }}
        >
          <button
            onClick={() => toggleItem(index)}
            style={{
              width: '100%',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Roboto Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#000',
              textAlign: 'left',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
            }}
          >
            <span>{item.title}</span>
            <ChevronDown
              size={20}
              style={{
                transition: 'transform 0.3s ease',
                transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0,
              }}
            />
          </button>

          {openIndex === index && (
            <div
              style={{
                padding: '16px',
                background: '#f9f9f9',
                borderTop: '1px solid #000',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#333',
                animation: 'slideDown 0.3s ease',
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
