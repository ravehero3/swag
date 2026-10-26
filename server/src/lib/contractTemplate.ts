export function formatDateCzech(date: Date): string {
  const day = date.getDate();
  const months = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

export function formatDateEnglish(date: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatPriceCzech(amount: number): string {
  return (
    amount.toLocaleString("cs-CZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " Kč"
  );
}

export function formatPriceEnglish(amount: number): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} CZK`;
}

export function fillContractTemplate(
  template: string,
  data: {
    datum: string;
    pravniJmeno: string;
    umeleckeJmeno: string;
    adresa: string;
    beatNazev: string;
    cena: string;
  }
): string {
  return template
    .replace(/\{\{DATUM\}\}/g, data.datum)
    .replace(/\{\{PRAVNI_JMENO\}\}/g, data.pravniJmeno)
    .replace(/\{\{UMELECKE_JMENO\}\}/g, data.umeleckeJmeno)
    .replace(/\{\{ADRESA\}\}/g, data.adresa)
    .replace(/\{\{BEAT_NAZEV\}\}/g, data.beatNazev)
    .replace(/\{\{CENA\}\}/g, data.cena);
}
