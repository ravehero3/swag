-- License types for VOODOO808 production DB

INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
VALUES ('Nevýhradní MP3', 'Základní licence s MP3 souborem. Vhodná pro nahrávky na YouTube, SoundCloud a streamovací platformy.', 299.00, '{MP3}', 'Nevýhradní licence k užití beatu pro komerční i nekomerční účely.', false, true, 'LICENČNÍ SMLOUVA K HUDEBNÍMU DÍLU
Nevýhradní licence – MP3

Smlouva uzavřená dne {{DATUM}}

═══════════════════════════════════════════════════

SMLUVNÍ STRANY

Poskytovatel licence:
Vojtěch Vojkovský, hudební producent
Obchodní název: VOODOO808
Kontakt: info@voodoo808.com
Web: voodoo808.com
(dále jen „Poskytovatel")

Nabyvatel licence:
Právní jméno: {{PRAVNI_JMENO}}
Umělecké jméno: {{UMELECKE_JMENO}}
Adresa trvalého bydliště: {{ADRESA}}
(dále jen „Nabyvatel")

═══════════════════════════════════════════════════

PŘEDMĚT SMLOUVY

Název díla (beatu): {{BEAT_NAZEV}}
Cena licence: {{CENA}}
Formát: MP3 (stereo mix)

═══════════════════════════════════════════════════

ROZSAH LICENCE

Nabyvatel je oprávněn:

a) Použít dílo jako hudební podklad pro vlastní skladby a nahrávky
b) Distribuovat výsledné dílo na streamovacích platformách (Spotify, Apple Music, YouTube, SoundCloud a dalších)
c) Používat dílo pro komerční i nekomerční účely
d) Synchronizovat dílo s audiovizuálními díly (videoklipy, reklamy, reels, stories)
e) Provádět úpravy díla potřebné pro tvorbu vlastní skladby

Nabyvatel není oprávněn:

a) Prodávat, sublicencovat ani jinak převádět tato licenční práva na třetí osoby
b) Registrovat hudební dílo nebo jeho části jako svůj vlastní autorský copyright
c) Uplatňovat Content ID nároky vztahující se k tomuto beatu
d) Prezentovat beat jako výhradní vlastnictví Nabyvatele

POVAHA LICENCE

Tato licence je nevýhradní. Poskytovatel si vyhrazuje právo toto hudební dílo dále licencovat třetím osobám.

═══════════════════════════════════════════════════

AUTORSKÁ PRÁVA

Všechna autorská práva k hudebnímu dílu zůstávají výhradně Poskytovateli.
Nabyvatel je povinen uvést Poskytovatele jako autora hudby ve formátu:
Prod. by VOODOO808

═══════════════════════════════════════════════════

PLATEBNÍ PODMÍNKY

Licenční poplatek ve výši {{CENA}} byl uhrazen prostřednictvím platební brány GoPay dne {{DATUM}}.
Tato smlouva nabývá platnosti okamžikem přijetí platby.

═══════════════════════════════════════════════════

ZÁVĚREČNÁ USTANOVENÍ

Tato smlouva se řídí právním řádem České republiky, zejména zákonem č. 121/2000 Sb. (autorský zákon) v platném znění. Je platná v elektronické podobě bez fyzického podpisu.

Za Poskytovatele:                    Za Nabyvatele:
VOODOO808 / Vojtěch Vojkovský        {{PRAVNI_JMENO}}
info@voodoo808.com                   (umělecky: {{UMELECKE_JMENO}})

Datum: {{DATUM}}');

INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
VALUES ('Nevýhradní WAV + Stems', 'Prémiová nevýhradní licence s WAV souborem a trackout stems pro profesionální mixování.', 699.00, '{WAV,Stems}', 'Nevýhradní licence k užití beatu se stems pro profesionální produkci.', false, true, 'LICENČNÍ SMLOUVA K HUDEBNÍMU DÍLU
Nevýhradní licence – WAV + Trackout Stems

Smlouva uzavřená dne {{DATUM}}

═══════════════════════════════════════════════════

SMLUVNÍ STRANY

Poskytovatel licence:
Vojtěch Vojkovský, hudební producent
Obchodní název: VOODOO808
Kontakt: info@voodoo808.com
Web: voodoo808.com
(dále jen „Poskytovatel")

Nabyvatel licence:
Právní jméno: {{PRAVNI_JMENO}}
Umělecké jméno: {{UMELECKE_JMENO}}
Adresa trvalého bydliště: {{ADRESA}}
(dále jen „Nabyvatel")

═══════════════════════════════════════════════════

PŘEDMĚT SMLOUVY

Název díla (beatu): {{BEAT_NAZEV}}
Cena licence: {{CENA}}
Formát: WAV (stereo mix) + Trackout Stems (jednotlivé stopy)

═══════════════════════════════════════════════════

ROZSAH LICENCE

Nabyvatel je oprávněn:

a) Použít dílo jako hudební podklad pro vlastní skladby a nahrávky
b) Distribuovat výsledné dílo na všech streamovacích platformách bez omezení
c) Používat dílo pro komerční i nekomerční účely, včetně placené reklamy
d) Synchronizovat dílo s audiovizuálními díly (videoklipy, filmy, reklamy, reels, stories)
e) Pracovat s jednotlivými stopy (stems) pro účely mixování a masteringu
f) Provádět rozsáhlé úpravy díla pro tvorbu vlastní skladby

Nabyvatel není oprávněn:

a) Prodávat, sublicencovat ani jinak převádět tato licenční práva na třetí osoby
b) Registrovat hudební dílo nebo jeho části jako svůj vlastní autorský copyright
c) Uplatňovat Content ID nároky vztahující se k tomuto beatu
d) Sdílet ani zveřejňovat obdržené stems třetím osobám

POVAHA LICENCE

Tato licence je nevýhradní. Poskytovatel si vyhrazuje právo toto hudební dílo dále licencovat třetím osobám.

═══════════════════════════════════════════════════

AUTORSKÁ PRÁVA

Všechna autorská práva k hudebnímu dílu zůstávají výhradně Poskytovateli.
Nabyvatel je povinen uvést Poskytovatele jako autora hudby:
Prod. by VOODOO808

═══════════════════════════════════════════════════

PLATEBNÍ PODMÍNKY

Licenční poplatek ve výši {{CENA}} byl uhrazen prostřednictvím platební brány GoPay dne {{DATUM}}.

═══════════════════════════════════════════════════

ZÁVĚREČNÁ USTANOVENÍ

Tato smlouva se řídí právním řádem České republiky, zákonem č. 121/2000 Sb. Je platná v elektronické podobě.

Za Poskytovatele:                    Za Nabyvatele:
VOODOO808 / Vojtěch Vojkovský        {{PRAVNI_JMENO}}
info@voodoo808.com                   (umělecky: {{UMELECKE_JMENO}})

Datum: {{DATUM}}');

INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
VALUES ('Výhradní licence', 'Výhradní (exclusive) licence. Beat bude stažen z prodeje. Zahrnuje WAV, Stems a MIDI.', 4999.00, '{WAV,Stems,MIDI}', 'Výhradní licence – beat je odebrán z prodeje a licencován výhradně Nabyvateli.', true, true, 'LICENČNÍ SMLOUVA K HUDEBNÍMU DÍLU
Výhradní licence (Exclusive)

Smlouva uzavřená dne {{DATUM}}

═══════════════════════════════════════════════════

SMLUVNÍ STRANY

Poskytovatel licence:
Vojtěch Vojkovský, hudební producent
Obchodní název: VOODOO808
Kontakt: info@voodoo808.com
Web: voodoo808.com
(dále jen „Poskytovatel")

Nabyvatel licence:
Právní jméno: {{PRAVNI_JMENO}}
Umělecké jméno: {{UMELECKE_JMENO}}
Adresa trvalého bydliště: {{ADRESA}}
(dále jen „Nabyvatel")

═══════════════════════════════════════════════════

PŘEDMĚT SMLOUVY

Název díla (beatu): {{BEAT_NAZEV}}
Cena licence: {{CENA}}
Formát: WAV (stereo mix) + Trackout Stems + MIDI soubory

═══════════════════════════════════════════════════

VÝHRADNOST LICENCE

Poskytovatel se touto smlouvou zavazuje, že toto hudební dílo nebude dále licencovat žádným dalším třetím osobám. Beat bude stažen z prodeje na webu VOODOO808.com a dalších platformách do 48 hodin od uzavření smlouvy.

═══════════════════════════════════════════════════

ROZSAH LICENCE

Nabyvatel je oprávněn:

a) Výhradně a neomezeně užívat dílo pro vlastní skladby a nahrávky
b) Distribuovat výsledné dílo na všech streamovacích platformách bez omezení počtu přehrání
c) Používat dílo pro veškeré komerční i nekomerční účely
d) Synchronizovat dílo s audiovizuálními díly bez omezení
e) Pracovat s jednotlivými stopy (stems) a MIDI soubory
f) Provádět libovolné úpravy díla

Nabyvatel není oprávněn:

a) Prodávat ani převádět tato licenční práva třetím osobám
b) Registrovat samotný beat (bez vlastní tvorby) jako autorské dílo

═══════════════════════════════════════════════════

AUTORSKÁ PRÁVA

Autorská práva k hudebnímu dílu zůstávají Poskytovateli. Nabyvatel uvede Poskytovatele jako autora hudby:
Prod. by VOODOO808

═══════════════════════════════════════════════════

PLATEBNÍ PODMÍNKY

Licenční poplatek ve výši {{CENA}} byl uhrazen prostřednictvím platební brány GoPay dne {{DATUM}}.

═══════════════════════════════════════════════════

ZÁVĚREČNÁ USTANOVENÍ

Tato smlouva se řídí právním řádem České republiky, zákonem č. 121/2000 Sb. Je platná v elektronické podobě.

Za Poskytovatele:                    Za Nabyvatele:
VOODOO808 / Vojtěch Vojkovský        {{PRAVNI_JMENO}}
info@voodoo808.com                   (umělecky: {{UMELECKE_JMENO}})

Datum: {{DATUM}}');

