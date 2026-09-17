/**
 * Template Seed Data - Auto-creates all 12 email templates on first run
 * Metadata includes: category, journey_name, step_position, is_recommended
 */

export const TEMPLATE_SEEDS = [
  {
    name: "Free Beat Onboarding - Day 3",
    key: "free_beat_onboarding_day3",
    category: "onboarding",
    journey_name: "Free Beat Onboarding",
    step_position: 3,
    step_type: "email",
    is_recommended: true,
    sort_order: 1,
    subject: "Pojďme makat (20% sleva na vaši první exkluzivu)",
    preheader: "Stáhli jste si free beat. Teď je čas udělat oficiální věc.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Před pár dny jste u mě na webu stáhli ten free beat. Chtěl jsem se jen zeptat – už do toho něco píšete? Jestli máte hotový demo nebo nahráváte nějaký video ze studia na IG, určitě mě označte, chci slyšet, co vám v tý hlavě vzniká.</p>

<p>Pokud chcete tenhle sound posunout dál, mít k dispozici kompletní stopy (stems) pro pořádnej mix a hlavně jistotu, že ten beat nikdo jinej nekoupí a zůstane navždycky jenom váš, je čas na exkluzivní licenci.</p>

<p>Chci vás podpořit, takže vám dávám kód <strong>FIRST20</strong> na 20% slevu na jakoukoliv exkluzivitu z mýho katalogu.</p>

<p><a href="{{site_url}}/beats" style="background: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Kouknout na exkluzivní beaty</a></p>

<p>Vidíme se ve studiu,<br>VOODOO808</p>`,
  },
  {
    name: "Free Kit Onboarding - Day 3",
    key: "free_kit_onboarding_day3",
    category: "onboarding",
    journey_name: "Free Sound Kit Onboarding",
    step_position: 3,
    step_type: "email",
    is_recommended: true,
    sort_order: 2,
    subject: "Posuňte svoji produkci dál (Sleva uvnitř) 🎹",
    preheader: "Jak vám sedí moje free zvuky v DAW?",
    html_content: `<p>Čau {{first_name}},</p>

<p>Jen kontroluju, jak vám jedou ty free zvuky, co jste u mě před pár dny stahovali. Sedí vám to dobře do mixu?</p>

<p>Pokud vás už nebaví používat dokola ty stejné recyklované zvuky z internetu a chcete unikátní, fresh textury, ze kterých vznikají opravdové hity, musíte checknout moje prémiové kity. Žádná vata, jen 100% placement-ready soundy.</p>

<p>Chci vám pomoct nakopnout další session. Použijte kód <strong>PRODUCER20</strong> a získejte 20% slevu na jakýkoliv prémiový sound kit nebo loop pack.</p>

<p><a href="{{site_url}}/sound-kits" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Upgradovat banku zvuků</a></p>

<p>Dělejte hudbu,<br>VOODOO808</p>`,
  },
  {
    name: "Abandoned Checkout - Reminder",
    key: "abandoned_checkout_reminder",
    category: "recovery",
    journey_name: "Abandoned Checkout Recovery",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 3,
    subject: "Spadnul vám program? Nebo jste zapomněli na tohle?",
    preheader: "Váš rozdělanej projekt na vás čeká v košíku.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Všimnul jsem si, že vám v košíku zůstal viset pěknej leak. Chápu to – někdo vám zavolal, crashlo DAW nebo vás prostě něco vyrušilo mid-cookup.</p>

<p>Nechal jsem vám košík schovanej. U exkluzivních licencí je to ale celkem risk, protože jakmile ten beat koupí někdo jinej, je navždycky pryč a já s tím už nic neudělám. Radši vám ho zatím držím.</p>

<p><strong>Váš výběr:</strong> {{cart_items_summary}}</p>

<p><a href="{{checkout_url}}" style="background: #EA580C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Dokončit objednávku a zamknout beat</a></p>

<p>Zatím,<br>VOODOO808</p>`,
  },
  {
    name: "Abandoned Checkout - Scarcity",
    key: "abandoned_checkout_scarcity",
    category: "recovery",
    journey_name: "Abandoned Checkout Recovery",
    step_position: 2,
    step_type: "email",
    is_recommended: true,
    sort_order: 4,
    subject: "15% sleva – vaše poslední šance!",
    preheader: "Nenechte tenhle track proklouznout mezi prsty.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Fakt chci, abyste tenhle projekt dotáhli do konce. Exkluzivní beaty a kity u mě v komunitě mizí dost rychle a nemůžu vám tenhle nákup držet věčně.</p>

<p>Abyste to měli o něco víc easy, vygeneroval jsem vám speciální 15% slevu. Použijte v košíku kód <strong>SAVE15</strong>.</p>

<p>Ten kód ale platí jenom 24 hodin, pak nadobro expiruje. Tak na to nespěte.</p>

<p><a href="{{checkout_url}}?code=SAVE15" style="background: #D97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Uplatnit 15% slevu</a></p>

<p>Pojďme na to,<br>VOODOO808</p>`,
  },
  {
    name: "Browse Recovery - Day 1",
    key: "browse_recovery_day1",
    category: "browse_recovery",
    journey_name: "Browse Abandonment Recovery",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 5,
    subject: "Ten beat, co jste checkovali... 👀",
    preheader: "Vibe u věci {{product_name}} je šílenej.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Všimnul jsem si, že jste strávili delší dobu u projektu <strong>{{product_name}}</strong>. Tenhle kousek má neskutečnej bounce – upřímně je to jedna z mých nejoblíbenějších věcí z poslední doby.</p>

<p>Máte už v hlavě nějakou konkrétní vizi nebo téma, co byste do toho dali? Pokud vás zajímají detaily ohledně trackoutů (jednotlivých stop) nebo smluvních podmínek exkluzivity, stačí odpovědět na tenhle mail.</p>

<p><a href="{{product_url}}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Poslechnout si {{product_name}} znovu</a></p>

<p>Mír,<br>VOODOO808</p>`,
  },
  {
    name: "Browse Recovery - Day 3",
    key: "browse_recovery_day3",
    category: "browse_recovery",
    journey_name: "Browse Abandonment Recovery",
    step_position: 2,
    step_type: "email",
    is_recommended: true,
    sort_order: 6,
    subject: "Hledáte jinej vibe? Zkuste tyhle věci.",
    preheader: "Fresh sound vybraný podle vašeho vkusu.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Protože jste nedávno procházeli můj katalog, vytáhnul jsem pro vás z vaultu pár dalších věcí, které mají podobnou energii a mohly by vám sednout.</p>

<p>Tohle jsou momentálně 3 nejvíc vyhledávané věci u mě na webu:</p>
<ul>
    <li>🔥 {{recommendation_1}}</li>
    <li>🎹 {{recommendation_2}}</li>
    <li>⚡ {{recommendation_3}}</li>
</ul>

<p>Klikněte níže, naskočte zpátky na web a najděte ten správný sound pro váš projekt.</p>

<p><a href="{{site_url}}" style="background: #4B5563; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Otevřít kompletní katalog</a></p>

<p>Hned jsme zpátky,<br>VOODOO808</p>`,
  },
  {
    name: "Rapper Tips - Spotify Strategy",
    key: "rapper_tips_spotify",
    category: "nurture",
    journey_name: "Rapper Growth & Tips Series",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 7,
    subject: "Jak dostat vaše tracky do Spotify playlistů 📈",
    preheader: "Blueprint pro nezávislé CZ/SK interprety.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Můžete mít ty nejtvrdší bary a dokonalej mix, ale pokud váš track nikdo neuslyší, děláte to zbytečně. Dneska vám chci poslat rychlej návod, jak dostat vaši tvorbu do editorial a algorithmic playlistů na Spotify:</p>

<ol>
    <li><strong>Pitchujte včas:</strong> Nahrajte a pitchujte track přes Spotify for Artists aspoň 3 až 4 týdny před releasem. Dá to kurátorům čas a hlavně to track automaticky hodí vašim followers do Release Radaru.</li>
    <li><strong>Tlačte traffic první dny:</strong> Prvních 48 hodin po releasu směřujte veškerou pozornost z IG, TikToku a YouTube čistě na Spotify link. Algoritmus miluje, když lidi přicházejí zvenčí.</li>
    <li><strong>Čistá metadata:</strong> Při pitchování přesně zadejte žánr, subžánry a náladu tracku. AI Spotify podle toho hledá správné posluchače.</li>
</ol>

<p>Hledáte novej podklad, kterým odpálíte příští release? Skočte na web checknout nové exkluzivní beaty.</p>

<p><a href="{{site_url}}/beats" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Poslechnout nové beaty</a></p>

<p>Makejte na sobě,<br>VOODOO808</p>`,
  },
  {
    name: "Producer Tips - Sound Design",
    key: "producer_tips_sound_design",
    category: "nurture",
    journey_name: "Producer Growth & Tutorials Series",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 8,
    subject: "Jak dělám beaty (A mix tajemství na hard 808s)",
    preheader: "Udělejte si bicí, co proříznou každej master.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Hodně lidí se mě ptá, jak dělám, že moja bicí hrají tak tvrdě bez toho, aby to totálně clipovalo master fader. Dneska vám otevřu projekt a ukážu vám, jak jsem procesoval zvuky do mýho posledního kitu:</p>

<ul>
    <li><strong>Soft Clipping je král:</strong> Místo limiteru na masteru zkus hodit soft clipper přímo na drum bus. Můžete pak tlačit hlasitost 808s a kicků do červenejch hodnot a vytvoří to příjemnou saturaci místo hnusnýho digitálního distortionu.</li>
    <li><strong>Paralelní komprese:</strong> Pošli kick a snare na aux stopu, tam je totálně rozbíj těžkým kompresorem a tuhle stopu pak jemně přimíchej pod původní čistý bicí. Dodá to neskutečnou váhu.</li>
    <li><strong>Vyčisti spodky:</strong> Hoď EQ na melodie a ořízni všechno pod 120Hz. Uvolníš tím čistou runway pro sub-frekvence tvé 808.</li>
</ul>

<p>Pokud chcete používat přesně tyhle předpřipravené zvuky, co sám házím do svejch exkluzivních beatů, bez toho, abyste trávili dlouhý noce kroucením knobů, klikněte dolů.</p>

<p><a href="{{site_url}}/sound-kits" style="background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Získat placement-ready kity</a></p>

<p>Běžte něco upéct,<br>VOODOO808</p>`,
  },
  {
    name: "Post-Beat Purchase - Engagement",
    key: "post_beat_purchase_engagement",
    category: "upsell",
    journey_name: "Post-Beat Purchase Upsell",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 9,
    subject: "Co jste nahráli do {{product_name}}?",
    preheader: "Chci slyšet, co na tom soundu vzniká.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Ještě jednou vám moc děkuju, že jste koupili exkluzivní práva na beat <strong>{{product_name}}</strong>. Kompletní stopy (stems) i smlouvu už máte profesionálně připravenou u sebe na mailu nebo v dashboardu.</p>

<p>Píšu vám hlavně proto, že mě ta hudba reálně zajímá a nechci bejt jenom nějakej anonymní eshop. Už jste na to položili vokál? Jak to zatím vypadá?</p>

<p>Odepište na tenhle mail a pošlete mi klidně nějaký hrubý demo nebo snippet z mobilu. Rád podpořím lidi, co na mých věcech dělají, a milerád váš release pak nasdílím u sebe na profilech.</p>

<p>Ať to hraje,<br>VOODOO808</p>`,
  },
  {
    name: "Post-Beat Purchase - Custom Arrangement",
    key: "post_beat_purchase_custom_arrangement",
    category: "upsell",
    journey_name: "Post-Beat Purchase Upsell",
    step_position: 2,
    step_type: "email",
    is_recommended: true,
    sort_order: 10,
    subject: "Potřebujete upravit beat {{product_name}} na míru? 🚀",
    preheader: "Uděláme z toho dokonalej track pro váš release.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Zakoupili jste exkluzivní verzi <strong>{{product_name}}</strong>, což znamená, že ten sound je teď stoprocentně váš. Chci se ujistit, že z toho vytáhnete absolutní maximum.</p>

<p>Pokud vám v beatu nesedí struktura, potřebujete prodloužit intro, zkrátit refrén nebo přidat speciální breakdown na vaše sloky, nabízím vám k téhle exkluzivitě custom úpravy za přátelskou cenu.</p>

<p>Přizpůsobím strukturu beatu přesně podle vašeho nahraného vokálu, aby to mělo to správné aranžmá.</p>

<p><a href="{{upgrade_url}}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Objednat custom úpravu aranže</a></p>

<p>Pojďme udělat hit,<br>VOODOO808</p>`,
  },
  {
    name: "Kit Cross-Sell",
    key: "kit_cross_sell",
    category: "upsell",
    journey_name: "Kit Cross-Sell Series",
    step_position: 1,
    step_type: "email",
    is_recommended: true,
    sort_order: 11,
    subject: "Spárujte svůj kit s tímhle (50% sleva na bundle) 🔌",
    preheader: "Perfektní kombinace pro váš příští cookup.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Díky za nákup kitu {{purchased_kit_name}}. Máte v rukách solidní základ, ale pokud chcete totálně zrychlit svůj workflow a okamžitě zničit beat-block, potřebujete k němu správného parťáka.</p>

<p>Navrhnul jsem k němu přímo <strong>{{complementary_kit_name}}</strong>. Používají stejný sound design a ladění, takže ty zvuky k sobě sednou bez jakéhokoliv frekvenčního bordelu.</p>

<p>Protože jste u mě ověření zákazníci, hodil jsem vám do odkazu automatickou 50% slevu na tenhle chybějící kousek do vaší skládačky.</p>

<p><a href="{{cross_sell_url}}?discount=CROSS50" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Získat doplňkový kit s 50% slevou</a></p>

<p>Běžte vařit,<br>VOODOO808</p>`,
  },
  {
    name: "Weekly Newsletter - New Drops",
    key: "weekly_newsletter_new_drops",
    category: "nurture",
    journey_name: null, // Special: standalone newsletter
    step_position: null,
    step_type: "email",
    is_recommended: false,
    sort_order: 12,
    subject: "Dropnul jsem novej materiál [Poslouchej uvnitř] 🔥",
    preheader: "Nové exkluzivní věci a sound kity jsou online.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Tenhle týden jsem strávil zavřený ve studiu a kompletně jsem překopal a aktualizoval skladové zásoby. Experimentoval jsem hodně s temnýma texturama a analogovým vintage gearem.</p>

<p><strong>Co je nového na webu:</strong></p>
<ul>
    <li>🎤 3 nové exkluzivní beaty (Od temného trapu po melodický pluggnb)</li>
    <li>🎹 1 novej mini-loop pack (Stahujte zdarma v sekci pro registrované)</li>
</ul>

<p>Skočte na web si ty věci poslechnout dřív, než si ty exkluzivity lockne někdo jinej. Kdo dřív přijde, ten bere.</p>

<p><a href="{{site_url}}" style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Poslechnout si novej drop</a></p>

<p>Uvidíme se u reporbeden,<br>VOODOO808</p>`,
  },
  {
    name: "First Purchase Thank You",
    key: "first_purchase_thank_you",
    category: "general",
    journey_name: "First Purchase Celebration",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 13,
    subject: "Váš beat je teď oficiálně váš!",
    preheader: "Přátelský vzkaz po vašem prvním nákupu.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Moc gratuluju! Právě jste se stali součástí komunity eksklusivních producentů u mě. To znamená, že máte přístup k věcem, které má jen pár vyvolených.</p>

<p>Víte, co mě na tom nejvíc těší? Že když vydáte svůj track s tímhle beátem, budu moct říct: "Jo, ten sound jsem dělal pro vás." To je pecka.</p>

<p>Pokud máte nějaké otázky, potřebujete help s mixem nebo se vám něco nelíbí, napište mi rovnou.</p>

<p>Ať se vám to daří,<br>VOODOO808</p>`,
  },
  {
    name: "Bundle Recommendation",
    key: "bundle_recommendation",
    category: "general",
    journey_name: "Bundle Upsell",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 14,
    subject: "Kompletní setup pro váš příští track",
    preheader: "Beat + Kit combo s mega slevou.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Chci vám nabídnout speciální kombinaci: beat, co máte + kit, který k němu dokonale sedne. Dohromady o 40% levněji.</p>

<p>Tento bundle jsem vytvořil jenom pro vás.</p>

<p><a href="{{bundle_url}}" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Zobrazit bundle</a></p>

<p>Pojďte na to,<br>VOODOO808</p>`,
  },
  {
    name: "Educational - Beat Breakdown",
    key: "educational_beat_breakdown",
    category: "producer",
    journey_name: "Producer Deep Dive Series",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 15,
    subject: "Jak jsem složil tento beat",
    preheader: "Přesný proces z nuly až po hotový track.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Dneska jsem pro vás natočil kompletní breakdown jednoho z mých posledních tracků.</p>

<p><a href="{{breakdown_url}}" style="background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Zhlédnout breakdown</a></p>

<p>Naučme se spolu,<br>VOODOO808</p>`,
  },
  {
    name: "Collaboration - Remix Request",
    key: "collaboration_remix",
    category: "general",
    journey_name: "Collaboration Series",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 16,
    subject: "Pojďme vytvořit něco spolu",
    preheader: "Hledám producenty na nový projekt.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Pracuji na novém projektu a hledám producenty na remix. Myslím si, že byste by do toho šli dokonale.</p>

<p><a href="{{collaboration_url}}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Chci se dozvědět víc</a></p>

<p>Skvěle,<br>VOODOO808</p>`,
  },
  {
    name: "VIP Upgrade Offer",
    key: "vip_upgrade_offer",
    category: "general",
    journey_name: "VIP Tier Campaign",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 17,
    subject: "Máte potenciál být VIP",
    preheader: "Speciální tier jenom pro ty nejlepší.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Všimnul jsem si, že u mě nakupujete pravidelně. Vytvořil jsem speciální VIP tier s 30% slevou na všechno a prvým přístupem k novým beatům.</p>

<p><a href="{{vip_url}}" style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Upgrade na VIP</a></p>

<p>Pojďte nahoru,<br>VOODOO808</p>`,
  },
  {
    name: "Rapper Feature - Collab Call",
    key: "rapper_feature_collab",
    category: "rapper",
    journey_name: "Rapper Collaboration Series",
    step_position: 1,
    step_type: "email",
    is_recommended: false,
    sort_order: 18,
    subject: "Chcete se objevit na mém albumu?",
    preheader: "Hledám rappery na nový projekt.",
    html_content: `<p>Čau {{first_name}},</p>

<p>Pracuji na novém albumu a hledám ty nejlepší rappery. Myslím si, že byste by do toho šli dokonale.</p>

<p>Beaty mám hotové, teď chybí jen ten správný voice.</p>

<p><a href="{{collab_url}}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Chci se dozvědět víc</a></p>

<p>Skvěle,<br>VOODOO808</p>`,
  },
];

export default TEMPLATE_SEEDS;
