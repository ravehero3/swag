import React, { useState } from "react";
import { Play, Pause, Users, Mail, TrendingUp, Info, Zap, Clock, ShieldCheck } from "lucide-react";

interface Journey {
  id: number;
  name: string;
  status: string;
  trigger_type: string;
  trigger_value?: string;
  description?: string;
  activeEnrollments?: number;
  completedEnrollments?: number;
  emailsSent?: number;
  stepCount?: number;
  emails?: any[];
}

interface JourneyListProps {
  journeys: Journey[];
  selectedJourneyId: number | null;
  onSelectJourney: (id: number) => void;
  onStatusChange: (id: number, newStatus: string) => void;
}

interface TriggerDetails {
  category: string;
  categoryColor: string;
  categoryBg: string;
  icon: string;
  triggerTitle: string;
  triggerExplanation: string;
  targetAudience: string;
  whatItDoes: string;
  timing: string;
  tip?: string;
}

export function getJourneyTriggerDetails(journey: Journey): TriggerDetails {
  const name = (journey.name || "").toLowerCase();
  const trigger = (journey.trigger_type || "").toLowerCase();
  const val = (journey.trigger_value || "").toLowerCase();

  // 1. Transakční systémové e-maily
  if (trigger === "order_created" || val === "order_created" || name.includes("order confirmation") || name.includes("potvrzení objednávky")) {
    return {
      category: "⚡ TRANSAKČNÍ SYSTÉM",
      categoryColor: "#5dd65d",
      categoryBg: "rgba(93, 214, 93, 0.12)",
      icon: "⚡",
      triggerTitle: "Okamžitě po úspěšné platbě objednávky",
      triggerExplanation: "Spustí se v reálném čase (0 sekund po platbě), jakmile zákazník uhradí objednávku přes platební bránu GoPay nebo převodem na voodoo808.com.",
      targetAudience: "Každý platící zákazník (beat, sound kit, mixing)",
      whatItDoes: "Odešle oficiální shrnutí objednávky, soupis zakoupených položek, platební metodu a poděkování. Tento e-mail nelze odhlásit.",
      timing: "Ihned (0s po platbě)",
      tip: "Kritický systémový e-mail zajišťující okamžitou důvěru kupujícího.",
    };
  }

  if (trigger === "digital_license_ready" || val === "digital_license_ready" || name.includes("license delivery") || name.includes("doručení licence")) {
    return {
      category: "⚡ TRANSAKČNÍ SYSTÉM",
      categoryColor: "#5dd65d",
      categoryBg: "rgba(93, 214, 93, 0.12)",
      icon: "🔓",
      triggerTitle: "Po vygenerování licence a odkazů ke stažení",
      triggerExplanation: "Aktivuje se v momentě, kdy systém automaticky vygeneruje licenční smlouvu a zabezpečené časově neomezené download linky na soubory.",
      targetAudience: "Kupující beatů a stahovatelé s nárokem na licenční certifikát",
      whatItDoes: "Doručí PDF licenční smlouvu s rozsahem práv (streamy, distribuce, monetizace) a přímé odkazy na WAV / MP3 / Trackouty.",
      timing: "Ihned po vygenerování licence",
      tip: "Právní ochrana pro interpreta i producenta.",
    };
  }

  if (trigger === "invoice_ready" || val === "invoice_ready" || name.includes("invoice") || name.includes("faktura")) {
    return {
      category: "⚡ TRANSAKČNÍ SYSTÉM",
      categoryColor: "#5dd65d",
      categoryBg: "rgba(93, 214, 93, 0.12)",
      icon: "🧾",
      triggerTitle: "Vystavení daňového dokladu / faktury",
      triggerExplanation: "Spustí se automaticky, jakmile systém vytvoří oficiální fakturu a daňový doklad k zaplacené objednávce.",
      targetAudience: "Všichni nakupující (plátci i neplátci pro účetní evidenci)",
      whatItDoes: "Odešle PDF fakturu s platebními údaji a rekapitulací DPH pro účetnictví zákazníka.",
      timing: "Ihned po vystavení faktury",
      tip: "Povinný účetní doklad zasílaný v souladu se zákonem.",
    };
  }

  // 2. Welcome sekvence (nový odběratel / registrace)
  if (trigger === "subscriber_created" || name.includes("welcome") || name.includes("uvítací")) {
    return {
      category: "🚀 ONBOARDING NOVÁČKA",
      categoryColor: "#0B99FC",
      categoryBg: "rgba(11, 153, 252, 0.12)",
      icon: "👋",
      triggerTitle: "Přihlášení k newsletteru / vytvoření účtu",
      triggerExplanation: "Spustí se automaticky, jakmile nový návštěvník zadá svůj e-mail do newsletteru na webu nebo si vytvoří nový zákaznický účet.",
      targetAudience: "Všichni nově zaregistrovaní odběratelé",
      whatItDoes: "Přivítá nového člena komunity, představí producenta VOODOO808, unikátní dark trap / 808 sound a nasměruje k poslechu top beatů.",
      timing: "1. e-mail ihned po potvrzení odběru",
      tip: "Klíčový e-mail pro vytvoření skvělého prvního dojmu a budování vztahu.",
    };
  }

  // 3. Freebie download (Free 808 Kit, Free Beat, Free Sound Kit)
  if (trigger === "freebie_downloaded" || trigger === "free_download" || name.includes("free") || name.includes("zdarma") || name.includes("808 kit")) {
    if (val === "beat" || name.includes("beat")) {
      return {
        category: "🎤 RAPPER FUNNEL",
        categoryColor: "#a855f7",
        categoryBg: "rgba(168, 85, 247, 0.12)",
        icon: "🎤",
        triggerTitle: "Stažení beatu zdarma (Free Beat)",
        triggerExplanation: "Spustí se ve chvíli, kdy interpret zadá svůj e-mail za účelem stažení volného beatu pro nahrávání vokálů.",
        targetAudience: "Rappeři, zpěváci a nezávislí hudební tvůrci",
        whatItDoes: "Doručí MP3 beatu → po 2 dnech se zeptá, jak se na beat píše text → po 5 dnech nabídne 20% slevu na plnou komerční WAV licenci.",
        timing: "1. e-mail ihned, poté po 2 a 5 dnech",
        tip: "Přirozeně konvertuje stahovače bezplatné verze na platící interprety.",
      };
    }
    if (val === "kit" || name.includes("sound kit") || name.includes("808 kit")) {
      return {
        category: "🎛️ PRODUCER FUNNEL",
        categoryColor: "#06b6d4",
        categoryBg: "rgba(6, 182, 212, 0.12)",
        icon: "🎛️",
        triggerTitle: "Stažení sound kitu zdarma (např. Free 808 Kit)",
        triggerExplanation: "Aktivuje se ihned, jakmile beatmaker nebo producent zadá svůj e-mail a stáhne bezplatný zvukový balíček samplů a 808s.",
        targetAudience: "Hudební producenti a beatmakeři",
        whatItDoes: "Odešle ZIP balíček → po 24 hodinách pošle producentský tip pro ladění a saturaci 808 basů → a představí prémiové placené sound kity.",
        timing: "Ihned doručení, poté tip po 24h a nabídka po 3 dnech",
        tip: "Pokud mezitím producent nakoupí, prodejní krok se automaticky přeskočí.",
      };
    }
    return {
      category: "🎁 FREEBIE FUNNEL",
      categoryColor: "#06b6d4",
      categoryBg: "rgba(6, 182, 212, 0.12)",
      icon: "🎁",
      triggerTitle: "Stažení libovolného bezplatného obsahu",
      triggerExplanation: "Spustí se po odeslání formuláře pro stažení bezplatného souboru výměnou za e-mailový kontakt.",
      targetAudience: "Uživatelé se zájmem o bezplatný produkt",
      whatItDoes: "Doručí slíbené soubory ke stažení a v navazujících zprávách představí možnosti prémiové tvorby VOODOO808.",
      timing: "Ihned po odeslání formuláře",
    };
  }

  // 4. Abandoned Checkout
  if (trigger === "abandoned_checkout" || trigger === "abandoned_cart" || name.includes("abandoned") || name.includes("košík")) {
    return {
      category: "🛒 ZÁCHRANA OPUŠTĚNÉHO KOŠÍKU",
      categoryColor: "#f59e0b",
      categoryBg: "rgba(245, 158, 11, 0.12)",
      icon: "🛒",
      triggerTitle: "Opuštění košíku nebo rozpracované pokladny",
      triggerExplanation: "Spustí se, když zákazník vloží beat nebo kit do košíku, zadá v pokladně svůj e-mail, ale neodešle platbu na platební bráně.",
      targetAudience: "Zákazníci, kteří nedokončili nákup do 1–2 hodin",
      whatItDoes: "Po 1–2 hodinách pošle přátelské připomenutí s odkazem pro obnovení košíku jedním kliknutím; po 24 hodinách může nabídnout slevový impuls.",
      timing: "1. e-mail po 1–2h, 2. e-mail po 24h",
      tip: "Zachraňuje až 15–20 % neuskutečněných nákupů.",
    };
  }

  // 5. Browse Abandonment
  if (trigger === "page_view_no_action" || name.includes("browse")) {
    return {
      category: "👀 PROHLÍŽENÍ BEZ NÁKUPU",
      categoryColor: "#eab308",
      categoryBg: "rgba(234, 179, 8, 0.12)",
      icon: "👀",
      triggerTitle: "Zájemce si prohlíží beat bez nákupu",
      triggerExplanation: "Spustí se, když přihlášený odběratel navštíví stránku konkrétního beatu nebo kitu, poslechne si ukázku, ale nevloží produkt do košíku.",
      targetAudience: "Odběratelé se zájmem o poslech skladeb",
      whatItDoes: "Připomene prohlížený beat, zobrazí BPM, tóninu, náladu skladby a nabídne rychlé opětovné přehrání ukázky.",
      timing: "4 hodiny po odchodu z produktové stránky",
      tip: "Reaktivuje zájemce dříve, než na skladbu zapomenou.",
    };
  }

  // 6. Post purchase / Order completed
  if (trigger === "order_completed" || trigger === "purchase" || name.includes("po nákupu") || name.includes("post-purchase")) {
    return {
      category: "🛍️ PÉČE PO NÁKUPU",
      categoryColor: "#10b981",
      categoryBg: "rgba(16, 185, 129, 0.12)",
      icon: "🛍️",
      triggerTitle: "Dokončení a uhrazení jakékoli objednávky",
      triggerExplanation: "Spustí se po úspěšném zaplacení objednávky zákazníkem. Slouží k péči, zjištění spokojenosti a doporučení souvisejících věcí.",
      targetAudience: "Platící zákazníci po nákupu",
      whatItDoes: "Poděkuje za podporu, ověří, zda soubory fungují bez problémů, a po několika dnech nabídne věrnostní slevu na další tvorbu.",
      timing: "1 až 3 dny po zaplacení",
      tip: "Zvyšuje spokojenost a motivuje k opakovaným nákupům.",
    };
  }

  // 7. Upsell & Cross-sell by product type
  if (trigger === "has_purchased") {
    if (val === "beat" || name.includes("beat")) {
      return {
        category: "📈 UPGRADE LICENCE BEATU",
        categoryColor: "#ec4899",
        categoryBg: "rgba(236, 72, 153, 0.12)",
        icon: "📈",
        triggerTitle: "Zakoupení licence na beat (MP3 nebo WAV)",
        triggerExplanation: "Spustí se zákazníkovi, který si koupil beat, s cílem nabídnout mu přechod na vyšší licenci (např. Trackouty nebo Unlimited).",
        targetAudience: "Kupující beatů s nižší licencí",
        whatItDoes: "Zajímá se o stav nahrávání tracku, nabídne možnost repostu na sociální sítě a poskytne slevu na doplatek neomezené licence.",
        timing: "3 až 7 dní po nákupu beatu",
        tip: "Ideální pro interprety chystající vydání na Spotify.",
      };
    }
    if (val === "kit" || name.includes("kit")) {
      return {
        category: "🔀 CROSS-SELL SOUND KITŮ",
        categoryColor: "#f43f5e",
        categoryBg: "rgba(244, 63, 94, 0.12)",
        icon: "🔀",
        triggerTitle: "Zakoupení bicího kitu / sound kitu",
        triggerExplanation: "Aktivuje se po nákupu zvukové banky pro doporučení doplňkového balíčku (např. loop pack nebo melodie).",
        targetAudience: "Producenti, kteří právě nakoupili sound kit",
        whatItDoes: "Doporučí perfektně ladící melodický balíček se slevovým kupónem platným 48 hodin.",
        timing: "2 dny po nákupu kitu",
      };
    }
  }

  // 8. Tag-based content series (role:rapper, role:producer)
  if (trigger === "has_tag" || trigger === "tag_added") {
    if (val.includes("rapper") || name.includes("rapper")) {
      return {
        category: "🎙️ OBSAHOVÁ SÉRIE (RAP)",
        categoryColor: "#8b5cf6",
        categoryBg: "rgba(139, 92, 246, 0.12)",
        icon: "🎙️",
        triggerTitle: "Přiřazení štítku role:rapper",
        triggerExplanation: "Spustí se kontaktům, které jsou označené jako rappeři nebo zpěváci.",
        targetAudience: "Interpreti s přiřazeným štítkem role:rapper",
        whatItDoes: "Pravidelně odesílá praktické tipy: jak nahrávat vokály doma, jak dostat skladbu do Spotify playlistů, marketing pro hudebníky + exkluzivní beat dropy.",
        timing: "Týdenní obsahová série",
        tip: "Buduje dlouhodobou komunitu aktivních interpretů.",
      };
    }
    if (val.includes("producer") || name.includes("producer")) {
      return {
        category: "🎹 OBSAHOVÁ SÉRIE (PRODUKCE)",
        categoryColor: "#3b82f6",
        categoryBg: "rgba(59, 130, 246, 0.12)",
        icon: "🎹",
        triggerTitle: "Přiřazení štítku role:producer",
        triggerExplanation: "Spustí se kontaktům označeným jako hudební producenti a beatmakeři.",
        targetAudience: "Producenti se štítkem role:producer",
        whatItDoes: "Pravidelně posílá tutoriály do DAW, breakdowns aranží, tipy na tvrdé bicí a rady, jak začít prodávat beaty online.",
        timing: "Týdenní obsahová série",
        tip: "Vytváří silné pouto v producentské komunitě.",
      };
    }
    return {
      category: "🏷️ SEGMENT DLE ŠTÍTKU",
      categoryColor: "#8b5cf6",
      categoryBg: "rgba(139, 92, 246, 0.12)",
      icon: "🏷️",
      triggerTitle: `Přiřazení štítku: ${journey.trigger_value || "kontakt"}`,
      triggerExplanation: `Spustí se automaticky v okamžiku, kdy je kontaktu přiřazen štítek ${journey.trigger_value || ""}.`,
      targetAudience: `Kontakty se štítkem ${journey.trigger_value || ""}`,
      whatItDoes: journey.description || "Odesílá cílenou sérii e-mailů určenou pro tento specifický segment kontaktů.",
      timing: "Ihned po přiřazení štítku",
    };
  }

  // Obecný fallback
  return {
    category: "⚙️ AUTOMATIZOVANÁ JOURNEY",
    categoryColor: "#0B99FC",
    categoryBg: "rgba(11, 153, 252, 0.12)",
    icon: "⚙️",
    triggerTitle: `Spouštěč: ${journey.trigger_type || "Automatická událost"}`,
    triggerExplanation: journey.description || "Tato sekvence se spustí automaticky na základě definované akce kontaktu na webu.",
    targetAudience: "Odběratelé splňující podmínky spuštění",
    whatItDoes: journey.description || "Odesílá předem nastavené kroky a e-maily.",
    timing: "Dle nastavených prodlev v sekvenci",
  };
}

export default function JourneyList({
  journeys,
  selectedJourneyId,
  onSelectJourney,
  onStatusChange,
}: JourneyListProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [hoveredJourney, setHoveredJourney] = useState<Journey | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const TRIGGER_ICONS: Record<string, string> = {
    free_download: "🎁",
    freebie_downloaded: "🎁",
    purchase: "💳",
    has_purchased: "🛍️",
    order_completed: "🛍️",
    order_created: "⚡",
    digital_license_ready: "🔓",
    invoice_ready: "🧾",
    abandoned_cart: "🛒",
    abandoned_checkout: "🛒",
    user_signup: "👋",
    subscriber_created: "👋",
    tag_added: "🏷️",
    has_tag: "🏷️",
    page_view_no_action: "👀",
    custom: "⚙️",
  };

  const getTriggerCzechLabel = (journey: Journey): string => {
    const type = journey.trigger_type;
    const val = (journey.trigger_value || "").toLowerCase();

    if (val === "order_created" || type === "order_created") return "Potvrzení objednávky";
    if (val === "digital_license_ready" || type === "digital_license_ready") return "Doručení licence";
    if (val === "invoice_ready" || type === "invoice_ready") return "Faktura & doklad";

    if (type === "subscriber_created" || type === "user_signup") return "Nový odběratel";
    if (type === "freebie_downloaded" || type === "free_download") {
      return val === "beat" ? "Stažení free beatu" : val === "kit" ? "Stažení free kitu" : "Stažení freebie";
    }
    if (type === "abandoned_checkout" || type === "abandoned_cart") return "Opuštěný košík";
    if (type === "page_view_no_action") return "Prohlížení webu";
    if (type === "has_purchased") {
      return val === "beat" ? "Nákup beatu (upsell)" : val === "kit" ? "Nákup kitu (cross-sell)" : "Nákup produktu";
    }
    if (type === "order_completed" || type === "purchase") return "Po dokončení nákupu";
    if (type === "has_tag" || type === "tag_added") {
      return val ? `Štítek: ${val}` : "Přiřazen štítek";
    }
    return type || "Automatický trigger";
  };

  const isTransactional = (journey: Journey): boolean => {
    const val = (journey.trigger_value || "").toLowerCase();
    const type = (journey.trigger_type || "").toLowerCase();
    return val === "order_created" || val === "digital_license_ready" || val === "invoice_ready" ||
           type === "order_created" || type === "digital_license_ready" || type === "invoice_ready";
  };

  const handleMouseEnter = (journey: Journey, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cardWidth = 360;
    const estimatedHeight = 360;

    // Prefer placing to the right of the journey list (right side of 400px panel)
    let left = rect.right + 12;
    // If not enough space on right, flip to left
    if (left + cardWidth > window.innerWidth - 16) {
      left = Math.max(16, rect.left - cardWidth - 12);
    }

    // Align vertically with item, keep within viewport
    let top = rect.top - 10;
    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - estimatedHeight - 16);
    }
    if (top < 16) top = 16;

    setHoveredId(journey.id);
    setHoveredJourney(journey);
    setTooltipPos({ top, left });
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setHoveredJourney(null);
    setTooltipPos(null);
  };

  return (
    <div style={{ marginBottom: "24px" }} onMouseLeave={handleMouseLeave}>
      <style>{`
        @keyframes journeyTooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(3px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            📧 Všechny Journeys
          </h3>
          <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>
            {journeys.length} automatizac{journeys.length === 1 ? "e" : journeys.length < 5 ? "e" : "í"} • Najeď myší pro vysvětlení triggeru
          </p>
        </div>
      </div>

      {/* Minimalist List */}
      <div style={{ borderRadius: "6px", border: "1px solid #222", overflow: "hidden", background: "#0a0a0a" }}>
        {journeys.length === 0 ? (
          <div style={{ padding: "20px 16px", textAlign: "center", color: "#666", fontSize: "12px" }}>
            Žádné journeys k zobrazení
          </div>
        ) : (
          journeys.map((journey) => {
            const isSelected = selectedJourneyId === journey.id;
            const isHovered = hoveredId === journey.id;
            const transactional = isTransactional(journey);

            return (
              <div
                key={journey.id}
                onMouseEnter={(e) => handleMouseEnter(journey, e)}
                onClick={() => onSelectJourney(journey.id)}
                style={{
                  padding: "12px 14px",
                  background: isSelected ? "rgba(11, 153, 252, 0.08)" : isHovered ? "#141414" : "transparent",
                  border: isSelected ? "1px solid #0B99FC" : isHovered ? "1px solid #333" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "background 120ms ease, border-color 120ms ease",
                  borderBottom: journey.id !== journeys[journeys.length - 1].id ? "1px solid #141414" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  position: "relative",
                }}
              >
                {/* Status Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(journey.id, journey.status === "active" ? "paused" : "active");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    background: journey.status === "active" ? "#24e05320" : "#f9a82520",
                    border: `1px solid ${journey.status === "active" ? "#24e053" : "#f9a825"}`,
                    color: journey.status === "active" ? "#24e053" : "#f9a825",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    padding: 0,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  }}
                  title={journey.status === "active" ? "Pozastavit journey" : "Aktivovat journey"}
                >
                  {journey.status === "active" ? <Pause size={12} /> : <Play size={12} />}
                </button>

                {/* Journey Name & Trigger */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "3px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isSelected ? "#0B99FC" : "#fff",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {journey.name}
                    </div>

                    {transactional ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          background: "#122a15",
                          border: "1px solid #2d6d33",
                          borderRadius: "3px",
                          padding: "1px 6px",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "#5dd65d",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        ⚡ Transakční
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "9px",
                          color: isHovered ? "#0B99FC" : "#444",
                          background: isHovered ? "rgba(11, 153, 252, 0.12)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isHovered ? "rgba(11, 153, 252, 0.35)" : "#222"}`,
                          borderRadius: "3px",
                          padding: "1px 5px",
                          whiteSpace: "nowrap",
                          transition: "all 120ms ease",
                          flexShrink: 0,
                        }}
                      >
                        ℹ️ spouštěč
                      </div>
                    )}
                  </div>

                  {/* Trigger subtitle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: isHovered ? "#999" : "#666" }}>
                    <span>{TRIGGER_ICONS[journey.trigger_type] || "⚙️"}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getTriggerCzechLabel(journey)}
                    </span>
                  </div>
                </div>

                {/* Metrics Mini */}
                <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "#666", whiteSpace: "nowrap", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }} title="Aktivně zařazení odběratelé">
                    <Users size={11} color={journey.activeEnrollments ? "#24e053" : "#555"} />
                    <span style={{ color: journey.activeEnrollments ? "#24e053" : "#666", fontWeight: journey.activeEnrollments ? 600 : 400 }}>
                      {journey.activeEnrollments || 0}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }} title="Odeslané e-maily">
                    <Mail size={11} />
                    <span>{journey.emailsSent || 0}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Hover Trigger Explanation Modal ────────────────────────────────────── */}
      {hoveredJourney && tooltipPos && (() => {
        const details = getJourneyTriggerDetails(hoveredJourney);
        return (
          <div
            style={{
              position: "fixed",
              top: tooltipPos.top,
              left: tooltipPos.left,
              width: "350px",
              background: "rgba(10, 10, 13, 0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              padding: "16px",
              zIndex: 999999,
              pointerEvents: "none",
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.9), 0 0 24px rgba(11, 153, 252, 0.15)",
              animation: "journeyTooltipFadeIn 140ms cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* Top Row: Category Pill & Status Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: details.categoryBg,
                  border: `1px solid ${details.categoryColor}40`,
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: details.categoryColor,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <span>{details.icon}</span>
                <span>{details.category}</span>
              </div>

              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background:
                    hoveredJourney.status === "active"
                      ? "#24e05315"
                      : hoveredJourney.status === "paused"
                      ? "#f9a82515"
                      : "#55555520",
                  color:
                    hoveredJourney.status === "active"
                      ? "#24e053"
                      : hoveredJourney.status === "paused"
                      ? "#f9a825"
                      : "#888",
                  border: `1px solid ${
                    hoveredJourney.status === "active"
                      ? "#24e05340"
                      : hoveredJourney.status === "paused"
                      ? "#f9a82540"
                      : "#55555540"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "7px" }}>
                  {hoveredJourney.status === "active" ? "●" : hoveredJourney.status === "paused" ? "⏸" : "○"}
                </span>
                {hoveredJourney.status === "active"
                  ? "Aktivní"
                  : hoveredJourney.status === "paused"
                  ? "Pozastaveno"
                  : "Návrh (Draft)"}
              </div>
            </div>

            {/* Journey Title */}
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "12px", lineHeight: 1.35 }}>
              {hoveredJourney.name}
            </div>

            {/* Highlighted Trigger Box */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderLeft: `3px solid ${details.categoryColor}`,
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: details.categoryColor,
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                <span>🎯</span>
                <span>Kdy se tato journey spustí?</span>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#eee", marginBottom: "4px" }}>
                {details.triggerTitle}
              </div>
              <div style={{ fontSize: "11px", color: "#aaa", lineHeight: 1.45 }}>
                {details.triggerExplanation}
              </div>
            </div>

            {/* Target Audience */}
            <div style={{ marginBottom: "10px" }}>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "2px",
                }}
              >
                👥 Cílová skupina (kdo vstoupí)
              </div>
              <div style={{ fontSize: "11px", color: "#ddd", lineHeight: 1.4 }}>
                {details.targetAudience}
              </div>
            </div>

            {/* What it does */}
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "2px",
                }}
              >
                📬 Co tato automatizace dělá
              </div>
              <div style={{ fontSize: "11px", color: "#bbb", lineHeight: 1.45 }}>
                {details.whatItDoes}
              </div>
            </div>

            {/* Tip or Note */}
            {details.tip && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#888",
                  marginBottom: "10px",
                  borderTop: "1px solid #1a1a1a",
                  paddingTop: "8px",
                  lineHeight: 1.4,
                }}
              >
                💡 <span style={{ color: "#aaa" }}>{details.tip}</span>
              </div>
            )}

            {/* Footer metrics bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#050505",
                border: "1px solid #1a1a1a",
                borderRadius: "5px",
                padding: "6px 10px",
                fontSize: "10px",
                color: "#666",
              }}
            >
              <div>
                <span style={{ color: "#888" }}>Časování:</span>{" "}
                <span style={{ color: "#bbb" }}>{details.timing}</span>
              </div>
              <div>
                <span style={{ color: "#888" }}>Kroků:</span>{" "}
                <span style={{ color: "#fff", fontWeight: 600 }}>{hoveredJourney.stepCount || 1}</span>
              </div>
              <div>
                <span style={{ color: "#888" }}>Běží:</span>{" "}
                <span style={{ color: "#24e053", fontWeight: 600 }}>
                  {hoveredJourney.activeEnrollments || 0}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
