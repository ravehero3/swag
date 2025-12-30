import { useState } from 'react';
import { Link } from 'wouter';

interface NewsletterWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsletterWindow({ isOpen, onClose }: NewsletterWindowProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailError, setEmailError] = useState(false);
  const [touched, setTouched] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleBlur = () => {
    setTouched(true);
    if (email && !validateEmail(email)) {
      setEmailError(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'E-mail je povinný' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    setEmailError(false);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Úspěšně jste se přihlásili k odběru newsletteru' });
        setEmail('');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Došlo k chybě' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Došlo k chybě při přihlášení' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isOpen ? 1 : 0, 
          pointerEvents: isOpen ? 'auto' : 'none',
          zIndex: 9998,
          transition: 'opacity 0.3s ease-in-out'
        }}
        onClick={onClose}
      />
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: 'min(100%, 33.333%)',
          backgroundColor: '#000',
          borderLeft: '1px solid #333',
          zIndex: 9999,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 1s ease-out, opacity 1s ease-out',
          display: 'flex',
          flexDirection: 'column',
          opacity: isOpen ? 1 : 0,
        }}
      >
        {/* Header */}
        <div style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #333', backgroundColor: '#000', position: 'relative', flexShrink: 0 }}>
          <h2 style={{ fontFamily: '"Helvetica Neue Condensed Bold", "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', fontWeight: 700, fontStretch: 'condensed', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', color: '#fff' }}>
            PŘIHLASTE SE K ODBĚRU NAŠEHO NEWSLETTERU
          </h2>
          <button
            onClick={onClose}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '22px', height: '22px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
            aria-label="Close"
          >
            <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Flex to push everything to bottom */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 12px 12px 12px', justifyContent: 'flex-end' }}>
            {/* Description - Centered vertically in the available space */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', order: 1 }}>
              <p style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.6', color: '#666', margin: 0, textAlign: 'center' }}>
                Přihlaste se k odběru našeho newsletteru a získejte přístup k nejnovějším kolekcím, exkluzivním nabídkám a novinkám ze světa VOODOO808.
              </p>
            </div>

            {/* Labels for Email Input */}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 2px 4px 2px', order: 2 }}>
              <span style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', color: '#fff' }}>E-mail*</span>
              <span style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', color: '#666' }}>*požadovaný</span>
            </div>

            {/* Email Input */}
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(false);
              }}
              onBlur={handleBlur}
              required
              placeholder=""
              style={{ 
                fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', 
                fontSize: '12px',
                padding: '12px',
                height: '44px',
                borderRadius: '4px',
                border: emailError && touched ? '1px solid #dc2626' : '1px solid #fff',
                backgroundColor: '#fff',
                color: emailError && touched ? '#dc2626' : '#000',
                boxSizing: 'border-box',
                width: '100%',
                margin: '0 0 64px 0',
                order: 3
              }}
            />

            {emailError && (
              <p style={{ 
                fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', 
                fontSize: '12px', 
                color: '#dc2626',
                margin: '-60px 2px 64px 2px',
                whiteSpace: 'pre-line',
                order: 4
              }}>
                Neplatný formát emailu. Zkuste to znovu, pro příklad „RaveHero3@gmail.com"
              </p>
            )}

            {/* Data Processing Text */}
            <div style={{ marginBottom: '64px', marginInline: '2px', order: 5 }}>
              <p style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '1.4', color: '#666', margin: '0', textAlign: 'center' }}>
                Odesláním tohoto formuláře souhlasíte se zpracováním vašich{' '}
                <Link href="/ochrana-osobnich-udaju" style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                  osobních údajů
                </Link>
                {' '}za účelem zasílání newsletteru.
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: '#666', marginBottom: '12px', order: 6, width: 'calc(100% + 24px)', marginLeft: '-12px' }} />

            {/* Message Display */}
            {message && (
              <div style={{ padding: '12px', margin: '0 2px 2px 2px', textAlign: 'center', backgroundColor: message.type === 'success' ? 'rgba(36, 224, 83, 0.1)' : '#fee2e2', border: `1px solid ${message.type === 'success' ? '#24e053' : '#dc2626'}`, borderRadius: '4px', order: 7 }}>
                <p style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', lineHeight: '12px', margin: '0', color: message.type === 'success' ? '#24e053' : '#dc2626' }}>{message.text}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ 
                fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', 
                padding: '12px',
                height: '44px',
                fontSize: '12px',
                fontWeight: 400,
                border: 'none',
                backgroundColor: '#fff',
                color: '#000',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRadius: '4px',
                width: '100%',
                order: 8
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.boxShadow = '0 0 15px 2px rgba(255, 255, 255, 0.8)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.boxShadow = 'none';
              }}
            >
              {loading ? 'PŘIHLAŠOVÁNÍ...' : 'PŘIHLÁSIT'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
