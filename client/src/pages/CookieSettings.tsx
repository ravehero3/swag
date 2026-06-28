import { useState } from 'react';
import { getConsent, setConsent } from '../components/CookieConsent.js';

function CookieSettings() {
  const existing = getConsent();

  const [settings, setSettings] = useState({
    necessary: true,
    performance: existing === 'accepted',
    functional: existing === 'accepted',
    marketing: false,
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    if (key === 'necessary') return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    const analyticsAllowed = settings.performance || settings.functional;
    setConsent(analyticsAllowed ? 'accepted' : 'essential-only');
    localStorage.setItem('voodoo808_cookie_settings', JSON.stringify(settings));
    setSaved(true);
  };

  const cookieStyle: React.CSSProperties = {
    padding: '16px',
    border: '1px solid #222',
    borderRadius: '8px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.03)',
  };

  const Toggle = ({ active, disabled, onToggle }: { active: boolean; disabled?: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        background: active ? '#fff' : '#333',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        transition: 'background 200ms',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: active ? '23px' : '3px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: active ? '#000' : '#888',
        transition: 'left 180ms',
      }} />
    </button>
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 20px' }} className="fade-in">
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '10px' }}>Nastavení cookies</h1>
      <p style={{ color: '#666', marginBottom: '36px', lineHeight: 1.6, fontSize: '14px' }}>
        Zde můžete kontrolovat, jaké cookies nám dovolíte používat.
        Nezbytné cookies jsou povinné a nelze je vypnout.
      </p>

      <div>
        <div style={cookieStyle}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>Nezbytné cookies</p>
            <p style={{ color: '#555', fontSize: '12px' }}>Povinné – nezbytné pro fungování webu (košík, přihlášení)</p>
          </div>
          <Toggle active={true} disabled onToggle={() => {}} />
        </div>

        <div style={cookieStyle}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>Analytické cookies</p>
            <p style={{ color: '#555', fontSize: '12px' }}>Pomáhají nám sledovat návštěvnost a chování uživatelů</p>
          </div>
          <Toggle active={settings.performance} onToggle={() => handleToggle('performance')} />
        </div>

        <div style={cookieStyle}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>Funkční cookies</p>
            <p style={{ color: '#555', fontSize: '12px' }}>Zapamatování vašich preferencí a nastavení</p>
          </div>
          <Toggle active={settings.functional} onToggle={() => handleToggle('functional')} />
        </div>

        <div style={cookieStyle}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>Marketingové cookies</p>
            <p style={{ color: '#555', fontSize: '12px' }}>Personalizovaný obsah a reklamy</p>
          </div>
          <Toggle active={settings.marketing} onToggle={() => handleToggle('marketing')} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '28px' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 24px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '7px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          Uložit nastavení
        </button>
        {saved && (
          <span style={{ fontSize: '13px', color: '#4ade80', transition: 'opacity 300ms' }}>
            ✓ Uloženo
          </span>
        )}
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: '#444', lineHeight: 1.6 }}>
        Více informací najdete v naší{' '}
        <a href="/cookies" style={{ color: '#666', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          zásadách používání souborů cookie
        </a>.
      </p>
    </div>
  );
}

export default CookieSettings;
