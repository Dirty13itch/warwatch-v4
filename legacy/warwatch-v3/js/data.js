/* WarWatch V3 — Static Reference Data
   Last updated: April 9, 2026 (Day 41)
   Sources: CENTCOM, ISW/CriticalThreats, BBC, WSJ, NYT, Anadolu, CNN,
   Wikipedia 2026 Iran war, India Today, SCMP, TRT World, MilitaryWatch,
   + independent journalist reporting (Ritter, Escobar, Scahill, Elmer, Johnson, McGovern)
   + Drop Site News, Electronic Intifada, Judging Freedom */

const WW = window.WW || {};

WW.VERSION = '3.0';
WW.CONFLICT_START = new Date('2026-02-28T00:00:00Z');

WW.THREAT_LEVEL = { level: 'CRITICAL', label: 'CRITICAL', description: 'FRAGILE CEASEFIRE — Lebanon excluded — Islamabad talks April 10 — Hormuz ≤15 ships/day' };

// ═══════════════════════════════════════════════════════
// TOP-LINE KPIs
// ═══════════════════════════════════════════════════════
WW.KPI = {
  totalStrikes: '>13,000',
  strikesNote: 'CENTCOM confirmed 13,000+ strikes on Iranian military targets across 38 days of major combat (Admiral Cooper, Apr 9); strikes paused under ceasefire',
  oilPrice: '$109 / $95 spot',
  oilNote: 'Brent dropped 13% to ~$95 on ceasefire announcement (Apr 8) — largest single-day drop since 2020; rebounding ~$97–98 Apr 9 as Hormuz re-closed. Peak: $144.42/bbl physical (Apr 7 record). WTI similarly collapsed then rebounded.',
  hormuzStatus: 'PARTIAL — ≤15/DAY',
  hormuzNote: 'Iran re-blocked after Israel\'s Operation Eternal Darkness (Apr 8); mine charts published routing ships near Larak Island; ≤15 vessels/day with IRGC approval; only 4 ships passed on ceasefire Day 1 (Kpler); 400+ tankers stuck in Gulf',
  activeCSGs: 3,
  csgNote: 'Lincoln active (Arabian Sea); Ford damaged (Crete); GHWB arrived and ON STATION in theater; HMS Prince of Wales advanced readiness',
  countriesTargeted: 14,
  warCost: '$28B+',
  warCostNote: 'Estimated through Day 41; CSAR alone ~$400M (Larry Johnson); $1.8B/day burn rate; $200B supplemental requested',
  iranInternet: '~1%',
  internetNote: 'Near-total blackout since Day 1 (41 days); judiciary criminalized filming US/Israeli strikes',
  casualtiesTotal: '21,000+ Iran alone',
  casualtiesNote: 'Iranian Red Crescent: 21,000+ killed in Iran alone (as of early April); 115,000+ civilian facilities destroyed or damaged; 3.2M displaced. Lebanon: 1,784+ killed, 1M+ displaced. US: 13 KIA confirmed (7 by enemy fire, per CENTCOM Apr 9). CEASEFIRE IN EFFECT — fragile.',
  usEquipmentLoss: '$2.4B–$5.0B+',
  usEquipmentNote: 'Updated through Day 39: adds F-15E shootdown, A-10, CSAR assets (~$400M per Larry Johnson), 2 MC-130, 4 MH-6 Little Birds destroyed in rescue op',
  usAircraftLost: '21+',
  usAircraftNote: 'F-15E shot down Apr 3 (Day 35, shoulder-fired SAM); A-10 downed near Strait; 2 MC-130 + 4 MH-6 destroyed in CSAR op; exceeds all US air campaign losses since Vietnam'
};

// ═══════════════════════════════════════════════════════
// APRIL 7 DEADLINE — MOST TIME-CRITICAL DATA POINT
// ═══════════════════════════════════════════════════════
WW.DEADLINE = {
  label: 'Trump Energy Strike Deadline — PASSED — CEASEFIRE ANNOUNCED',
  target: new Date('2026-04-07T20:00:00-04:00'),
  threatLevel: 'CEASEFIRE — FRAGILE',
  threatDesc: 'Trump threatened "complete demolition" of all Iranian power plants, bridges, desalination facilities. April 7 AM: "A whole civilization will die tonight, never to be brought back again." US bombers were reportedly airborne toward Iran when the deal was struck — ~88 minutes before the 8PM ET deadline.',
  negotiationStatus: 'CEASEFIRE ANNOUNCED — FRAGILE — Lebanon excluded',
  ceasefireAnnounced: '2026-04-07T18:32:00-04:00',
  ceasefireNote: 'Trump announced ceasefire on Truth Social at ~6:32 PM ET April 7 — 88 minutes before his self-imposed 8PM deadline. Brokered by Pakistan PM Shehbaz Sharif and Army Chief Field Marshal Asim Munir; China urged Iran at the last minute to accept. 2-week halt to US/Israeli strikes on Iran; Iran suspends offensive operations; Hormuz to reopen under Iranian military coordination.',
  ceasefireViolations: 'Israel launched Operation Eternal Darkness in Lebanon on April 8 — 254 killed, 1,000+ injured, 160 munitions, 100+ targets. Iran re-closed Hormuz April 8 in response. Iran\'s Parliament Speaker cited three ceasefire violations. Ceasefire survival depends entirely on Lebanon.',
  iranPosition: 'Iran SNSC declared ceasefire "an enduring defeat" for Washington; said it forced US to accept Iran\'s 10-point plan. FM Araghchi: "If attacks against Iran are halted, our Powerful Armed Forces will cease their defensive operations." Iran views Lebanon exclusion as fundamental breach.',
  usPosition: 'Trump: "Total and complete victory. 100 percent." Pentagon: "historic and decisive triumph." Hegseth: "Iran begged for this ceasefire." Vance: Lebanon not in the ceasefire — "We never made such a commitment."',
  intermediary: 'Pakistan PM Shehbaz Sharif + Army Chief Field Marshal Asim Munir (primary brokers); China (decisive last-minute pressure on Tehran); Oman (joint maritime Hormuz protocol)',
  deadlineExtendedAgain: false,
  ceasefirePassed: true,
  previousDeadlines: [
    { date: '2026-03-21', outcome: 'Extended ~12 hours before deadline — Pentagon ordered to delay energy infrastructure strikes for "five-day period"; cited "productive" Pakistan talks' },
    { date: '2026-03-26', outcome: 'Extended +10 days to April 6 8PM ET — cited Iranian request and "great progress"; added Kharg Island and desalination plant threats' },
    { date: '2026-04-06', outcome: 'Extended to April 7 8PM ET — expletive-filled Truth Social post; cited Pakistan channel progress; Kharg military targets struck Apr 6–7 as signal' },
    { date: '2026-04-07', outcome: 'CEASEFIRE ANNOUNCED — 88 minutes before deadline. Trump posted on Truth Social ~6:32 PM ET citing Pakistan PM Sharif and Field Marshal Munir. Iran accepted within hours via FM Araghchi. IMMEDIATELY STRAINED: Israel launched Operation Eternal Darkness in Lebanon (Apr 8, 254 killed); Iran re-closed Hormuz Apr 8 in retaliation. Islamabad talks confirmed for April 10.' }
  ]
};

// ═══════════════════════════════════════════════════════
// NEGOTIATION TRACKER
// ═══════════════════════════════════════════════════════
WW.NEGOTIATION = {
  framework: 'ISLAMABAD ACCORD (Two-Phase) — CEASEFIRE PHASE ACTIVE',
  frameworkDesc: 'Pakistan-brokered two-phase deal: Phase 1 — ceasefire + Hormuz reopening (active but fragile); Phase 2 — permanent settlement talks beginning at Islamabad April 10. Both sides claiming victory from ceasefire. Lebanon exclusion is the immediate crisis point.',
  keyBroker: 'Pakistan PM Shehbaz Sharif + Field Marshal Asim Munir — primary brokers; China played decisive last-minute role urging Iran to accept; Oman co-managing Hormuz maritime protocol',
  vanceRole: 'VP Vance leads US delegation to Islamabad (April 10); joined by Special Envoy Steve Witkoff and Jared Kushner. ~30-member advance security team already in Islamabad by Apr 9.',
  islamabadTalks: {
    date: '2026-04-10',
    venue: 'Serena Hotel, Islamabad (Red Zone; hotel cleared for delegates)',
    usDelegation: ['VP JD Vance (lead)', 'Steve Witkoff (Special Envoy)', 'Jared Kushner'],
    iranDelegation: ['FM Abbas Araghchi (lead)', 'Parliament Speaker Mohammad Baqer Ghalibaf (former IRGC commander)'],
    facilitated_by: 'Pakistan Deputy PM/FM Ishaq Dar; Sharif to formally chair',
    fragility: 'Iranian ambassador deleted his confirmation post April 9 — delegation participation uncertain. Pakistan held Iran back from retaliating against Israel night of Apr 8–9.'
  },
  usPlan: {
    label: 'US 15-Point Plan (delivered via Pakistan Mar 25)',
    status: 'BASIS FOR TALKS — Iran called "workable basis" then disputed',
    keyPoints: [
      { text: 'Immediate ceasefire (Phase 1 in effect)', status: 'partial' },
      { text: 'Reopen Strait of Hormuz — no tolls allowed', status: 'disputed' },
      { text: '45-day ceasefire — replaced by 2-week ceasefire', status: 'modified' },
      { text: 'Dismantle uranium enrichment / zero enrichment', status: 'rejected' },
      { text: 'Full IAEA access to all nuclear sites', status: 'disputed' },
      { text: 'Halt ballistic missile development', status: 'rejected' },
      { text: 'End support for Hezbollah / Lebanon separate issue', status: 'rejected' },
      { text: 'End support for Houthis and Iraqi militias', status: 'rejected' },
      { text: 'Recognition of Israel', status: 'rejected' },
      { text: 'Sanctions relief tied to nuclear concessions', status: 'disputed' },
      { text: 'No troop withdrawal from region', status: 'rejected_by_iran' },
      { text: 'No reparations', status: 'rejected_by_iran' }
    ]
  },
  iranConditions: {
    label: 'Iran 10-Point Counter-Proposal (released Apr 7 — Persian/English discrepancies)',
    status: 'SUBMITTED — Iran claims US accepted; US disputes',
    note: 'Persian version explicitly includes enrichment right; English version shared with journalists omitted this — deliberate ambiguity. Iran SNSC declares ceasefire validates their 10 points.',
    points: [
      { text: 'US guarantee of non-aggression against Iran', status: 'partial' },
      { text: 'Iranian control over Strait of Hormuz (with Oman) + transit fees', status: 'rejected_by_us' },
      { text: 'Acceptance of Iran\'s right to uranium enrichment (Persian version only)', status: 'rejected_by_us' },
      { text: 'Lifting all primary US sanctions', status: 'rejected_by_us' },
      { text: 'Lifting all secondary US sanctions', status: 'rejected_by_us' },
      { text: 'Termination of all UNSC resolutions against Iran', status: 'rejected_by_us' },
      { text: 'Termination of all IAEA Board of Governors resolutions against Iran', status: 'rejected_by_us' },
      { text: 'Full war reparations (funded via Hormuz transit fees)', status: 'rejected_by_us' },
      { text: 'Withdrawal of ALL US combat forces from region', status: 'rejected_by_us' },
      { text: 'Immediate ceasefire on ALL fronts including Lebanon', status: 'rejected_by_us' }
    ]
  },
  keyStickingPoints: [
    { issue: 'Uranium Enrichment', us: 'Zero enrichment; must dismantle all above 3.67%; Hegseth: "non-negotiable" to seize 440kg HEU', iran: 'Non-negotiable sovereign right; nuclear chief: no restrictions on enrichment' },
    { issue: 'Strait of Hormuz', us: 'Full free navigation, no tolls, open to all', iran: 'Sovereign right to military oversight + transit fees (≤15 vessels/day with IRGC approval)' },
    { issue: 'Lebanon', us: 'Separate issue; not part of ceasefire; Israel sovereign decision', iran: 'Must be included; ceasefire violation; Ghalibaf: talks "unreasonable" with Lebanon strikes ongoing' },
    { issue: 'US Troop Withdrawal', us: 'Not discussed; not on table', iran: 'Full withdrawal from all regional bases — mandatory' },
    { issue: 'War Reparations', us: 'Not on table', iran: 'Mandatory; to be funded via Hormuz toll revenues' }
  ],
  iranCoreConditions: [
    'Final and complete cessation of aggression on ALL fronts including Lebanon',
    'Credible guarantees preventing any recurrence of war',
    'Full compensation for material and moral damages',
    'Respect for Iran\'s legal jurisdiction in the Strait of Hormuz'
  ],
  supportingParties: 'Pakistan (primary channel + talks host); China (last-minute decisive pressure on Iran); Oman (Hormuz maritime co-management protocol); Turkey (FM Fidan 15+ calls); Qatar (FM spoke with Araghchi Apr 7)',
  unscStatus: 'UNSC Hormuz resolution VETOED Apr 7 by Russia and China (11-2-2); US/allies without UN legal cover for Hormuz enforcement'
};

// ═══════════════════════════════════════════════════════
// MULTI-FRONT STATUS
// ═══════════════════════════════════════════════════════
WW.FRONTS = [
  {
    name: 'Iran Air Campaign',
    status: 'CEASEFIRE — STRIKES PAUSED',
    level: 'watch',
    summary: '13,000+ strikes over 38 days of major combat (CENTCOM Admiral Cooper, Apr 9). Iranian air force grounded; 150+ naval vessels destroyed; 190+ ballistic missile launchers destroyed; ~80% of nuclear industrial base struck. Ceasefire halted strikes as of Apr 7. Threatened to resume if ceasefire collapses.',
    keyFact: 'CENTCOM: 90% Iran weapons factories hit, 80% missile facilities, 80% nuclear industrial base. VP Vance: energy infrastructure strikes — next threshold if talks fail. Politico: Pentagon officials warned US was "running out of strategically important targets."',
    lastUpdate: '2026-04-09',
    icon: '✈️'
  },
  {
    name: 'Lebanon / Hezbollah',
    status: 'ESCALATING DESPITE CEASEFIRE — OPERATION ETERNAL DARKNESS',
    level: 'critical',
    summary: 'Operation Eternal Darkness (Apr 8): Israel\'s largest single strike wave on Lebanon — ~50 IAF jets, ~160 munitions, 100+ Hezbollah command centers/military installations. Strikes hit Beirut southern suburbs, central areas, Beqaa Valley, southern Lebanon. 254 killed, 1,000+ injured. Five IDF divisions in Lebanon (36th, 91st, 98th, 146th, 162nd). 98th Division near full control of Bint Jbail (Apr 9). 7 key bridges destroyed; southern Lebanon cut off. Hezbollah resumed rocket attacks on northern Israel (dozens fired Apr 9).',
    keyFact: 'Netanyahu: "Lebanon is NOT in the ceasefire." Vance: "We never made such a commitment." Arab League: Israel "persistently seeking to sabotage" Iran ceasefire. IDF announced area south of Litani River "disconnected from Lebanon." Lebanon declared day of mourning. 1,784+ killed total in Lebanon; 1M+ displaced.',
    lastUpdate: '2026-04-09',
    icon: '⚔️'
  },
  {
    name: 'Houthi / Red Sea',
    status: 'ACTIVE — 2-WEEK PAUSE ANNOUNCED',
    level: 'high',
    summary: 'Apr 6: Joint Houthi-Iran-Hezbollah cruise missile + UAV operation at Eilat. 8+ Houthi attacks on Israel total. All Axis of Resistance groups announced 2-week suspension of attacks on "enemy bases" following ceasefire — but Hezbollah resumed after Lebanon strikes. Houthis have NOT resumed commercial shipping attacks.',
    keyFact: 'Senior Iranian adviser Velayati (Apr 5): Bab al-Mandab can be closed "with a single signal." Houthi-Iran joint operation targeting Eilat confirms deep coordination. Bab al-Mandab remains open but explicitly threatened as escalation option.',
    lastUpdate: '2026-04-09',
    icon: '🚀'
  },
  {
    name: 'Strait of Hormuz',
    status: 'PARTIAL REOPENING → RE-CLOSED — ≤15/DAY',
    level: 'critical',
    summary: 'Ceasefire Day 1 (Apr 8): Only 4 vessels passed with AIS active (Kpler data). Iran re-blocked after Israel\'s Operation Eternal Darkness. By Apr 9: oil tankers halted again per Iran\'s Fars News. IRGC published mine chart routing ships northward near Larak Island — implies mines in traditional Oman-side corridor. Cap: ≤15 vessels/day with IRGC approval; fees: ~$1/barrel (Iran\'s share for reconstruction). 400+ tankers stuck in Gulf. UK FM: Hormuz "must be toll-free."',
    keyFact: 'Iran and Oman co-managing maritime protocol. TASS: Iran restricting passage to max 15 vessels/day. Local 10/WPLG confirmed chart shows ships routed away from "danger zones." VP Vance: "signs straits are starting to reopen" — contradicted by Iranian state media.',
    lastUpdate: '2026-04-09',
    icon: '🚢'
  },
  {
    name: 'Iraqi Militias',
    status: '2-WEEK PAUSE — MONITORING',
    level: 'elevated',
    summary: 'Pro-Iranian groups in Iraq announced parallel 2-week suspension of attacks on "enemy bases" following ceasefire. Previously: 19–41 drone/rocket attacks/day by Islamic Resistance in Iraq; BP North Rumaila oilfield hit (Apr 4); Chinese-operated Maysan oilfield hit (Apr 5). Ceasefire compliance uncertain given Hezbollah resumed after Lebanon strikes.',
    keyFact: 'Apr 5: Chinese-operated Maysan oilfield struck — first targeting of Chinese-operated infrastructure. US counter-strikes hit 53rd PMF Brigade HQ (Tal Afar, Apr 1) and 45th PMF Brigade HQ (Anbar, Apr 4). Militia pause may dissolve if Lebanon ceasefire collapses.',
    lastUpdate: '2026-04-09',
    icon: '💥'
  }
];

// ═══════════════════════════════════════════════════════
// CASUALTY TRACKER
// ═══════════════════════════════════════════════════════
WW.CASUALTIES = {
  asOf: '2026-04-09',
  source: 'Wikipedia 2026 Iran war / Al Jazeera Day 41 tracker / CENTCOM / Iranian Red Crescent / UNICEF / IFRC / HRANA / Hengaw / ISW CTP',
  childrenKilled: '168 boys and girls killed in single school strike on Day 1 (UNICEF)',
  parties: [
    { country: 'Iran', killed: '21,000+', killedLow: 21000, killedHigh: 21000, wounded: '115,000+ facilities', woundedNum: 115000, displaced: '3,200,000+', note: 'Iranian Red Crescent (early April): 21,000+ killed; 115,000+ civilian facilities destroyed or damaged; 914,980 housing units affected. UNICEF: 442 health facilities damaged; 10M people including 2.2M children losing healthcare access; 760+ schools destroyed. Govt stopped updating death toll. 3.2M displaced (UNHCR mid-March).', flag: '🇮🇷' },
    { country: 'Lebanon', killed: '1,784+', killedLow: 1784, killedHigh: 1784, wounded: '5,977+', woundedNum: 5977, displaced: '1,000,000+', note: 'As of Apr 8. Operation Eternal Darkness (Apr 8) alone: 254 killed, 1,000+ injured. 5 IDF divisions in Lebanon. Southern Lebanon cut off (7 bridges destroyed). 57 healthcare workers killed. 1M+ displaced (20% of Lebanon population).', flag: '🇱🇧' },
    { country: 'Iraq', killed: '110+', killedLow: 110, killedHigh: 110, wounded: '230+', woundedNum: 230, displaced: null, note: 'US counter-strikes ongoing; 53rd PMF Brigade HQ struck (Tal Afar, Apr 1); 45th PMF Brigade HQ struck (Anbar, Apr 4); 3 PMF killed in F-15E rescue op (Apr 4–5)', flag: '🇮🇶' },
    { country: 'Israel', killed: '29+', killedLow: 29, killedHigh: 35, wounded: '6,200+', woundedNum: 6200, displaced: null, note: 'Cluster munitions escalating (70% of Iranian ballistic missiles now carry cluster warheads per IDF); Petah Tikva drone factory damaged; HaKirya HQ vicinity struck Apr 4; 11 Israeli soldiers killed in Lebanon combat', flag: '🇮🇱' },
    { country: 'United States', killed: '13', killedLow: 13, killedHigh: 13, wounded: '347+', woundedNum: 347, displaced: null, note: 'CENTCOM (Admiral Cooper, Apr 9): 13 US service members killed (7 by enemy fire). 6 Kuwait Mar 1; 1 Marine Saudi Mar 4; 6 KC-135 crash Mar 12; 2 F-16 crash Mar 22; +15 injured Ali Al Salem AB Kuwait (Apr 5–6 Iranian Shahed-136 drone strike); F-15E WSO (colonel) rescued alive with sprained ankle Apr 5', flag: '🇺🇸' },
    { country: 'UAE', killed: '11', killedLow: 11, killedHigh: 11, wounded: '165+', woundedNum: 165, displaced: null, note: 'Apr 4: 56 drones + 23 ballistic missiles intercepted; Oracle building Dubai Internet City hit by debris; Dubai Airport operational status uncertain', flag: '🇦🇪' },
    { country: 'Kuwait', killed: '8', killedLow: 8, killedHigh: 8, wounded: '109+', woundedNum: 109, displaced: null, note: 'Apr 5–6: Shahed-136 drone strike on Ali Al Salem AB injured 15 Americans; Kuwait fuel tanks, desalination plants repeatedly targeted', flag: '🇰🇼' },
    { country: 'Qatar', killed: '7', killedLow: 7, killedHigh: 7, wounded: '23+', woundedNum: 23, displaced: null, note: 'Ras Laffan LNG struck twice ($20B damage, 3–5 year recovery); AQUA 1 tanker hit Apr 1 (17nm from Ras Laffan)', flag: '🇶🇦' },
    { country: 'Bahrain', killed: '3', killedLow: 3, killedHigh: 3, wounded: '38+', woundedNum: 38, displaced: null, note: 'US 5th Fleet HQ targeted; THAAD radar at Al-Salti and 5th Fleet confirmed destroyed per Larry Johnson', flag: '🇧🇭' },
    { country: 'Turkey', killed: '3', killedLow: 3, killedHigh: 3, wounded: '0', woundedNum: 0, displaced: null, note: 'Turkey shot down 2 Iranian ballistic missiles (Mar 2 and Mar 9); NATO air defenses active but Article 4/5 not invoked', flag: '🇹🇷' },
    { country: 'Saudi Arabia', killed: '5+', killedLow: 5, killedHigh: 8, wounded: '55+', woundedNum: 55, displaced: null, note: 'Jubail petrochemical facility struck Apr 7 (IRGC retaliation for Kharg strikes); Prince Sultan AB hit; E-3 Sentry damaged Mar 27; 25+ US personnel injured earlier; Apr 8: Saudi intercepted 9 drones, 5 ballistic missiles in Eastern Province', flag: '🇸🇦' },
    { country: 'Oman', killed: '3', killedLow: 3, killedHigh: 3, wounded: '5', woundedNum: 5, displaced: null, note: '', flag: '🇴🇲' }
  ],
  totalRange: { low: 22000, high: 30000, wounded: 125000 }
};

// ═══════════════════════════════════════════════════════
// COUNTRY-BY-COUNTRY IRANIAN ATTACK DATA
// ═══════════════════════════════════════════════════════
WW.COUNTRY_ATTACKS = [
  { country: 'Israel', lat: 31.05, lon: 34.85, ballistic: 220, cruise: 0, drones: 110, totalMunitions: 330, killed: 29, wounded: 5768, keyTargets: 'Military bases, Neot Hovav chemical plant, Orot Rabin power, Haifa refinery, Dimona area, Ramat Gan (cluster munition)', patriotDepleted: null, flag: '🇮🇱' },
  { country: 'UAE', lat: 24.45, lon: 54.38, ballistic: 378, cruise: 15, drones: 1835, totalMunitions: 2228, killed: 11, wounded: 165, keyTargets: 'Dubai Airport, Abu Dhabi Airport, Emirates Global Aluminum', patriotDepleted: 75, flag: '🇦🇪' },
  { country: 'Saudi Arabia', lat: 24.68, lon: 46.72, ballistic: 38, cruise: 0, drones: 435, totalMunitions: 473, killed: 2, wounded: 41, keyTargets: 'Prince Sultan AB (E-3 Sentry damaged), Shaybah oil, Ras Tanura refinery', patriotDepleted: null, flag: '🇸🇦' },
  { country: 'Kuwait', lat: 29.37, lon: 47.97, ballistic: 307, cruise: 2, drones: 616, totalMunitions: 925, killed: 8, wounded: 109, keyTargets: 'Kuwait Airport, power/desalination plants, military camps', patriotDepleted: null, flag: '🇰🇼' },
  { country: 'Qatar', lat: 25.35, lon: 51.18, ballistic: 203, cruise: 0, drones: 87, totalMunitions: 290, killed: 4, wounded: 16, keyTargets: 'Al Udeid AB, Ras Laffan LNG (struck twice)', patriotDepleted: null, flag: '🇶🇦' },
  { country: 'Bahrain', lat: 26.07, lon: 50.55, ballistic: 132, cruise: 0, drones: 234, totalMunitions: 366, killed: 3, wounded: 38, keyTargets: 'US 5th Fleet HQ, Isa Air Base', patriotDepleted: 87, flag: '🇧🇭' },
  { country: 'Jordan', lat: 31.24, lon: 36.51, ballistic: 60, cruise: 0, drones: 59, totalMunitions: 119, killed: 0, wounded: 19, keyTargets: 'Muwaffaq (Azraq) Air Base', patriotDepleted: null, flag: '🇯🇴' },
  { country: 'Iraq', lat: 33.22, lon: 43.68, ballistic: 20, cruise: 0, drones: 40, totalMunitions: 60, killed: 0, wounded: 0, keyTargets: 'Al Habbaniya (US-UK forces)', patriotDepleted: null, flag: '🇮🇶' },
  { country: 'Turkey', lat: 39.92, lon: 32.85, ballistic: 1, cruise: 0, drones: 0, totalMunitions: 1, killed: 3, wounded: 0, keyTargets: 'Incirlik AB vicinity; 4th missile intercepted March 30', patriotDepleted: null, flag: '🇹🇷' }
];

// ═══════════════════════════════════════════════════════
// INTERCEPTOR / MUNITION DEPLETION
// ═══════════════════════════════════════════════════════
WW.MUNITION_DEPLETION = {
  asOf: 'March 30, 2026',
  us: {
    totalCost: '~$18B through Day ~20',
    dailyBurnRate: '~$1.8B/day (first 6 days)',
    atacms_prsm: { label: 'ATACMS/PrSM', depleted: 46, remaining: 54 },
    thaad: { label: 'THAAD Interceptors', depleted: 40, remaining: 60 },
    missilesFired: '6,000+ in first 16 days',
    productionGap: 'Production cannot replace consumption rate — key strategic constraint driving April 7 deadline',
    source: 'WSJ March 17 / Small Wars Journal March 27'
  },
  gulf: [
    { country: 'UAE', system: 'Patriot', depleted: 75, remaining: 25, flag: '🇦🇪' },
    { country: 'Bahrain', system: 'Patriot', depleted: 87, remaining: 13, flag: '🇧🇭' },
    { country: 'Kuwait', system: 'Patriot', depleted: null, remaining: null, note: 'Severely depleted; exact % unconfirmed', flag: '🇰🇼' },
    { country: 'Saudi Arabia', system: 'Patriot', depleted: null, remaining: null, note: 'Active intercepts; stock status classified', flag: '🇸🇦' }
  ],
  source: 'JINSA / WSJ / Small Wars Journal'
};

// ═══════════════════════════════════════════════════════
// CARRIER STRIKE GROUP STATUS
// ═══════════════════════════════════════════════════════
WW.CSG_STATUS = [
  { name: 'CVN-72 Abraham Lincoln', status: 'ACTIVE', statusColor: 'success', location: 'Arabian Sea', note: 'Primary striking CSG; continuous air operations; positioned 1,200+ km south of Gulf (cannot safely enter Persian Gulf per Macgregor sourcing)' },
  { name: 'CVN-78 Gerald R. Ford', status: 'DAMAGED / REPAIR', statusColor: 'warning', location: 'Souda Bay, Crete', note: 'Fire March 12; DDG-81 Churchill escorting; limited operations; undergoing repairs' },
  { name: 'CVN-77 George H.W. Bush', status: 'ON STATION', statusColor: 'success', location: 'Arabian Sea', note: 'Arrived from Atlantic ~April 1–3; fully operational in theater; 3rd carrier now ON STATION; full complement embarked' },
  { name: 'HMS Prince of Wales (UK)', status: 'ADVANCED READINESS', statusColor: 'primary', location: 'Eastern Mediterranean', note: 'UK carrier; advanced readiness since March 7; Charles de Gaulle (France) possible redeployment from TBD' },
  { name: '2,500 US Marines (31st MEU)', status: 'DEPLOYED', statusColor: 'success', location: 'Region', note: 'Deployed March 28; 7 additional DDGs independently deployed; Marines on standby for potential Hormuz Island operation' }
];

// ═══════════════════════════════════════════════════════
// HIGH-VALUE TARGET / DECAPITATION TRACKER
// ═══════════════════════════════════════════════════════
WW.HVT = [
  { name: 'RADM Alireza Tangsiri', role: 'IRGC Navy Commander', status: 'KILLED', date: '2026-03-23', location: 'Bandar Abbas', source: 'Multiple / CENTCOM' },
  { name: 'Ali Fuladvand', role: 'Head of SPND (nuclear weapons research)', status: 'KILLED', date: '2026-03-28', location: 'Borujerd', source: 'ISW / WaPo' },
  { name: 'Naim Qassem', role: 'Hezbollah Secretary-General', status: 'UNKNOWN — MISSING', date: '2026-03-03', location: 'Beirut (strike)', source: 'ISW' },
  // Days 32–41 additions
  { name: 'Eshaghi', role: 'Adviser to Armed Forces General Staff Chief', status: 'KILLED', date: '2026-03-31', location: 'Iran', source: 'ISW Apr 1 / US-sanctioned Feb 2025 for illicit oil sales to China' },
  { name: 'Mohammad Sadeghi', role: 'IRGC Aerospace Force al-Ghadir Missile Command Engineering Officer', status: 'KILLED', date: '2026-03-31', location: 'Iran', source: 'Critical Threats Apr 1 / responsible for underground tunnel/missile infrastructure construction' },
  { name: 'Mehdi Vafaei', role: 'IRGC Quds Force Lebanon Corps Engineering Head', status: 'KILLED', date: '2026-04-01', location: 'Mahallat, Markazi Province', source: 'ISW Apr 1 / responsible for all underground facilities in Lebanon storing advanced Hezbollah weapons' },
  { name: 'Yusuf Ismail Hashem', role: 'Hezbollah Southern Front Commander', status: 'KILLED', date: '2026-04-01', location: 'Beirut', source: 'Critical Threats Apr 1 / directed ground combat in southern Lebanon; replaced Ali Karaki (killed Sep 2024)' },
  { name: 'Makram Atimi', role: 'Iranian Ballistic Missile Chief', status: 'KILLED', date: '2026-04-02', location: 'Kermanshah area', source: 'Wikipedia / Critical Threats Apr 2 / killed with several battalion commanders from central Iranian ballistic missile unit' },
  { name: 'Mohammad Ali Fathali Zadeh', role: 'Fatehin Battalions Commander (Brig. General)', status: 'KILLED', date: '2026-04-02', location: 'Iran', source: 'Critical Threats Apr 2' },
  { name: 'Kamal Kharrazi', role: 'Former Iranian FM / Senior Policy Adviser', status: 'SERIOUSLY INJURED', date: '2026-04-01', location: 'Tehran (home strike)', source: 'Wikipedia 2026 Iran war / wife killed in same strike' },
  { name: 'Maj. Gen. Khademi', role: 'IRGC Intelligence Chief', status: 'KILLED', date: '2026-04-06', location: 'Iran', source: 'ISW / Intel report Apr 6' },
  { name: 'Multiple Senior IRGC Commanders (Days 37–38)', role: 'IRGC Intelligence, Quds Force, Navy leadership', status: 'KILLED', date: '2026-04-05/06', location: 'Various', source: 'ISW / Intel report / includes Khademi (IRGC Intelligence Chief), Yazdan Mir (Quds Force senior), others' },
  { name: 'Ali Yusuf Harshi', role: 'Personal secretary and nephew of Hezbollah leader Naim Qassem', status: 'KILLED', date: '2026-04-09', location: 'Beirut', source: 'IDF announcement Apr 9' },
  { name: 'Approximately 10 additional senior IRGC commanders (Days 32–39)', role: 'Senior IRGC and Artesh leadership', status: 'KILLED', date: 'Days 32–39', location: 'Various', source: 'ISW / CTP / Wikipedia; Trump (Mar 30): "48+ top officials killed since Feb 28"; ISW tracking ongoing' }
];

// ═══════════════════════════════════════════════════════
// NUCLEAR SITES (CORRECTED)
// ═══════════════════════════════════════════════════════
WW.NUCLEAR_SITES = [
  { name: 'Natanz Enrichment Complex', lat: 33.7255, lon: 51.7273, desc: 'Primary uranium enrichment. Bunker-busted March 21; struck twice. Severely damaged.', status: 'SEVERELY DAMAGED' },
  { name: 'Fordow Fuel Enrichment Plant', lat: 34.8847, lon: 50.6136, desc: 'Deep underground near Qom. Named as dismantlement target in 15-point plan. Status unclear.', status: 'STATUS UNCLEAR' },
  { name: 'Bushehr Nuclear Power Plant', lat: 28.8300, lon: 50.9100, desc: 'Russian-built civilian reactor. Near-miss March 18 — crater 350m from reactor. 163 Rosatom staff evacuated.', status: 'NEAR-MISS' },
  { name: 'Isfahan UCF', lat: 32.5400, lon: 51.7700, desc: 'Uranium Conversion Facility. Struck early in campaign.', status: 'DAMAGED' },
  { name: 'Arak Heavy Water Reactor', lat: 34.1456, lon: 49.2325, desc: 'NO LONGER OPERATIONAL — IAEA confirmed March 30, 2026. Heavy water production halted.', status: 'DESTROYED' },
  { name: 'Parchin Military Complex', lat: 35.5200, lon: 51.7700, desc: 'Nuclear weapons research. Struck March 12. SPND head Ali Fuladvand killed nearby March 28.', status: 'STRUCK' },
  { name: 'Ardakan Yellowcake Plant', lat: 32.3100, lon: 54.0200, desc: 'Yellowcake production facility near Yazd. Struck March 27.', status: 'STRUCK' },
  { name: 'Khojir Missile Complex', lat: 35.5700, lon: 51.7400, desc: 'Key ballistic missile production facility. Struck with Natanz in March 21 operation.', status: 'STRUCK' },
  { name: 'Darkhovin NPP', lat: 31.1400, lon: 48.6700, desc: 'Nuclear power plant under construction. Within strike range.', status: 'INTACT' },
  { name: 'Bonab Research Reactor', lat: 37.3500, lon: 46.0600, desc: 'Small research reactor. Northwest Iran. No confirmed damage.', status: 'INTACT' }
];

// ═══════════════════════════════════════════════════════
// IRAN AIR BASES
// ═══════════════════════════════════════════════════════
WW.IRAN_BASES = [
  { name: 'Mehrabad AFB (Tehran)', lat: 35.6892, lon: 51.3114, icao: 'OIIE', desc: 'Tehran main military airfield' },
  { name: 'Isfahan AFB (8th TAB)', lat: 32.7507, lon: 51.8611, icao: 'OIFM', desc: '8th Tactical Air Base' },
  { name: 'Tabriz AFB (2nd TAB)', lat: 38.1339, lon: 46.2350, icao: 'OITT', desc: '2nd Tactical Air Base. Northwest Iran.' },
  { name: 'Shiraz AFB (7th TAB)', lat: 29.5392, lon: 52.5897, icao: 'OISS', desc: '7th Tactical Air Base' },
  { name: 'Bandar Abbas AFB', lat: 27.2183, lon: 56.3778, icao: 'OIKB', desc: 'Near Strait of Hormuz. Key naval-air base.' },
  { name: 'Dezful/Vahdati AFB', lat: 32.4344, lon: 48.3976, icao: 'OIAD', desc: 'Western Iran forward base' },
  { name: 'Kharg Island Airport', lat: 29.2589, lon: 50.3239, icao: 'OIBQ', desc: 'Island airstrip near oil terminal' }
];

// ═══════════════════════════════════════════════════════
// US/COALITION BASES
// ═══════════════════════════════════════════════════════
WW.US_BASES = [
  { name: 'Al Udeid Air Base', country: 'Qatar', lat: 25.1172, lon: 51.3147, desc: 'Primary CENTCOM air hub. ~10,000 personnel. 4 killed, 16 injured in Iranian strikes.' },
  { name: 'NSA Bahrain (5th Fleet)', country: 'Bahrain', lat: 26.2111, lon: 50.6011, desc: 'US 5th Fleet / NAVCENT. 3 killed, 38 injured. Directly targeted.' },
  { name: 'Isa Air Base', country: 'Bahrain', lat: 25.9183, lon: 50.5906, desc: 'Joint US/Bahrain air base.' },
  { name: 'Ali Al Salem Air Base', country: 'Kuwait', lat: 29.4511, lon: 47.5208, desc: 'Kuwait-based coalition air ops.' },
  { name: 'Camp Buehring', country: 'Kuwait', lat: 29.6963, lon: 47.4248, desc: 'Army forward staging base.' },
  { name: 'Al Dhafra Air Base', country: 'UAE', lat: 24.2400, lon: 54.5483, desc: 'Major ME hub. ~3,500 troops.' },
  { name: 'Prince Sultan Air Base', country: 'Saudi Arabia', lat: 24.0647, lon: 47.5808, desc: 'Hit multiple times; 25+ US personnel injured; E-3 Sentry damaged.' },
  { name: 'Thumrait Air Base', country: 'Oman', lat: 17.6669, lon: 54.0328, desc: 'Oman-based operations support.' },
  { name: 'Camp Lemonnier', country: 'Djibouti', lat: 11.5436, lon: 43.1486, desc: 'Horn of Africa operations hub. No confirmed attacks.' },
  { name: 'Diego Garcia', country: 'BIOT', lat: -7.1848, lon: 72.2440, desc: 'B-2 bomber staging base. Iran claimed attacks; US/UK denied damage.' },
  { name: 'NSA Souda Bay', country: 'Greece', lat: 35.5328, lon: 24.0733, desc: 'Mediterranean naval hub.' }
];

// ═══════════════════════════════════════════════════════
// OIL INFRASTRUCTURE
// ═══════════════════════════════════════════════════════
WW.OIL_INFRA = [
  { name: 'Kharg Island Terminal', lat: 29.2450, lon: 50.3100, type: 'Oil Export', desc: '90% of Iran oil exports. Military targets struck. Trump threatened complete obliteration.', status: 'STRUCK' },
  { name: 'Lavan Island Terminal', lat: 26.7953, lon: 53.3597, type: 'Oil Export', desc: 'Secondary offshore oil terminal.' },
  { name: 'Sirri Island', lat: 25.9003, lon: 54.5397, type: 'Oil Export', desc: 'Offshore oil export platform.' },
  { name: 'Bandar Abbas Port', lat: 27.1865, lon: 56.2808, type: 'Port/Terminal', desc: 'Major port city. Hormuz gateway.' },
  { name: 'Abadan Refinery', lat: 30.3400, lon: 48.2900, type: 'Refinery', desc: 'Largest Iranian refinery. Southwest Iran.' },
  { name: 'Arak Refinery', lat: 34.0900, lon: 49.6900, type: 'Refinery', desc: 'Central Iran refinery complex.' },
  { name: 'Ras Laffan LNG (Qatar)', lat: 25.9220, lon: 51.5394, type: 'LNG', desc: 'World largest LNG complex. Struck TWICE by Iranian missiles. Major EU energy supply risk.', status: 'STRUCK' }
];

WW.HORMUZ_POLYGON = [
  [56.08, 27.14], [56.30, 26.70], [56.50, 26.40], [56.70, 26.20],
  [57.00, 26.10], [57.30, 26.20], [57.50, 26.30], [57.30, 26.60],
  [57.00, 26.80], [56.70, 27.00], [56.40, 27.10], [56.08, 27.14]
];

// ═══════════════════════════════════════════════════════
// ESCALATION LADDER (CORRECTED)
// ═══════════════════════════════════════════════════════
WW.ESCALATION_LADDER = [
  { rung: 1, label: 'Political Crisis / Failed Diplomacy', status: 'past', desc: 'Oman negotiations collapsed Feb 28. Pakistan channel active but fragile. UNSC Hormuz resolution vetoed Apr 7 (Russia, China). Islamabad Accord under review.' },
  { rung: 2, label: 'Military Demonstrations', status: 'past', desc: 'Carrier deployments, Iranian missile tests, force posturing — all pre-war.' },
  { rung: 3, label: 'Hybrid/Proxy Warfare', status: 'active', desc: 'Houthis: 8 attacks on Israel since Mar 28; joint Iran-Hezbollah-Houthi operations. Iraqi militias: 19–41 attacks/day (2-week pause announced). Hezbollah ground war + first anti-ship cruise missile Apr 5. NOT past — ceasefire fragile, groups may resume.' },
  { rung: 4, label: 'Limited Conventional Strikes', status: 'ceasefire', desc: 'CEASEFIRE IN EFFECT as of Apr 7. 38 days of multi-front conventional war. Iran retaliating with diminished but persistent capability. IRGC warned it will resume if ceasefire collapses. Lebanon front actively ongoing despite ceasefire.' },
  { rung: 5, label: 'Large-Scale Air Campaign', status: 'ceasefire', desc: '13,000+ targets struck through Day 41. Steel factories, pharmaceutical firms, universities, bridges. Ceasefire paused strikes. Threatened to resume if Islamabad talks fail.' },
  { rung: 6, label: 'Military Energy-Adjacent Strikes', status: 'ceasefire', desc: 'Kharg Island military targets struck Apr 6–7 (bunkers, installations, ammo depots; ~50 locations); Ras Laffan LNG struck twice; Kuwait desalination; petrochemical facilities. OIL EXPORT INFRASTRUCTURE DELIBERATELY SPARED as negotiation leverage.' },
  { rung: 7, label: 'Telecom/Internet Infrastructure', status: 'current', desc: 'Iran internet ~1% since Day 1 (41 days). IRIB radio/TV strategic transmitter struck Apr 3. Telecom backbone systematically degraded. Judiciary criminalized filming US/Israeli strikes.' },
  { rung: 8, label: 'Nuclear-Adjacent Facilities', status: 'watch', desc: 'Arak confirmed destroyed (IAEA). Natanz bunker-busted. Bushehr NPP VICINITY STRUCK Apr 4 — 1 security guard killed, 198 Rosatom personnel evacuated; IAEA confirmed no radiation increase. Rosatom cumulatively evacuated 361 staff. CEASEFIRE does not address nuclear material.' },
  { rung: 9, label: 'Civilian Energy/Power Infrastructure', status: 'threatened', desc: 'NEXT THRESHOLD per VP Vance. Trump Apr 7 explicitly threatened EVERY power plant, bridge, and desalination facility. Energy infrastructure deliberately spared as ceasefire leverage. Will be executed if Islamabad talks fail and strikes resume. Economists: $190/bbl oil + global recession if executed.' },
  { rung: 10, label: 'Ceasefire Announced / Fragile', status: 'current', desc: 'CURRENT RUNG — Ceasefire announced Apr 7 (88 min before deadline). 2-week halt to US/Israeli strikes on Iran. IMMEDIATELY STRAINED: Operation Eternal Darkness in Lebanon (Apr 8, 254 killed); Iran re-closed Hormuz. Islamabad talks Apr 10. Lebanon exclusion is existential threat to deal.' },
  { rung: 11, label: 'Nuclear Threshold', status: 'threshold', desc: 'No nuclear weapons used. Independent analysts (Wilkerson, Hedges) warn of Israeli nuclear option if conventional objectives fail. Khamenei\'s fatwa against nuclear weapons removed with his death — constraint is gone per Macgregor and Abunimah.' }
];

// ═══════════════════════════════════════════════════════
// SCENARIOS (CORRECTED)
// ═══════════════════════════════════════════════════════
WW.SCENARIOS = [
  {
    id: 'A', name: 'Negotiated Ceasefire', nickname: '"Islamabad Accord"',
    probability: 38,
    desc: 'CEASEFIRE EXISTS but is fragile. Islamabad talks (Apr 10) produce a framework for 15-45 day extension. Lebanon controversy managed through ambiguity. Trump declares victory; Iran claims partial victory. Hormuz partially reopens. Key risk: Netanyahu refuses to halt Lebanon operations.',
    indicators: [
      { label: 'Ceasefire announced April 7 (88 min before deadline)', status: 'green' },
      { label: 'Islamabad talks confirmed for April 10', status: 'green' },
      { label: 'Pakistan/China brokered deal — both have incentive to sustain', status: 'green' },
      { label: 'Iran ambassador deleted Islamabad confirmation post (uncertainty)', status: 'amber' }
    ]
  },
  {
    id: 'B', name: 'Controlled Attrition', nickname: '"The Grinding Continues"',
    probability: 15,
    desc: 'Ceasefire collapses within days but war resumes at reduced intensity. Lebanon front drags into broader conflict. Pakistan talks drag on. Hormuz remains partially blocked. Neither side achieves decisive outcome. US munition gap accelerates constraint.',
    indicators: [
      { label: 'Operation Eternal Darkness already violated ceasefire spirit', status: 'amber' },
      { label: 'Iran re-closed Hormuz April 8 in response to Lebanon', status: 'amber' },
      { label: 'US cruise missiles "alarmingly low" (WaPo)', status: 'green' },
      { label: 'Oil $95–98 range (rebounding)', status: 'amber' }
    ]
  },
  {
    id: 'C', name: 'Exponential Escalation', nickname: '"The War Spreads"',
    probability: 22,
    desc: 'Lebanon exclusion blows up the ceasefire. Iran retaliates against Israel for Operation Eternal Darkness. Trump is forced to resume strikes. IRGC drops all restraint on Gulf energy infrastructure. Houthis close Bab al-Mandab. Both chokepoints blocked. Global recession triggered. Oxford Economics: $190/bbl Brent by August.',
    indicators: [
      { label: 'Lebanon: 254 killed in Operation Eternal Darkness (Apr 8)', status: 'green' },
      { label: 'Iran re-closed Hormuz April 8 — within hours of ceasefire', status: 'green' },
      { label: 'Pakistan held Iran back from retaliating night Apr 8–9 (barely)', status: 'amber' },
      { label: 'Hezbollah resumed rockets into northern Israel (Apr 9)', status: 'green' }
    ]
  },
  {
    id: 'D', name: 'Asymmetric Attrition', nickname: '"Iran Outlasts the Will"',
    probability: 20,
    desc: 'Ceasefire holds nominally but Hormuz remains restricted. Iran uses 2 weeks to reconstitute capability and negotiate from strength. US congressional pushback grows. F-15E/A-10 losses damage domestic support. US production gap forces unilateral restraint. Iran regime survives indefinitely via Hormuz leverage.',
    indicators: [
      { label: 'War Powers Resolution failed 47-53 in Senate', status: 'amber' },
      { label: 'US cruise missiles "alarmingly low" (WaPo)', status: 'green' },
      { label: 'Iran survived 39 days of bombardment without capitulating', status: 'green' },
      { label: 'Gulf SWFs reviewing US investments (Drop Site Apr 7)', status: 'amber' }
    ]
  },
  {
    id: 'E', name: 'Regime Collapse', nickname: '"The Shah Scenario"',
    probability: 5,
    desc: 'LESS LIKELY given ceasefire — Iran survived 41 days and extracted a deal. Artesh breaks with regime. IRGC fractures after leadership decapitation. Zero significant defections noted in 41 days despite 48+ senior officials killed, 13,000+ strikes. Atlantic Council: "Khamenei\'s removal could fortify the regime instead of weakening it." Ceasefire demonstrates regime retained negotiating leverage.',
    indicators: [
      { label: 'IRGC defections: ZERO confirmed in 41 days', status: 'grey' },
      { label: 'Iran extracted ceasefire — regime demonstrated durability', status: 'grey' },
      { label: 'Mosaic defense doctrine still operational', status: 'green' },
      { label: 'New Supreme Leader Mojtaba Khamenei: approved ceasefire', status: 'grey' }
    ]
  }
];

// ═══════════════════════════════════════════════════════
// DIME FRAMEWORK (CORRECTED)
// ═══════════════════════════════════════════════════════
WW.DIME = {
  us: { diplomatic: 7, information: 6, military: 7, economic: 5 },
  iran: { diplomatic: 2, information: 5, military: 2, economic: 1 },
  notes: {
    us_information: 'Downgraded 8→6: AN/FPS-132 early warning radar destroyed ($1.1B); 4 THAAD radars hit; 2 SATCOM terminals destroyed; sensor network degraded across 7+ sites',
    us_military: 'Downgraded 9→7: 16+ aircraft lost; $2–4B equipment destroyed; 11/20 bases damaged; THAAD redeployed from S. Korea; interceptors depleting faster than production',
    us_economic: 'Downgraded 6→5: $18B+ war cost (20 days); Pentagon requesting $200B supplemental; Brent at $116 hurting domestic; defense stocks down ~1%'
  }
};

// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// ORBAT — REBALANCED (losses for BOTH sides)
// ═══════════════════════════════════════════════════════
WW.ORBAT = [
  { category: 'Personnel', iran: '~610,000', us: '~45,000+ deployed', iranLoss: '21,000+ KIA (Red Crescent est.)', usLoss: '13 KIA / 347+ WIA', notes: '+2,500 Marines Mar 28; 15 additional injured Ali Al Salem AB Apr 5–6; F-15E WSO (colonel) recovered Apr 5; CENTCOM Apr 9: 13 KIA (7 by enemy fire)' },
  { category: 'Fighter/Strike Aircraft', iran: '~188 (near-zero sorties)', us: '~597 (w/ Israel)', iranLoss: 'Air force suppressed', usLoss: '3 F-15E (friendly fire Mar 1) + 1 F-15E shot down by Iran Apr 3 + 1 F-35 hit + 1 A-10 downed', notes: 'F-15E Apr 3: FIRST confirmed US combat aircraft shot down by Iranian fire in this war; A-10 downed near Strait of Hormuz (Apr 3)' },
  { category: 'Tanker/Support', iran: 'N/A', us: 'KC-135 fleet + special ops aircraft', iranLoss: 'N/A', usLoss: '1 KC-135 destroyed (6 KIA), 5 damaged; 2 MC-130 combat talons deliberately destroyed in Iran (CSAR Apr 4–5)', notes: 'MC-130s stuck in sand at abandoned Iranian airstrip; destroyed by own forces to prevent capture; ~$250M+ in CSAR aircraft destroyed' },
  { category: 'Special Operations', iran: 'N/A', us: 'CSAR / JSOC assets', iranLoss: 'N/A', usLoss: '4 MH-6 Little Birds destroyed (CSAR op Apr 3–5)', notes: 'Larry Johnson: CSAR operation total losses ~$400M in aircraft. 155 aircraft committed to rescue of F-15E WSO' },
  { category: 'ISR Drones', iran: 'Shahed depleted ~83%', us: 'MQ-9 Reaper fleet', iranLoss: 'Factories struck; factories producing again per IRGC Mar 20', usLoss: '14+ MQ-9 Reapers lost + 1 MQ-9 damaged at Muwaffaq Salti (Jordan) Apr 2', notes: '9 shot down by Iran; Ritter: US is now out of standoff weapons and sending aircraft into contested airspace' },
  { category: 'Radar / Early Warning', iran: '85–90% degraded', us: 'AN/FPS-132 + AN/TPY-2 + THAAD', iranLoss: 'AD network gutted but NOT destroyed — S-300 SAM site hit Kahrizak Apr 4', usLoss: '1 FPS-132 ($1.1B) + 5 THAAD-associated radars (~$2.5B); 40% of total THAAD inventory destroyed (Johnson)', notes: 'Johnson (Apr 3–6): US/Israel now have 1–2 min warning time vs 15–30 min pre-war; "effectively blinded"' },
  { category: 'SATCOM / Comms', iran: 'Internet ~1% for 41 days', us: 'AN/GSC-52B terminals', iranLoss: 'IRIB TV transmitter struck Apr 3', usLoss: '2 SATCOM terminals destroyed (Bahrain)', notes: '5th Fleet HQ comms impacted; radomes hit at multiple bases' },
  { category: 'Naval Assets', iran: '~9 remaining (92% lost)', us: '3 CSGs + 5th Fleet (GHWB on station)', iranLoss: '>150 vessels destroyed; Hezbollah fired first anti-ship cruise missile at Israeli warship Apr 5 (confirmed damage)', usLoss: 'CVN-78 Ford fire (Crete repairs); AQUA 1 tanker hit Apr 1', notes: 'Macgregor: US Navy parked "hundreds of miles south of the Gulf" — cannot enter Persian Gulf safely; 3rd carrier (GHWB) now on station' },
  { category: 'Bases / Sites', iran: 'Most bases struck', us: '~20 bases in region', iranLoss: 'Widespread destruction; 30+ universities struck; steel factories, petrochemical facilities', usLoss: '11+ bases hit / 17+ sites damaged; most US ME bases "all but uninhabitable" (NYT); Ali Al Salem hit Apr 5–6', notes: 'NYT confirmed most 13 US ME bases now uninhabitable; Kuwait bases worst affected' },
  { category: 'Air Defense Stocks', iran: '85–90% depleted', us: 'Patriot/THAAD/ID', iranLoss: 'Near-total depletion', usLoss: '40% THAAD; 75% UAE Patriot; 87% Bahrain Patriot', notes: 'THAAD redeployed from South Korea creating Pacific deterrence gap; coalition expended 2,400+ interceptors (Bloomberg Mar 30)' },
  { category: 'Missiles Expended', iran: 'Launch rate down ~90% but still firing; cluster munitions 70% of Israeli-targeting ballistic missiles (IDF)', us: '6,000+ fired in 16 days; Tomahawk inventory "alarmingly low" (WaPo)', iranLoss: '~130 launchers destroyed', usLoss: '46% ATACMS/PrSM inventory; 850+ Tomahawks ("alarmingly low")', notes: 'Production cannot replace consumption; Ritter: US out of standoff weapons; Johnson: US now flying into contested Iranian airspace out of necessity' },
  { category: 'Financial Cost', iran: 'Economy devastated; Rial: 1,616,000 IRR/USD (38× official rate)', us: '$895B annual budget', iranLoss: 'Oil exports halted; Ras Laffan $20B damage; food inflation +105%', usLoss: '$28B+ war cost through Day 41; $200B supplemental; CSAR ~$400M alone', notes: 'Equipment losses updated to $2.4–5.0B+ through Day 41; US gas $4/gallon; Goldman 30% recession probability' }
];

// ═══════════════════════════════════════════════════════
// RSS FEEDS (EXPANDED)
// ═══════════════════════════════════════════════════════
WW.RSS_FEEDS = [
  { name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', category: 'international', badge: 'verified' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'regional', badge: 'priority' },
  { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews', category: 'international', badge: 'verified' },
  { name: 'AP News', url: 'https://rsshub.app/apnews/topics/world-news', category: 'international', badge: 'verified' },
  { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', category: 'defense', badge: 'defense' },
  { name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/', category: 'regional', badge: 'regional' },
  { name: 'Iran International', url: 'https://www.iranintl.com/en/feed', category: 'opposition', badge: 'opposition' },
  { name: 'The War Zone', url: 'https://www.thedrive.com/the-war-zone/feed', category: 'defense', badge: 'defense' },
  { name: 'USNI News', url: 'https://news.usni.org/feed', category: 'defense', badge: 'naval' },
  { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml', category: 'international', badge: 'verified' }
];

// ═══════════════════════════════════════════════════════
// YOUTUBE CHANNELS
// ═══════════════════════════════════════════════════════
WW.YT_CHANNELS = [
  { name: 'CaspianReport', id: 'UCwnKziETDbHJtx78nIkfYug', category: 'osint', badge: 'OSINT' },
  { name: 'Ryan McBeth', id: 'UC8URMa1fI4rlaLc-Lhev2fQ', category: 'osint', badge: 'OSINT' },
  { name: 'Zeihan on Geopolitics', id: 'UCVpRKoP5Bx6MH6dZgpnxAIg', category: 'osint', badge: 'Geopolitics' },
  { name: 'FRONTLINE PBS', id: 'UC3ScyryU9Oy9Wse3a8OAmYQ', category: 'mainstream', badge: 'Documentary' },
  { name: 'Al Jazeera English', id: 'UCNye-wNBqNL5ZzHSJj3l8Bg', category: 'mainstream', badge: 'Regional' },
  { name: 'FRANCE 24 English', id: 'UCQfwfsi5VrQ8yKZ-UWmAEFg', category: 'mainstream', badge: 'International' }
];

WW.YT_INDEPENDENT = [
  { name: 'Richard Medhurst', id: 'UCB1u_wJThc3_e5J4VVj7hQQ', badge: 'UN Journalist',
    desc: 'British independent journalist. UN-accredited. Multilingual (EN/AR/FR/DE). On-the-ground coverage from Lebanon and Iran.',
    links: { substack: 'https://richardmedhurst.substack.com', x: 'https://x.com/richimedhurst', rumble: 'https://rumble.com/richardmedhurst' } },
  { name: 'Redacted (Clayton & Natali Morris)', id: 'UCoJhK5kMc4LjBKdiYrDtzlA', badge: 'Independent',
    desc: 'Former Fox/MSNBC anchors. Daily live coverage challenging official war narratives. Hosts Scott Ritter, Pepe Escobar.',
    links: { site: 'https://redacted.inc', x: 'https://twitter.com/TheRedactedInc', rumble: 'https://rumble.com/Redacted' } },
  { name: 'Judge Napolitano — Judging Freedom', id: 'UCDkEYb-TXJVWLvOokshtlsw', badge: 'Legal/Intel',
    desc: 'Former NJ Superior Court judge. Daily intel/military analyst interviews (Ritter, Macgregor, Larry Johnson).',
    links: { site: 'https://judgenap.com' } },
  { name: 'The Chris Hedges Report', id: 'UCEATT6H3U5lu20eKPuHVN8A', badge: 'Pulitzer',
    desc: 'Pulitzer Prize-winning journalist. Former NYT ME bureau chief. Deep structural analysis of US war policy.',
    links: { substack: 'https://chrishedges.substack.com' } },
  { name: 'Drop Site News', id: 'UCBMrOkjg3AbvLS5g1MhtlRQ', badge: 'Investigative',
    desc: 'Jeremy Scahill (Dirty Wars, Blackwater) + Ryan Grim. Direct Iranian official sources. Broke "US requested negotiations" story.',
    links: { site: 'https://www.dropsitenews.com', x: 'https://twitter.com/dropsitenews' } },
  { name: 'Electronic Intifada', id: 'UC9jY5IcAA99wX8MZQ9K9r-Q', badge: 'Regional',
    desc: 'Ali Abunimah + Jon Elmer. Daily livestreams: resistance-front military analysis, Hormuz updates, Lebanese front tactical.',
    links: { site: 'https://electronicintifada.net', x: 'https://twitter.com/intifada' } }
];

// ═══════════════════════════════════════════════════════
// OSINT ACCOUNTS (EXPANDED)
// ═══════════════════════════════════════════════════════
WW.OSINT_ACCOUNTS = [
  { name: '@sentdefender', platform: 'X', url: 'https://x.com/sentdefender', badge: 'OSINT',
    desc: 'OSINTdefender. Real-time conflict monitoring. Most-cited OSINT account for this conflict.' },
  { name: '@Aurora_Intel', platform: 'X', url: 'https://x.com/Aurora_Intel', badge: 'OSINT',
    desc: '24/7 from UK/Canada/Israel contributors. Security developments across the Middle East.' },
  { name: 'ISW / Critical Threats', platform: 'Web', url: 'https://www.criticalthreats.org/analysis', badge: 'Think Tank',
    desc: 'Twice-daily Iran war updates. Most detailed open-source BDA and ORBAT tracking.' },
  { name: 'Bellingcat', platform: 'Web', url: 'https://www.bellingcat.com', badge: 'Forensic',
    desc: 'Satellite imagery verification, geolocation, munitions ID. Gold standard OSINT.' },
  { name: '@ELIKIANSEN', platform: 'X', url: 'https://x.com/ELIKIANSEN', badge: 'OSINT',
    desc: 'Flight tracking, military aviation OSINT. Tanker sorties, bomber deployments, SIGINT.' },
  { name: '@LevantReport', platform: 'X', url: 'https://x.com/LevantReport', badge: 'OSINT',
    desc: 'Ground-level Lebanon/Hezbollah front reporting. Cited in ISW updates.' },
  { name: '@IntelCrab', platform: 'X', url: 'https://x.com/IntelCrab', badge: 'OSINT',
    desc: 'Military satellite imagery analyst. BDA and strike confirmation.' }
];

WW.KEY_ANALYSTS = [
  { name: 'Scott Ritter', role: 'Former UN Weapons Inspector / USMC Intel', freq: 'Redacted, Judging Freedom',
    value: 'Deep knowledge of Iranian military doctrine. Called attrition strategy. Predicted Hormuz closure timeline.' },
  { name: 'Pepe Escobar', role: 'Geopolitical analyst / Asia Times', freq: 'Danny Haiphong, Redacted',
    value: 'Sources inside Iranian diplomatic circles. Breaks back-channel details days before mainstream.' },
  { name: 'Col. Douglas Macgregor', role: 'Former Pentagon advisor', freq: 'Judging Freedom',
    value: 'US force readiness, ammo burn rates, CSG rotation, readiness degradation assessment.' },
  { name: 'Jeremy Scahill', role: 'Investigative journalist / Drop Site', freq: 'Drop Site News',
    value: 'Direct sources inside Iranian government. Broke "US requested negotiations" story.' },
  { name: 'Jon Elmer', role: 'Military analyst / Electronic Intifada', freq: 'EI Livestreams',
    value: 'Granular tactical analysis: Lebanese front, Hezbollah ops, Iranian missile/drone patterns.' }
];

WW.PODCAST_FEEDS = [
  { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', icon: '🎙️' },
  { name: 'The Diplomat', url: 'https://thediplomat.com/feed/', icon: '🌐' },
  { name: 'Drop Site News', url: 'https://www.dropsitenews.com/feed', icon: '🔍' }
];

// ═══════════════════════════════════════════════════════
// UNCONVENTIONAL INDICATORS (CORRECTED)
// ═══════════════════════════════════════════════════════
WW.INDICATORS = [
  { name: 'Pentagon Pizza Index', icon: '🍕', status: 'ELEVATED', statusColor: 'warning',
    desc: 'Late-night food delivery to Pentagon/Langley correlates with crisis activity.',
    link: 'https://www.bbc.com/future/article/20220330-the-pizza-metre-and-other-novel-ways-of-predicting-events', source: 'External Monitor' },
  { name: 'GPS Jamming Zones', icon: '📡', status: 'CRITICAL — 1,650+ ships affected', statusColor: 'danger',
    desc: '1,735 GPS interference events on 655 vessels (Lloyd\'s List Intel). 30+ jamming clusters. Data from March 7 — likely worse now.',
    link: 'https://gpsjam.org', source: 'GPSJam.org / Windward AI' },
  { name: 'Oil Price', icon: '🛢️', status: 'VOLATILE — $95–98/bbl Brent (rebounding)', statusColor: 'warning',
    desc: 'Brent dropped 13% to ~$95 on ceasefire (Apr 8); rebounding to ~$97–98 Apr 9 as Hormuz re-closed. Peak: $144.42 physical (Apr 7 record). Dow surged 1,300+ pts Apr 8.',
    link: null, source: 'TradingView', hasWidget: true },
  { name: 'NOTAMs / Flight Restrictions', icon: '✈️', status: 'ACTIVE', statusColor: 'danger',
    desc: 'Multiple TFRs over Iran, Gulf, Eastern Med. Iranian airspace fully closed.',
    link: 'https://tfr.faa.gov', source: 'FAA TFR System' },
  { name: 'Iran Internet Status', icon: '🌐', status: 'NEAR-TOTAL BLACKOUT — Day 41', statusColor: 'danger',
    desc: '~1% of normal traffic since Day 1 (41 consecutive days). Total population-scale information blackout.',
    link: 'https://radar.cloudflare.com/traffic/ir', source: 'Cloudflare Radar' },
  { name: 'Seismic Activity (Iran)', icon: '🔴', status: 'MONITORING', statusColor: 'primary',
    desc: 'USGS data for Iran bounding box. Large munitions/bunker-busters register as seismic events.',
    link: null, source: 'USGS', hasSeismic: true },
  { name: 'AIS Ship Blackouts', icon: '🚢', status: 'CRITICAL — 400+ tankers stuck in Gulf', statusColor: 'danger',
    desc: '400+ tankers stuck in Gulf. Only 4 vessels passed Hormuz with AIS on ceasefire Day 1 (Kpler). Mine chart published — ships advised to avoid danger zones.',
    link: 'https://www.marinetraffic.com', source: 'MarineTraffic / Kpler / Windward' },
  { name: 'Defense Stock Movement', icon: '📈', status: 'MIXED — production constrained', statusColor: 'warning',
    desc: 'Top 5 US defense contractors collectively down ~1% since war start. Production cannot replace consumption. RTX/LMT underperforming.',
    link: null, source: 'TradingView', hasWidget: true },
  { name: 'Satellite Imagery', icon: '🛰️', status: 'ACTIVE', statusColor: 'primary',
    desc: 'Copernicus Sentinel-2 + Bellingcat BDA. ISW publishes verified satellite damage assessments.',
    link: 'https://browser.dataspace.copernicus.eu/', source: 'Copernicus / Bellingcat / ISW' },
  { name: 'Nuclear Radiation', icon: '☢️', status: 'ELEVATED WATCH', statusColor: 'warning',
    desc: 'Arak reactor destroyed (IAEA). Natanz bunker-busted. Bushehr near-miss. Contamination risk from conventional strikes on nuclear material.',
    link: 'https://map.safecast.org', source: 'Safecast / IAEA' },
  { name: 'BGP Routing Anomalies', icon: '🔌', status: 'CRITICAL — Iran dark 41 days', statusColor: 'danger',
    desc: 'Iran\'s internet backbone routing near-completely disrupted since Day 1. IODA shows near-zero traffic.',
    link: 'https://ioda.inetintel.cc.gatech.edu', source: 'IODA / Georgia Tech' },
  { name: 'Social Media Surge', icon: '📱', status: 'ELEVATED', statusColor: 'warning',
    desc: '#IranConflict #OperationEpicFury #HormuzCrisis trending. Track for crowd signals and breaking developments.',
    link: 'https://twitter.com/search?q=%23IranConflict', source: 'X/Twitter' }
];

WW.QUICK_LINKS = [
  { name: 'ISW Iran Hub', url: 'https://understandingwar.org/research/middle-east/', icon: '📋' },
  { name: 'CENTCOM', url: 'https://www.centcom.mil', icon: '🎖️' },
  { name: 'CSIS Analysis', url: 'https://www.csis.org/programs/latest-analysis-war-iran', icon: '🏛️' },
  { name: 'Liveuamap', url: 'https://liveuamap.com', icon: '🗺️' },
  { name: 'ACLED Data', url: 'https://acleddata.com/curated/data-us-iran-regional-conflict-daily', icon: '📊' },
  { name: 'ADS-B Military', url: 'https://globe.adsbexchange.com/?mil', icon: '✈️' },
  { name: 'MarineTraffic', url: 'https://www.marinetraffic.com', icon: '🚢' },
  { name: 'GPSJam', url: 'https://gpsjam.org', icon: '📡' },
  { name: 'Cloudflare Radar IR', url: 'https://radar.cloudflare.com/traffic/ir', icon: '🌐' },
  { name: 'IAEA Releases', url: 'https://www.iaea.org/newscenter/pressreleases', icon: '☢️' }
];

// ═══════════════════════════════════════════════════════
// ECONOMIC TIMELINE (NEW)
// ═══════════════════════════════════════════════════════
WW.TIMELINE = [
  { date: 'FEB 28', label: 'Day 1', color: 'danger', text: 'Operation Epic Fury begins. >1,000 strikes in 24 hrs. Oil surges +$12/bbl. Iran internet goes dark.' },
  { date: 'MAR 02', label: 'Day 3', color: 'danger', text: 'Hezbollah enters war. Air superiority declared over Iran. Iran retaliates against 14 countries.' },
  { date: 'MAR 05', label: 'Day 6', color: 'warning', text: 'Iran targets 14 countries. $11.3B in munitions expended. SWIFT restrictions expanded. Insurance triples.' },
  { date: 'MAR 11', label: 'Day 12', color: 'warning', text: 'IEA announces 400M barrel SPR release — largest in history. UNSC Resolution 2817 adopted 13-0.' },
  { date: 'MAR 12', label: 'Day 13', color: 'warning', text: 'CVN-78 Ford fire. KC-135 crash (6 KIA). Iran internet remains 98% down. Hormuz throughput plunges.' },
  { date: 'MAR 16', label: 'Day 17', color: 'danger', text: 'IDF ground invasion of southern Lebanon. Advancing toward Litani River. 1M Lebanese displaced.' },
  { date: 'MAR 18', label: 'Day 19', color: 'danger', text: 'Ras Laffan LNG (Qatar) struck again — $20B damage, 3–5 year recovery. Asian LNG spot prices double.' },
  { date: 'MAR 21', label: 'Day 22', color: 'nuclear', text: 'Natanz bunker-busted. 46% ATACMS/PrSM inventory expended. 40% THAAD interceptors used.' },
  { date: 'MAR 24', label: 'Day 25', color: 'primary', text: 'Trump 15-point plan delivered via Pakistan. Iran rejects March 25. Original deadline March 21 already passed twice.' },
  { date: 'MAR 28', label: 'Day 29', color: 'danger', text: 'Houthis enter war — missiles at Beersheba/Eilat. Ali Fuladvand (SPND chief) killed. 2,500 Marines deployed.' },
  { date: 'MAR 30', label: 'Day 31', color: 'danger', text: 'IAEA: Arak "no longer operational." Kuwait desalination hit. Trump threatens Kharg obliteration. April 7 deadline: 7 days.' },
  { date: 'MAR 31', label: 'Day 32', color: 'danger', text: 'Iraq: highest bridge in ME struck (Apr 2, collapses). Steel factories targeted. 5-salvo Iranian missile campaign begins. Brent futures high $120.' },
  { date: 'APR 01', label: 'Day 33', color: 'warning', text: 'CENTCOM confirms 11,000+ targets struck total. Trump April 1 speech. 15 weapons production sites struck. B1 Bridge Tehran-Karaj highway collapses (8 killed, 95 wounded).' },
  { date: 'APR 03', label: 'Day 35', color: 'danger', text: 'F-15E "Dude 44" SHOT DOWN by Iranian shoulder-fired SAM — FIRST US combat aircraft lost to Iranian fire. A-10 downed near Strait. 36-hour CSAR operation begins. ~$400M in aircraft lost.' },
  { date: 'APR 04', label: 'Day 36', color: 'nuclear', text: 'Bushehr NPP VICINITY STRUCK — 1 security guard killed; IAEA: no radiation. Mahshahr petrochemical zone: 5 killed, 170 injured. Rosatom evacuates 198 more staff.' },
  { date: 'APR 05', label: 'Day 37', color: 'danger', text: 'F-15E WSO (colonel) rescued alive after 36 hours. Ali Al Salem AB Kuwait: 15 Americans injured (Shahed-136 strike). Hezbollah: FIRST anti-ship cruise missile at Israeli warship (confirmed damage, 68nm offshore).' },
  { date: 'APR 07', label: 'Day 39', color: 'danger', text: 'Dated Brent physical hits RECORD $144.42/bbl. UNSC Hormuz resolution VETOED by Russia+China. Kharg Island military targets struck. Iran submits 10-point counter-proposal. CENTCOM: Maj. Gen. Khademi (IRGC Intel Chief) killed Apr 6.' },
  { date: 'APR 07', label: 'Day 39 — CEASEFIRE', color: 'primary', text: 'CEASEFIRE ANNOUNCED — 88 minutes before deadline. Trump posts on Truth Social ~6:32 PM ET. Pakistan/China brokered. Brent drops 13% — largest single-day decline since 2020.' },
  { date: 'APR 08', label: 'Day 40', color: 'danger', text: 'Israel launches Operation Eternal Darkness in Lebanon: 254 killed, 160 munitions, 100+ targets. Iran re-closes Hormuz in retaliation. Dow surges 1,300+ pts (+2.9%) on ceasefire. Brent: ~$95.' },
  { date: 'APR 09', label: 'Day 41', color: 'warning', text: 'Iran publishes Hormuz mine charts; routing ships near Larak Island. Hormuz ≤15 vessels/day cap confirmed. Islamabad talks confirmed for April 10. Brent rebounds to ~$97–98 as deal frays. Hezbollah fires dozens of rockets into northern Israel.' }
];

// ═══════════════════════════════════════════════════════
// US/COALITION LOSSES — THE OTHER SIDE OF THE WAR
// Sources: BBC/CSIS, WSJ/AEI, NYT satellite analysis, Anadolu,
//          CNN, India Today, SCMP, Wikipedia aviation losses,
//          TRT World, Military Watch Magazine
// ═══════════════════════════════════════════════════════
WW.US_LOSSES = {
  asOf: '2026-04-09',
  totalEquipmentCost: { low: 2400, high: 5000, unit: 'million USD', source: 'AEI (McCusker) / CSIS / Anadolu + Day 39 additions (F-15E, A-10, 2x MC-130, 4x MH-6, CSAR)' },
  baseDamage: { cost: 800, unit: 'million USD', source: 'BBC/CSIS March 20' },
  totalWarCost: '$28B+ through Day 41',
  supplementalRequested: '$200 billion',
  basesHit: 13,
  basesTotal: '~20 in region',
  sitesConfirmedDamaged: 17,
  sitesSource: 'NYT satellite imagery analysis March 11; Ali Al Salem hit again Apr 5–6',
  personnel: { killed: 13, wounded: 347, source: 'CENTCOM Admiral Cooper Apr 9: 13 US service members killed (7 by enemy fire). AP / Wikipedia + 15 injured Ali Al Salem AB Apr 5–6 + 3 injured in F-15E rescue op' },
  aircraftLost: 21,
  aircraftNote: 'Exceeds all US air campaign losses since Vietnam. F-15E shot down by Iranian fire Apr 3 (FIRST confirmed combat loss to Iranian fire this war). A-10 downed near Strait same day.',
  csarNote: 'CSAR operation (Apr 3–5) for F-15E WSO: 155 aircraft committed; 2 MC-130 combat talons + 4 MH-6 Little Birds destroyed; ~$400M total CSAR material cost (Larry Johnson, Judging Freedom Apr 5–6)',
  aliAlSalemNote: 'Apr 5–6: Iranian Shahed-136 drone strike on Ali Al Salem AB, Kuwait — 15 Americans injured. Most US ME bases now "all but uninhabitable" (NYT).',
  embassiesHit: [
    { name: 'US Embassy Riyadh', detail: '2 drones; CIA station inside compound also struck', source: 'Washington Post / Anadolu' },
    { name: 'US Embassy Kuwait City', detail: 'Drone + missile strike; closed until further notice; staff evacuated', source: 'Anadolu' },
    { name: 'US Consulate Dubai', detail: 'Drone hit parking lot; fire contained', source: 'Anadolu' }
  ],
  baseEvents: [
    { name: 'Ali Al Salem Air Base, Kuwait', date: '2026-04-05/06', detail: '15 Americans injured in Iranian Shahed-136 drone strike overnight; most US ME bases now "all but uninhabitable" (NYT)', source: 'Intel report / Wikipedia' }
  ],
  russiaIntel: 'Russia providing intelligence to Iran on US military positions (BBC/CSIS; confirmed by satellite image analysis showing precision of strikes on previously concealed equipment). Johnson/Ritter: China providing BeiDou navigation and real-time satellite targeting data.',
  aircraft: [
    { type: 'F-15E Strike Eagle (friendly fire)', lost: 3, damaged: 0, cause: 'Friendly fire — Kuwaiti F/A-18 shot down 3 over Kuwait (Mar 1)', cost: '$282M replacement', crew: 'All 6 ejected safely', source: 'WSJ / Reuters / CENTCOM' },
    { type: 'F-15E Strike Eagle — "Dude 44" (COMBAT LOSS)', lost: 1, damaged: 0, cause: 'Shot down by shoulder-fired missile (BBC) over Kohgiluyeh and Boyer-Ahmad Province, SW Iran. 494th Fighter Squadron, RAF Lakenheath. Apr 3, Day 35. First US combat aircraft shot down by Iranian fire in this war.', cost: '~$94M per unit', crew: 'Pilot recovered same day by CSAR; WSO (colonel) recovered Apr 5 after 36-hour rescue op; both alive', source: 'Iran International Apr 4 / Wikipedia F-15E rescue operation / CBS News', note: 'FIRST CONFIRMED US COMBAT AIRCRAFT LOSS TO IRANIAN FIRE THIS WAR' },
    { type: 'A-10 Thunderbolt II', lost: 1, damaged: 0, cause: 'Downed near Strait of Hormuz while providing CSAR support for F-15E rescue. Iran released footage claiming SAM shootdown. Apr 3, Day 35.', cost: '~$22M per unit', crew: 'Pilot ejected and recovered', source: 'CBS News Apr 3 / Wikipedia F-15E rescue operation' },
    { type: 'MC-130 Combat Talon (x2)', lost: 2, damaged: 0, cause: 'CSAR operation Apr 4–5: aircraft landed at abandoned airstrip in Iran during F-15E WSO rescue; both became stuck in sand; US forces deliberately destroyed them to prevent capture', cost: '~$70M each = $140M+', crew: 'Crews evacuated', source: 'Wikipedia F-15E rescue operation / ISW Apr 5' },
    { type: 'MH-6 Little Bird (x4)', lost: 4, damaged: 0, cause: 'CSAR operation Apr 3–5; destroyed during or after F-15E rescue operation', cost: '~$8M each = $32M+', crew: 'Crews evacuated', source: 'Larry Johnson (Facebook/Instagram Apr 5); Judging Freedom roundtable' },
    { type: 'F-35 Lightning II', lost: 0, damaged: 1, cause: 'Struck by Iranian IR-guided 358 SAM during combat sortie (Mar 16). Emergency landing.', cost: '~$120M per unit', crew: 'Pilot stable', source: 'CNN / Bloomberg / CENTCOM', note: 'FIRST F-35 EVER HIT BY ENEMY FIRE' },
    { type: 'KC-135 Stratotanker', lost: 1, damaged: 5, cause: '1 destroyed in mid-air collision over Iraq (Mar 12, 6 KIA); 5 damaged by Iranian missile at Prince Sultan AB (Mar 13)', cost: 'Irreplaceable — no new KC-135 produced since 1965', crew: '6 killed', source: 'CNN / CBS / WSJ' },
    { type: 'MQ-9 Reaper', lost: 14, damaged: 1, cause: '9 shot down by Iranian air defense; 1 destroyed on ground in Jordan by ballistic missile (Mar); 2 crashed; 2 other losses; 1 damaged at Muwaffaq Salti/Azraq AB Jordan Apr 2', cost: '~$16M each = $240M+', crew: 'Unmanned', source: 'WSJ / Bloomberg / ABC / Wikipedia aviation losses' },
    { type: 'E-3 Sentry (AWACS)', lost: 0, damaged: 1, cause: 'Damaged by Iranian missile strike at Prince Sultan AB (Mar 27)', cost: '$270M per unit', crew: 'Unknown', source: 'AP / Wikipedia' }
  ],
  radarAndComms: [
    { system: 'AN/FPS-132 Early Warning Radar', location: 'Al Udeid AB, Qatar', status: 'DAMAGED', cost: '$1.1 billion', detail: 'Long-range radar providing 3,000-mile detection radius. Struck Day 1 (Feb 28). Qatar confirmed hit.', source: 'NYT / Anadolu / TRT World' },
    { system: 'AN/TPY-2 (THAAD radar) #1', location: 'Muwaffaq (Azraq) AB, Jordan — Al-Salti Air Base', status: 'DESTROYED', cost: '~$485M', detail: 'Two 13-foot craters near radar. All 5 trailers destroyed or heavily damaged. Hit Mar 1-2. Confirmed by Larry Johnson roundtable.', source: 'CNN satellite imagery / Larry Johnson Judging Freedom' },
    { system: 'AN/TPY-2 (THAAD radar) #2', location: 'Ruwais, UAE', status: 'HIT — DAMAGE UNCLEAR', cost: '~$500M', detail: 'Vehicle sheds for THAAD radar struck Feb 28–Mar 1. 3 buildings damaged.', source: 'CNN satellite imagery' },
    { system: 'AN/TPY-2 (THAAD radar) #3', location: 'Sader, UAE', status: 'HIT — DAMAGE UNCLEAR', cost: '~$500M', detail: '4 buildings damaged at THAAD battery site. Radar presence confirmed since 2016.', source: 'CNN satellite imagery' },
    { system: 'AN/TPY-2 (THAAD radar) #4', location: 'Prince Sultan AB, Saudi Arabia', status: 'HIT', cost: '~$500M', detail: 'Satellite imagery shows smoke rising from radar position.', source: 'NYT / BBC' },
    { system: 'AN/TPY-2 (THAAD radar) #5 — Al Udeid/5th Fleet area', location: 'Bahrain / Al Udeid AB, Qatar', status: 'DESTROYED', cost: '~$500M', detail: 'Fifth radar confirmed by Larry Johnson roundtable (Apr 3). Johnson: "Five radars associated with THAAD batteries have been destroyed. We are now blinded."', source: 'Larry Johnson, Judging Freedom roundtable Apr 3 / Scott Ritter corroboration' },
    { system: 'AN/GSC-52B SATCOM Terminal #1', location: 'NSA Bahrain (5th Fleet HQ)', status: 'DESTROYED', cost: '~$10M (incl. deployment)', detail: 'Destroyed by Iranian one-way attack drone on Day 1 (Feb 28). Video confirmed by NYT.', source: 'NYT / Anadolu' },
    { system: 'AN/GSC-52B SATCOM Terminal #2', location: 'NSA Bahrain (5th Fleet HQ)', status: 'DESTROYED', cost: '~$10M', detail: 'Second terminal destroyed in same attack. Several large buildings also destroyed.', source: 'NYT / Anadolu' },
    { system: 'Radomes (multiple)', location: 'NSA Bahrain, Camp Arifjan, Prince Sultan AB', status: 'DAMAGED/DESTROYED', cost: 'Classified', detail: 'Multiple radar-protecting radomes hit across at least 3 bases. Equipment inside likely damaged.', source: 'BBC / NYT satellite' },
    { system: 'Camp Arifjan radar', location: 'Camp Arifjan, Kuwait', status: 'STRUCK', cost: 'Unknown', detail: 'Radar facilities struck. 6 US personnel killed at this base.', source: 'NYT / Anadolu' }
  ],
  strategicImplication: 'Iran\'s Day 1 strikes systematically targeted the US sensor and communications network. As of Day 41: 5 THAAD-associated radars destroyed (Johnson), US now has 1–2 minutes warning time vs 15–30 pre-war. Larry Johnson: "We are now blinded." US has depleted standoff weapons (cruise missiles "alarmingly low" per WaPo) and is now flying aircraft into contested Iranian airspace. F-15E shootdown and CSAR disaster (~$400M) confirm Iran\'s air defense network remains operational despite 41 days of SEAD operations. CENTCOM confirmed 13 KIA total (7 by enemy fire, Apr 9). Ceasefire pauses further losses but ceasefire is fragile.'
};

WW.IRAN_ACHIEVEMENTS = [
  // ── MILITARY ACHIEVEMENTS ──
  { category: 'Sensor Network Degradation', detail: 'Destroyed or damaged the AN/FPS-132 ($1.1B), 4 THAAD radars (~$2B), 2 SATCOM terminals, and multiple radomes across 7+ sites within first 72 hours. Systematically targeted US eyes and ears before US could fully activate defensive posture.', significance: 'CRITICAL', source: 'CNN / NYT / BBC' },
  { category: 'First F-35 Hit in Combat History', detail: 'Iranian IR-guided 358 SAM struck an F-35 during combat sortie March 16 — first time in the aircraft\'s history that enemy fire forced an emergency landing. Demonstrated Iranian SAM network retained capability despite sustained US SEAD campaign.', significance: 'HIGH', source: 'CNN / Bloomberg / CENTCOM' },
  { category: 'Hormuz De Facto Closure', detail: 'Closed Strait of Hormuz — 20% of global oil, 20–25% of global LNG, 35% of global urea/fertilizer. ~3,000 vessels waiting as of late March (S&P Global). Normal daily traffic of 120 ships reduced to near standstill. First closure of Hormuz in modern history.', significance: 'CRITICAL', source: 'S&P Global / Bloomberg / Al Jazeera' },
  { category: 'Hormuz Toll Booth', detail: 'Began charging $2M per voyage for IRGC-approved passage (Bloomberg, March 24). 26 ships transited under IRGC escort; vessels from China, Russia, Pakistan, India, Bangladesh, Iraq approved. US/Israeli-linked ships denied. Iran parliament moved to formalize toll legislation.', significance: 'CRITICAL', source: 'Bloomberg March 24 / NYT / Al Jazeera' },
  { category: 'Multi-Country Retaliation', detail: 'Struck targets in 14 countries simultaneously within first 6 days — largest geographic scope of Iranian military action in history. Operation True Promise 4 targeted US assets across 9 countries with ballistic missiles and drones.', significance: 'HIGH', source: 'CENTCOM / Wikipedia / Richard Medhurst' },
  { category: 'US Base Damage', detail: 'Hit 11 of ~20 US bases in region. 17+ sites confirmed damaged by satellite. $800M+ in infrastructure damage (BBC). 6 US personnel killed at Camp Arifjan alone.', significance: 'HIGH', source: 'NYT / BBC / CSIS' },
  { category: '16+ US Aircraft Destroyed', detail: '3 F-15E (friendly fire induced by combat chaos), 14+ MQ-9 Reapers (9 shot down), 1 KC-135 (6 KIA), 5 KC-135s damaged, 1 E-3 Sentry AWACS damaged. Exceeds US aircraft losses in Libya and Iraq air campaigns combined.', significance: 'HIGH', source: 'WSJ / India Today / SCMP / Wikipedia' },
  { category: 'Embassy Strikes', detail: 'Hit US Embassy Riyadh (CIA station damaged), US Embassy Kuwait, US Consulate Dubai. Unprecedented targeting of diplomatic facilities by a nation-state in a conventional conflict.', significance: 'HIGH', source: 'Washington Post / Anadolu' },
  { category: 'Cluster Munition Escalation', detail: 'By late March, ~70% of Iranian ballistic missiles targeting Israel carry cluster warheads (up from 50% on March 10 per IDF). Cluster munition killed 2 civilians in Ramat Gan apartment (March 17); killed 2 workers in Yehud (March 9). Strategy overwhelms Iron Dome via area denial.', significance: 'HIGH', source: 'ISW/Critical Threats March 27 / Al Jazeera' },
  // ── ATTRITION WARFARE ──
  { category: 'Tomahawk Depletion', detail: '850 Tomahawk missiles fired by the US — remaining inventory described as "alarmingly low" (Washington Post). Production rate cannot replace consumption pace. This is a strategic constraint on future US force projection globally, not just in Iran theater.', significance: 'CRITICAL', source: 'Washington Post / CSIS' },
  { category: '2,400+ Interceptors Expended', detail: 'As of March 30, coalition forces expended at least 2,400 interceptors — approaching known prewar stockpiles (Bloomberg). Iran\'s Shahed drones ($20–50k each) systematically exhausted high-cost US/allied interceptors ($1M–$3M each). Forced US to redeploy THAAD from South Korea, creating Pacific deterrence gaps.', significance: 'CRITICAL', source: 'Bloomberg March 30' },
  { category: 'Interceptor Depletion by Country', detail: 'Forced expenditure of 40% THAAD interceptors, 75% UAE Patriot, 87% Bahrain Patriot in 3 weeks. US cannot produce replacements fast enough. Saudi Arabia\'s Patriot battery at Prince Sultan AFB was among systems most strained.', significance: 'CRITICAL', source: 'WSJ / JINSA / Small Wars Journal' },
  { category: 'War Cost Imposition', detail: '$11.3B in first 6 days; $16.5B in first 12 days; $18B+ through Day 20. $1.4–$3.8B in equipment losses (AEI/CSIS). Pentagon requesting $200B supplemental. At $1.8B/day burn rate, production gap means costs continue accelerating.', significance: 'CRITICAL', source: 'CSIS / AEI / Pentagon briefings / Al Jazeera' },
  // ── TECHNOLOGICAL ADVANTAGES ──
  { category: 'BeiDou Navigation System (China)', detail: 'China provided Iran access to BeiDou satellite navigation — encrypted military signals less vulnerable to Western jamming, sub-meter accuracy, mid-flight redirection up to 2,000 km. Confirmed by French intel chief Alain Juillet and CIA Director Ratcliffe. Explains marked improvement in Iranian missile accuracy vs. June 2025 conflict.', significance: 'CRITICAL', source: 'Al Jazeera March 11 / Small Wars Journal / CNBC March 26' },
  { category: 'Underground Missile Cities', detail: 'Network of missile cities carved into granite at 440–500m depth (e.g., Imam Hussein Base, Yazd Province — Sheru granite formation). Underground rail connects assembly halls, storage depots, multiple exits. "Only fully activated in 2026." CENTCOM was reduced to striking bulldozers at tunnel entrances — proving core facilities survived.', significance: 'CRITICAL', source: 'CNN March 20 / WSJ March 5 / Scott Ritter / YouTube analysis' },
  { category: 'Mosaic Defense Doctrine', detail: 'IRGC divided into 31 autonomous regional commands, each with independent intel, stockpile, and C2. Semi-autonomous units act on pre-given instructions — decapitation strikes cannot halt operations. Iran\'s FM Araghchi (March 1): "Our military units are now in fact independent and somewhat isolated, and they are acting based on general instructions given in advance." Derived from study of US failures in Iraq.', significance: 'CRITICAL', source: 'Soufan Center March 9 / Al Jazeera / FM Araghchi statement' },
  // ── CYBER & ASYMMETRIC ──
  { category: 'Cyber Operations — 60+ Groups', detail: '60+ hacktivist groups active by March 2; Electronic Operations Room coordinating Cyber Islamic Resistance, KillNet, Ghosts of Palestine, RipperSec, 313 Team (Iraq), and others. Claimed SCADA access to Israeli/Gulf industrial systems. DDoS and data-wiping operations on financial, defense, and energy infrastructure. Collaborated with pro-Russian groups.', significance: 'HIGH', source: 'Palo Alto Unit42 / Axios March 17 / Resecurity March 24' },
  { category: 'GPS Jamming Campaign', detail: '1,735 GPS interference incidents affecting 655 vessels between war start and March 3 (Lloyd\'s List). 1,100+ commercial vessels experienced AIS disruptions on Day 1. Iran\'s BeiDou switch made it largely immune to its own jamming campaign, while US/Gulf GPS-dependent systems were degraded.', significance: 'HIGH', source: 'Lloyd\'s List / CNN March 6 / CNBC March 26' },
  // ── DIPLOMATIC & INFORMATION WINS ──
  { category: 'War Started During Negotiations', detail: 'Oman FM declared diplomatic "breakthrough" on Feb 27. Iran\'s FM Araghchi said deal "within reach" on Feb 25. US-Israel struck anyway on Feb 28. This diplomatic context — war launched during active negotiations — drove 15+ countries to condemn the strikes and gave Iran the global narrative.', significance: 'HIGH', source: 'Reuters Feb 28 / CGTN / Wikipedia' },
  { category: 'US Vetoed Ceasefire Resolution', detail: 'US vetoed Russia\'s UNSC resolution calling for an end to all hostilities (March 11). Only passed UNSC Resolution 2817 condemning Iran (13-0, China/Russia abstaining). US veto of ceasefire gave Iran the narrative that the rules-based order was structurally rigged against it.', significance: 'HIGH', source: 'NYT UNSC March 11 / Tempo.co March 12' },
  { category: 'EU Refused Hormuz Role', detail: 'EU leaders explicitly rejected military involvement in Strait of Hormuz (March 16). NATO Article 5 not invoked. Only direct US allies participated. 15+ countries condemned US-Israel strikes including China, Russia, Turkey, South Africa, Brazil, Pakistan, Indonesia, Malaysia, Iraq, Syria, and multiple African nations.', significance: 'HIGH', source: 'Al Jazeera March 16 / Reuters / CGTN' },
  { category: 'PMF Into Iranian Territory', detail: 'On March 29, a convoy of Iraqi Popular Mobilization Forces (PMF) entered Khorramshahr, Iran — indicating Iran was prepared to deploy PMF forces on its own soil if a US ground invasion materialized. Signals a new phase of Axis of Resistance integration.', significance: 'HIGH', source: 'Multiple OSINT / Wikipedia' },
  // ── PARTNER SUPPORT (RUSSIA/CHINA) ──
  { category: 'Russia Confirmed Arms Supply', detail: 'Russian FM Lavrov confirmed on French TV: "We have a technical-military cooperation agreement and within that framework, we have provided military equipment to Iran." CIA Director Ratcliffe confirmed intelligence sharing. Russia supplied improved Shahed drones and shared wave-attack tactics developed in Ukraine.', significance: 'CRITICAL', source: 'Kurdistan24 March 26 / Al Jazeera March 27 / CIA Director Ratcliffe' },
  { category: 'China: BeiDou + Chemical Precursors', detail: 'China provided BeiDou navigation access (dramatically improving accuracy) and — per CNA analysis — two sanctioned Iranian vessels picked up chemicals at Zhuhai port including sodium perchlorate (rocket propellant). Chinese electronics markets continued supplying inertial sensors and navigation modules for missile guidance.', significance: 'CRITICAL', source: 'CNA March 24 / Atlantic Council March 25 / Al Jazeera' },
  // ── REGIME SURVIVAL ──
  { category: 'Succession in 8 Days', detail: 'Khamenei killed Feb 28 alongside daughter, granddaughter, son-in-law. Interim Leadership Council announced March 1. Assembly of Experts appointed Mojtaba Khamenei as Supreme Leader March 8 — just 8 days after assassination. Zero significant IRGC defections. Atlantic Council: "Khamenei\'s removal could fortify the regime instead of weakening it."', significance: 'CRITICAL', source: 'Wikipedia / Reuters March 1 / Hudson Institute' },
  { category: 'Survival Under Bombardment', detail: 'Despite >11,000 targets struck and complete US air superiority, Iran launched 7 barrages March 28–29 alone. IRGC stated March 20: "Our missile industry deserves a perfect score — even under wartime conditions we continue missile production." Directly contradicted Netanyahu\'s March 19 claim Iran can no longer produce ballistics.', significance: 'CRITICAL', source: 'ISW / CENTCOM / Kurdistan24 March 20' },
  { category: 'Ceasefire Extracted After 39 Days — CRITICAL ACHIEVEMENT', detail: 'Iran survived 39 days of sustained bombardment (13,000+ strikes, Iranian air force grounded, 150+ naval vessels destroyed) and extracted a ceasefire without capitulating on its core demands. Iran\'s SNSC declared the ceasefire "an enduring defeat" for Washington. Both Pakistan (primary broker) and China (last-minute pressure) intervened to preserve Iran\'s position. Iran entered Islamabad talks with Hormuz leverage intact and Lebanon exclusion as its primary bargaining chip. Independent analysts (Ritter, Escobar, Galbraith/The Nation): ceasefire validates Iran\'s strategy of strategic patience and asymmetric denial.', significance: 'CRITICAL', source: 'CENTCOM / Wikipedia / Al Jazeera / The Nation / Scott Ritter YouTube Apr 9' },
  { category: 'Intelligence Advantage', detail: 'Precision of strikes on previously concealed US equipment demonstrated real-time targeting intelligence. Russia sharing satellite imagery of US naval/aircraft positions. UK Defence Secretary Healey: "It would be unsurprising to consider that Putin\'s hidden hand influences some of Iran\'s tactics." Trump acknowledged Russia "might be helping them a bit."', significance: 'HIGH', source: 'BBC / CSIS / UK Defence Secretary / Fox News (Trump)' }
];

// ═══════════════════════════════════════════════════════
// ECONOMIC IMPACT DATA (EXPANDED)
// ═══════════════════════════════════════════════════════
WW.ECONOMIC_IMPACT = {
  asOf: '2026-04-09',
  oilPrices: [
    { label: 'Pre-War Brent (Feb 27)', value: '~$69.41/bbl', note: 'Pre-war baseline' },
    { label: 'Brent Futures (Apr 7)', value: '~$109/bbl', note: '+57% from pre-war; volatile on deadline anxiety', highlight: true },
    { label: 'Dated Brent Physical (Apr 7)', value: '$144.42/bbl RECORD', note: 'ALL-TIME RECORD — highest since Platts began publishing in 1987; +106% from pre-war', highlight: true },
    { label: 'Brent (Apr 8 — ceasefire announced)', value: '~$95/bbl (-13%)', note: 'LARGEST SINGLE-DAY DECLINE SINCE 2020; ceasefire euphoria', highlight: true },
    { label: 'Brent (Apr 9 — Hormuz re-closed)', value: '~$97–98/bbl (+4%)', note: 'Rebound as Lebanon strikes + Iran re-blocks Hormuz reverses ceasefire price drop', highlight: true },
    { label: 'WTI May Futures (Apr 7)', value: '~$116/bbl (+$4.13, +3.67%)', note: '+78% from pre-war ~$65' },
    { label: 'Brent Peak (Mar 2026 roll)', value: '~$120/bbl', note: 'End of March roll period; March 2026 logged LARGEST SINGLE-MONTH crude oil gain in recorded history' },
    { label: 'Dubai Crude Peak', value: '$166.80/bbl', note: 'Asian benchmark; supply panic in East Asia', highlight: true },
    { label: 'US Gas (AAA, Apr 7)', value: '>$4.00/gallon', note: 'First above $4 since Aug 2022 (crossed Mar 31); diesel $5.45/gallon (+45%)' },
    { label: 'Oxford Economics Severe Scenario', value: '~$190/bbl by August', note: 'If Hormuz closed 6 months; above 2008 record of $147.50' }
  ],
  stockMarkets: {
    dow_apr8: 'Dow Jones +1,300+ points (+2.9%) on ceasefire — largest single-day gain in a year',
    sp500_apr8: 'S&P 500 and Nasdaq: 6th consecutive day of gains; Dow turned positive for 2026 YTD',
    apr9_reversal: 'Dow/S&P/Nasdaq futures down 0.1–0.3% Apr 9 as ceasefire frayed on Lebanon/Hormuz news'
  },
  emergencyResponse: {
    iea: { label: 'IEA Emergency SPR Release (Mar 11)', value: '400M barrels', note: 'Largest in IEA\'s 50-year history — 2.2× prior record of 182.7M barrels (2022). Unanimous 32-member agreement. US: 172M barrels. INSUFFICIENT — covers only 26 days of Hormuz-disrupted supply (15M bbl/day lost). Brent surged additional 17%+ after announcement.', source: 'NYT / Axios / Al Jazeera Mar 11 / CNBC' },
    unsc: { label: 'UNSC Hormuz Resolution VETOED (Apr 7)', date: '2026-04-07', detail: '11-2-2 vote; Russia and China vetoed 6th revised text; US/allies now lack UN legal cover for enforcement action', source: 'Euronews / PBS / Reuters Apr 7' },
    rasLaffan: { label: 'Ras Laffan LNG Complex — CATASTROPHIC DAMAGE', date: 'Mar 2 + Mar 18', detail: '$20B/year revenue loss; 3–5 year recovery (QatarEnergy CEO). LNG trains 4 and 6 damaged (combined 12.89M tons/year capacity). Force majeure extended up to 5 years. ~20% of global LNG supply disrupted.', source: 'Al Jazeera / Bloomberg / CNBC / EADaily', highlight: true },
    philippines: { label: 'Philippines State of Emergency (Mar 24)', date: 'March 24', detail: 'Fuel shortage + transport strike. Vietnam, Zimbabwe, Pakistan, Bangladesh, Nigeria also facing severe fuel shortages.', source: 'Semafor / Wikipedia Economic Impact' }
  },
  hormuzScale: {
    dailyOil: '13–15 million barrels/day (20% of global supply)',
    lngShare: '20–25% of global LNG; Qatar = 20% of global LNG supply',
    fertilizerShare: '35% of global urea/fertilizer (50% of global urea exports); 31% all maritime oil',
    currentTraffic: '4 ships with AIS on Day 1 of ceasefire (Apr 8, Kpler); re-blocked Apr 8–9; ≤15/day cap under IRGC approval',
    normalDaily: '~120–129 ships/day pre-war; down 93%+',
    vesselsWaiting: '400+ tankers stuck in Gulf (shipping company reports)',
    iranCap: 'Iran restricting to ≤15 vessels/day with IRGC approval; ~$1/barrel transit fee (Iran reconstruction share); Oman co-managing',
    approvedNations: 'Iran allows: Iraq, China, India, Russia, Pakistan. Blocked: US, Israel, UK and allies'
  },
  goldAndMarkets: {
    goldPrice: '$4,676.04/oz (Apr 7)',
    goldPreWar: '~$3,964/oz (Feb 27)',
    goldChange: '+18% from Feb 28',
    goldAllTimeHigh: '$5,602.22/oz (Jan 28, 2026 — pre-war tariff shock)',
    gsYearEnd: '$5,400/oz (Goldman Sachs target)',
    bitcoin: '~$67,337 — FAILED as safe haven; fell with Nasdaq (-47% from Oct 2025 ATH of $126K)',
    spFiveHundred: 'S&P 500 down ~9.3% since war began'
  },
  recessioRisk: {
    goldmanSachs: '30% US recession probability over 12 months',
    eyParthenon: '40% probability severe US downturn over 12 months',
    pncFinancial: '50%+ if oil reaches $150/barrel',
    oxfordEconomics: 'Prolonged war tips world into recession; Oxford severe scenario: global GDP +1.4% (1.2pp below baseline); world GDP contracts mid-year — first synchronised contraction outside pandemic/GFC in 40 years',
    imf: '"Global economic shock; all roads lead to higher prices and slower growth" (WEO due April 14)',
    uMichSentiment: '53.3 (March 2026 final) — lowest since Dec 2025; year-ahead inflation expectations: 3.4% → 3.8% largest one-month jump since April 2025',
    eiu: '"This is more of a pause in hostilities rather than any form of lasting resolution. It is a precarious arrangement." (EIU Pratibha Thaker, Apr 8)'
  },
  foodCrisis: {
    gccFood: '+15–20% consumer food prices in GCC states (Apr 7)',
    gccReliance: 'GCC states rely on Strait for 70% of caloric intake; 70% food imports',
    iranFood: 'Iran food inflation +105% YoY (oils/fats +219%, bread +140%, meat +135%, dairy +117%)',
    faoIndex: '128.5 (March 2026) — up 3 points from Feb; fertilizer nitrogen potentially doubling from 2024 levels'
  },
  munitionCosts: {
    tomahawks: { fired: 850, status: 'Inventory "alarmingly low"', source: 'Washington Post' },
    interceptors: { expended: '2,400+', note: 'Approaching prewar stockpiles (Bloomberg Mar 30); Shahed drones ($20–50k) systematically exhausted US interceptors ($1–3M each)' },
    warCost: { total: '$28B+ through Day 41', daily: '$1.8B/day', supplemental: '$200B requested', csarAddition: '~$400M CSAR op alone (Larry Johnson)', source: 'CSIS / DoD briefings' }
  },
  shippingInsurance: [
    { period: 'Pre-war', rate: '<0.25% hull value', note: 'Peacetime baseline (annual)' },
    { period: 'War outbreak', rate: '1–10% per voyage', note: '+400–4,000% surge; Lloyd\'s, Skuld, North P&I, American Club issued 7-day cancellation notices' },
    { period: 'April 9 (current)', rate: '1–10% per voyage', note: '$200M LNG tanker: $2–20M/voyage war risk premium; GIC Re (India) withdrew cover entirely; ceasefire provided brief relief; re-closing Hormuz reversing', highlight: true }
  ],
  lngMarkets: {
    asiaPrices: '>$26/MMBtu from late April through June (post-Ras Laffan damage); $30+/MMBtu if Hormuz closed 3 months; $40+/MMBtu if 6 months',
    europeTTF: '~€60–70+/MWh (was ~€61.25 March; heading toward €716–740/thousand cubic meters winter contracts)',
    europeStorage: '~30% capacity vs 5-year seasonal average of 41%'
  },
  supplyChain: {
    aluminum: 'LME aluminum +6% to $3,492/ton (near 4-year high); Gulf states produce 9% world aluminum; US imports 60% annually',
    helium: 'Qatar produces 35% world helium; prices surged $300 → $600–900/mcf (+100–200%); impacts semiconductors, MRI, space industry',
    sulfur: '+30%; tungsten +50%+ in March (tripled since Dec 2025)',
    flightsCancelled: '27,000+ flights cancelled total; 4,000/day peak; jet fuel doubled'
  },
  winners: [
    { actor: 'Russia', benefit: 'Oil price spike gave financial breathing room for Ukraine war. Trump forced to lift Russian oil sanctions. Russian tankers serving India through approved Hormuz corridor.' },
    { actor: 'China', benefit: 'Insulated by 4-month strategic oil reserves + coal. Hormuz access guaranteed (approved by Iran). Positioned as indispensable diplomatic mediator. BeiDou system enabling Iranian missile accuracy. Last-minute role in brokering ceasefire enhances China\'s global diplomatic standing.' }
  ],
  gdpImpact: 'Oxford Economics: prolonged war global GDP +1.4% (1.2pp below baseline). Goldman Sachs: US recession 30%. EY-Parthenon: 40%. If oil reaches $150, PNC Financial: >50% recession odds. Barclays: sustained $100/barrel reduces global GDP 0.2pp, raises inflation 0.7pp. Gulf states worst hit: -8% GDP in severe scenario. Ceasefire provided temporary relief (Brent -13% Apr 8, Dow +1,300 pts) but Hormuz re-closure reversing gains.'
};

// ═══════════════════════════════════════════════════════
// PRESS FREEDOM VIOLATIONS (Days 1–41)
// Source: Committee to Protect Journalists (CPJ) / Bloomberg /
//   Electronic Intifada / Drop Site News / Independent Media
// ═══════════════════════════════════════════════════════
WW.PRESS_FREEDOM = {
  asOf: '2026-04-09',
  source: 'Committee to Protect Journalists (CPJ) — Ongoing Timeline; Bloomberg; Electronic Intifada',
  totals: {
    journalistsKilled: 7,
    journalistsKidnapped: 1,
    journalistsTargetedOrHarassed: 16,
    mediaOutletsDamaged: 9,
    journalistsDetainedOrQuestioned: 11,
    journalistsObstructed: 19,
    iranInternetLevel: '~1% of normal (Day 1 through Day 41)'
  },
  notableViolations: [
    {
      country: 'United States',
      events: [
        'Apr 6: Trump threatened to JAIL journalists reporting that a second US Air Force officer was missing after being shot down',
        'Mar 14: FCC Chair Brendan Carr threatened to revoke broadcasters\' licenses over Iran war coverage; said outlets must "take the right course" or "lose their licenses"',
        'Pentagon (Hegseth) restricted press briefings and access; accused media of "trying to make Trump look bad"',
        'Trump threatened media companies with TREASON charges for "fake news" on the Iran war'
      ]
    },
    {
      country: 'Israel',
      events: [
        'Military censor issued new directives restricting live broadcasts during air raid sirens; prohibiting filming near security sites',
        'Multiple foreign journalists (Turkish CNN Turk, Al Arabiya, Al-Araby TV, i24 correspondent) detained/obstructed; Israeli media crews at same locations not interfered with — suggesting discriminatory enforcement by ethnicity/nationality',
        'Israeli photojournalists barred from sporting events under emergency restrictions',
        'Mar 28 (Day 29): 3 Lebanon journalists killed in Israeli airstrike'
      ]
    },
    {
      country: 'Gulf States',
      events: [
        'Qatar: Interior ministry arrested 300+ people for sharing images and "misleading information" about Iranian attacks',
        'UAE: Public prosecutor blocked social media accounts including Al Arabiya; warned against photographing missile strike damage',
        'Kuwait: Arrested people who shared footage "mocking" the army',
        'Bahrain: Arrested 4 people for filming Iranian attacks — called it "treason"',
        'Jordan: Banned all publication of information about "defense operations"'
      ]
    },
    {
      country: 'Iran',
      events: [
        'Internet shut to ~1% of normal levels on Day 1; judiciary criminalized filming US/Israeli strikes as "cooperation with a hostile enemy"',
        'Judiciary ordered asset freezes on 100+ journalists including 63 managers at Iran International (London) and 25 at Manoto TV',
        'Documentary filmmaker Mojgan Ilanlou arrested in early-morning raid without warrant'
      ]
    }
  ],
  kidnapping: { name: 'Shelly Kittleson', role: 'US freelancer', location: 'Baghdad', detail: 'Abducted; status unknown', source: 'CPJ' },
  informationEnvironment: 'Bloomberg (Mar 23): Iran war is "a black box" — no independent embedded journalists, near-total internet blackout means citizen journalism from inside Iran near-impossible. White House using gaming-style videos, AI-generated content, and memes to "sell" the war. Al Jazeera documented systematic attacks on mainstream outlets. Richard Medhurst: under UK/Austria investigation for up to 14 years in prison for reporting on Iran\'s perspective.'
};

window.WW = WW;
