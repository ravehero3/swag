'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const styles = `
  @media (min-width: 1024px) {
    .footer-desktop {
      display: grid !important;
    }
    .footer-mobile {
      display: none !important;
    }
    .footer-section {
      border: 1px solid #333333;
    }
  }
  
  @media (max-width: 1023px) {
    .footer-desktop {
      display: none !important;
    }
    .footer-mobile {
      display: block !important;
    }
  }
  
  .footer-link:hover {
    text-decoration: underline !important;
  }
`;


interface FooterAccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function FooterAccordionItem({ title, children, isOpen, onToggle }: FooterAccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div style={{ borderBottom: "1px solid #333333" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "8px",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px",
          textAlign: "left",
          fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "0.12px",
          textTransform: "uppercase",
          color: "#666666",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span>{title}</span>
        <ChevronDown 
          style={{
            transition: "transform 0.3s ease-in-out",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          size={18}
          strokeWidth={1.5}
        />
      </button>
      
      <div
        style={{
          height: `${height}px`,
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
        }}
      >
        <div ref={contentRef} style={{ paddingLeft: "16px", paddingRight: "16px", paddingBottom: "8px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ExtendedFooter() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sectionStyle = {
    paddingTop: "16px",
    paddingLeft: "12px",
    paddingRight: "16px",
    paddingBottom: "48px",
  };

  const titleStyle = {
    fontSize: "12px",
    lineHeight: "23.6px",
    letterSpacing: "0.12px",
    margin: "0px 0px 12px 0px",
    padding: "0px",
    textTransform: "uppercase" as const,
    color: "#666666",
  };

  const listStyle = {
    margin: "0px",
    padding: "0px",
    listStyle: "none" as const,
  };

  const listItemStyle = {
    margin: "0px",
    padding: "0px",
    fontSize: "12px",
    lineHeight: "23.6px",
    letterSpacing: "0.12px",
    color: "#666666",
  };

  const linkStyle = {
    fontSize: "12px",
    lineHeight: "23.6px",
    letterSpacing: "0.12px",
    color: "#666666",
    textDecoration: "none",
    cursor: "pointer",
  };

  return (
    <footer style={{ backgroundColor: "#000000", width: "100%" }}>
      <style>{styles}</style>
      {/* Desktop Footer - 6 columns */}
      <div 
        className="footer-desktop"
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          borderTop: "1px solid #333333",
          fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "0.12px",
          minHeight: "calc(33.33vh - 60px)",
        } as React.CSSProperties}
      >
        {/* Section 1: Newsletter */}
        <div style={sectionStyle} className="footer-section">
          <h3 style={titleStyle}>ODBĚR NOVINEK</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}>
              <a href="#" style={{...linkStyle, textDecoration: "underline"}}>Přihlaste se k odběru novinek</a>
            </li>
          </ul>
        </div>

        {/* Section 2: Customer Service */}
        <div style={sectionStyle} className="footer-section">
          <h3 style={titleStyle}>ZÁKAZNICKÝ SERVIS</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Často kladené dotazy</a></li>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Sledování objednávky</a></li>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Vrácení zboží</a></li>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Doručení</a></li>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Platba</a></li>
          </ul>
        </div>

        {/* Section 3: About */}
        <div style={sectionStyle} className="footer-section">
          <h3 style={titleStyle}>O SPOLEČNOSTI</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Právní informace</a></li>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Zásady ochrany osobních údajů</a></li>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Zásady používání souborů cookie</a></li>
            <li style={listItemStyle}><a href="#" style={linkStyle} className="footer-link">Nastavení cookies</a></li>
          </ul>
        </div>

        {/* Section 4: Follow Us */}
        <div style={sectionStyle} className="footer-section">
          <h3 style={titleStyle}>SLEDUJTE NÁS</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}><a href="https://www.facebook.com/VOODOO808" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">Facebook</a></li>
            <li style={listItemStyle}><a href="https://www.instagram.com/voodoobeats808/#" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">Instagram</a></li>
            <li style={listItemStyle}><a href="https://www.tiktok.com/@voodoo808?lang=en" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">TikTok</a></li>
          </ul>
        </div>

        {/* Section 5: Team */}
        <div style={sectionStyle} className="footer-section">
          <h3 style={titleStyle}>TEAM VOODOO808</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}>Země / Region: Česká republika</li>
            <li style={listItemStyle}>Jazyk: Čeština</li>
          </ul>
        </div>

        {/* Section 6: Contact */}
        <div style={sectionStyle} className="footer-section">
          <h3 style={titleStyle}>KONTAKTUJTE NÁS</h3>
          <ul style={listStyle}>
            <li style={{...listItemStyle, marginBottom: "8px"}}>Naši poradci jsou vám k dispozici Po–Pá od 9:30 do 19:00</li>
            <li style={{...listItemStyle, marginBottom: "8px"}}>WhatsApp: <a href="https://wa.me/420775181107" target="_blank" rel="noopener noreferrer" style={{...linkStyle, textDecoration: "underline"}} className="footer-link">+420 775 181 107</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}>Telefon: <a href="tel:+420775181107" style={{...linkStyle, textDecoration: "underline"}} className="footer-link">+420 775 181 107</a></li>
            <li style={listItemStyle}>E-mail: <a href="mailto:voodoo808@mail.com" style={{...linkStyle, textDecoration: "underline"}} className="footer-link">Napište nám</a></li>
          </ul>
        </div>
      </div>

      {/* Mobile Footer - Accordion style */}
      <div 
        className="footer-mobile"
        style={{
          width: "100%",
          display: "block",
          borderTop: "1px solid #333333",
          fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "0.12px",
        }}
      >
        <FooterAccordionItem 
          title="ODBĚR NOVINEK" 
          isOpen={openSection === 'newsletter'} 
          onToggle={() => toggleSection('newsletter')}
        >
          <ul style={{...listStyle, marginTop: "8px"}}>
            <li style={{...listItemStyle, marginBottom: "8px"}}>
              <a href="#" style={{...linkStyle, textDecoration: "underline"}}>Přihlaste se k odběru novinek</a>
            </li>
          </ul>
        </FooterAccordionItem>

        <FooterAccordionItem 
          title="ZÁKAZNICKÝ SERVIS" 
          isOpen={openSection === 'customer'} 
          onToggle={() => toggleSection('customer')}
        >
          <ul style={{...listStyle, marginTop: "8px"}}>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Často kladené dotazy</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Sledování objednávky</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Vrácení zboží</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Doručení</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Platba</a></li>
          </ul>
        </FooterAccordionItem>

        <FooterAccordionItem 
          title="O SPOLEČNOSTI" 
          isOpen={openSection === 'about'} 
          onToggle={() => toggleSection('about')}
        >
          <ul style={{...listStyle, marginTop: "8px"}}>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Právní informace</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Zásady ochrany osobních údajů</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Zásady používání souborů cookie</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="#" style={linkStyle} className="footer-link">Nastavení cookies</a></li>
          </ul>
        </FooterAccordionItem>

        <FooterAccordionItem 
          title="SLEDUJTE NÁS" 
          isOpen={openSection === 'social'} 
          onToggle={() => toggleSection('social')}
        >
          <ul style={{...listStyle, marginTop: "8px"}}>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="https://www.facebook.com/VOODOO808" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">Facebook</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="https://www.instagram.com/voodoobeats808/#" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">Instagram</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}><a href="https://www.tiktok.com/@voodoo808?lang=en" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">TikTok</a></li>
          </ul>
        </FooterAccordionItem>

        <FooterAccordionItem 
          title="TEAM VOODOO808" 
          isOpen={openSection === 'team'} 
          onToggle={() => toggleSection('team')}
        >
          <ul style={{...listStyle, marginTop: "8px"}}>
            <li style={{...listItemStyle, marginBottom: "8px"}}>Země / Region: Česká republika</li>
            <li style={{...listItemStyle}}>Jazyk: Čeština</li>
          </ul>
        </FooterAccordionItem>

        <FooterAccordionItem 
          title="KONTAKTUJTE NÁS" 
          isOpen={openSection === 'contact'} 
          onToggle={() => toggleSection('contact')}
        >
          <ul style={{...listStyle, marginTop: "8px"}}>
            <li style={{...listItemStyle, marginBottom: "8px"}}>Naši poradci jsou vám k dispozici Po–Pá od 9:30 do 19:00</li>
            <li style={{...listItemStyle, marginBottom: "8px"}}>WhatsApp: <a href="https://wa.me/420775181107" target="_blank" rel="noopener noreferrer" style={{...linkStyle, textDecoration: "underline"}} className="footer-link">+420 775 181 107</a></li>
            <li style={{...listItemStyle, marginBottom: "8px"}}>Telefon: <a href="tel:+420775181107" style={{...linkStyle, textDecoration: "underline"}} className="footer-link">+420 775 181 107</a></li>
            <li style={{...listItemStyle}}>E-mail: <a href="mailto:voodoo808@mail.com" style={{...linkStyle, textDecoration: "underline"}} className="footer-link">Napište nám</a></li>
          </ul>
        </FooterAccordionItem>
      </div>
    </footer>
  );
}
