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
        className="fixed inset-0 bg-black transition-opacity duration-300"
        style={{ 
          opacity: isOpen ? 0.5 : 0, 
          pointerEvents: isOpen ? 'auto' : 'none',
          zIndex: 9998
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
          backgroundColor: '#fff',
          borderLeft: '1px solid #000',
          zIndex: 9999,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <div className="bg-white border-b border-black relative flex items-center justify-center px-6 flex-shrink-0" style={{ height: '44px' }}>
            <h2 className="uppercase tracking-wider text-center" style={{ fontFamily: '"Helvetica Neue Condensed Bold", "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', fontWeight: 700, fontStretch: 'condensed', margin: '0 24px 0 0' }}>PŘIHLASTE SE K ODBĚRU NAŠEHO NEWSLETTERU</h2>
            <button
              onClick={onClose}
              className="absolute hover:opacity-70 transition-opacity"
              style={{ width: '22px', height: '22px', top: '50%', right: '8px', transform: 'translateY(-50%)', padding: '0', border: 'none', background: 'none' }}
              aria-label="Close"
            >
              <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '24px', paddingBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '32px', paddingLeft: '0px', paddingRight: '0px' }}>
              <p className="text-center" style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '1.6', letterSpacing: 'normal', marginTop: '0px', marginBottom: '0px', display: 'block', boxSizing: 'border-box' }}>
                Přihlaste se k odběru našeho newsletteru a získejte přístup k nejnovějším kolekcím, exkluzivním nabídkám a novinkám ze světa VOODOO808.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <div style={{ marginBottom: '24px' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                  <label style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '12px', letterSpacing: '0.12px', color: emailError && touched ? 'red' : 'black' }}>
                    E-mail*
                  </label>
                  <span style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '12px', letterSpacing: '0.12px', color: emailError && touched ? 'red' : '#6b7280' }}>*požadovaný</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(false);
                  }}
                  onBlur={handleBlur}
                  required
                  className="w-full px-3 py-2"
                  style={{ 
                    fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', 
                    fontSize: '12px', 
                    borderRadius: '4px',
                    border: emailError && touched ? '1px solid red' : '1px solid black',
                    color: emailError && touched ? 'red' : 'black',
                    backgroundColor: '#fff'
                  }}
                />
                {emailError && (
                  <p style={{ 
                    fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', 
                    fontSize: '12px', 
                    color: 'red',
                    marginTop: '4px',
                    whiteSpace: 'pre-line'
                  }}>
                    Neplatný formát emailu. Zkuste to znovu, pro příklad „RaveHero3@gmail.com"
                  </p>
                )}
              </div>

              <div style={{ marginTop: 'auto', marginBottom: '32px' }}>
                <p className="text-center" style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '1.4', color: '#4b5563' }}>
                  Odesláním tohoto formuláře souhlasíte se zpracováním vašich{' '}
                  <Link href="/ochrana-osobnich-udaju" style={{ color: '#000', textDecoration: 'underline', cursor: 'pointer' }}>
                    osobních údajů
                  </Link>
                  {' '}za účelem zasílání newsletteru.
                </p>
              </div>

              <div className="border-t border-black" style={{ marginLeft: '-16px', marginRight: '-16px', marginBottom: '16px' }}></div>

              {message && (
                <div className={`p-3 border text-center`} style={{ marginBottom: '16px', marginLeft: '-16px', marginRight: '-16px', borderColor: message.type === 'success' ? '#24e053' : '#dc2626', borderTop: `1px solid ${message.type === 'success' ? '#24e053' : '#dc2626'}`, borderBottom: `1px solid ${message.type === 'success' ? '#24e053' : '#dc2626'}`, borderLeft: 'none', borderRight: 'none', backgroundColor: message.type === 'success' ? 'rgba(36, 224, 83, 0.1)' : '#fee2e2', color: message.type === 'success' ? '#000000' : '#991b1b', paddingLeft: '16px', paddingRight: '16px' }}>
                  <p style={{ fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '12px', lineHeight: '12px', margin: '0' }}>{message.text}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full"
                style={{ 
                  fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif', 
                  padding: '12px',
                  height: '44px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: '1px solid black',
                  backgroundColor: '#000',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {loading ? 'PŘIHLAŠOVÁNÍ...' : 'PŘIHLÁSIT'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
