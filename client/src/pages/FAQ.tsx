import Accordion from '../components/Accordion';

export default function FAQ() {
  const faqItems = [
    {
      title: 'Jak mohu objednat?',
      content: 'Objednávku můžete provést přímo na našem e-shopu. Stačí si vybrat produkty, vložit je do košíku a postupovat podle pokynů v procesu objednávky.'
    },
    {
      title: 'Jaké máte platební metody?',
      content: 'Akceptujeme platby kartou a bankovním převodem. Více informací najdete na stránce platby.'
    },
    {
      title: 'Jak dlouho trvá doručení?',
      content: 'Standardní doba doručení je 2-5 pracovních dnů od potvrzení objednávky. Více informací najdete na stránce doručení.'
    },
    {
      title: 'Mohu zboží vrátit?',
      content: 'Ano, zboží můžete vrátit do 14 dnů od převzetí. Více informací najdete na stránce vrácení zboží.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', position: 'relative' }} className="fade-in">
      {/* Left vertical line - starts at top */}
      <div
        style={{
          display: 'none',
          position: 'absolute',
          left: '25%',
          width: '1px',
          backgroundColor: '#000',
          top: 0,
          bottom: 0,
          zIndex: 0,
        }}
        className="md:block"
      />
      
      {/* Right vertical line - starts at top */}
      <div
        style={{
          display: 'none',
          position: 'absolute',
          right: '25%',
          width: '1px',
          backgroundColor: '#000',
          top: 0,
          bottom: 0,
          zIndex: 0,
        }}
        className="md:block"
      />

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '64px',
          paddingBottom: '40px',
        }}
      >
        <h1
          style={{
            fontFamily: '"Roboto Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '48px',
            color: '#d4af37',
          }}
        >
          ČASTO KLADENÉ DOTAZY
        </h1>
        
        <div
          style={{
            width: '100%',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
          className="md:w-1/3"
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Accordion items={faqItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
