-- License types for VOODOO808 production DB
-- Run this on your Vercel PostgreSQL database

DELETE FROM beat_license_files;
DELETE FROM license_types;

INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
VALUES ('Bezplatné stažení', 'Zdarma ke stažení. Žádná smlouva není vyžadována.', 0.00, '{MP3}', 'Bezplatné stažení pro osobní nekomerční užití.', false, true, NULL);

INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
VALUES ('Sound Kit — Royalty Free licence', 'Nevýhradní royalty free licence ke zvukovému kitu. Všechny zvuky jsou royalty free pro komerční i nekomerční užití.', 890.00, '{ZIP}', 'Royalty free licence ke zvukovému kitu. Žádné průběžné poplatky.', false, true, '               VOODOO808: Licenční smlouva ke zvukovému kitu
                                Smlouva o užití zvukových vzorků


SMLUVNÍ STRANY
Tato licenční smlouva (dále jen „Smlouva") je uzavřena dne {{DATUM}} (dále jen „Den
účinnosti") mezi těmito stranami:

Nabyvatel licence: {{PRAVNI_JMENO}}, uměleckým jménem {{UMELECKE_JMENO}}, s bydlištěm
na adrese {{ADRESA}}, Česká republika (dále jen „Nabyvatel").

Poskytovatel licence: Vojtěch Vojkovský, uměleckým jménem VOODOO808, s bydlištěm na
adrese Bedovická č. 193, Třebechovice pod Orebem, 503 46, Česká republika (dále jen
„Poskytovatel").

  Tato Smlouva se řídí zákonem č. 89/2012 Sb., občanský zákoník (dále jen „OZ"), a zákonem č. 121/2000
  Sb., o právu autorském (dále jen „AZ").


PŘEDMĚT SMLOUVY
Předmětem této Smlouvy je zvukový kit s názvem {{BEAT_NAZEV}} (dále jen „Kit"), obsahující
kolekci zvukových vzorků, smyček a perkusí vytvořených Vojtěchem Vojkovským.


1. UDĚLENÍ LICENCE — ROYALTY FREE
Poskytovatel uděluje Nabyvateli nevýhradní, celosvětovou, trvalou licenci k užití zvukových
vzorků obsažených v Kitu pro komerční i nekomerční hudební tvorbu.

Všechny zvuky obsažené v Kitu jsou „royalty free" — Nabyvatel není povinen platit žádné
průběžné licenční poplatky za jejich užití v hudebních nahrávkách.


2. OPRÁVNĚNÁ UŽITÍ
Nabyvatel je oprávněn:

a) Začlenit zvukové vzorky z Kitu do vlastních hudebních skladeb a nahrávek
b) Distribuovat výsledné skladby na streamovacích platformách (Spotify, Apple Music, YouTube apod.)
c) Používat vzorky pro komerční i nekomerční projekty včetně reklam a filmů
d) Upravovat a kombinovat zvukové vzorky dle vlastního uvážení


3. ZAKÁZANÁ UŽITÍ
Nabyvatel není oprávněn:

a) Prodávat, sdílet ani jinak distribuovat obsah Kitu jako samostatné zvukové vzorky třetím osobám
b) Prezentovat vzorky z Kitu jako vlastní autorské dílo
c) Zahrnout obsah Kitu do jiného zvukového kitu nebo sample packu určeného k prodeji


4. ODMĚNA ZA LICENCI
Jednorázová odměna za licenci ve výši {{CENA}} byla uhrazena prostřednictvím platební brány
GoPay dne {{DATUM}}. Tímto je potvrzeno přijetí platby.


5. PŘEDÁNÍ DÍLA
Kit bude Nabyvateli předán prostřednictvím e-mailu obsahujícího odkaz ke stažení na adresu,
kterou Nabyvatel Poskytovateli sdělil.


6. OMEZENÍ A NEPŘEVODITELNOST
Tato licence je nepřevoditelná. Nabyvatel nesmí postoupit práva plynoucí z této Smlouvy třetím
osobám.


7. ROZHODNÉ PRÁVO
Tato Smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb.,
občanský zákoník, a zákonem č. 121/2000 Sb., autorský zákon, v jejich platném znění.

Veškeré spory budou strany řešit přednostně smírnou cestou. Nebude-li dosaženo dohody,
rozhodne věcně a místně příslušný soud České republiky.




PODPISY SMLUVNÍCH STRAN


Nabyvatel licence:

Jméno: ________________________________

Datum: ________________________________

Podpis: ________________________________



Poskytovatel licence:

Vojtěch Vojkovský (VOODOO808)

Datum: ________________________________

Podpis: ________________________________




          VOODOO808 Licenční smlouva ke zvukovému kitu — Vyhotoveno: {{DATUM}} — Strana 1/1
        Tato smlouva je vyhotovena ve dvou stejnopisích, přičemž každá strana obdrží jeden výtisk.');

INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
VALUES ('Beat — Exkluzivní licence (Standard)', 'Pro umělce s méně než 100 000 měsíčními posluchači. Zahrnuje WAV + stems. Exkluzivní práva dle českého autorského zákona.', 5000.00, '{WAV,Stems}', 'Exkluzivní licence k hudebnímu dílu pro umělce s méně než 100 000 měsíčními posluchači.', false, true, '               VOODOO808: Smlouva o exkluzivní licenci
                                Licenční smlouva k hudebnímu dílu


SMLUVNÍ STRANY
Tato licenční smlouva (dále jen „Smlouva") je uzavřena dne {{DATUM}} (dále jen „Den
účinnosti") mezi těmito stranami:

Nabyvatel licence: {{PRAVNI_JMENO}}, uměleckým jménem {{UMELECKE_JMENO}}, s bydlištěm
na adrese {{ADRESA}}, Česká republika (dále jen „Nabyvatel").

Poskytovatel licence: Vojtěch Vojkovský, uměleckým jménem VOODOO808, s bydlištěm na
adrese Bedovická č. 193, Třebechovice pod Orebem, 503 46, Česká republika (dále jen
„Poskytovatel").

  Tato Smlouva se řídí zákonem č. 89/2012 Sb., občanský zákoník (dále jen „OZ"), a zákonem č. 121/2000
  Sb., o právu autorském (dále jen „AZ").


PŘEDMĚT SMLOUVY
Poskytovatel prohlašuje, že je nositelem majetkových autorských práv k hudebnímu dílu s
názvem {{BEAT_NAZEV}} (dále jen „Dílo") ve smyslu § 12 a násl. AZ. Dílo bylo vytvořeno Vojtěchem
Vojkovským („Autor") v rámci činnosti Poskytovatele.

  Dle § 46 AZ udělá Poskytovatel Nabyvateli níže specifikované oprávnění k výkonu práva Dílo užít.


1. PRÁVO NA POŘÍZENÍ ZVUKOVÉHO ZÁZNAMU
Poskytovatel udělí Nabyvateli exkluzivní licenci k zaznamenání vokální složky synchronizované s
Dílem, zčásti nebo v celém rozsahu a v podstatě v jeho původní formě (dále jen „Zvukový
záznam").


2. PRÁVO NA ROZMNOŽOVÁNÍ A ROZŠIŘOVÁNÍ
Poskytovatel udělí Nabyvateli exkluzivní licenci k užití Zvukového záznamu při rozmnožování,
výrobě a rozšiřování ve formě gramofonových desek, kazet, CD, digitálních stažení, jiných
zvukových nosičů a digitálních záznamů (souhrnně „Záznamy") po celém světě v neomezeném
počtu kopií.

  Toto právo odpovídá § 13 a § 14 AZ (právo na rozmnožování a rozšiřování rozmnoženin díla).


3. PRÁVO NA SDĚLOVÁNÍ VEŘEJNOSTI A STREAMOVÁNÍ
Nabyvateli je uděleno oprávnění ke sdělování Zvukového záznamu veřejnosti prostřednictvím
internetu bez omezení počtu stažení či streamů - jak bezplatných, tak pro komerční účely (např.
Spotify, Apple Music a podobné platformy).

  Toto právo vychází z § 18 AZ (právo na sdělování díla veřejnosti).


4. SYNCHRONIZAČNÍ PRÁVA
Poskytovatel udělí Nabyvateli neomezená synchronizační práva k užití Díla v hudebních videích
šířených online (YouTube, Vimeo apod.) bez omezení počtu přehrání.

Neomezená synchronizační práva jsou rovněž udělena pro distribuci prostřednictvím televizního
vysílání, filmů nebo počítačových her.

5. PRÁVO NA VEŘEJNÉ PROVOZOVÁNÍ
Poskytovatel udělí Nabyvateli exkluzivní licenci k užití Zvukového záznamu při neomezeném
počtu nevýdělečných i výdělečných vystoupení, show a koncertů. Nabyvatel je oprávněn přijímat
odměnu z vystoupení realizovaných na základě této licence.

  Toto právo odpovídá § 20 AZ (provozování díla ze záznamu a přenos provozování díla).


6. PRÁVO NA VYSÍLÁNÍ
Poskytovatel udělí Nabyvateli právo na vysílání Zvukového záznamu neomezeným počtem
rozhlasových stanic.

  Toto právo odpovídá § 19 a § 21 AZ (vysílání díla rozhlasem nebo televizí).


7. UVEDENÍ AUTORSTVÍ
Nabyvatel je povinen v souladu s § 11 odst. 2 AZ uvádět původní autorství Díla přiměřeným
způsobem ve všech médiích a formátech pod jménem „VOODOO808" – písemně kde je to možné,
jinak ústně.


8. ODMĚNA ZA LICENCI
Jako protiplnění za práva udělená touto Smlouvou je Nabyvatel povinen zaplatit Poskytovateli
jednorázovou odměnu ve výši {{CENA}}, splatnou Vojtěchu Vojkovskému, přičemž převzetí
tohoto plnění je tímto potvrzeno.

Pokud Nabyvatel nesplní povinnost platby, nedostojí jiným závazkům dle této Smlouvy nebo
bude-li mít nedostatečný zůstatek na bankovním účtu, je Poskytovatel oprávněn Smlouvu
vypovědět písemným oznámením doručeným Nabyvateli dle § 2001 a násl. OZ.

Taková výpověď způsobí, že rozmnožování, výroba a/nebo distribuce Záznamů, za něž nebylo
zaplaceno, bude posuzována jako porušení autorských práv dle AZ.

  Dle § 2 odst. 1 OZ a § 46 odst. 3 AZ musí být výpověď licence provedena písemnou formou. Licence zaniká
  uplynutím výpovědní doby, která činí 30 dní od doručení výpovědi.


9. PŘEDÁNÍ DÍLA
Dílo bude Nabyvateli předáno ve formě souboru ve vysoké kvalitě (WAV + stems)
prostřednictvím e-mailu na adresu, kterou Nabyvatel Poskytovateli sdělí. Nabyvatel obdrží e-mail
s přílohou nebo odkazem ke stažení Díla.


10. ZVUKOVÉ VZORKY (SAMPLESY)
Zajištění clearance práv třetích stran k případným zvukovým vzorkům obsaženým v Dílu je
výlučnou odpovědností Nabyvatele.


11. OMEZENÍ A NEPŘEVODITELNOST
Tato licence je nepřevoditelná a vztahuje se výhradně na specifikované Dílo. Tato Smlouva
představuje úplnou dohodu mezi Poskytovatelem a Nabyvatelem týkající se Díla a je závazná pro
obě smluvní strany, jakož i pro jejich právní nástupce a zástupce.

  Dle § 48 AZ nelze licenci bez souhlasu autora postoupit třetí osobě, ledaže je licence převedena spolu s
  podnikem nebo jeho částí.


12. AUTORSKÝ PODÍL A NAKLADATELSKÁ PRÁVA
Ohledně nakladatelských práv a vlastnictví k podkladovému Dílu vtělenému do Zvukového
záznamu smluvní strany sjednávají tento podíl:
• Poskytovatel vlastní a spravuje 50 % tzv. „autorského podílu" (Writer''s Share) podkladového Díla.
• Poskytovatel vlastní a spravuje 50 % tzv. „nakladatelského podílu" (Publisher''s Share) podkladového Díla.
• Poskytovatel vlastní a spravuje 3 % tzv. „licenčních poplatků z masteru" (Master Royalties),
  vypočtených z čistého zisku po odečtení všech nákladů Nabyvatele.

  Rozdělení autorských podílů je v souladu s § 100 a násl. AZ. Strany mohou smluvně sjednat rozdělení
  výnosu z kolektivní správy práv (OSA, INTERGRAM apod.).


13. ROZHODNÉ PRÁVO A ŘEŠENÍ SPORŮ
Tato Smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb.,
občanský zákoník, a zákonem č. 121/2000 Sb., autorský zákon, v jejich platném znění.

Veškeré spory vzniklé z této Smlouvy budou strany řešit přednostně smírnou cestou. Nebude-li
dosaženo dohody, rozhodne věcně a místně příslušný soud České republiky.




PODPISY SMLUVNÍCH STRAN
Smluvní strany prohlašují, že si tuto Smlouvu přečetly, že odpovídá jejich pravé a svobodné vůli a
že ji uzavírají dobrovolně, nikoli v tísni ani za nápadně nevýhodných podmínek.



Nabyvatel licence:

Jméno: ________________________________

Datum: ________________________________

Podpis: ________________________________



Poskytovatel licence:

Vojtěch Vojkovský (VOODOO808)

Datum: ________________________________

Podpis: ________________________________




          VOODOO808 Exkluzivní licenční smlouva — Vyhotoveno: {{DATUM}} — Strana 1/1
        Tato smlouva je vyhotovena ve dvou stejnopisích, přičemž každá strana obdrží jeden výtisk.');

INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
VALUES ('Beat — Exkluzivní licence (Premium)', 'Pro umělce s více než 100 000 měsíčními posluchači. Zahrnuje WAV + stems. Exkluzivní práva dle českého autorského zákona.', 10000.00, '{WAV,Stems}', 'Exkluzivní licence k hudebnímu dílu pro umělce s více než 100 000 měsíčními posluchači.', false, true, '               VOODOO808: Smlouva o exkluzivní licenci
                                Licenční smlouva k hudebnímu dílu


SMLUVNÍ STRANY
Tato licenční smlouva (dále jen „Smlouva") je uzavřena dne {{DATUM}} (dále jen „Den
účinnosti") mezi těmito stranami:

Nabyvatel licence: {{PRAVNI_JMENO}}, uměleckým jménem {{UMELECKE_JMENO}}, s bydlištěm
na adrese {{ADRESA}}, Česká republika (dále jen „Nabyvatel").

Poskytovatel licence: Vojtěch Vojkovský, uměleckým jménem VOODOO808, s bydlištěm na
adrese Bedovická č. 193, Třebechovice pod Orebem, 503 46, Česká republika (dále jen
„Poskytovatel").

  Tato Smlouva se řídí zákonem č. 89/2012 Sb., občanský zákoník (dále jen „OZ"), a zákonem č. 121/2000
  Sb., o právu autorském (dále jen „AZ").


PŘEDMĚT SMLOUVY
Poskytovatel prohlašuje, že je nositelem majetkových autorských práv k hudebnímu dílu s
názvem {{BEAT_NAZEV}} (dále jen „Dílo") ve smyslu § 12 a násl. AZ. Dílo bylo vytvořeno Vojtěchem
Vojkovským („Autor") v rámci činnosti Poskytovatele.

  Dle § 46 AZ udělá Poskytovatel Nabyvateli níže specifikované oprávnění k výkonu práva Dílo užít.


1. PRÁVO NA POŘÍZENÍ ZVUKOVÉHO ZÁZNAMU
Poskytovatel udělí Nabyvateli exkluzivní licenci k zaznamenání vokální složky synchronizované s
Dílem, zčásti nebo v celém rozsahu a v podstatě v jeho původní formě (dále jen „Zvukový
záznam").


2. PRÁVO NA ROZMNOŽOVÁNÍ A ROZŠIŘOVÁNÍ
Poskytovatel udělí Nabyvateli exkluzivní licenci k užití Zvukového záznamu při rozmnožování,
výrobě a rozšiřování ve formě gramofonových desek, kazet, CD, digitálních stažení, jiných
zvukových nosičů a digitálních záznamů (souhrnně „Záznamy") po celém světě v neomezeném
počtu kopií.

  Toto právo odpovídá § 13 a § 14 AZ (právo na rozmnožování a rozšiřování rozmnoženin díla).


3. PRÁVO NA SDĚLOVÁNÍ VEŘEJNOSTI A STREAMOVÁNÍ
Nabyvateli je uděleno oprávnění ke sdělování Zvukového záznamu veřejnosti prostřednictvím
internetu bez omezení počtu stažení či streamů - jak bezplatných, tak pro komerční účely (např.
Spotify, Apple Music a podobné platformy).

  Toto právo vychází z § 18 AZ (právo na sdělování díla veřejnosti).


4. SYNCHRONIZAČNÍ PRÁVA
Poskytovatel udělí Nabyvateli neomezená synchronizační práva k užití Díla v hudebních videích
šířených online (YouTube, Vimeo apod.) bez omezení počtu přehrání.

Neomezená synchronizační práva jsou rovněž udělena pro distribuci prostřednictvím televizního
vysílání, filmů nebo počítačových her.

5. PRÁVO NA VEŘEJNÉ PROVOZOVÁNÍ
Poskytovatel udělí Nabyvateli exkluzivní licenci k užití Zvukového záznamu při neomezeném
počtu nevýdělečných i výdělečných vystoupení, show a koncertů. Nabyvatel je oprávněn přijímat
odměnu z vystoupení realizovaných na základě této licence.

  Toto právo odpovídá § 20 AZ (provozování díla ze záznamu a přenos provozování díla).


6. PRÁVO NA VYSÍLÁNÍ
Poskytovatel udělí Nabyvateli právo na vysílání Zvukového záznamu neomezeným počtem
rozhlasových stanic.

  Toto právo odpovídá § 19 a § 21 AZ (vysílání díla rozhlasem nebo televizí).


7. UVEDENÍ AUTORSTVÍ
Nabyvatel je povinen v souladu s § 11 odst. 2 AZ uvádět původní autorství Díla přiměřeným
způsobem ve všech médiích a formátech pod jménem „VOODOO808" – písemně kde je to možné,
jinak ústně.


8. ODMĚNA ZA LICENCI
Jako protiplnění za práva udělená touto Smlouvou je Nabyvatel povinen zaplatit Poskytovateli
jednorázovou odměnu ve výši {{CENA}}, splatnou Vojtěchu Vojkovskému, přičemž převzetí
tohoto plnění je tímto potvrzeno.

Pokud Nabyvatel nesplní povinnost platby, nedostojí jiným závazkům dle této Smlouvy nebo
bude-li mít nedostatečný zůstatek na bankovním účtu, je Poskytovatel oprávněn Smlouvu
vypovědět písemným oznámením doručeným Nabyvateli dle § 2001 a násl. OZ.

Taková výpověď způsobí, že rozmnožování, výroba a/nebo distribuce Záznamů, za něž nebylo
zaplaceno, bude posuzována jako porušení autorských práv dle AZ.

  Dle § 2 odst. 1 OZ a § 46 odst. 3 AZ musí být výpověď licence provedena písemnou formou. Licence zaniká
  uplynutím výpovědní doby, která činí 30 dní od doručení výpovědi.


9. PŘEDÁNÍ DÍLA
Dílo bude Nabyvateli předáno ve formě souboru ve vysoké kvalitě (WAV + stems)
prostřednictvím e-mailu na adresu, kterou Nabyvatel Poskytovateli sdělí. Nabyvatel obdrží e-mail
s přílohou nebo odkazem ke stažení Díla.


10. ZVUKOVÉ VZORKY (SAMPLESY)
Zajištění clearance práv třetích stran k případným zvukovým vzorkům obsaženým v Dílu je
výlučnou odpovědností Nabyvatele.


11. OMEZENÍ A NEPŘEVODITELNOST
Tato licence je nepřevoditelná a vztahuje se výhradně na specifikované Dílo. Tato Smlouva
představuje úplnou dohodu mezi Poskytovatelem a Nabyvatelem týkající se Díla a je závazná pro
obě smluvní strany, jakož i pro jejich právní nástupce a zástupce.

  Dle § 48 AZ nelze licenci bez souhlasu autora postoupit třetí osobě, ledaže je licence převedena spolu s
  podnikem nebo jeho částí.


12. AUTORSKÝ PODÍL A NAKLADATELSKÁ PRÁVA
Ohledně nakladatelských práv a vlastnictví k podkladovému Dílu vtělenému do Zvukového
záznamu smluvní strany sjednávají tento podíl:
• Poskytovatel vlastní a spravuje 50 % tzv. „autorského podílu" (Writer''s Share) podkladového Díla.
• Poskytovatel vlastní a spravuje 50 % tzv. „nakladatelského podílu" (Publisher''s Share) podkladového Díla.
• Poskytovatel vlastní a spravuje 3 % tzv. „licenčních poplatků z masteru" (Master Royalties),
  vypočtených z čistého zisku po odečtení všech nákladů Nabyvatele.

  Rozdělení autorských podílů je v souladu s § 100 a násl. AZ. Strany mohou smluvně sjednat rozdělení
  výnosu z kolektivní správy práv (OSA, INTERGRAM apod.).


13. ROZHODNÉ PRÁVO A ŘEŠENÍ SPORŮ
Tato Smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb.,
občanský zákoník, a zákonem č. 121/2000 Sb., autorský zákon, v jejich platném znění.

Veškeré spory vzniklé z této Smlouvy budou strany řešit přednostně smírnou cestou. Nebude-li
dosaženo dohody, rozhodne věcně a místně příslušný soud České republiky.




PODPISY SMLUVNÍCH STRAN
Smluvní strany prohlašují, že si tuto Smlouvu přečetly, že odpovídá jejich pravé a svobodné vůli a
že ji uzavírají dobrovolně, nikoli v tísni ani za nápadně nevýhodných podmínek.



Nabyvatel licence:

Jméno: ________________________________

Datum: ________________________________

Podpis: ________________________________



Poskytovatel licence:

Vojtěch Vojkovský (VOODOO808)

Datum: ________________________________

Podpis: ________________________________




          VOODOO808 Exkluzivní licenční smlouva — Vyhotoveno: {{DATUM}} — Strana 1/1
        Tato smlouva je vyhotovena ve dvou stejnopisích, přičemž každá strana obdrží jeden výtisk.');

