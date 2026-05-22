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

export function formatPriceCzech(amount: number): string {
  return (
    amount.toLocaleString("cs-CZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " Kč"
  );
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
