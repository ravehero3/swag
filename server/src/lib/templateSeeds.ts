/**
 * Template Seed Data - Auto-creates all 20 email templates on first run
 * All templates wrapped in professional HTML with VOODOO808 branding
 * Metadata includes: category, journey_name, step_position, is_recommended
 */

// Professional email wrapper function
const createEmailHTML = (content: string, templateName: string): string => `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #2a2a2a;
            background: #0f0f0f;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 20px auto;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        
        /* Header */
        .email-header {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            padding: 32px 24px;
            text-align: center;
            border-bottom: 2px solid #E11D48;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 900;
            color: #E11D48;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 4px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .logo-subtitle {
            font-size: 11px;
            color: #888;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-weight: 500;
        }
        
        /* Body Content */
        .email-body {
            padding: 32px 24px;
            background: #1a1a1a;
            color: #ddd;
        }
        
        .email-body p {
            margin-bottom: 16px;
            font-size: 14px;
            line-height: 1.8;
            color: #ccc;
        }
        
        .email-body strong {
            font-weight: 700;
            color: #E11D48;
        }
        
        .email-body ol,
        .email-body ul {
            margin: 16px 0 16px 24px;
            font-size: 14px;
            line-height: 1.8;
            color: #2a2a2a;
        }
        
        .email-body li {
            margin-bottom: 12px;
        }
        
        .email-body li strong {
            display: inline-block;
            margin-right: 4px;
            color: #E11D48;
        }
        
        /* Call-to-Action */
        .cta-button {
            display: inline-block !important;
            background: #E11D48 !important;
            color: #ffffff !important;
            padding: 14px 28px !important;
            text-decoration: none !important;
            border-radius: 6px !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            text-align: center !important;
            margin: 16px 0 !important;
            transition: all 200ms !important;
            border: 1px solid #E11D48 !important;
        }
        
        .cta-button:hover {
            background: #C91640 !important;
            border-color: #C91640 !important;
        }
        
        /* Alternate CTA colors */
        .cta-green {
            background: #10B981 !important;
            border-color: #10B981 !important;
        }
        
        .cta-green:hover {
            background: #059669 !important;
            border-color: #059669 !important;
        }
        
        .cta-blue {
            background: #2563EB !important;
            border-color: #2563EB !important;
        }
        
        .cta-blue:hover {
            background: #1D4ED8 !important;
            border-color: #1D4ED8 !important;
        }
        
        .cta-orange {
            background: #EA580C !important;
            border-color: #EA580C !important;
        }
        
        .cta-orange:hover {
            background: #C2470A !important;
            border-color: #C2470A !important;
        }
        
        .cta-amber {
            background: #F59E0B !important;
            border-color: #F59E0B !important;
            color: #1a1a1a !important;
        }
        
        .cta-amber:hover {
            background: #D97706 !important;
            border-color: #D97706 !important;
        }
        
        .cta-purple {
            background: #8B5CF6 !important;
            border-color: #8B5CF6 !important;
        }
        
        .cta-purple:hover {
            background: #7C3AED !important;
            border-color: #7C3AED !important;
        }
        
        .cta-indigo {
            background: #6366F1 !important;
            border-color: #6366F1 !important;
        }
        
        .cta-indigo:hover {
            background: #4F46E5 !important;
            border-color: #4F46E5 !important;
        }
        
        .cta-red {
            background: #EF4444 !important;
            border-color: #EF4444 !important;
        }
        
        .cta-red:hover {
            background: #DC2626 !important;
            border-color: #DC2626 !important;
        }
        
        /* Footer */
        .email-footer {
            background: #0f0f0f;
            padding: 24px;
            border-top: 1px solid #333;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .email-footer-text {
            margin-bottom: 12px;
            line-height: 1.6;
        }
        
        .email-footer-divider {
            height: 1px;
            background: #e0e0e0;
            margin: 12px 0;
        }
        
        .email-footer-links {
            font-size: 11px;
            color: #999;
        }
        
        .email-footer-links a {
            color: #E11D48;
            text-decoration: none;
        }
        
        .email-footer-links a:hover {
            text-decoration: underline;
        }
        
        /* Highlights and sections */
        .highlight-box {
            background: rgba(225, 29, 72, 0.1);
            border-left: 4px solid #E11D48;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
        }
        
        .highlight-box p {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: #ccc;
        }
        
        /* Responsive */
        @media (max-width: 640px) {
            .email-wrapper {
                border: none;
            }
            
            .email-header {
                padding: 24px 16px;
            }
            
            .email-body {
                padding: 24px 16px;
            }
            
            .email-body p {
                font-size: 13px;
            }
            
            .cta-button {
                width: 100% !important;
                padding: 12px 16px !important;
                font-size: 12px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <!-- Header -->
        <div class="email-header">
            <div class="logo">🎹 VOODOO808</div>
            <div class="logo-subtitle">Beat Production & Sound Design</div>
        </div>
        
        <!-- Body -->
        <div class="email-body">
            ${content}
        </div>
        
        <!-- Footer -->
        <div class="email-footer">
            <div class="email-footer-text">
                © 2024 VOODOO808. Všechna práva vyhrazena.
            </div>
            <div class="email-footer-divider"></div>
            <div class="email-footer-text">
                <strong>Kontakt:</strong><br>
                Email: <a href="mailto:info@voodoo808.cz" style="color: #E11D48; text-decoration: none;">info@voodoo808.cz</a>
            </div>
            <div class="email-footer-divider"></div>
            <div class="email-footer-links">
                Máte dotaz? Odpovězte přímo na tento email a rád vám pomůžu. 🙏
            </div>
        </div>
    </div>
</body>
</html>`;

export const TEMPLATE_SEEDS = [
  {
    name: "Free Beat Onboarding - Day 3",
    key: "free_beat_onboarding_day3",
    category: "onboarding",
    audience: "general",
    journey_name: "Free Beat Onboarding",
    step_position: 3,
    step_type: "email",
    is_recommended: true,
    sort_order: 1,
    subject: "Pojďme makat (20% sleva na vaši první exkluzivu)",
    preheader: "Stáhli jste si free beat. Teď je čas udělat oficiální věc.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Před pár dny jste u mě na webu stáhli ten free beat. Chtěl jsem se jen zeptat – už do toho něco píšete? Jestli máte hotový demo nebo nahráváte nějaký video ze studia na IG, určitě mě označte, chci slyšet, co vám v tý hlavě vzniká.</p>

      <p>Pokud chcete tenhle sound posunout dál, mít k dispozici kompletní stopy (stems) pro pořádnej mix a hlavně jistotu, že ten beat nikdo jinej nekoupí a zůstane navždycky jenom váš, je čas na exkluzivní licenci.</p>

      <p><strong>Chci vás podpořit, takže vám dávám kód FIRST20 na 20% slevu na jakoukoliv exkluzivitu z mýho katalogu.</strong></p>

      <p style="text-align: center;">
        <a href="{{site_url}}/beats" class="cta-button">Kouknout na exkluzivní beaty →</a>
      </p>

      <p>Vidíme se ve studiu,<br><strong>VOODOO808</strong></p>
    `, "Free Beat Onboarding"),
  },
  {
    name: "Free Kit Onboarding - Day 3",
    key: "free_kit_onboarding_day3",
    category: "onboarding",
    audience: "general",
    journey_name: "Free Sound Kit Onboarding",
    step_position: 3,
    step_type: "email",
    is_recommended: true,
    sort_order: 2,
    subject: "Posuňte svoji produkci dál (Sleva uvnitř) 🎹",
    preheader: "Jak vám sedí moje free zvuky v DAW?",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Jen kontroluju, jak vám jedou ty free zvuky, co jste u mě před pár dny stahovali. Sedí vám to dobře do mixu?</p>

      <p>Pokud vás už nebaví používat dokola ty stejné recyklované zvuky z internetu a chcete unikátní, fresh textury, ze kterých vznikají opravdové hity, musíte checknout moje prémiové kity. Žádná vata, jen 100% placement-ready soundy.</p>

      <p><strong>Chci vám pomoct nakopnout další session. Použijte kód PRODUCER20 a získejte 20% slevu na jakýkoliv prémiový sound kit nebo loop pack.</strong></p>

      <p style="text-align: center;">
        <a href="{{site_url}}/sound-kits" class="cta-button cta-green">Upgradovat banku zvuků →</a>
      </p>

      <p>Dělejte hudbu,<br><strong>VOODOO808</strong></p>
    `, "Free Kit Onboarding"),
  },
  {
    name: "Abandoned Checkout - Reminder",
    key: "abandoned_checkout_reminder",
    category: "recovery",
    audience: "general",
    journey_name: "Abandoned Checkout Recovery",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 3,
    subject: "Spadnul vám program? Nebo jste zapomněli na tohle?",
    preheader: "Váš rozdělanej projekt na vás čeká v košíku.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Všimnul jsem si, že vám v košíku zůstal viset pěknej leak. Chápu to – někdo vám zavolal, crashlo DAW nebo vás prostě něco vyrušilo mid-cookup.</p>

      <p>Nechal jsem vám košík schovanej. U exkluzivních licencí je to ale celkem risk, protože jakmile ten beat koupí někdo jinej, je navždycky pryč a já s tím už nic neudělám. Radši vám ho zatím držím.</p>

      <div class="highlight-box">
        <p>📦 Váš výběr: {{cart_items_summary}}</p>
      </div>

      <p style="text-align: center;">
        <a href="{{checkout_url}}" class="cta-button cta-orange">Dokončit objednávku a zamknout beat →</a>
      </p>

      <p>Zatím,<br><strong>VOODOO808</strong></p>
    `, "Abandoned Checkout Reminder"),
  },
  {
    name: "Abandoned Checkout - Scarcity",
    key: "abandoned_checkout_scarcity",
    category: "recovery",
    audience: "general",
    journey_name: "Abandoned Checkout Recovery",
    step_position: 2,
    step_type: "email",
    is_recommended: true,
    sort_order: 4,
    subject: "15% sleva – vaše poslední šance!",
    preheader: "Nenechte tenhle track proklouznout mezi prsty.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Fakt chci, abyste tenhle projekt dotáhli do konce. Exkluzivní beaty a kity u mě v komunitě mizí dost rychle a nemůžu vám tenhle nákup držet věčně.</p>

      <p><strong>Abyste to měli o něco víc easy, vygeneroval jsem vám speciální 15% slevu. Použijte v košíku kód SAVE15.</strong></p>

      <div class="highlight-box">
        <p>⏰ Pozor! Kód SAVE15 platí jenom 24 hodin, pak nadobro expiruje.</p>
      </div>

      <p style="text-align: center;">
        <a href="{{checkout_url}}?code=SAVE15" class="cta-button cta-amber">Uplatnit 15% slevu teď →</a>
      </p>

      <p>Pojďme na to,<br><strong>VOODOO808</strong></p>
    `, "Abandoned Checkout Scarcity"),
  },
  {
    name: "Browse Recovery - Day 1",
    key: "browse_recovery_day1",
    category: "browse_recovery",
    audience: "general",
    journey_name: "Browse Abandonment Recovery",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 5,
    subject: "Ten beat, co jste checkovali... 👀",
    preheader: "Vibe u věci {{product_name}} je šílenej.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Všimnul jsem si, že jste strávili delší dobu u projektu <strong>{{product_name}}</strong>. Tenhle kousek má neskutečnej bounce – upřímně je to jedna z mých nejoblíbenějších věcí z poslední doby.</p>

      <p>Máte už v hlavě nějakou konkrétní vizi nebo téma, co byste do toho dali? Pokud vás zajímají detaily ohledně trackoutů (jednotlivých stop) nebo smluvních podmínek exkluzivity, stačí odpovědět na tenhle mail.</p>

      <p style="text-align: center;">
        <a href="{{product_url}}" class="cta-button cta-blue">Poslechnout si {{product_name}} znovu →</a>
      </p>

      <p>Mír,<br><strong>VOODOO808</strong></p>
    `, "Browse Recovery Day 1"),
  },
  {
    name: "Browse Recovery - Day 3",
    key: "browse_recovery_day3",
    category: "browse_recovery",
    audience: "general",
    journey_name: "Browse Abandonment Recovery",
    step_position: 2,
    step_type: "email",
    is_recommended: true,
    sort_order: 6,
    subject: "Hledáte jinej vibe? Zkuste tyhle věci.",
    preheader: "Fresh sound vybraný podle vašeho vkusu.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Protože jste nedávno procházeli můj katalog, vytáhnul jsem pro vás z vaultu pár dalších věcí, které mají podobnou energii a mohly by vám sednout.</p>

      <p><strong>Tenhle 3 věci jsou momentálně nejvíc vyhledávané na webu:</strong></p>
      <ul>
        <li>🔥 {{recommendation_1}}</li>
        <li>🎹 {{recommendation_2}}</li>
        <li>⚡ {{recommendation_3}}</li>
      </ul>

      <p>Klikněte níže, naskočte zpátky na web a najděte ten správný sound pro váš projekt.</p>

      <p style="text-align: center;">
        <a href="{{site_url}}" class="cta-button cta-blue">Otevřít kompletní katalog →</a>
      </p>

      <p>Hned jsme zpátky,<br><strong>VOODOO808</strong></p>
    `, "Browse Recovery Day 3"),
  },
  {
    name: "Rapper Tips - Spotify Strategy",
    key: "rapper_tips_spotify",
    category: "nurture",
    audience: "rapper",
    journey_name: "Rapper Growth & Tips Series",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 7,
    subject: "Jak dostat vaše tracky do Spotify playlistů 📈",
    preheader: "Blueprint pro nezávislé CZ/SK interprety.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Můžete mít ty nejtvrdší bary a dokonalej mix, ale pokud váš track nikdo neuslyší, děláte to zbytečně. Dneska vám chci poslat rychlej návod, jak dostat vaši tvorbu do editorial a algorithmic playlistů na Spotify:</p>

      <ol>
        <li><strong>Pitchujte včas:</strong> Nahrajte a pitchujte track přes Spotify for Artists aspoň 3 až 4 týdny před releasem. Dá to kurátorům čas a hlavně to track automaticky hodí vašim followers do Release Radaru.</li>
        <li><strong>Tlačte traffic první dny:</strong> Prvních 48 hodin po releasu směřujte veškerou pozornost z IG, TikToku a YouTube čistě na Spotify link. Algoritmus miluje, když lidi přicházejí zvenčí.</li>
        <li><strong>Čistá metadata:</strong> Při pitchování přesně zadejte žánr, subžánry a náladu tracku. AI Spotify podle toho hledá správné posluchače.</li>
      </ol>

      <p><strong>Hledáte novej podklad, kterým odpálíte příští release?</strong> Skočte na web checknout nové exkluzivní beaty.</p>

      <p style="text-align: center;">
        <a href="{{site_url}}/beats" class="cta-button cta-green">Poslechnout nové beaty →</a>
      </p>

      <p>Makejte na sobě,<br><strong>VOODOO808</strong></p>
    `, "Rapper Tips Spotify"),
  },
  {
    name: "Producer Tips - Sound Design",
    key: "producer_tips_sound_design",
    category: "nurture",
    audience: "producer",
    journey_name: "Producer Growth & Tutorials Series",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 8,
    subject: "Jak dělám beaty (A mix tajemství na hard 808s)",
    preheader: "Udělejte si bicí, co proříznou každej master.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Hodně lidí se mě ptá, jak dělám, že moja bicí hrají tak tvrdě bez toho, aby to totálně clipovalo master fader. Dneska vám otevřu projekt a ukážu vám, jak jsem procesoval zvuky do mýho posledního kitu:</p>

      <ul>
        <li><strong>Soft Clipping je král:</strong> Místo limiteru na masteru zkus hodit soft clipper přímo na drum bus. Můžete pak tlačit hlasitost 808s a kicků do červenejch hodnot a vytvoří to příjemnou saturaci místo hnusnýho digitálního distortionu.</li>
        <li><strong>Paralelní komprese:</strong> Pošli kick a snare na aux stopu, tam je totálně rozbíj těžkým kompresorem a tuhle stopu pak jemně přimíchej pod původní čistý bicí. Dodá to neskutečnou váhu.</li>
        <li><strong>Vyčisti spodky:</strong> Hoď EQ na melodie a ořízni všechno pod 120Hz. Uvolníš tím čistou runway pro sub-frekvence tvé 808.</li>
      </ul>

      <p><strong>Pokud chcete používat přesně tyhle předpřipravené zvuky, co sám házím do svejch exkluzivních beatů,</strong> bez toho, abyste trávili dlouhý noce kroucením knobů, klikněte dolů.</p>

      <p style="text-align: center;">
        <a href="{{site_url}}/sound-kits" class="cta-button cta-indigo">Získat placement-ready kity →</a>
      </p>

      <p>Běžte něco upéct,<br><strong>VOODOO808</strong></p>
    `, "Producer Tips Sound Design"),
  },
  {
    name: "Post-Beat Purchase - Engagement",
    key: "post_beat_purchase_engagement",
    category: "upsell",
    audience: "general",
    journey_name: "Post-Beat Purchase Upsell",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 9,
    subject: "Co jste nahráli do {{product_name}}?",
    preheader: "Chci slyšet, co na tom soundu vzniká.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Ještě jednou vám moc děkuju, že jste koupili exkluzivní práva na beat <strong>{{product_name}}</strong>. Kompletní stopy (stems) i smlouvu už máte profesionálně připravenou u sebe na mailu nebo v dashboardu.</p>

      <p>Píšu vám hlavně proto, že mě ta hudba reálně zajímá a nechci bejt jenom nějakej anonymní eshop. Už jste na to položili vokál? Jak to zatím vypadá?</p>

      <p>Odepište na tenhle mail a pošlete mi klidně nějaký hrubý demo nebo snippet z mobilu. Rád podpořím lidi, co na mých věcech dělají, a milerád váš release pak nasdílím u sebe na profilech.</p>

      <p>Ať to hraje,<br><strong>VOODOO808</strong></p>
    `, "Post-Purchase Engagement"),
  },
  {
    name: "Post-Beat Purchase - Custom Arrangement",
    key: "post_beat_purchase_custom_arrangement",
    category: "upsell",
    audience: "general",
    journey_name: "Post-Beat Purchase Upsell",
    step_position: 2,
    step_type: "email",
    is_recommended: true,
    sort_order: 10,
    subject: "Potřebujete upravit beat {{product_name}} na míru? 🚀",
    preheader: "Uděláme z toho dokonalej track pro váš release.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Zakoupili jste exkluzivní verzi <strong>{{product_name}}</strong>, což znamená, že ten sound je teď stoprocentně váš. Chci se ujistit, že z toho vytáhnete absolutní maximum.</p>

      <p>Pokud vám v beatu nesedí struktura, potřebujete prodloužit intro, zkrátit refrén nebo přidat speciální breakdown na vaše sloky, nabízím vám k téhle exkluzivitě custom úpravy za přátelskou cenu.</p>

      <p><strong>Přizpůsobím strukturu beatu přesně podle vašeho nahraného vokálu, aby to mělo to správné aranžmá.</strong></p>

      <p style="text-align: center;">
        <a href="{{upgrade_url}}" class="cta-button cta-red">Objednat custom úpravu aranže →</a>
      </p>

      <p>Pojďme udělat hit,<br><strong>VOODOO808</strong></p>
    `, "Custom Arrangement"),
  },
  {
    name: "Kit Cross-Sell",
    key: "kit_cross_sell",
    category: "upsell",
    audience: "general",
    journey_name: "Kit Cross-Sell Series",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 11,
    subject: "Spárujte svůj kit s tímhle (50% sleva na bundle) 🔌",
    preheader: "Perfektní kombinace pro váš příští cookup.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Díky za nákup kitu {{purchased_kit_name}}. Máte v rukách solidní základ, ale pokud chcete totálně zrychlit svůj workflow a okamžitě zničit beat-block, potřebujete k němu správného parťáka.</p>

      <p>Navrhnul jsem k němu přímo <strong>{{complementary_kit_name}}</strong>. Používají stejný sound design a ladění, takže ty zvuky k sobě sednou bez jakéhokoliv frekvenčního bordelu.</p>

      <p><strong>Protože jste u mě ověření zákazníci, hodil jsem vám do odkazu automatickou 50% slevu na tenhle chybějící kousek do vaší skládačky.</strong></p>

      <p style="text-align: center;">
        <a href="{{cross_sell_url}}?discount=CROSS50" class="cta-button cta-green">Získat doplňkový kit s 50% slevou →</a>
      </p>

      <p>Běžte vařit,<br><strong>VOODOO808</strong></p>
    `, "Kit Cross-Sell"),
  },
  {
    name: "Weekly Newsletter - New Drops",
    key: "weekly_newsletter_new_drops",
    category: "nurture",
    audience: "general",
    journey_name: null,
    step_position: null,
    step_type: "email",
    is_recommended: false,
    sort_order: 12,
    subject: "Dropnul jsem novej materiál [Poslouchej uvnitř] 🔥",
    preheader: "Nové exkluzivní věci a sound kity jsou online.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Tenhle týden jsem strávil zavřený ve studiu a kompletně jsem překopal a aktualizoval skladové zásoby. Experimentoval jsem hodně s temnýma texturama a analogovým vintage gearem.</p>

      <p><strong>Co je nového na webu:</strong></p>
      <ul>
        <li>🎤 3 nové exkluzivní beaty (Od temného trapu po melodický pluggnb)</li>
        <li>🎹 1 novej mini-loop pack (Stahujte zdarma v sekci pro registrované)</li>
      </ul>

      <p>Skočte na web si ty věci poslechnout dřív, než si ty exkluzivity lockne někdo jinej. Kdo dřív přijde, ten bere.</p>

      <p style="text-align: center;">
        <a href="{{site_url}}" class="cta-button cta-amber">Poslechnout si novej drop →</a>
      </p>

      <p>Uvidíme se u reprobeden,<br><strong>VOODOO808</strong></p>
    `, "Weekly Newsletter"),
  },
  {
    name: "First Purchase Thank You",
    key: "first_purchase_thank_you",
    category: "general",
    audience: "general",
    journey_name: "First Purchase Celebration",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 13,
    subject: "Váš beat je teď oficiálně váš!",
    preheader: "Přátelský vzkaz po vašem prvním nákupu.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Moc gratuluju! Právě jste se stali součástí komunity eksklusivních producentů u mě. To znamená, že máte přístup k věcem, které má jen pár vyvolených.</p>

      <p>Víte, co mě na tom nejvíc těší? Že když vydáte svůj track s tímhle beátem, budu moct říct: <strong>"Jo, ten sound jsem dělal pro vás."</strong> To je pecka.</p>

      <p>Pokud máte nějaké otázky, potřebujete help s mixem nebo se vám něco nelíbí, napište mi rovně.</p>

      <p>Ať se vám to daří,<br><strong>VOODOO808</strong></p>
    `, "First Purchase Thank You"),
  },
  {
    name: "Bundle Recommendation",
    key: "bundle_recommendation",
    category: "general",
    audience: "general",
    journey_name: "Bundle Upsell",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 14,
    subject: "Kompletní setup pro váš příští track",
    preheader: "Beat + Kit combo s mega slevou.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Chci vám nabídnout speciální kombinaci: beat, co máte + kit, který k němu dokonale sedne. Dohromady o <strong>40% levněji.</strong></p>

      <p>Tento bundle jsem vytvořil jenom pro vás.</p>

      <p style="text-align: center;">
        <a href="{{bundle_url}}" class="cta-button cta-purple">Zobrazit bundle →</a>
      </p>

      <p>Pojďte na to,<br><strong>VOODOO808</strong></p>
    `, "Bundle Recommendation"),
  },
  {
    name: "Educational - Beat Breakdown",
    key: "educational_beat_breakdown",
    category: "producer",
    audience: "producer",
    journey_name: "Producer Deep Dive Series",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 15,
    subject: "Jak jsem složil tento beat",
    preheader: "Přesný proces z nuly až po hotový track.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Dneska jsem pro vás natočil kompletní breakdown jednoho z mých posledních tracků. Ukazuju všechny efekty, automaci a workflow, kterém jsem ten track dělal.</p>

      <p style="text-align: center;">
        <a href="{{breakdown_url}}" class="cta-button cta-indigo">Zhlédnout breakdown →</a>
      </p>

      <p>Naučme se spolu,<br><strong>VOODOO808</strong></p>
    `, "Beat Breakdown"),
  },
  {
    name: "Collaboration - Remix Request",
    key: "collaboration_remix",
    category: "general",
    audience: "general",
    journey_name: "Collaboration Series",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 16,
    subject: "Pojďme vytvořit něco spolu",
    preheader: "Hledám producenty na nový projekt.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Pracuji na novém projektu a hledám producenty na remix. Myslím si, že byste by do toho šli dokonale. Váš workflow a estetika se mi líbí.</p>

      <p><strong>Máte zájem?</strong> Pojďme si o tom popovídat.</p>

      <p style="text-align: center;">
        <a href="{{collaboration_url}}" class="cta-button cta-green">Chci se dozvědět víc →</a>
      </p>

      <p>Skvěle,<br><strong>VOODOO808</strong></p>
    `, "Collaboration Remix"),
  },
  {
    name: "VIP Upgrade Offer",
    key: "vip_upgrade_offer",
    category: "general",
    audience: "general",
    journey_name: "VIP Tier Campaign",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 17,
    subject: "Máte potenciál být VIP",
    preheader: "Speciální tier jenom pro ty nejlepší.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Všimnul jsem si, že u mě nakupujete pravidelně. Vytvoří jsem speciální VIP tier jenom pro nejlepší zákazníky a myslím si, že byste tam měl/a být.</p>

      <p><strong>Co dostanete:</strong></p>
      <ul>
        <li>✨ 30% sleva na všechno, pořád</li>
        <li>🚀 První přístup k novým beatům (3 dny dříve)</li>
        <li>💎 Limitované exkluzivní passy</li>
        <li>👤 Přímý přístup ke mně na support</li>
      </ul>

      <p style="text-align: center;">
        <a href="{{vip_url}}" class="cta-button cta-amber">Upgrade na VIP tier →</a>
      </p>

      <p>Pojďte nahoru,<br><strong>VOODOO808</strong></p>
    `, "VIP Upgrade Offer"),
  },
  {
    name: "Rapper Feature - Collab Call",
    key: "rapper_feature_collab",
    category: "rapper",
    audience: "rapper",
    journey_name: "Rapper Collaboration Series",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 18,
    subject: "Chcete se objevit na mém albumu?",
    preheader: "Hledám rappery na nový projekt.",
    html_content: createEmailHTML(`
      <p>Čau {{first_name}},</p>

      <p>Pracuji na novém albumu a hledám ty nejlepší rappery. Poslouchal jsem vaše tracky a myslím si, že byste by do toho šli dokonale.</p>

      <p><strong>Beaty mám hotové, teď chybí jen ten správný voice.</strong></p>

      <p>Máte zájem se na tom podílet?</p>

      <p style="text-align: center;">
        <a href="{{collab_url}}" class="cta-button cta-green">Chci se dozvědět víc →</a>
      </p>

      <p>Skvěle,<br><strong>VOODOO808</strong></p>
    `, "Rapper Collab Call"),
  },
];

export default TEMPLATE_SEEDS;
