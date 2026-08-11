import { useEffect, useState } from 'react';
import { setLanguage, detectLanguage } from '../lib/i18n';

type Language = 'cs' | 'de' | 'en';

interface LanguageSelectorProps {
  style?: React.CSSProperties;
}

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const [lang, setLang] = useState<Language>(detectLanguage());

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
    // Trigger a custom event so components can react
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: newLang } }));
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', ...style }}>
      {languages.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          title={label}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: `2px solid ${lang === code ? '#0B99FC' : 'rgba(255,255,255,0.1)'}`,
            background: lang === code ? 'rgba(11,153,252,0.1)' : 'transparent',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
