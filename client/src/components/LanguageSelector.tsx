import { useEffect, useState } from 'react';
import { setLanguage, detectLanguage } from '../lib/i18n';

type Language = 'cs' | 'de' | 'en';

interface LanguageSelectorProps {
  style?: React.CSSProperties;
}

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const [lang, setLang] = useState<Language>(detectLanguage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Listen for storage changes (for multi-tab sync)
    const handleStorageChange = () => {
      const newLang = (localStorage.getItem('language') || detectLanguage()) as Language;
      setLang(newLang);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleChange = (newLang: Language) => {
    setLanguage(newLang);
    setLang(newLang);
    setIsOpen(false);
    // Trigger a custom event so components can react
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: newLang } }));
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'cs', label: 'Čeština' },
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
  ];

  const currentLabel = languages.find(l => l.code === lang)?.label || 'Čeština';

  return (
    <div style={{ position: 'relative', ...style }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: '0.4px solid #555',
          color: '#aaa',
          borderRadius: '3px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#666';
          e.currentTarget.style.color = '#999';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#555';
            e.currentTarget.style.color = '#aaa';
          }
        }}
      >
        Jazyk: <strong>{currentLabel}</strong>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#0a0a0a',
            border: '0.4px solid #333',
            borderRadius: '3px',
            minWidth: '140px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {languages.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => handleChange(code)}
              style={{
                width: '100%',
                background: lang === code ? 'rgba(11, 153, 252, 0.1)' : 'transparent',
                border: 'none',
                color: lang === code ? '#0B99FC' : '#aaa',
                padding: '8px 12px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.15s',
                borderBottom: code !== languages[languages.length - 1].code ? '0.4px solid #1a1a1a' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (lang !== code) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#ccc';
                }
              }}
              onMouseLeave={(e) => {
                if (lang !== code) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#aaa';
                }
              }}
            >
              <span>{label}</span>
              {lang === code && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 'auto' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
