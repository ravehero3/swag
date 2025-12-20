import Accordion from '@/components/Accordion';

export default function FAQPage() {
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
    <div className="min-h-screen bg-white relative">
      {/* Left vertical line - starts at top (header padding handled by body) */}
      <div className="hidden md:block absolute left-1/4 w-px bg-black z-0" style={{ top: 0, bottom: 0 }} />
      
      {/* Right vertical line - starts at top (header padding handled by body) */}
      <div className="hidden md:block absolute right-1/4 w-px bg-black z-0" style={{ top: 0, bottom: 0 }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center" style={{ paddingTop: '64px', paddingBottom: '40px' }}>
        <h1 
          className="uppercase text-center mb-12"
          style={{
            fontFamily: '"Roboto Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}
        >
          ČASTO KLADENÉ DOTAZY
        </h1>
        
        <div className="w-full px-4 md:w-1/3 md:px-0">
          <Accordion items={faqItems} />
        </div>
      </div>
    </div>
  );
}
