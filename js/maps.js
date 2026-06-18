// ==========================================
// MAP DATABASE
// ==========================================
const MAP_DATABASE = {
  CAR: {
    name: "Carentan",
    image: "images/maps/map_carentan.webp",
    thumbnail: "images/maps/thumbnail/CAR.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Carentan (June 10-14, 1944)",
      description: "After landing on D-Day, the 101st Airborne Division was ordered to capture Carentan to link the Utah and Omaha beachheads. German 6th Fallschirmjäger Regiment under Colonel von der Heydte defended the town. The battle involved crossing causeways through flooded fields, with the 502nd PIR attacking from the southwest and the 327th GIR crossing the Douve River at Brévands for a double envelopment.",
      tactics: "The flooded terrain forced attackers along narrow causeways, making them vulnerable to German machine guns and mortars. US forces used artillery support and coordinated infantry assaults to capture the bridges and high ground. The fighting included the famous charge by Cole's 3rd Battalion across an open field under heavy fire, now known as 'Purple Heart Lane.'",
      significance: "Carentan was vital for connecting the two American beachheads into a continuous front. Its capture allowed Allied supplies to flow directly into Normandy and prevented German forces from splitting the invasion. The battle demonstrated the importance of airborne troops in seizing key objectives ahead of ground forces.",
      images: [
        {
          thumbnail: "images/history/carentan/carentan_1944_airborne_troops_kubelwagen_thumbnail.webp",
          full: "images/history/carentan/carentan_1944_airborne_troops_kubelwagen.webp",
          caption: "U.S. Airborne paratroopers in and on a captured VW Kübelwagen and by houses in Carentan, Battle of Normandy, 1944."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/carentan/carentan_1944_thumbnail.webp",
            full: "images/history/carentan/carentan_1944.webp",
            caption: "Troops in a jeep tow light artillery through a street in Carentan, France, the first French town taken by the Allied armies. 12 June, 1944. 101st Airborne Division."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/carentan/carentan_1944_chaplain_prayer_thumbnail.webp",
            full: "images/history/carentan/carentan_1944_chaplain_prayer.webp",
            caption: "The monument, draped with parachutes, is a World War 1 tribute from the citizens of Carentan to its soldier dead. 19 June, 1944. 101st Airborne Division."
          }
        ]
      }
    },
    
    // --- FIX 1: Exact Dimensions from MapMeta file ---
    // 40320 units * 5 sectors = 2016 meters
    widthMeters: 2016, 
    heightMeters: 2016, 
    // -------------------------------------------------

    gunRotations: { "us": -90, "ger": 90 },

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: -97254.0, gameY: 4366.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: -97253.0, gameY: 5262.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: -97252.0, gameY: 6096.0, radius: 500, team: "us", type: "point" }, 

      // --- AXIS GUNS ---
      { label: "", id: "GERMANY_A1", gameX: 96890.0, gameY: -513.99, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GERMANY_A2", gameX: 96890.0, gameY: 345.0, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GERMANY_A3", gameX: 96890.0, gameY: 1234.0, radius: 500, team: "ger", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "FARM RUINS", id: "B3", gameX: -68814.41, gameY: -37720.035, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "502ND START", id: "B1", gameX: -67076.41, gameY: -4670.035, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "BLACTOT", id: "B2", gameX: -65543.41, gameY: 39731.965, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "DERAILED TRAIN", id: "B6", gameX: -39381.41, gameY: -28975.035, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "RUINS", id: "B4", gameX: -26183.41, gameY: -2343.035, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "PUMPING STATION", id: "B5", gameX: -36748.41, gameY: 29821.965, radius: 5000.0, team: "us", type: "strongpoint" },
      
      // --- NEUTRAL SECTORS ---
      { label: "TRAIN STATION", id: "B9", gameX: 246.59, gameY: -27698.035, radius: 5000.0, team: "neu", type: "strongpoint" },
      { label: "TOWN CENTER", id: "B7", gameX: 1021.59, gameY: 1021.96, radius: 5000.0, team: "neu", type: "strongpoint" },
      { label: "CANAL CROSSING", id: "B8", gameX: 5892.59, gameY: 39387.965, radius: 5000.0, team: "neu", type: "strongpoint" },
      
      // --- AXIS SECTORS ---
      { label: "MONT HALAIS", id: "B12", gameX: 33828.59, gameY: -51343.035, radius: 3973.63, team: "ger", type: "strongpoint" },
      { label: "RAIL CROSSING", id: "B10", gameX: 44171.59, gameY: 6296.965, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "CUSTOMS", id: "B11", gameX: 40816.59, gameY: 34224.965, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "LA MAISON DES ORMES", id: "B15", gameX: 72222.59, gameY: -38476.035, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "RAIL CAUSEWAY", id: "B13", gameX: 75611.59, gameY: -5968.035, radius: 5495.63, team: "ger", type: "strongpoint" },
      { label: "CANAL LOCKS", id: "B14", gameX: 66826.59, gameY: 26456.965, radius: 5000.0, team: "ger", type: "strongpoint" }
    ]
  },
  DRI: { 
    name: "Driel", 
    image: "images/maps/map_driel.webp", 
    thumbnail: "images/maps/thumbnail/DRI.webp", 
    teams: { t1: "ALLIES", t2: "GERMANY" },
    history: {
      battle: "Battle of Arnhem - Oosterbeek Perimeter (September 17-25, 1944)",
      description: "During Operation Market Garden, the British 1st Airborne Division established a defensive perimeter around Oosterbeek after failing to capture the Arnhem road bridge. The railway bridge at Oosterbeek was blown up by German forces on September 17, just before British paratroopers reached it. Approximately 3,600 men defended a 3-mile perimeter centered on the Hotel Hartenstein divisional headquarters, holding out against repeated German attacks for nine days before evacuation.",
      tactics: "The British organized the perimeter into defensive pockets in houses and foxholes rather than a continuous line. German forces captured the Westerbouwing Heights overlooking the Driel ferry using captured French tanks, allowing them to observe and interdict river crossings. The flat open terrain and railway embankments provided limited cover. The 64th Medium Regiment provided critical artillery support via radio link, bombarding German positions around the perimeter.",
      significance: "Oosterbeek was the British 1st Airborne's last stand during Operation Market Garden. The failure to secure a bridgehead across the Rhine doomed the operation, as XXX Corps could not relieve the paratroopers. The evacuation across the Rhine (Operation Berlin) rescued about 2,400 men, but nearly 8,000 were killed or captured from the original 10,000. The battle demonstrated the risks of airborne operations without adequate ground support.",
      images: [
        {
          thumbnail: "images/history/driel/driel_1944_thumbnail.webp",
          full: "images/history/driel/driel_1944.webp",
          caption: "British crew manning a 6-pdr anti-tank gun of No. 26 Anti-Tank Platoon, 1st Border Regiment, in action at Oosterbeek, 20 September 1944. The gun successfully knocked out a German flamethrower tank."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/driel/driel_1944_british_paratroopers_thumbnail.webp",
            full: "images/history/driel/driel_1944_british_paratroopers.webp",
            caption: "Four British paratroopers moving through a shell-damaged house in Oosterbeek to which they had retreated after being driven out of Arnhem. Operation Market Garden (the Battle For Arnhem), 17-25 September 1944."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/driel/driel_1944_bridge_thumbnail.webp",
            full: "images/history/driel/driel_1944_bridge.webp",
            caption: "Four British paratroops of the 1st Para Squadron, Royal Engineers, clamber ashore from a rowing boat at Nijmegen after escaping from German captivity near Arnhem Bridge. Operation Market Garden, September 1944."
          }
        ]
      }
    }, 

// --- SCALE FIX: 1984 METERS ---
    // Although SectorWidth indicates 2016m, the Level Settings (HLLWorldSettings)
    // define MBPBounds as -99200 to 99200 units (1984 meters).
    // The visual map texture is clipped to these playable bounds.
    widthMeters: 1984, 
    heightMeters: 1984, 

    gunRotations: { "us": -180, "ger": 0 },
    gunSort: "x",

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // Y coordinates inverted (multiplied by -1) to match map image orientation

      // --- ALLIES GUNS ---
      { label: "", id: "GB_A1", gameX: -8563.06, gameY: -87734.95, radius: 500, team: "us", type: "point", rotation: 177.3 }, 
      { label: "", id: "GB_A2", gameX: -6264.19, gameY: -87408.29, radius: 500, team: "us", type: "point", rotation: -180 }, 
      { label: "", id: "GB_A3", gameX: -4660.69, gameY: -86962.99, radius: 500, team: "us", type: "point", rotation: -180 }, 

      // --- AXIS GUNS ---
      { label: "", id: "GERMANY_A1", gameX: -16081.69, gameY: 84361.05, radius: 500, team: "ger", type: "point", rotation: -1.3 }, 
      { label: "", id: "GERMANY_A2", gameX: -14599.28, gameY: 84316.64, radius: 500, team: "ger", type: "point", rotation: -1.3 }, 
      { label: "", id: "GERMANY_A3", gameX: -12759.99, gameY: 84396.84, radius: 500, team: "ger", type: "point", rotation: -7.6 },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "ORCHARDS", id: "B15", gameX: -39533.19, gameY: -70991.98, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "SCHADUWWOLKEN FARM", id: "B14", gameX: -2113.17, gameY: -72341.06, radius: 6500.0, team: "us", type: "strongpoint" },
      { label: "FIELDS", id: "B13", gameX: 41461.46, gameY: -71828.51, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "RIETVELD", id: "B10", gameX: -40615.84, gameY: -40909.70, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "SOUTH RAILWAY", id: "B11", gameX: 3826.84, gameY: -42206.75, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "MIDDEL ROAD", id: "B12", gameX: 41461.46, gameY: -38457.82, radius: 6000.0, team: "us", type: "strongpoint" },
      
      // --- NEUTRAL SECTORS ---
      { label: "BRICK FACTORY", id: "B9", gameX: -39703.02, gameY: -6122.76, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "RAILWAY BRIDGE", id: "B7", gameX: 2882.37, gameY: 3877.29, radius: 9000.0, team: "neu", type: "strongpoint" },
      { label: "GUN EMPLACEMENTS", id: "B8", gameX: 43301.99, gameY: 2530.00, radius: 5500.0, team: "neu", type: "strongpoint" },
      
      // --- AXIS SECTORS ---
      { label: "BOATYARD", id: "B1", gameX: -38518.71, gameY: 33980.62, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "BRIDGEWAY", id: "B6", gameX: 3880.96, gameY: 39449.43, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "RIJN BANKS", id: "B5", gameX: 39177.53, gameY: 42960.49, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "OOSTERBEEK APPROACH", id: "B2", gameX: -36028.54, gameY: 73330.25, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "ROSEANDER POLDER", id: "B3", gameX: 2809.07, gameY: 72870.87, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "KASTEEL ROSANDE", id: "B4", gameX: 38371.14, gameY: 71836.70, radius: 7000.0, team: "ger", type: "strongpoint" }
    ]
  },
  ELA: { 
    name: "El Alamein", 
    image: "images/maps/map_elalamein.webp", 
    thumbnail: "images/maps/thumbnail/ELA.webp", 
    teams: {
        t1: "BRITISH 8TH ARMY",
        t2: "AFRIKA KORPS"
    },
    history: {
      battle: "Second Battle of El Alamein (October 23 - November 11, 1942)",
      description: "Lieutenant-General Bernard Montgomery's Eighth Army attacked General Erwin Rommel's Panzerarmee Afrika in the Egyptian desert. The battle began with a 1,000-gun artillery barrage on October 23, with Allied forces advancing through deep Axis minefields known as the Devil's Gardens. The narrow front between the Mediterranean and the Qatara Depression forced frontal attacks against heavily fortified positions.",
      tactics: "Montgomery employed massive artillery superiority with over 800 guns firing 529,000 shells in the opening barrage. Engineers had to clear 24-foot gaps through 5 miles of minefields for tanks to advance. The battle progressed through five phases: the initial infantry break-in, the crumbling of Axis defenses, counter-attacks, Operation Supercharge (the armored breakthrough), and the final breakout. The 1st South African Division secured Miteirya Ridge while armored divisions engaged in tank duels with German Panzers.",
      significance: "El Alamein was the turning point of the North African Campaign and the first major British victory against German forces. It halted the Axis advance toward the Suez Canal and Middle Eastern oil fields, with Axis losses of 500 tanks and 30,000 prisoners. The victory restored Allied morale and paved the way for Operation Torch in North Africa and the eventual invasion of Sicily and Italy. Winston Churchill called it 'the end of the beginning.'",
      images: [
        {
          src: "images/history/el_alamein/el_alamein_1942.webp",
          caption: "A 25-pdr gun firing during the British night artillery barrage which opened Second Battle of El Alamein, 23 October 1942."
        }
      ],
      tacticalSituation: {
        images: [
          {
            src: "images/history/el_alamein/el_alamein_1942_tanks.webp",
            caption: "British tanks advancing during the Second Battle of El Alamein, October-November 1942."
          },
          {
            src: "images/history/el_alamein/el_alamein_1942_barrage.webp",
            caption: "General view of the British night artillery barrage which opened the second Battle of El Alamein. Infantry carriers and ambulances waiting to move up are silhouetted against the glare from the guns. 23 October 1942."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            src: "images/history/el_alamein/el_alamein_1942_british_soldier_v_victory.webp",
            caption: "A British soldier gives a V-for-Victory sign to German prisoners captured at El Alamein, 26 October 1942."
          }
        ]
      }
    }, 

    widthMeters: 1984, 
    heightMeters: 1984, 

    gunRotations: { "us": 90, "ger": -90 },

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "GB_A1", gameX: 91592.76, gameY: 6998.52, radius: 500, team: "us", type: "point", rotation: 90.0 }, 
      { label: "", id: "GB_A2", gameX: 90711.81, gameY: 9742.40, radius: 500, team: "us", type: "point", rotation: 92.4 }, 
      { label: "", id: "GB_A3", gameX: 89586.62, gameY: 13349.61, radius: 500, team: "us", type: "point", rotation: 90.0 }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: -91964.09, gameY: 3237.91, radius: 500, team: "ger", type: "point", rotation: -91.3 }, 
      { label: "", id: "GER_A2", gameX: -90921.03, gameY: 6183.05, radius: 500, team: "ger", type: "point", rotation: -91.3 }, 
      { label: "", id: "GER_A3", gameX: -94109.44, gameY: 9760.08, radius: 500, team: "ger", type: "point", rotation: -91.3 },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- AXIS SECTORS ---
      { label: "MITEIRIYA RIDGE", id: "B11", gameX: -79261.70, gameY: -36680.63, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "ARTILLERY GUNS", id: "B6", gameX: -71609.83, gameY: 8175.46, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "VEHICLE DEPOT", id: "B1", gameX: -68233.38, gameY: 37264.52, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "WATCHTOWER", id: "B12", gameX: -40818.59, gameY: -37838.59, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "EL MREIR", id: "B7", gameX: -37776.82, gameY: 2887.53, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "HAMLET RUINS", id: "B2", gameX: -37466.63, gameY: 37732.38, radius: 6000.0, team: "ger", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "VALLEY", id: "B13", gameX: 1970.44, gameY: -35186.07, radius: 8190.72, team: "neu", type: "strongpoint" },
      { label: "OASIS", id: "B8", gameX: -2900.92, gameY: 851.28, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "DESERT RAT TRENCHES", id: "B3", gameX: 4880.01, gameY: 40988.05, radius: 6000.0, team: "neu", type: "strongpoint" },

      // --- ALLIES SECTORS ---
      { label: "AIRFIELD HANGARS", id: "B14", gameX: 41085.37, gameY: -32927.33, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "AIRFIELD COMMAND", id: "B9", gameX: 38495.92, gameY: 4155.89, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "FUEL DEPOT", id: "B4", gameX: 43333.85, gameY: 35426.48, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "QUARRY", id: "B15", gameX: 78760.73, gameY: -41540.40, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "AMBUSHED CONVOY", id: "B10", gameX: 72480.45, gameY: 2526.44, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "CLIFFSIDE VILLAGE", id: "B5", gameX: 68942.24, gameY: 39028.40, radius: 6000.0, team: "us", type: "strongpoint" }
    ],
  },
  EBR: { 
    name: "Elsenborn Ridge", 
    image: "images/maps/map_elsenborn.webp", 
    thumbnail: "images/maps/thumbnail/EBR.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Elsenborn Ridge (December 16-26, 1944)",
      description: "During the Battle of the Bulge (Operation Wacht am Rhein), German forces launched a surprise offensive through the Ardennes on December 16, 1944. Sepp Dietrich's 6th Panzer Army, including the 1st SS Panzer Division with Joachim Peiper's kampfgruppe, attacked American positions at Elsenborn Ridge in heavy snow and freezing temperatures. The German advance was slowed by destroyed bridges, minefields, and the stubborn defense of the US 2nd and 99th Infantry Divisions.",
      tactics: "American forces employed defense in depth using field fortifications around villages and choke points. The 18-man reconnaissance platoon at Lanzerath Ridge delayed Peiper's advance for hours. American defenders used bazookas, anti-tank mines including 'daisy chains' dragged across roads, and heavy artillery support. Tank destroyers like the M36 Jackson and anti-tank guns fired from covered positions. The dense forest and frozen terrain channeled German armor onto roads where they were vulnerable to ambush.",
      significance: "Elsenborn Ridge was the only sector of the American front during the Battle of the Bulge where German forces failed to advance. This defense blocked three of five planned German routes to Antwerp, forcing the northern pincer to alter its plans and significantly slowing the advance. Historian John S.D. Eisenhower called the action of the 2nd and 99th Divisions 'the most decisive of the Ardennes campaign.' The failure to break through at Elsenborn Ridge contributed to the overall collapse of the German offensive.",
      images: [
        {
          src: "images/history/elsenborn_ridge/elsenborn_ridge_1944.webp",
          caption: "Discarded artillery shell casings litter a U.S. artillery position on Elsenborn Ridge during the Battle of the Bulge, December 1944."
        }
      ],
      tacticalSituation: {
        images: [
          {
            src: "images/history/elsenborn_ridge/elsenborn_ridge_1944_mortar_man_on_radio.webp",
            caption: "American mortar crewman on radio at Elsenborn Ridge during the Battle of the Bulge, December 1944."
          }
        ]
      }
    },

    // --- DIMENSIONS ---
    // Calculated from LayoutMeta: 5 sectors * 40000 units = 2000m.
    // 1 Game Unit = 1 cm. 100 units = 1m.
    widthMeters: 2000, 
    heightMeters: 2000, 

    // --- SORTING CONFIG ---
    // "x": Sorts guns Left-to-Right (West->East). Required for horizontal gun lines.
    // "y": (Default) Sorts Top-to-Bottom. Used for most other maps.
    gunSort: "x",

    gunRotations: { "us": 0, "ger": 180 },

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // --- METHOD: Y-INVERSION (Driel Method) ---
      // The visual map is South->North.
      // Raw Data: US is Negative Y (-91k). GER is Positive Y (+94k).
      // Adjustment: Multiply ALL Y-coordinates  by -1 to flip them.

      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: 1972.95, gameY: 91307.24, radius: 500, team: "us", type: "point", rotation: -2.4 }, 
      { label: "", id: "US_A2", gameX: 2864.32, gameY: 91026.45, radius: 500, team: "us", type: "point", rotation: -18.2 }, 
      { label: "", id: "US_A3", gameX: 3538.50, gameY: 91394.53, radius: 500, team: "us", type: "point", rotation: -24.3 }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: -7994.93, gameY: -94008.09, radius: 500, team: "ger", type: "point", rotation: -196.9 }, 
      { label: "", id: "GER_A2", gameX: -6399.25, gameY: -93262.29, radius: 500, team: "ger", type: "point", rotation: -177.2 }, 
      { label: "", id: "GER_A3", gameX: -4866.51, gameY: -94131.34, radius: 500, team: "ger", type: "point", rotation: 179.7 },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "99TH COMMAND CENTRE", id: "B17", gameX: -39637.50, gameY: 67610.96, radius: 7500.0, team: "us", type: "strongpoint" },
      { label: "GUN BATTERY", id: "B18", gameX: 420.0, gameY: 69376.0, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "U.S. CAMP", id: "B16", gameX: 50979.02, gameY: 67675.0, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "ELSENBORN RIDGE", id: "B19", gameX: -30950.0, gameY: 41967.96, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "FARAHILDE FARM", id: "B20", gameX: 10158.0, gameY: 30210.0, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "JENSIT PILLBOXES", id: "B21", gameX: 49674.99, gameY: 28085.95, radius: 7000.0, team: "us", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "ROAD TO ELSENBORN RIDGE", id: "B22", gameX: -40964.0, gameY: -3317.0, radius: 8000.0, team: "neu", type: "strongpoint" },
      { label: "DUGOUT TANKS", id: "B23", gameX: -9124.0, gameY: -2404.0, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "CHECKPOINT", id: "B25", gameX: 40444.91, gameY: -6529.14, radius: 5000.0, team: "neu", type: "strongpoint" },

      // --- AXIS SECTORS ---
      { label: "ERELSDELL FARMHOUSE", id: "B24", gameX: -41672.0, gameY: -38246.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "AA BATTERY", id: "B27", gameX: 8607.68, gameY: -33127.07, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "HINTERBERG", id: "B26", gameX: 39637.23, gameY: -39888.69, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "SUPPLY CACHE", id: "B29", gameX: -25666.0, gameY: -66300.0, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "FOXHOLES", id: "B28", gameX: 12223.86, gameY: -67172.27, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "FUEL DEPOT", id: "B30", gameX: 38049.76, gameY: -70408.04, radius: 7000.0, team: "ger", type: "strongpoint" }
    ],
  },
  FOY: { 
    name: "Foy", 
    image: "images/maps/map_foy.webp", 
    thumbnail: "images/maps/thumbnail/FOY.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Foy (December 20, 1944 – January 14, 1945)",
      description: "During the Battle of the Bulge, the village of Foy was occupied by German forces while the U.S. 101st Airborne Division held defensive positions in the Bois Jacques (Jack's Wood) just outside town. The 506th Parachute Infantry Regiment set up in the area on December 19, 1944, and faced intense fighting from elements of the German 2nd Panzer Division and 26th Volksgrenadier Division. After being relieved by General George S. Patton's U.S. Third Army, the 101st launched an assault to retake the town.",
      tactics: "On January 13, 1945, in difficult winter conditions, Companies E and I of the 506th PIR led the assault on Foy under covering fire. The attack required house-to-house fighting to clear snipers from the village buildings. Despite the open terrain exposing attackers to German machine guns and artillery, the coordinated infantry assault succeeded in capturing Foy with dozens of German soldiers taken prisoner. The next day, German forces counterattacked but failed to retake the village.",
      significance: "Foy was a key objective for breaking out from the Bastogne perimeter and advancing northward. Its capture allowed the 101st Airborne, with support from the U.S. 11th Armored Division, to gradually liberate territories north of Bastogne including Noville and Cobru. The battle demonstrated the resilience of airborne troops who, despite weeks of siege and brutal winter conditions, could still execute effective offensive operations. Foy changed hands four times during the battle, ultimately remaining in American control.",
      images: [
        {
          thumbnail: "images/history/foy/foy_1944_thumbnail.webp",
          full: "images/history/foy/foy_1944.webp",
          caption: "101st Airborne troops move out of Bastogne, December 31, 1944, after the siege was relieved by Patton's Third Army."
        }
      ],
      strategicContext: {
        images: [
          {
            src: "images/history/foy/foy_1944_101st_airborne.webp",
            caption: "101st Airborne Division receives airdropped supplies during the siege of Bastogne, December 1944."
          }
        ]
      }
    },

    // Verified standard dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 

    // Sort Left-to-Right
    gunSort: "x",

    // US (South) points North (180), GER (North) points South (0)
    gunRotations: { "us": 180, "ger": 0  },

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: 14095.0, gameY: -95545.0, radius: 500, team: "us", type: "point", rotation: -160.3 }, 
      { label: "", id: "US_A2", gameX: 15033.0, gameY: -96042.0, radius: 500, team: "us", type: "point", rotation: -160.3 }, 
      { label: "", id: "US_A3", gameX: 15846.0, gameY: -96295.0, radius: 500, team: "us", type: "point", rotation: -177.2 }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: 6178.13, gameY: 93955.51, radius: 500, team: "ger", type: "point", rotation: 14.0 }, 
      { label: "", id: "GER_A2", gameX: 7401.13, gameY: 93871.51, radius: 500, team: "ger", type: "point", rotation: 0.0 }, 
      { label: "", id: "GER_A3", gameX: 8783.13, gameY: 93871.70, radius: 500, team: "ger", type: "point", rotation: 0.0 },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- AXIS SECTORS ---
      { label: "ROAD TO RECOGNE", id: "B11", gameX: -49755.0, gameY: 74340.0, radius: 2750.0, team: "ger", type: "strongpoint" }, 
      { label: "COBRU APPROACH", id: "B13", gameX: 9952.0, gameY: 74787.0, radius: 3500.0, team: "ger", type: "strongpoint" },  
      { label: "ROAD TO NOVILLE", id: "B12", gameX: 38286.18, gameY: 76947.95, radius: 5343.75, team: "ger", type: "strongpoint" }, 
      { label: "COBRU FACTORY", id: "B10", gameX: -29988.0, gameY: 44676.0, radius: 5500.0, team: "ger", type: "strongpoint" }, 
      { label: "FOY", id: "B15", gameX: -9586.0, gameY: 34052.0, radius: 3250.0, team: "ger", type: "strongpoint" }, 
      { label: "FLAK BATTERY", id: "B8", gameX: 45241.0, gameY: 39594.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // --- NEUTRAL SECTORS ---
      { label: "WEST BEND", id: "B9", gameX: -53153.0, gameY: 12966.0, radius: 5500.0, team: "neu", type: "strongpoint" }, 
      { label: "SOUTHERN EDGE", id: "B3", gameX: -1114.0, gameY: -589.0, radius: 4738.37, team: "neu", type: "strongpoint" }, 
      { label: "DUGOUT BARN", id: "B14", gameX: 46085.04, gameY: 4721.09, radius: 4139.88, team: "neu", type: "strongpoint" }, 

      // --- ALLIES SECTORS ---
      { label: "N30 HIGHWAY", id: "B4", gameX: -38407.0, gameY: -31775.0, radius: 6250.0, team: "us", type: "strongpoint" }, 
      { label: "BIZORY-FOY ROAD", id: "B2", gameX: 10035.0, gameY: -39390.0, radius: 3500.0, team: "us", type: "strongpoint" }, 
      { label: "EASTERN OURTHE", id: "B1", gameX: 45845.0, gameY: -27822.0, radius: 4531.25, team: "us", type: "strongpoint" }, 
      { label: "ROAD TO BASTOGNE", id: "B7", gameX: -52862.0, gameY: -63773.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "BOIS JACQUES", id: "B5", gameX: -5582.0, gameY: -68237.0, radius: 5000.0, team: "us", type: "strongpoint" }, 
      { label: "FOREST OUTSKIRTS", id: "B6", gameX: 46279.0, gameY: -67141.0, radius: 5000.0, team: "us", type: "strongpoint" }
    ],
  },
H4: { 
    name: "Hill 400", 
    image: "images/maps/map_hill400.webp", 
    thumbnail: "images/maps/thumbnail/H4.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Hill 400 (December 6, 1944)",
      description: "Hill 400 was a 400-meter-high hill located one kilometer east of Bergstein, Germany, in the Hürtgen Forest, dominating the Rur River valley. As part of the Siegfried Line defenses, it was heavily fortified by German forces. During the Battle of Hürtgen Forest, multiple U.S. divisions (9th, 28th, and 8th Infantry Divisions) had failed to capture the hill. The 5th Armored Division's Combat Command Reserve also attempted to take it in early December but was repulsed, with the 47th Armored Infantry Battalion barely holding Bergstein against German counterattacks.",
      tactics: "The 2nd Ranger Battalion had relieved elements of the 112th Infantry Regiment on November 14, 1944. On December 6, the Rangers moved on Bergstein and subsequently took the strategic position of Hill 400 from defending troops of the 980th Grenadier Regiment of the 272nd Volksgrenadier Division. Working with the 5th Armored Division's Combat Command Reserve, the Rangers assaulted the hill in difficult winter conditions. They secured the hilltop and held it against German counterattacks until being relieved by the 13th Regiment. On the last day of the Hürtgen battle, the Germans retook the hill from the 13th Regiment.",
      significance: "Hill 400 was a key strategic position overlooking the Rur River valley and provided observation of the surrounding area. Its capture was essential for advancing toward the Roer River dams and breaking through the Siegfried Line. The Rangers' success demonstrated the effectiveness of specialized infantry units in difficult terrain where conventional divisions had failed. The hill changed hands multiple times during the Hürtgen Forest campaign, with the U.S. Army not securing it permanently until February 1945.",
      images: [
        {
          thumbnail: "images/history/hill_400/hill_400_1944_thumbnail.webp",
          full: "images/history/hill_400/hill_400_1944.webp",
          caption: "Weary infantrymen take a brief rest on a slope in the Hurtgen forest in Germany during the Hürtgen Forest campaign, November-December 1944. Left to right, Pfc. Maurice Berzon, Buffalo, N.Y., S Sgt. Bernard Spurr, Newark, Ohio, and S Sgt. Harold Glessler."
        }
      ]
    },

    widthMeters: 1984, 
    heightMeters: 1984, 
    gunSort: "y",
    gunRotations: { "us": -90, "ger": 90 },

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: -92742.050, gameY: -12583.729, radius: 500, team: "us", type: "point", rotation: -98.4 }, 
      { label: "", id: "US_A2", gameX: -92871.086, gameY: -11403.749, radius: 500, team: "us", type: "point", rotation: -95.6 }, 
      { label: "", id: "US_A3", gameX: -93164.120, gameY: -9681.098, radius: 500, team: "us", type: "point", rotation: -111.1 }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: 88119.170, gameY: -7863.742, radius: 500, team: "ger", type: "point", rotation: 81.7 }, 
      { label: "", id: "GER_A2", gameX: 88402.150, gameY: -6428.254, radius: 500, team: "ger", type: "point", rotation: 93.1 }, 
      { label: "", id: "GER_A3", gameX: 88974.860, gameY: -5394.126, radius: 500, team: "ger", type: "point", rotation: 113.3 },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "FEDERHECKE JUNCTION", id: "B1", gameX: -65367.926, gameY: -2874.167, radius: 4250.0, team: "us", type: "strongpoint" },
      { label: "CONVOY AMBUSH", id: "B2", gameX: -65875.18, gameY: 36966.816, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "STUCKCHEN FARM", id: "B3", gameX: -63938.484, gameY: -42413.004, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "BERGSTEIN CHURCH", id: "B4", gameX: -30580.357, gameY: -8420.501, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "ROER RIVER HOUSE", id: "B5", gameX: -38405.066, gameY: 43380.766, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "KIRCHWEG", id: "B6", gameX: -41257.29, gameY: -31282.14, radius: 3000.0, team: "us", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "FLAK PITS", id: "B7", gameX: 1384.489, gameY: 33584.805, radius: 3000.0, team: "neu", type: "strongpoint" },
      { label: "HILL 400", id: "B8", gameX: -1408.900, gameY: -4698.044, radius: 5000.0, team: "neu", type: "strongpoint" },
      { label: "SOUTHERN APPROACH", id: "B9", gameX: 948.213, gameY: -25170.994, radius: 3000.0, team: "neu", type: "strongpoint" },

      // --- AXIS SECTORS ---
      { label: "EASTERN SLOPE", id: "B10", gameX: 29662.375, gameY: 3406.845, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "TRAIN WRECK", id: "B11", gameX: 32129.537, gameY: -43600.098, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "PAPER MILL", id: "B12", gameX: 69319.79, gameY: -39032.61, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "ROER RIVER CROSSING", id: "B13", gameX: 64685.836, gameY: 33321.977, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "ZERKALL", id: "B14", gameX: 78823.555, gameY: 9569.677, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "ESELSWEG JUNCTION", id: "B15", gameX: 26549.63, gameY: 41028.504, radius: 3000.0, team: "ger", type: "strongpoint" }
    ],
  },
  HUR: {
    name: "Hürtgen Forest",
    image: "images/maps/map_hurtgen.webp", // Verify filename
    thumbnail: "images/maps/thumbnail/HUR.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Hürtgen Forest (September 19 – December 16, 1944)",
      description: "The Battle of Hürtgen Forest was a series of fierce battles fought between American and German forces in the Hürtgen Forest, a rugged 140 km² area about 5 km east of the Belgian-German border. The dense conifer forest, rough terrain, and poor weather conditions severely limited Allied air superiority and vehicular movement. German defenders had prepared the area with Siegfried Line bunkers, minefields, barbed wire, and booby-traps, using the terrain to great advantage.",
      tactics: "The forest terrain prevented proper use of Allied advantages in armor, mobility, and air support. Dense forest limited tank use and provided cover for German anti-tank teams with Panzerfaust weapons. The few roads and clearings allowed German machine gun, mortar, and artillery teams to pre-range their weapons accurately. American divisions suffered heavy casualties in the difficult conditions, with inexperienced replacements fed directly into combat. Engineers had to blast tank routes through the forest to enable armored support.",
      significance: "The Hürtgen Forest was the longest battle the U.S. Army fought on German soil during World War II. American commanders sought to secure the route to the Rur River dams to prevent German flooding of downstream areas. The battle demonstrated how well-prepared defenders in difficult terrain could negate Allied numerical and technological advantages. The campaign ultimately delayed Allied advances toward the Rhine and contributed to the timing of the Battle of the Bulge.",
      images: [
        {
          thumbnail: "images/history/hurtgen_forest/hurtgen_forest_1944_thumbnail.webp",
          full: "images/history/hurtgen_forest/hurtgen_forest_1944.webp",
          caption: "American infantry in the Hürtgen Forest during the Battle of Hürtgen Forest, September-December 1944."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/hurtgen_forest/hurtgen_forest_1944_muddy_road_thumbnail.webp",
            full: "images/history/hurtgen_forest/hurtgen_forest_1944_muddy_road.webp",
            caption: "American vehicles struggle through muddy roads in the Hürtgen Forest, demonstrating the difficult terrain conditions that hampered Allied mobility."
          },
          {
            thumbnail: "images/history/hurtgen_forest/hurtgen_forest_1944_ger_heavy_infantry_guns.webp",
            full: "images/history/hurtgen_forest/hurtgen_forest_1944_ger_heavy_infantry_guns.webp",
            caption: "German heavy infantry guns firing in the Hürtgen Forest during the repelling of American attacks. 22 November 1944."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/hurtgen_forest/hurtgen_forest_1944_damaged_trees.webp",
            full: "images/history/hurtgen_forest/hurtgen_forest_1944_damaged_trees.webp",
            caption: "Artillery-damaged trees during the Battle of Hürtgen Forest. Date between 1944 and 1945."
          }
        ]
      }
    },

    widthMeters: 1984,
    heightMeters: 1984,

    gunSort: "y",
    gunRotations: { us: -90, ger: 90 },

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // --- AXIS GUNS (Germany) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "GER_A3", gameX: 91198.0, gameY: -10428.0, radius: 500, team: "ger", type: "point", rotation: 90.0 }, // North
      { label: "", id: "GER_A2", gameX: 91198.0, gameY: -11227.0, radius: 500, team: "ger", type: "point", rotation: 90.0 }, // Mid
      { label: "", id: "GER_A1", gameX: 91198.0, gameY: -11963.0, radius: 500, team: "ger", type: "point", rotation: 90.0 }, // South

      // --- ALLIES GUNS (United States) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "US_A3", gameX: -92088.86, gameY: 4955.032, radius: 500, team: "us", type: "point", rotation: -95.6 },  // North
      { label: "", id: "US_A2", gameX: -93577.97, gameY: 3982.9868, radius: 500, team: "us", type: "point", rotation: -99.7 },  // Mid
      { label: "", id: "US_A1", gameX: -92188.766, gameY: 2897.9956, radius: 500, team: "us", type: "point", rotation: -98.4 },  // South

      // --- ALLIES SECTORS (Col 1 & 2) ---
      { label: "LUMBER YARD", id: "B1", gameX: -77356.0, gameY: -36029.0, radius: 4000.0, team: "us", type: "strongpoint" }, // Booster 9 (Scale 4.0 * 1000)
      { label: "RESERVE STATION", id: "B2", gameX: -78776.0, gameY: -2238.0, radius: 4500.0, team: "us", type: "strongpoint" }, // Booster 11 (Scale 4.5 * 1000)
      { label: "MAUSBACH APPROACH", id: "B3", gameX: -74423.0, gameY: 46733.0, radius: 4625.0, team: "us", type: "strongpoint" }, // Booster 20 (Scale 4.625 * 1000)
      { label: "THE RUIN", id: "B4", gameX: -42793.0, gameY: -26141.0, radius: 4400.0, team: "us", type: "strongpoint" }, // Booster 7 (Scale 5.5 * Explicit 800)
      { label: "KALL TRAIL", id: "B5", gameX: -35755.0, gameY: -2459.0, radius: 6000.0, team: "us", type: "strongpoint" }, // Booster 13 (Scale 6.0 * 1000)
      { label: "WEHEBACH OVERLOOK", id: "B6", gameX: -38278.0, gameY: 34416.0, radius: 5031.25, team: "us", type: "strongpoint" }, // Booster 19 (Scale 5.03125 * 1000)

      // --- NEUTRAL SECTORS (Col 3) ---
      { label: "THE SIEGFRIED LINE", id: "B7", gameX: -3711.0, gameY: -42305.0, radius: 4500.0, team: "neu", type: "strongpoint" }, // Booster 31 (Scale 4.5 * 1000)
      { label: "THE SCAR", id: "B8", gameX: -6935.0, gameY: -3328.0, radius: 3015.0, team: "neu", type: "strongpoint" }, // Booster 3 (Scale 2.25 * Explicit 1340)
      { label: "NORTH PASS", id: "B9", gameX: 6540.0, gameY: 49329.0, radius: 4347.0, team: "neu", type: "strongpoint" }, // Booster 17 (Scale 3.25 * Explicit 1337)

      // --- AXIS SECTORS (Col 4 & 5) ---
      { label: "SALIENT 42", id: "B10", gameX: 40632.0, gameY: -50244.0, radius: 3250.0, team: "ger", type: "strongpoint" }, // Booster 26 (Scale 3.25 * 1000)
      { label: "JACOB'S BARN", id: "B11", gameX: 37658.0, gameY: -8531.0, radius: 3500.0, team: "ger", type: "strongpoint" }, // Booster 15 (Scale 3.5 * 1000)
      { label: "HILL 15", id: "B12", gameX: 45628.0, gameY: 34330.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster 22 (Scale 4.5 * 1000)
      { label: "LOGGING CAMP", id: "B13", gameX: 64477.0, gameY: -51502.0, radius: 3750.0, team: "ger", type: "strongpoint" }, // Booster 28 (Scale 3.75 * 1000)
      { label: "HURTGEN APPROACH", id: "B14", gameX: 67776.0, gameY: -6558.0, radius: 3500.0, team: "ger", type: "strongpoint" }, // Booster 1 (Scale 3.5 * 1000)
      { label: "GROSSHAU APPROACH", id: "B15", gameX: 73663.0, gameY: 38895.0, radius: 3750.0, team: "ger", type: "strongpoint" }  // Booster 24 (Scale 3.75 * 1000)
    ],
  },
  JUN: {
    name: "Juno Beach",
    image: "images/maps/map_juno_beach.webp",
    thumbnail: "images/maps/thumbnail/JUN.webp",
    teams: { t1: "CANADA", t2: "GERMANY" },
    history: {
      battle: "Juno Beach Landings (June 6, 1944)",
      description: "Juno Beach was one of the five D-Day landing sectors, assigned to the 3rd Canadian Infantry Division under Major-General Rod Keller. The beach spanned 6 miles between Courseulles-sur-Mer and Saint-Aubin-sur-Mer. The Canadians faced heavy resistance from the German 716th Infantry Division's fortified Atlantic Wall positions, including concrete bunkers, machine gun nests, and beach obstacles deployed in a 'devil's garden' between the tide marks.",
      tactics: "The 3rd Canadian Infantry Division landed with support from the 2nd Canadian Armoured Brigade. Duplex Drive Sherman tanks swam ashore to support the infantry, though rough seas disrupted some landings. The 7th Brigade attacked Mike and Nan Green sectors while the 8th Brigade assaulted Nan White and Nan Red. Specialized armored vehicles including Churchill AVREs assisted in destroying fortified positions. Despite heavy casualties in the first waves—particularly at Bernières and Courseulles—the Canadians pushed through the Atlantic Wall defenses and advanced inland.",
      significance: "Juno Beach was crucial for connecting the British beachheads at Gold and Sword into a continuous Allied front. The 3rd Canadian Infantry Division suffered approximately 961 casualties on D-Day (340 killed, 574 wounded, 47 captured)—fewer than the predicted 2,000. The Canadians were the only Allied division to reach their final D-Day objectives, advancing further inland than any other force, though they later withdrew from some positions due to flanking concerns. Carpiquet airfield, an objective for D-Day, was eventually captured during Operation Windsor on July 5.",
      images: [
        {
          thumbnail: "images/history/juno_beach/juno_beach_landing.webp",
          full: "images/history/juno_beach/juno_beach_landing.webp",
          caption: "Personnel of Royal Canadian Navy Beach Commando 'W' landing on Mike Beach, Juno sector of the Normandy beachhead. June 6th, 1944. Most are wearing Mk III helmets. From the National Archives of Canada."
        },
        {
          thumbnail: "images/history/juno_beach/juno_beach_landing_second_wave_thumbnail.webp",
          full: "images/history/juno_beach/juno_beach_landing_second_wave.webp",
          caption: "Second wave troops of 9th Canadian Infantry Brigade, probably Highland Light Infantry of Canada, disembarking with bicycles from LCI(L)s onto 'Nan White' Beach at Bernières-sur-Mer, shortly before midday on 6 June 1944."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/juno_beach/juno_beach_wounded.webp",
            full: "images/history/juno_beach/juno_beach_wounded.webp",
            caption: "Wounded Canadian soldiers await evacuation from a casualty clearing station on Juno beach, June 6, 1944."
          },
          {
            thumbnail: "images/history/juno_beach/juno_beach_centaur_iv_thumbnail.webp",
            full: "images/history/juno_beach/juno_beach_centaur_iv.webp",
            caption: "A British Centaur IV of the Royal Marine Support Group towing an ammunition sled."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/juno_beach/juno_beach_reinforcements_thumbnail.webp",
            full: "images/history/juno_beach/juno_beach_reinforcements.webp",
            caption: "Canadian infantry reinforcements landing on Juno Beach. A multitude of soldiers from the Canadian infantry disembarking on the beaches."
          },
          {
            thumbnail: "images/history/juno_beach/juno_beach_pow_thumbnail.webp",
            full: "images/history/juno_beach/juno_beach_pow.webp",
            caption: "Corporal Victor Deblois of the Régiment de la Chaudière interrogating two German prisoners captured by Canadian troops at Juno Beach on D-Day. Other prisoners sit along the anti-tank wall."
          }
        ]
      }
    },

    widthMeters: 2000,
    heightMeters: 2000,

    gunSort: "x",
    gunRotations: { "ger": 180, "can": 0 },

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: -8018.951, gameY: -92411.57, radius: 500, team: "ger", type: "point", rotation: 180.00027 },
      { label: "", id: "GER_A2", gameX: -4803.604, gameY: -92667.13, radius: 500, team: "ger", type: "point", rotation: 180.00029 },
      { label: "", id: "GER_A3", gameX: -6399.269, gameY: -93328.29, radius: 500, team: "ger", type: "point", rotation: 180.00027 },

      // --- ALLIES GUNS ---
      { label: "", id: "CAN_A1", gameX: 7514.3633, gameY: 90534.19, radius: 500, team: "can", type: "point", rotation: 0.0 },
      { label: "", id: "CAN_A2", gameX: 9229.401, gameY: 91303.36, radius: 500, team: "can", type: "point", rotation: -22.474886 },
      { label: "", id: "CAN_A3", gameX: 6146.0317, gameY: 91758.02, radius: 500, team: "can", type: "point", rotation: 25.595324 },

      // --- CANADIAN SECTORS ---
      { label: "GRAYE-SUR-MER OUTSKIRTS", id: "B18", gameX: -39670.0, gameY: -69078.0, radius: 5500.0, team: "can", type: "strongpoint" },
      { label: "RADAR STATION", id: "B19", gameX: -2611.0, gameY: -67760.0, radius: 6000.0, team: "can", type: "strongpoint" },
      { label: "CHEM DE LA LAMPE", id: "B20", gameX: 39765.0, gameY: -70210.0, radius: 8000.0, team: "can", type: "strongpoint" },
      { label: "WEAPONS FACTORY", id: "B15", gameX: -39610.0, gameY: -41685.0, radius: 8000.0, team: "can", type: "strongpoint" },
      { label: "LE SENTIER SEULLES", id: "B16", gameX: -10.0, gameY: -41685.0, radius: 8000.0, team: "can", type: "strongpoint" },
      { label: "ROAD TO BENY-SUR-MER", id: "B17", gameX: 39765.0, gameY: -41685.0, radius: 8000.0, team: "can", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "GRAYE-SUR-MER", id: "B12", gameX: -39610.0, gameY: -4660.0, radius: 8000.0, team: "neu", type: "strongpoint" },
      { label: "LA SEULLES RIVER", id: "B13", gameX: -10.0, gameY: -4660.0, radius: 8000.0, team: "neu", type: "strongpoint" },
      { label: "MARKET SQUARE", id: "B14", gameX: 39765.0, gameY: -4660.0, radius: 8000.0, team: "neu", type: "strongpoint" },

      // --- AXIS SECTORS ---
      { label: "REGINA LANDING", id: "B6", gameX: -39610.0, gameY: 71720.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "BUNKER R612", id: "B7", gameX: -10.0, gameY: 71606.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "WN29", id: "B8", gameX: 39765.0, gameY: 71312.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "LA PLATINE", id: "B9", gameX: -39610.0, gameY: 40340.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "LA MARINA", id: "B10", gameX: -10.0, gameY: 40340.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "HEROULT HOUSE", id: "B11", gameX: 50583.223, gameY: 44190.965, radius: 8000.0, team: "ger", type: "strongpoint" }
    ]
  },
  KHA: {
    name: "Kharkov",
    image: "images/maps/map_kharkov.webp",
    thumbnail: "images/maps/thumbnail/KHA.webp",
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },
    history: {
      battle: "Third Battle of Kharkov (February 19 – March 15, 1943)",
      description: "Following the Soviet recapture of Kharkov on February 16, 1943, Field Marshal Erich von Manstein launched a counteroffensive known as the Donets Campaign. The German SS Panzer Corps, including the 1st SS Leibstandarte, 2nd SS Das Reich, and 3rd SS Totenkopf divisions, struck at overextended Soviet forces. The battle involved intense urban fighting as German forces recaptured Kharkov on March 15, 1943, and subsequently took Belgorod on March 18.",
      tactics: "Manstein's three-stage offensive targeted Soviet spearheads that had overextended themselves during Operation Star. The SS Panzer Corps used mobile warfare tactics, cutting Soviet supply lines and encircling enemy units. German forces exploited intelligence on Soviet strength to achieve tactical numerical superiority. The battle featured combined arms operations with Panzer divisions, infantry, and close air support from Ju 87 Stuka dive bombers. Urban combat in Kharkov required house-to-house fighting.",
      significance: "The Third Battle of Kharkov was the last major German victory on the Eastern Front. It temporarily stabilized the German front after the disaster at Stalingrad and delayed the Soviet advance. The success gave Hitler confidence to launch the offensive against the Kursk salient, which would become the Battle of Kursk - the largest tank battle in history. The battle demonstrated Manstein's skill in defensive counteroffensive operations but could not reverse Germany's strategic decline.",
      images: [
        {
          thumbnail: "images/history/kharkov/kharkov_1943.webp",
          full: "images/history/kharkov/kharkov_1943.webp",
          caption: "Artillerymen of the German 'Großdeutschland' division at a heavy field howitzer in a raised position, with an anti-aircraft machine gun in the front, 1943."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/kharkov/kharkov_1943_ss_colonel_witt.webp",
            full: "images/history/kharkov/kharkov_1943_ss_colonel_witt.webp",
            caption: "SS Colonel Witt standing at a car and reading a map during the Third Battle of Kharkov, 1943."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/kharkov/kharkov_1943_adolf_hitler.webp",
            full: "images/history/kharkov/kharkov_1943_adolf_hitler.webp",
            caption: "On 10 March 1943, during the Third Battle of Kharkov, Hitler flew under heavy security to Army Group South's headquarters at Zaporozh'ye, Ukraine to meet with Generalfeldmarschall Erich von Manstein. Seen here, Manstein greets Hitler on the airfield; on the right are Hans Baur and Luftwaffe Generalfeldmarschall Wolfram von Richthofen. This visit came as Manstein's counteroffensive was successfully recapturing Kharkov."
          }
        ]
      }
    },

    widthMeters: 1984, // Confirmed
    heightMeters: 1984,

    gunSort: "x",
    gunRotations: { "us": 0, "ger": 180 },

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: -3351.93, gameY: -90730.05, radius: 500, team: "ger", type: "point", rotation: -175.0 }, 
      { label: "", id: "GER_A2", gameX: -1593.68, gameY: -90886.69, radius: 500, team: "ger", type: "point", rotation: -172.8 }, 
      { label: "", id: "GER_A3", gameX: 206.03, gameY: -91623.68, radius: 500, team: "ger", type: "point", rotation: -159.1 }, 

      // --- ALLIES GUNS ---
      { label: "", id: "SOV_A1", gameX: 5643.66, gameY: 94554.93, radius: 500, team: "us", type: "point", rotation: 14.1 }, 
      { label: "", id: "SOV_A2", gameX: 6506.63, gameY: 94131.92, radius: 500, team: "us", type: "point", rotation: 0.0 }, 
      { label: "", id: "SOV_A3", gameX: 7607.47, gameY: 93717.47, radius: 500, team: "us", type: "point", rotation: 0.0 },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.
      
      // --- AXIS SECTORS ---
      { label: "WEHRMACHT OUTLOOK", id: "B1", gameX: -37313.91, gameY: -72972.37, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "HAY STORAGE", id: "B2", gameX: 4240.65, gameY: -71736.38, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "OVERPASS", id: "B3", gameX: 41180.39, gameY: -70416.95, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "RIVER CROSSING", id: "B4", gameX: -27116.35, gameY: -40003.02, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "BELGOROD OUTSKIRTS", id: "B5", gameX: 8105.97, gameY: -38673.01, radius: 9000.0, team: "ger", type: "strongpoint" },
      { label: "LUMBERYARD", id: "B6", gameX: 46774.79, gameY: -37490.91, radius: 3750.0, team: "ger", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "WATER MILL", id: "B7", gameX: -36761.05, gameY: 3563.89, radius: 3750.0, team: "neu", type: "strongpoint" },
      { label: "ST MARY", id: "B8", gameX: 6074.99, gameY: 633.23, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "DISTILLERY", id: "B9", gameX: 44449.21, gameY: 4542.49, radius: 3750.0, team: "neu", type: "strongpoint" },

      // --- ALLIES SECTORS ---
      { label: "BITTER SPRING", id: "B10", gameX: -37433.28, gameY: 38891.41, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "LUMBER WORKS", id: "B11", gameX: 7916.14, gameY: 39814.16, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "WINDMILL HILLSIDE", id: "B12", gameX: 46877.23, gameY: 41370.87, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "MARSH TOWN", id: "B13", gameX: -36517.52, gameY: 70661.75, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "SOVIET VANTAGE POINT", id: "B14", gameX: 8032.91, gameY: 70714.63, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "GERMAN FUEL DUMP", id: "B15", gameX: 41168.31, gameY: 70231.15, radius: 3750.0, team: "us", type: "strongpoint" }
    ],
  },
KUR: {
    name: "Kursk",
    image: "images/maps/map_kursk.webp",
    thumbnail: "images/maps/thumbnail/KUR.webp",
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },
    history: {
      battle: "Battle of Kursk (July 5 – August 23, 1943)",
      description: "The Battle of Kursk was a major World War II Eastern Front battle between German and Soviet forces near the Kursk salient in western Russia. Following the Third Battle of Kharkov, a 250 km by 160 km Soviet salient centered on Kursk protruded into German lines. Hitler launched Operation Citadel to encircle and destroy Soviet forces in the salient, hoping to regain the strategic initiative. The battle featured the largest tank engagements in history, including the Battle of Prokhorovka on July 12.",
      tactics: "The Soviets created a deep defensive system with multiple fortified belts, minefields, and anti-tank positions. German forces attacked on two fronts: the 9th Army from the north and the 4th Panzer Army and II SS Panzer Corps from the south. The Battle of Prokhorovka saw the Soviet 5th Guards Tank Army clash with the II SS Panzer Corps in one of history's largest tank battles. Soviet defenses absorbed the German attacks, and their operational reserves prevented breakthroughs.",
      significance: "The Battle of Kursk was a decisive Soviet victory and a turning point on the Eastern Front. For the first time, a major German offensive was stopped before achieving a breakthrough. The Soviet Union gained the operational initiative, which it held for the remainder of the war. The battle demonstrated the effectiveness of Soviet deep defensive tactics and the growing superiority of Soviet armored forces. German losses in men and equipment were irreplaceable, while Soviet industrial capacity allowed them to absorb and replace their losses.",
      images: [
        {
          thumbnail: "images/history/kursk/kursk_1943.webp",
          full: "images/history/kursk/kursk_1943.webp",
          caption: "Soviet Union, near Pokrovka - Operation Citadel - Group of light field howitzers 18/2 on PzKpfw II chassis (Sf) Wespe (Sd.Kfz. 124) standing on the front line in a field, 1943."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/kursk/kursk_1943_hünersdorff.webp",
            full: "images/history/kursk/kursk_1943_hünersdorff.webp",
            caption: "Soviet Union - Operation 'Citadel' - Major General von Hünersdorff during the Battle of Kursk, 1943."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/kursk/kursk_1943_soviet_victory.webp",
            full: "images/history/kursk/kursk_1943_soviet_victory.webp",
            caption: "Soviet soldiers inspect German Ferdinand tank destroyers destroyed on the Orel section of the front, July 1943."
          }
        ]
      }
    },

    // Confirmed 1984m
    widthMeters: 1984,
    heightMeters: 1984, 
    
    // Soviets (North) face South (0), Germans (South) face North (180)
    gunRotations: { "us": 0, "ger": 180 },
    gunSort: "x", 

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted (Raw Y * -1).
      // Radii = 1000 * RelativeScale3D.X
      
      // --- AXIS BASE (South / Bottom / Negative Inverted Y) ---
      // Sorted West to East
      { label: "ROAD TO KURSK", id: "B1", gameX: -31287.0, gameY: -68120.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster_1
      { label: "AMMO DUMP", id: "B14", gameX: -1729.0, gameY: -66294.0, radius: 5447.0, team: "ger", type: "strongpoint" }, // Booster 14
      { label: "EASTERN POSITION", id: "B13", gameX: 36100.0, gameY: -65758.0, radius: 6000.0, team: "ger", type: "strongpoint" }, // Booster 13

      // --- AXIS MID (Mid-South) ---
      { label: "RUDNO", id: "B2", gameX: -27089.0, gameY: -40069.0, radius: 6000.0, team: "ger", type: "strongpoint" }, // Booster 2
      { label: "DESTROYED BATTERY", id: "B15", gameX: -990.0, gameY: -39981.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster 15
      { label: "THE MUDDY CHURN", id: "B12", gameX: 41089.0, gameY: -42772.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster 12

      // --- NEUTRAL (Center) ---
      { label: "THE WINDMILLS", id: "B3", gameX: -26712.39, gameY: 4842.25, radius: 6000.0, team: "neu", type: "strongpoint" }, // Booster 3
      { label: "YAMKI", id: "B10", gameX: 9609.0, gameY: -3974.0, radius: 6973.0, team: "neu", type: "strongpoint" }, // Booster 10
      { label: "OLEG'S HOUSE", id: "B11", gameX: 39754.0, gameY: -7774.0, radius: 4500.0, team: "neu", type: "strongpoint" }, // Booster 11

      // --- ALLIES MID (Mid-North) ---
      { label: "PANZER'S END", id: "B4", gameX: -35117.0, gameY: 31958.0, radius: 6000.0, team: "us", type: "strongpoint" }, // Booster 4
      { label: "DEFENCE IN DEPTH", id: "B9", gameX: 1604.0, gameY: 34906.0, radius: 7022.0, team: "us", type: "strongpoint" }, // Booster 9
      { label: "LISTENING POST", id: "B8", gameX: 40413.0, gameY: 36000.0, radius: 7673.0, team: "us", type: "strongpoint" }, // Booster 8

      // --- ALLIES BASE (North / Top / Positive Inverted Y) ---
      { label: "ARTILLERY POSITION", id: "B5", gameX: -35117.0, gameY: 68921.0, radius: 6000.0, team: "us", type: "strongpoint" }, // Booster 5
      { label: "GRUSHKI", id: "B6", gameX: 7070.0, gameY: 68141.0, radius: 4961.0, team: "us", type: "strongpoint" }, // Booster 6
      { label: "GRUSHKI FLANK", id: "B7", gameX: 47151.0, gameY: 67169.0, radius: 4500.0, team: "us", type: "strongpoint" }, // Booster 7

      // --- GUN POSITIONS ---
      // GERMANS (South - Bottom of Map)
      { label: "", id: "GER_A1", gameX: -1583.09, gameY: -91085.52, radius: 500, team: "ger", type: "point", rotation: 164.8 }, // West
      { label: "", id: "GER_A2", gameX: -584.95,  gameY: -91323.79, radius: 500, team: "ger", type: "point", rotation: 181.9 }, // Middle
      { label: "", id: "GER_A3", gameX: 249.13,   gameY: -91934.51, radius: 500, team: "ger", type: "point", rotation: 175.6 }, // East

      // SOVIETS (North - Top of Map)
      { label: "", id: "SOV_A1", gameX: 3988.0, gameY: 91604.0, radius: 500, team: "us", type: "point", rotation: 0.0 }, // West
      { label: "", id: "SOV_A2", gameX: 4834.0, gameY: 91543.0, radius: 500, team: "us", type: "point", rotation: 0.0 }, // Middle
      { label: "", id: "SOV_A3", gameX: 5641.0, gameY: 91341.0, radius: 500, team: "us", type: "point", rotation: 0.0 }  // East
    ] 
  },
  MOR: {
    name: "Mortain",
    image: "images/maps/map_mortain.webp",
    thumbnail: "images/maps/thumbnail/MOR.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Mortain - Operation Lüttich (August 6-13, 1944)",
      description: "Following the American breakout from Normandy in Operation Cobra, German forces launched a desperate counteroffensive code-named Operation Lüttich to recapture Mortain and cut off General Patton's Third Army advance. The German attack involved the 2nd Panzer Division, 1st SS Panzer Division Leibstandarte, 2nd SS Panzer Division Das Reich, and 116th Panzer Division. The U.S. 30th Infantry Division defended the critical high ground around Mortain against overwhelming German armored forces.",
      tactics: "German forces achieved initial surprise and briefly captured Mortain, but the U.S. 30th Infantry Division's 2nd Battalion, 120th Infantry Regiment held Hill 314, the dominant terrain feature. Despite being cut off for five days, they were resupplied by parachute drops and held their position. Allied air power proved decisive when RAF Typhoon fighter-bombers and US 9th Air Force achieved complete air superiority, attacking German armored formations in the open ground east of Mortain.",
      significance: "The failure of Operation Lüttich was a turning point in the Normandy campaign. The German counteroffensive cost them over 120 tanks and assault guns with no strategic gain. The failed attack left German forces exposed, leading to the creation of the Falaise Pocket and the eventual destruction of the German 7th Army. The 30th Infantry Division's heroic stand at Hill 314 was later recognized with the Presidential Unit Citation.",
      images: [
        {
          thumbnail: "images/history/mortain/mortain_1944.webp",
          full: "images/history/mortain/mortain_1944.webp",
          caption: "Aftermath of bombardment of Mortain in front of the station of Mortain-Le-Neufbourg, showing a half-track vehicle Sd.Kfz. of the 2nd SS Panzer Division 'Das Reich' and the corpse of a dead German soldier, August 1944."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/mortain/mortain_1944_americans_thumbnail.webp",
            full: "images/history/mortain/mortain_1944_americans.webp",
            caption: "American forces moving through the ruins of Mortain during the German counterattack of Operation Lüttich, August 1944."
          }
        ]
      }
    },

    // --- DIMENSIONS FROM FModel LayoutMeta DATA ---
    // Source: MOR_L_LayoutMeta (MapLayoutMetaDataAsset)
    // SectorWidth: 40000.0 units × MapWidth: 5 sectors = 200,000 units = 2000m
    // Calculation: 2000m × 100 units/meter = 200,000 units total
    // Bounds: -100,000 to +100,000 units (centered at origin)
    // 
    // Verified: This matches Elsenborn Ridge pattern (5 sectors × 40,000 units = 2000m)
    // Game coordinate system: 1 unit = 1 cm, so 100 units = 1 meter
    // This size provides accurate distance calculations matching in-game values
    bounds: {
      minX: -100000,
      maxX: 100000,
      minY: -100000,
      maxY: 100000
    },
    
    // US guns on west point east (-90°), GER guns on east point west (90°)
    gunRotations: { "us": -90, "ger": 90 },
    
    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // --- STRONGPOINTS (OBJECTIVES) ---
      // Names: MOR_WarfareMeta (GameModeMetaDataAsset) -> SectorDefinitions[].Name.SourceString
      // Locations/Radii: SphereSectorCaptureBooster_01..15 -> TriggerShape (SphereComponent) -> RelativeLocation / SphereRadius
      // Y coordinates inverted from FModel (multiply by -1) to match map image orientation
      // Team mapping: ETeam::Allies → "us", ETeam::Axis → "ger", ETeam::None → "neu"

      // Booster_01
      { label: "HOTEL DE LA POSTE", id: "B1", gameX: -71664.03, gameY: 47217.445, radius: 5000.0, team: "us", type: "strongpoint" },
      // Booster_02
      { label: "FORWARD BATTERY", id: "B2", gameX: -67949.4, gameY: -6438.873, radius: 6500.0, team: "us", type: "strongpoint" },
      // Booster_03
      { label: "SOUTHERN APPROACH", id: "B3", gameX: -70344.09, gameY: -46402.33, radius: 7500.0, team: "neu", type: "strongpoint" },
      // Booster_04
      { label: "MORTAIN OUTSKIRTS", id: "B4", gameX: -49136.977, gameY: 39819.566, radius: 6000.0, team: "ger", type: "strongpoint" },
      // Booster_05
      { label: "FORWARD MEDICAL AID STATION", id: "B5", gameX: -35275.574, gameY: 2194.1567, radius: 7000.0, team: "ger", type: "strongpoint" },
      // Booster_06
      { label: "MORTAIN APPROACH", id: "B6", gameX: -42775.5, gameY: -33050.027, radius: 7000.0, team: "us", type: "strongpoint" },
      // Booster_07
      { label: "HILL 314", id: "B7", gameX: -2425.1055, gameY: 38259.5, radius: 7000.0, team: "us", type: "strongpoint" },
      // Booster_08
      { label: "LA PETITE CHAPELLE SAINT-MICHEL", id: "B8", gameX: 1725.2772, gameY: -5918.17, radius: 5000.0, team: "neu", type: "strongpoint" },
      // Booster_09
      { label: "U.S. SOUTHERN ROADBLOCK", id: "B9", gameX: -11254.05, gameY: -49076.438, radius: 7000.0, team: "ger", type: "strongpoint" },
      // Booster_10
      { label: "DESTROYED GERMAN CONVOY", id: "B10", gameX: 35469.836, gameY: 42255.99, radius: 8000.0, team: "ger", type: "strongpoint" },
      // Booster_11
      { label: "GERMAN RECON CAMP", id: "B11", gameX: 40439.145, gameY: 2510.7285, radius: 6000.0, team: "us", type: "strongpoint" },
      // Booster_12
      { label: "LES AUBRILS FARM", id: "B12", gameX: 48018.547, gameY: -26619.574, radius: 6000.0, team: "us", type: "strongpoint" },
      // Booster_13
      { label: "ABANDONED GERMAN CHECKPOINT", id: "B13", gameX: 68651.26, gameY: 40271.47, radius: 6500.0, team: "neu", type: "strongpoint" },
      // Booster_14
      { label: "GERMAN DEFENSIVE CAMP", id: "B14", gameX: 68294.46, gameY: -1986.8845, radius: 7000.0, team: "ger", type: "strongpoint" },
      // Booster_15
      { label: "LE FERME DU DESCHAMPS", id: "B15", gameX: 71327.67, gameY: -36841.695, radius: 7000.0, team: "ger", type: "strongpoint" },

      // --- US GUNS (WEST) ---
      // Y coordinates inverted from FModel (multiply by -1) to match map image orientation
      // Sorted by Y descending (North to South) after inversion
      // Spawner6 (most north), Spawner5, Spawner4 (most south)
      { label: "", id: "US_A1", gameX: -88315.72, gameY: 6495.1196, radius: 500, team: "us", type: "point", rotation: -95.6 }, 
      { label: "", id: "US_A2", gameX: -88402.46, gameY: 7784.2734, radius: 500, team: "us", type: "point", rotation: -95.6 }, 
      { label: "", id: "US_A3", gameX: -88551.5, gameY: 8780.766, radius: 500, team: "us", type: "point", rotation: -99.1 }, 

      // --- GERMAN GUNS (EAST) ---
      // Y coordinates inverted from FModel (multiply by -1) to match map image orientation
      // Sorted by Y descending (North to South) after inversion
      // Spawner4 (most north), Spawner5, Spawner6 (most south)
      { label: "", id: "GER_A1", gameX: 90334.24, gameY: 2615.621, radius: 500, team: "ger", type: "point", rotation: 80.0 }, 
      { label: "", id: "GER_A2", gameX: 90170.0, gameY: 4075.0, radius: 500, team: "ger", type: "point", rotation: 90.0 }, 
      { label: "", id: "GER_A3", gameX: 90346.56, gameY: 5372.948, radius: 500, team: "ger", type: "point", rotation: 100.0 }
    ]
  },
  OMA: {
    name: "Omaha Beach",
    image: "images/maps/map_omaha.webp",
    thumbnail: "images/maps/thumbnail/OMA.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Omaha Beach Landings - D-Day (June 6, 1944)",
      description: "Omaha Beach was the code name for one of the five sectors of the Allied invasion of German-occupied France during the Normandy landings. It was the most heavily fortified of the D-Day beaches, defended by the German 352nd Infantry Division. The U.S. 1st and 29th Infantry Divisions assaulted the 5-mile wide beach, which was bounded by high cliffs and featured five natural draws (valleys) that served as the only exits. The Germans had constructed extensive defenses including beach obstacles, mines, concrete bunkers, and 15 strongpoints called Widerstandsnester.",
      tactics: "The initial assault faced unexpectedly rough seas that swamped many landing craft and sunk amphibious DD tanks. Pre-landing naval and air bombardment failed to significantly damage the German defenses due to overcast conditions. As landing craft approached, they came under heavy automatic weapons and artillery fire. Many units landed far from their intended sectors due to smoke and strong currents. Small groups of soldiers eventually scaled the steep bluffs using the draws between strongpoints, eventually overwhelming the defenders despite taking heavy casualties.",
      significance: "Omaha Beach was the bloodiest of the D-Day landings, with approximately 2,000 American casualties. Despite heavy losses and initial chaos, the assaulting forces secured a beachhead by the end of June 6. The capture of Omaha Beach linked the British landing at Gold Beach with the American landing at Utah Beach, creating a continuous Allied front in Normandy. The success at Omaha was crucial to the overall success of Operation Overlord and the liberation of France.",
      images: [
        {
          thumbnail: "images/history/omaha_beach/omaha_beach_1944_thumbnail.webp",
          full: "images/history/omaha_beach/omaha_beach_1944.webp",
          caption: "USS Landing Craft Infantry (LCI)-553 and USS LCI-410 land troops on Omaha Beach, during the initial assault there on D-Day, 6 June 1944. Photographed from the conning station of another LCI. LCI-553, hit by two shells, was left a wreck on the beach on D-Day."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/omaha_beach/omaha_beach_1944_american_assault_troops_thumbnail.webp",
            full: "images/history/omaha_beach/omaha_beach_1944_american_assault_troops.webp",
            caption: "A large group of American assault troops of the 3rd Battalion, 16th Infantry Regiment, 1st U.S. Infantry Division, having gained the comparative safety offered by the chalk cliff at their backs, takes a 'breather' before moving onto the continent at Colleville-Sur-Mer, Omaha Beach, in Normandy, France. Medics who landed with the men treat them for minor injuries. 8 Jun 1944."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/omaha_beach/omaha_beach_1944_us_troops_land_at_normandy_thumbnail.webp",
            full: "images/history/omaha_beach/omaha_beach_1944_us_troops_land_at_normandy.webp",
            caption: "American assault troops land on the northern coast of France, at Omaha Beach. Half-tracks and a beached DUKW (amphibious truck) indicate the successful landing of the initial waves. 6 June, 1944."
          }
        ]
      }
    },

    // --- DIMENSIONS ---
    // Using standard 1984m square (same as Driel, Kharkov)
    // MBPBounds: -99200 to 99200 units = 1984 meters
    widthMeters: 1984,
    heightMeters: 1984,
    
    // --- GUN SORTING ---
    // "x": Sort guns Left-to-Right (West->East) for horizontal gun lines
    // "y": Sort guns Top-to-Bottom (North->South) - used for Omaha since labels are North/Middle/South
    gunSort: "y",
    
    // --- GUN ROTATIONS ---
    // Germany West, US East (west<->east layout): rotate guns to face inward.
    // US guns on east side point west (90°), GER guns on west side point east (-90°)
    gunRotations: { us: 90, ger: -90 },
    
    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // --- STRONGPOINTS (OBJECTIVES) ---
      // Extracted from FModel JSON: SphereSectorCaptureBooster components
      // Names and team assignments from MapMeta_OmahaWarfare_C (WarfareMeta)
      // Effective radius = SphereRadius × RelativeScale3D (if present)
      // Team mapping: ETeam::Axis → "ger", ETeam::Allies → "us", ETeam::None → "neu"
      // Map orientation: RightToLeft flow per MapMeta
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // 
      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.
      // SphereSectorCaptureBooster numbers are randomized and don't match sector order.
      // Coordinates extracted from booster components, names from MapMeta_OmahaWarfare_C.
      
      // --- AXIS SECTORS ---
      // Based on MapMeta: InitialOwner: Axis
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      { label: "BEAUMONT ROAD", id: "B11", gameX: -66508.0, gameY: 34528.0, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster12
      { label: "CROSSROADS", id: "B12", gameX: -63975.723, gameY: -2684.23, radius: 3713.8135, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster13
      { label: "CHURCH ROAD", id: "B9", gameX: -36692.0, gameY: 9308.0, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster10
      { label: "REAR BATTERY", id: "B10", gameX: -40364.508, gameY: 47019.88, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster11
      { label: "LES ISLES", id: "B13", gameX: -65785.0, gameY: -33673.0, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster14
      { label: "THE ORCHARDS", id: "B8", gameX: -44319.355, gameY: -27163.912, radius: 4000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster9
      
      // --- NEUTRAL SECTORS ---
      // Based on MapMeta: InitialOwner: None
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      { label: "WEST VIERVILLE", id: "B5", gameX: 4665.0, gameY: 40540.0, radius: 5000.0, team: "neu", type: "strongpoint" }, // SphereSectorCaptureBooster6
      { label: "VIERVILLE SUR MER", id: "B6", gameX: -2661.8896, gameY: 2895.0942, radius: 5000.0, team: "neu", type: "strongpoint" }, // SphereSectorCaptureBooster7
      { label: "ARTILLERY BATTERY", id: "B7", gameX: 2342.277, gameY: -31510.633, radius: 5000.0, team: "neu", type: "strongpoint" }, // SphereSectorCaptureBooster8
      
      // --- ALLIES SECTORS ---
      // Based on MapMeta: InitialOwner: Allies
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      { label: "WN73", id: "B4", gameX: 54259.0, gameY: 44498.0, radius: 5000.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster5
      { label: "DOG GREEN", id: "B3", gameX: 67602.0, gameY: 31262.0, radius: 6250.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster4, Scale: 1.25
      { label: "WN71", id: "B1", gameX: 55132.387, gameY: 5791.973, radius: 3750.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster2, Scale: 0.75
      { label: "THE DRAW", id: "B14", gameX: 71322.0, gameY: 7432.0, radius: 3750.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster15, Scale: 0.75
      { label: "WN70", id: "B2", gameX: 46516.0, gameY: -30340.0, radius: 5000.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster3
      { label: "DOG WHITE", id: "B15", gameX: 71817.0, gameY: -30284.0, radius: 5000.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster16
      
      // --- ARTILLERY GUN POSITIONS ---
      // Extracted from FModel JSON: BP_GERArtillery_Spawner and BP_USArtillery_Spawner components
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // Sorted by X coordinate (west to east) based on gunSort: "x" setting
      
      // --- GERMAN GUNS (WEST) ---
      // Sorted west to east (lowest X to highest X)
      { label: "", id: "GER_A1", gameX: -93808.164, gameY: -1728.4452, radius: 500, team: "ger", type: "point", rotation: -89.5 }, // BP_GERArtillery_Spawner5 (most west)
      { label: "", id: "GER_A2", gameX: -93742.41, gameY: 662.3068, radius: 500, team: "ger", type: "point", rotation: -89.5 }, // BP_GERArtillery_Spawner4
      { label: "", id: "GER_A3", gameX: -93369.984, gameY: -4131.0264, radius: 500, team: "ger", type: "point", rotation: -89.5 }, // BP_GERArtillery_Spawner6 (least west)
      
      // --- US GUNS (EAST) ---
      // Sorted west to east (lowest X to highest X)
      { label: "", id: "US_A1", gameX: 77848.13, gameY: -6830.192, radius: 500, team: "us", type: "point", rotation: 87.2 }, // BP_USArtillery_Spawner3 (most west of US guns)
      { label: "", id: "US_A2", gameX: 78467.6, gameY: -9514.723, radius: 500, team: "us", type: "point", rotation: 87.2 }, // BP_USArtillery_Spawner4
      { label: "", id: "US_A3", gameX: 79327.93, gameY: -3703.3025, radius: 500, team: "us", type: "point", rotation: 92.8 } // BP_USArtillery_Spawner_2 (most east)
    ] 
  },
PHL: { 
    name: "Purple Heart Lane",
    image: "images/maps/map_purpleheartlane.webp",
    thumbnail: "images/maps/thumbnail/PHL.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Purple Heart Lane - Battle of Carentan (June 10-11, 1944)",
      description: "Purple Heart Lane was the nickname given to the Carentan-Sainte-Mère-Église highway (National Road 13) where the U.S. 101st Airborne Division's 3rd Battalion, 502nd PIR under Lt. Col. Robert G. Cole suffered heavy casualties attacking German positions. The German 6th Fallschirmjäger Regiment under Colonel Friedrich von der Heydte defended the approach to Carentan from a farmhouse and hedgerow positions. The paratroopers had to advance single file down a narrow causeway under continuous fire from German machine guns, mortars, and an 88mm gun.",
      tactics: "On June 10, the 3rd/502nd PIR crossed the Douve River using an improvised footbridge and advanced down the causeway crouching and crawling. They took heavy casualties from artillery, mortar, sniper, and machine gun fire. At 23:30, two German Ju 87 Stukas strafed the causeway, killing 30 men and knocking I Company out of the battle. On June 11, Lt. Col. Cole led a bayonet charge against the German positions at the farmhouse, using a smoke screen for concealment. The charge overwhelmed the defenders in savage close combat, for which Cole was awarded the Medal of Honor.",
      significance: "The 3rd/502nd PIR suffered approximately 67% casualties during the Purple Heart Lane fighting, earning the highway its grim nickname. Despite the heavy losses, the attack was crucial to the capture of Carentan, which linked the Utah and Omaha beachheads. Cole's bayonet charge became one of the most famous actions of the Normandy campaign. The battle demonstrated the tenacity of American airborne troops and the ferocity of German Fallschirmjäger defenders.",
      images: [
        {
          thumbnail: "images/history/purple_heart_lane/purple_heart_lane_1944.webp",
          full: "images/history/purple_heart_lane/purple_heart_lane_1944.webp",
          caption: "View of the Carentan causeway from the north, with bridges 3 and 4 marking waterways crossed by the causeway, and the town of Carentan in the background."
        }
      ]
    },

    // Standard 1984m square map (same as Driel, Kharkov, etc.)
    widthMeters: 1984,
    heightMeters: 1984,
    
    // Sort guns by X coordinate (west to east) since they're arranged horizontally
    gunSort: "x",
    
    // US guns (north) point south (0°), German guns (south) point north (180°)
    gunRotations: { "us": 0, "ger": 180 },
    
    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // NOTE: Map is visually south-north, Allies north, Axis south
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // Sectors grouped by MapMeta InitialOwner, NOT by geographic position
      
      // Base Radius 1000.0 from ASphereSectorCaptureBooster.cpp (SetSphereRadius 1000.0)
      
      // --- ALLIES SECTORS (North) ---
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // Ordered north to south (highest to lowest Y)
      { label: "BLOODY BEND", id: "B12", gameX: -53699.133, gameY: 68803.984, radius: 2750.0, team: "ger", type: "strongpoint" }, // Scale 2.75
      { label: "DEAD MAN'S CORNER", id: "B8", gameX: 740.8672, gameY: 65433.984, radius: 4000.0, team: "neu", type: "strongpoint" }, // Scale 4.0
      { label: "FORWARD BATTERY", id: "B6", gameX: 33330.867, gameY: 66643.984, radius: 4000.0, team: "us", type: "strongpoint" }, // Scale 4.0
      { label: "JOURDAN CANAL", id: "B14", gameX: -41489.133, gameY: 38108.99, radius: 2750.0, team: "ger", type: "strongpoint" }, // Scale 2.75
      { label: "DOUVE BRIDGE", id: "B5", gameX: -1434.0474, gameY: 26826.268, radius: 4250.0, team: "us", type: "strongpoint" }, // Scale 4.25
      { label: "DOUVE RIVER BATTERY", id: "B15", gameX: 33572.38, gameY: 36601.72, radius: 3500.0, team: "ger", type: "strongpoint" }, // Scale 3.5
      
      // --- NEUTRAL SECTORS ---
      // Ordered north to south (highest to lowest Y)
      { label: "GROULT PILLBOX", id: "B7", gameX: -37607.4, gameY: 5672.991, radius: 5500.0, team: "neu", type: "strongpoint" }, // Scale 5.5
      { label: "CARENTAN CAUSEWAY", id: "B3", gameX: 787.74744, gameY: -1346.289, radius: 3500.0, team: "us", type: "strongpoint" }, // Scale 3.5
      { label: "FLAK POSITION", id: "B13", gameX: 45592.906, gameY: 4116.6772, radius: 4750.0, team: "ger", type: "strongpoint" }, // Scale 4.75
      
      // --- AXIS SECTORS (South) ---
      // Ordered north to south (highest to lowest Y)
      { label: "MADELEINE FARM", id: "B10", gameX: -33264.676, gameY: -30204.594, radius: 3250.0, team: "ger", type: "strongpoint" }, // Scale 3.25
      { label: "MADELEINE BRIDGE", id: "B1", gameX: 1928.2188, gameY: -39878.098, radius: 3000.0, team: "us", type: "strongpoint" }, // Scale 3.0
      { label: "AID STATION", id: "B11", gameX: 47043.207, gameY: -32172.8, radius: 3250.0, team: "ger", type: "strongpoint" }, // Scale 3.25
      { label: "INGOUF CROSSROADS", id: "B9", gameX: -36344.676, gameY: -66489.59, radius: 3250.0, team: "neu", type: "strongpoint" }, // Scale 3.25
      { label: "ROAD TO CARENTAN", id: "B2", gameX: 2953.2188, gameY: -63908.098, radius: 3000.0, team: "us", type: "strongpoint" }, // Scale 3.0
      { label: "CABBAGE PATCH", id: "B4", gameX: 46253.22, gameY: -62363.098, radius: 2500.0, team: "ger", type: "strongpoint" }, // Scale 2.5
      
      // --- ARTILLERY POSITIONS (Pure Data - Y Inverted) ---
      { label: "", id: "US_A1", gameX: -1290.70, gameY: 91683.69, radius: 500, team: "us", type: "point", rotation: -357.2 }, 
      { label: "", id: "US_A3", gameX: 1351.00,  gameY: 92849.00, radius: 500, team: "us", type: "point", rotation: 8.4 }, 
      { label: "", id: "US_A2", gameX: 1471.00,  gameY: 90291.00, radius: 500, team: "us", type: "point", rotation: -354.4 }, 
      { label: "", id: "GER_A1", gameX: 712.84,  gameY: -90298.55, radius: 500, team: "ger", type: "point", rotation: -185.6 }, 
      { label: "", id: "GER_A2", gameX: 1502.01, gameY: -92441.29, radius: 500, team: "ger", type: "point", rotation: -185.6 }, 
      { label: "", id: "GER_A3", gameX: 1718.97, gameY: -90134.83, radius: 500, team: "ger", type: "point", rotation: -171.6 }
    ] 
  },
REM: {
    name: "Remagen",
    image: "images/maps/map_remagen.webp",
    thumbnail: "images/maps/thumbnail/REM.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Remagen - Capture of Ludendorff Bridge (March 7-25, 1945)",
      description: "The Battle of Remagen was fought when U.S. forces unexpectedly captured the Ludendorff Bridge over the Rhine River intact on March 7, 1945. The bridge was one of the few remaining crossings over the Rhine that the Germans had not destroyed. Task Force Engeman of Combat Command B, 9th Armored Division under Lt. Col. Leonard Engeman, with Company A of the 14th Tank Battalion led by Lt. Karl H. Timmermann, captured the bridge after advancing through Remagen against light resistance from Volkssturm defenders.",
      tactics: "When scouts reported the bridge was still standing at 12:56 on March 7, Brig. General William Hoge ordered an immediate capture. U.S. tanks and infantry advanced quickly through Remagen, reaching the bridge by 3:00 pm. Despite German demolition charges, the bridge remained standing due to faulty explosives and sabotage by German engineer Captain Willi Bratge. U.S. forces crossed under fire, establishing a bridgehead on the east bank. The Germans launched relentless counterattacks using aircraft, artillery, V-2 rockets, and frogmen with floating mines, but American defenses held the bridgehead.",
      significance: "The capture of the Ludendorff Bridge was a major strategic breakthrough. It was the first intact bridge captured over the Rhine, allowing Allied forces to establish a bridgehead on the east bank of Germany's natural defensive barrier. This shortened the war by enabling massive Allied forces to cross into the German heartland. The bridge collapsed on March 17 due to cumulative damage from German attacks, but by then the Allies had built additional pontoon bridges. The German commander responsible for failing to destroy the bridge, Captain Willi Bratge, was court-martialed and sentenced to death, though the sentence was not carried out.",
      images: [
        {
          thumbnail: "images/history/remagen/remagen_1945_thumbnail.webp",
          full: "images/history/remagen/remagen_1945.webp",
          caption: "Poster printed by the US Army commemorating the capturing of the Ludendorff Bridge at Remagen. The Remagen Bridgehead - 7 March 1945. Here, on the Ludendorff Bridge crossing the Rhine at Remagen, Combat Command B, 9th Armored Division -- headed by the 27th Armored Infantry Battalion -- successfully effected the first bridgehead across Germany's formidable river barrier and so contributed decisively to the defeat of the enemy. The 27th Battalion reached Remagen, found the bridge intact but mined for demolition. Although its destruction was imminent, without hesitation and in face of heavy fire the infantrymen rushed across the structure, and with energy and skill seized the surrounding high ground."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/remagen/remagen_1945_bridge.webp",
            full: "images/history/remagen/remagen_1945_bridge.webp",
            caption: "The Ludendorff Bridge at Remagen, Germany, after capture by U.S. forces, March 1945."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/remagen/remagen_bridge_after_capture_thumbnail.webp",
            full: "images/history/remagen/remagen_1945_bridge_after_capture.webp",
            caption: "Ludendorff Bridge and Erpeler Ley tunnel at Erpel (eastern side of the Rhine) – First U.S. Army men and equipment pour across the Remagen Bridge; two knocked out jeeps in foreground. Germany, 11 March 1945."
          }
        ]
      }
    },

    // Standard 1984m dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    gunSort: "x",
    
    // US (South/West) faces North (180), GER (North/East) faces South (0)
    gunRotations: { "us": 180, "ger": 0 },

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // NOTE: Map is visually North-South.
      // Top of Map = Positive Y = German Lines
      // Bottom of Map = Negative Y = US Lines

      // --- AXIS SECTORS (North/Top) ---
      { label: "ALTE LIEBE BARSCH", id: "B11", gameX: -41114.0, gameY: 69583.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "BEWALDET KREUZUNG", id: "B12", gameX: -891.0, gameY: 69550.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "DAN RADART 512", id: "B15", gameX: 41625.0, gameY: 69063.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "ERPEL", id: "B10", gameX: -39275.0, gameY: 40853.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "ERPELER LEY", id: "B13", gameX: 9697.0, gameY: 42679.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "KASBACH OUTLOOK", id: "B14", gameX: 38436.418, gameY: 41098.23, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // --- NEUTRAL SECTORS (Middle/River) ---
      { label: "ST. SEVERIN CHAPEL", id: "B9", gameX: -39275.0, gameY: 12967.0, radius: 4000.0, team: "neu", type: "strongpoint" }, 
      { label: "LUDENDORFF BRIDGE", id: "B1", gameX: 3032.2412, gameY: -7.0210953, radius: 8000.0, team: "neu", type: "strongpoint" }, 
      { label: "BAUERNHOF AM RHEIN", id: "B6", gameX: 38817.02, gameY: -15613.944, radius: 4000.0, team: "neu", type: "strongpoint" }, 

      // --- ALLIES SECTORS (South/Bottom) ---
      { label: "REMAGEN", id: "B7", gameX: -35925.75, gameY: -39434.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "MÖBELFABRIK", id: "B2", gameX: -1000.0, gameY: -40824.0, radius: 5000.0, team: "us", type: "strongpoint" }, 
      { label: "SCHLIEFFEN AUSWEG", id: "B5", gameX: 39053.0, gameY: -38264.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "WALDBURG", id: "B8", gameX: -40954.977, gameY: -80279.71, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "MÜHLENWEG", id: "B3", gameX: 3742.6152, gameY: -72094.91, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "HAGELKREUZ", id: "B4", gameX: 37607.746, gameY: -68933.32, radius: 4000.0, team: "us", type: "strongpoint" }, 

      // --- GUN POSITIONS ---
      // ALLIES (US) - South/Bottom (Negative Y)
      { label: "", id: "US_A1", gameX: -4446.61, gameY: -88972.766, radius: 500, team: "us", type: "point", rotation: -180.0 }, 
      { label: "", id: "US_A2", gameX: -3567.6099, gameY: -89011.83, radius: 500, team: "us", type: "point", rotation: -180.0 }, 
      { label: "", id: "US_A3", gameX: -2679.6123, gameY: -88972.766, radius: 500, team: "us", type: "point", rotation: -180.0 }, 

      // AXIS (GER) - North/Top (Positive Y)
      { label: "", id: "GER_A1", gameX: 14294.659, gameY: 94233.6, radius: 500, team: "ger", type: "point", rotation: -1.3 }, 
      { label: "", id: "GER_A2", gameX: 16394.264, gameY: 94198.32, radius: 500, team: "ger", type: "point", rotation: -1.3 }, 
      { label: "", id: "GER_A3", gameX: 17936.605, gameY: 93962.43, radius: 500, team: "ger", type: "point", rotation: -1.3 }
    ]
  },
SMM: {
    name: "Sainte-Marie-du-Mont",
    image: "images/maps/map_smdmv2.webp",
    thumbnail: "images/maps/thumbnail/SMM.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Sainte-Marie-du-Mont - D-Day Drop Zone C (June 6, 1944)",
      description: "Sainte-Marie-du-Mont was the scene of a military engagement between the American 101st Airborne Division and the German Wehrmacht on D-Day, June 6, 1944. The village was occupied by approximately 60 German soldiers of Artillerie-Regiment 191 (91. Infanterie Division) who used the church tower as an observation post. The village was located at the southern edge of Drop Zone C, behind Utah Beach. Troops of the 506th Parachute Infantry Regiment and the 3rd Battalion of the 501st Parachute Infantry Regiment were tasked with landing in Zone C to clear a route for soldiers arriving by sea.",
      tactics: "A thick fog bank and heavy flak from coastal guns forced pilots away from their targets, leaving paratroopers scattered in unknown territory. Only two-thirds of troops designated for Zone C were accurately dropped. Many paratroopers landed in and around Sainte-Marie-du-Mont and immediately engaged surprised German forces. The famous assault on Brécourt Manor by Easy Company (506th PIR) under Lieutenant Richard Winters destroyed four German 105mm howitzers that were firing on Utah Beach, a action depicted in the HBO series Band of Brothers.",
      significance: "The capture of Sainte-Marie-du-Mont and the destruction of German artillery at Brécourt Manor were crucial to the success of the Utah Beach landings. The 101st Airborne's actions in this area secured the inland exits from Utah Beach and prevented German counterattacks against the landing forces. The Brécourt Manor assault became one of the most celebrated small-unit actions of the Normandy campaign and is still studied in military academies today.",
      images: [
        {
          thumbnail: "images/history/st_marie_du_mont/stmdm_1944_aerial_1.webp",
          full: "images/history/st_marie_du_mont/stmdm_1944_aerial_1.webp",
          caption: "Aerial view of Sainte-Marie-du-Mont, June 1944."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/st_marie_du_mont/stmdm_1944_soldiers_thumbnail.webp",
            full: "images/history/st_marie_du_mont/stmdm_1944_soldiers.webp",
            caption: "A group of American soldiers including 4 MPs at the village fountain surrounded by women and children, on June 12 at Sainte-Marie-du-Mont. The building facades show bullet damage from the fighting. U.S. National Archives, public domain."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/st_marie_du_mont/stmdm_1944_aerial_2.webp",
            full: "images/history/st_marie_du_mont/stmdm_1944_aerial_2.webp",
            caption: "Aerial view of Sainte-Marie-du-Mont looking south, June 1944. In-game this view leads towards the German bottom right HQ. Utah Beach would have been northbound via the road leading out at the bottom of the photo."
          }
        ]
      }
    },

    // Standard 1984m dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // US (North) Faces South (0), GER (South) Faces North (180)
    gunRotations: { "us": 0, "ger": 180 },
    gunSort: "x", 

    guns: ["HQ Gun 1 (West)", "HQ Gun 2 (Mid)", "HQ Gun 3 (East)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted (Raw Y * -1).
      // Radii calculated: Base Radius * RelativeScale3D.X
      // Sorted North (Top) to South (Bottom).

      // --- ALLIES SECTORS (North - Positive Inverted Y) ---
      // US Base
      { label: "WINTERS LANDING", id: "B2", gameX: -39503.26, gameY: 78343.03, radius: 5755.0, team: "us", type: "strongpoint" }, // Scale 1.278
      { label: "LE GRAND CHEMIN", id: "B3", gameX: -367.0, gameY: 76667.0, radius: 4500.0, team: "us", type: "strongpoint" }, // No Scale
      { label: "THE BARN", id: "B4", gameX: 44896.0, gameY: 73822.0, radius: 5691.0, team: "us", type: "strongpoint" }, // Scale 1.264

      // US Mid
      { label: "BRECOURT BATTERY", id: "B1", gameX: -39380.0, gameY: 39702.0, radius: 6079.0, team: "us", type: "strongpoint" }, // Scale 1.35
      { label: "CATTLESHEDS", id: "B11", gameX: 2961.32, gameY: 41557.40, radius: 5401.0, team: "us", type: "strongpoint" }, // Scale 1.20
      { label: "RUE DE LA GARE", id: "B12", gameX: 35565.56, gameY: 39370.59, radius: 5893.0, team: "us", type: "strongpoint" }, // Scale 1.309

      // --- NEUTRAL SECTORS (Center) ---
      { label: "THE DUGOUT", id: "B13", gameX: -37170.91, gameY: 151.19, radius: 5815.0, team: "neu", type: "strongpoint" }, // Scale 1.292
      { label: "AA NETWORK", id: "B5", gameX: 1716.0, gameY: -2530.0, radius: 6531.0, team: "neu", type: "strongpoint" }, // Scale 1.451
      { label: "PIERRE'S FARM", id: "B6", gameX: 37508.1, gameY: -1336.70, radius: 5207.0, team: "neu", type: "strongpoint" }, // Scale 1.157

      // --- AXIS SECTORS (South - Negative Inverted Y) ---
      // GER Mid
      { label: "HUGO'S FARM", id: "B10", gameX: -38001.0, gameY: -38089.0, radius: 6046.0, team: "ger", type: "strongpoint" }, // Scale 1.343
      { label: "THE HAMLET", id: "B15", gameX: -2158.77, gameY: -42649.31, radius: 4500.0, team: "ger", type: "strongpoint" }, // No Scale
      { label: "STE MARIE DU MONT", id: "B14", gameX: 47022.13, gameY: -50258.56, radius: 6000.0, team: "ger", type: "strongpoint" }, // Base Radius 6000

      // GER Base
      { label: "THE CORNER", id: "B9", gameX: -34620.76, gameY: -69152.77, radius: 5106.0, team: "ger", type: "strongpoint" }, // Scale 1.134
      { label: "HILL 6", id: "B8", gameX: 142.14, gameY: -76822.93, radius: 4500.0, team: "ger", type: "strongpoint" }, // No Scale
      { label: "THE FIELDS", id: "B7", gameX: 39750.15, gameY: -78234.78, radius: 4500.0, team: "ger", type: "strongpoint" }, // No Scale

      // --- GUN POSITIONS ---
      // ALLIES (US) - North (Positive Y)
      { label: "", id: "US_A1", gameX: 1037.18, gameY: 95426.19, radius: 500, team: "us", type: "point", rotation: -8.3 }, 
      { label: "", id: "US_A2", gameX: 1860.62, gameY: 95570.82, radius: 500, team: "us", type: "point", rotation: -1.1 }, 
      { label: "", id: "US_A3", gameX: 3849.56, gameY: 95341.53, radius: 500, team: "us", type: "point", rotation: -8.1 }, 

      // AXIS (GER) - South (Negative Y)
      { label: "", id: "GER_A1", gameX: -7146.81, gameY: -95880.13, radius: 500, team: "ger", type: "point", rotation: -189.4 }, 
      { label: "", id: "GER_A2", gameX: -4235.60, gameY: -95027.63, radius: 500, team: "ger", type: "point", rotation: -180.0 }, 
      { label: "", id: "GER_A3", gameX: -1324.40, gameY: -95453.88, radius: 500, team: "ger", type: "point", rotation: -180.0 } // Estimated 3rd gun based on pattern if missing
    ] 
  },
  SME: { 
    name: "Sainte-Mère-Église", 
    image: "images/maps/map_stmereeglise.webp", 
    thumbnail: "images/maps/thumbnail/SME.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Battle of Sainte-Mère-Église (June 6-7, 1944)",
      description: "Sainte-Mère-Église played a significant role in the Normandy landings due to its position on Route N13, which the Germans would have used to counterattack Allied landings on Utah and Omaha Beaches. In the early morning of June 6, 1944, mixed units of the U.S. 82nd Airborne and 101st Airborne Divisions occupied the town during Mission Boston, making it one of the first towns liberated in the invasion. The town was held by lightly armed airborne troops until reinforced by tanks from Utah Beach on the afternoon of June 7.",
      tactics: "Early airborne landings at approximately 1:40 a.m. resulted in heavy casualties as buildings in town caught fire, illuminating the sky and making descending paratroopers easy targets. Many paratroopers were shot while hanging from trees and utility poles. At 5 a.m., Lt. Col. Edward C. Krause of the 505th PIR captured the town with little resistance as the German garrison was confused and had retired for the night. Heavy German counterattacks began later on June 6 and continued into June 7, but the airborne troops held the town until reinforced by tanks from Utah Beach.",
      significance: "Sainte-Mère-Église was one of the first towns liberated on D-Day, securing a crucial crossroads on Route N13 that would have been used for German counterattacks against the Utah and Omaha beachheads. The capture demonstrated the importance of airborne operations in seizing key objectives ahead of ground forces. The famous incident of paratrooper John Steele, whose parachute caught on the church spire, became one of the most iconic images of D-Day and was portrayed in the film The Longest Day. Lt. Col. Krause and Lt. Col. Vandervoort received the Distinguished Service Cross for their actions.",
      images: [
        {
          thumbnail: "images/history/st_mere_eglise/stme_1944_thumbnail.webp",
          full: "images/history/st_mere_eglise/stme_1944.webp",
          caption: "Sainte-Mère-Église, France, possibly from before the battle (pre-June 6, 1944)."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/st_mere_eglise/stme_1944_soldiers_thumbnail.webp",
            full: "images/history/st_mere_eglise/stme_1944_soldiers.webp",
            caption: "Four members of the 82nd Airborne Division enter the village of St. Mere-Eglise, France, under heavy German artillery fire. The city was later taken by the Allies."
          },
          {
            thumbnail: "images/history/st_mere_eglise/stme_1944_paratroopers_thumbnail.webp",
            full: "images/history/st_mere_eglise/stme_1944_paratroopers.webp",
            caption: "Finding horses plentiful in St. Mere Eglise, France, American paratroopers utilize them as transportation for patrolling the street, after clearing the town of German defenders. 6th June 1944."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/st_mere_eglise/stme_1944_wounded_german_soldier_thumbnail.webp",
            full: "images/history/st_mere_eglise/stme_1944_wounded_german_soldier.webp",
            caption: "U.S. medics giving blood plasma to a wounded German soldier. St. Mere Eglise, Normandy, 15 June, 1944."
          }
        ]
      }
    },
    
    // Standard 2000m dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // US (East) faces West (90), GER (West) faces East (-90)
    gunRotations: { "us": 90, "ger": -90 },
    gunSort: "y", 

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted.
      // Map is West (Left/Ger) to East (Right/US).

      // --- ALLIES SECTORS (East - Positive X) ---
      // US Base (Far East)
      { label: "LES VIEUX VERGERS", id: "B3", gameX: 70168.0, gameY: 28861.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "CROSS ROADS", id: "B2", gameX: 72279.0, gameY: -1393.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "RUISSEAU DE FERME", id: "B1", gameX: 72138.0, gameY: -38912.0, radius: 4000.0, team: "us", type: "strongpoint" }, 

      // US Mid (Mid-East)
      { label: "ARTILLERY BATTERY", id: "B4", gameX: 39652.0, gameY: 34374.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "THE CEMETERY", id: "B5", gameX: 28858.0, gameY: -5593.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "MAISON DU CRIQUE", id: "B6", gameX: 25884.0, gameY: -30530.0, radius: 4000.0, team: "us", type: "strongpoint" }, 

      // --- NEUTRAL SECTORS (Center - Near X=0) ---
      { label: "HOSPICE", id: "B15", gameX: -1100.0, gameY: 46000.0, radius: 4000.0, team: "neu", type: "strongpoint" }, 
      { label: "SAINTE-MÈRE-ÉGLISE", id: "B7", gameX: 5949.0, gameY: 7436.0, radius: 4741.0, team: "neu", type: "strongpoint" }, 
      { label: "CHECKPOINT", id: "B10", gameX: 467.0, gameY: -32490.0, radius: 4000.0, team: "neu", type: "strongpoint" }, 

      // --- AXIS SECTORS (West - Negative X) ---
      // GER Mid (Mid-West)
      { label: "ROUTE DU HARAS", id: "B11", gameX: -40886.0, gameY: 37779.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "WESTERN APPROACH", id: "B8", gameX: -32652.0, gameY: 14761.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "RUE DE GAMBOSVILLE", id: "B9", gameX: -34553.0, gameY: -41733.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // GER Base (Far West)
      { label: "FLAK POSITION", id: "B12", gameX: -69311.0, gameY: 40772.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "VAULAVILLE", id: "B13", gameX: -62223.0, gameY: 3146.0, radius: 2507.0, team: "ger", type: "strongpoint" }, 
      { label: "LA PRAIRIE", id: "B14", gameX: -67517.0, gameY: -35037.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // --- GUN POSITIONS ---
      // ALLIES (US) - East (Positive X)
      { label: "", id: "US_A1", gameX: 91952.0, gameY: -559.0, radius: 500, team: "us", type: "point", rotation: 90.0 }, 
      { label: "", id: "US_A2", gameX: 91952.0, gameY: 1057.0, radius: 500, team: "us", type: "point", rotation: 90.0 }, 
      { label: "", id: "US_A3", gameX: 91952.0, gameY: 2432.0, radius: 500, team: "us", type: "point", rotation: 90.0 }, 

      // AXIS (GER) - West (Negative X)
      { label: "", id: "GER_A1", gameX: -95041.6, gameY: -1857.68, radius: 500, team: "ger", type: "point", rotation: -94.8 }, 
      { label: "", id: "GER_A2", gameX: -95111.11, gameY: -1027.0771, radius: 500, team: "ger", type: "point", rotation: -94.8 }, 
      { label: "", id: "GER_A3", gameX: -95177.37, gameY: -235.55342, radius: 500, team: "ger", type: "point", rotation: -94.8 }
    ] 
  },
  SMO: { 
    name: "Smolensk", 
    image: "images/maps/map_smolensk.webp", 
    thumbnail: "images/maps/thumbnail/SMO.webp", 
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },
    history: {
      battle: "Battle of Smolensk (August 7 - October 2, 1943)",
      description: "The Battle of Smolensk was a major Soviet offensive operation aimed at liberating the Smolensk region from German occupation. Following the German defeat at Kursk, the Soviet High Command launched simultaneous offensives on the Dnieper River and at Smolensk to weaken German defenses and liberate occupied territories. The operation involved the Kalinin Front and Western Front against German Army Group Center, which had established fortified defensive positions in the area.",
      tactics: "The Smolensk operation consisted of multiple coordinated offensives: Spas-Demensk (August 7-20), Dukhovshchina-Demidov (August 13-18 and September 14-October 2), Yelnia-Dorogobuzh (August 28-September 6), and Smolensk-Roslavl (September 15-October 2). Soviet forces used massive artillery bombardments to break through German lines, creating salients and conducting assault river crossings of the Dnieper. The third stage (September 7-October 2) saw Soviet troops advance 100-180 km in 20 days, capturing key positions like Dukhovshchina and Yartsevo before reaching Smolensk.",
      significance: "The liberation of Smolensk on September 25, 1943, was a major Soviet victory that opened the path to Belarus and threatened German Army Group Center's flank. The operation forced German forces to retreat from the Panther-Wotan defensive line and deprived them of a crucial strategic position on the approach to Moscow. The battle demonstrated the Soviet Union's ability to conduct large-scale coordinated offensives following the victory at Kursk and contributed significantly to the eventual liberation of Belarus and the advance toward Germany.",
      images: [
        {
          thumbnail: "images/history/smolensk/smolensk_1943_thumbnail.webp",
          full: "images/history/smolensk/smolensk_1943.webp",
          caption: "Soviet Red Army soldiers defend the city of Smolensk: Summer 1941"
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/smolensk/smolensk_1943_soviet_artillery_thumbnail.webp",
            full: "images/history/smolensk/smolensk_1943_soviet_artillery.webp",
            caption: "Soviet artillerymen of the 2nd Guards Cavalry Corps fire on the enemy from a camouflaged position. In the foreground: 45-mm anti-tank gun 53-K (model 1937), in the background: 76-mm regimental gun (model 1927). Bryansk Front. September 1943."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/smolensk/smolensk_1943_yelnya_liberated_thumbnail.webp",
            full: "images/history/smolensk/smolensk_1943_yelnya_liberated.webp",
            caption: "Salute in honor of raising the red flag in the liberated city of Yelnya. Yelnya was liberated during the Yelnia-Dorogobuzh Offensive Operation, part of the Smolensk operation. 30 August 1943."
          }
        ]
      }
    },
    
    // Confirmed 2000m based on data spread
    widthMeters: 2000, 
    heightMeters: 2000, 
    
    // Soviets (East) face West (90), Germans (West) face East (-90)
    gunRotations: { "us": 90, "ger": -90 },
    gunSort: "y", 

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)", "HQ Gun 4 (Far North)", "HQ Gun 5 (Far South)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted.
      // Map is West (Left/Ger) to East (Right/Sov).
      // North = Positive Inverted Y (Top)
      // South = Negative Inverted Y (Bottom)

      // --- AXIS SECTORS (West - Negative X) ---
      // GER Base (Far West)
      { label: "PANZER LOADING STATION", id: "SMO_GER_Base1", gameX: -68850.08, gameY: 40044.95, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 16 (Top/North)
      { label: "TRAM DEPOT", id: "SMO_GER_Base2", gameX: -67850.08, gameY: 5084.95, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 21 (Mid)
      { label: "SMOLENSK OUTSKIRTS", id: "SMO_GER_Base3", gameX: -68850.08, gameY: -40680.05, radius: 6500.0, team: "ger", type: "strongpoint" }, // Booster 26 (Bottom/South)

      // GER Mid (Mid-West)
      { label: "SMOLENSK HAUPTBAHNHOF", id: "SMO_GER_Mid1", gameX: -38450.08, gameY: 40044.95, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 17 (Top/North)
      { label: "LUMBER YARD", id: "SMO_GER_Mid2", gameX: -36050.08, gameY: -8915.05, radius: 9000.0, team: "ger", type: "strongpoint" }, // Booster 22 (Mid - Large Radius)
      { label: "DNIEPER WEST CROSSING", id: "SMO_GER_Mid3", gameX: -40450.08, gameY: -39680.05, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 27 (Bottom/South)

      // --- NEUTRAL SECTORS (Center - Near X=0) ---
      { label: "PYATNITSKII OVERPASS", id: "SMO_Mid1", gameX: 1000.0, gameY: 38544.95, radius: 6500.0, team: "neu", type: "strongpoint" }, // Booster 18 (Top/North)
      { label: "ZHELYABOVA SQUARE", id: "SMO_Mid2", gameX: 1000.0, gameY: 0.0, radius: 6500.0, team: "neu", type: "strongpoint" }, // Booster 23 (Mid)
      { label: "84TH BATTALION BRIDGE", id: "SMO_Mid3", gameX: 1000.0, gameY: -40680.05, radius: 6000.0, team: "neu", type: "strongpoint" }, // Booster 28 (Bottom/South)

      // --- SOVIET SECTORS (East - Positive X) ---
      // SOV Mid (Mid-East)
      { label: "ZADNEPROVIE DISTRICT", id: "SMO_SOV_Mid1", gameX: 39264.92, gameY: 40444.95, radius: 6500.0, team: "us", type: "strongpoint" }, // Booster 19 (Top/North)
      { label: "MOSKOVSKAYA STREET", id: "SMO_SOV_Mid2", gameX: 39764.92, gameY: 1084.95, radius: 6500.0, team: "us", type: "strongpoint" }, // Booster 24 (Mid)
      { label: "SMOLENSK CITADEL", id: "SMO_SOV_Mid3", gameX: 39264.92, gameY: -40680.05, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 29 (Bottom/South)

      // SOV Base (Far East)
      { label: "RAILYARD STORAGE", id: "SMO_SOV_Base1", gameX: 68709.92, gameY: 40044.95, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 20 (Top/North)
      { label: "APARTMENT BLOCK", id: "SMO_SOV_Base2", gameX: 69209.92, gameY: 1084.95, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 25 (Mid)
      { label: "BOMBARDED RIVERFRONT", id: "SMO_SOV_Base3", gameX: 69209.92, gameY: -40080.05, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 30 (Bottom/South)

      // --- GUN POSITIONS ---
      // SOVIETS (East - Positive X)
      { label: "", id: "SOV_A1", gameX: 98300.0, gameY: 670.0, radius: 500, team: "us", type: "point", rotation: 90.0 }, 
      { label: "", id: "SOV_A2", gameX: 98300.0, gameY: 2000.0, radius: 500, team: "us", type: "point", rotation: 90.0 }, 
      { label: "", id: "SOV_A3", gameX: 98300.0, gameY: 3525.0, radius: 500, team: "us", type: "point", rotation: 90.0 }, 
      { label: "", id: "SOV_A4", gameX: 98111.0, gameY: -45867.996, radius: 500, team: "us", type: "point", rotation: 90.0 }, 
      { label: "", id: "SOV_A5", gameX: 95375.56, gameY: 47680.367, radius: 500, team: "us", type: "point", rotation: 95.0 }, 

      // GERMANS (West - Negative X)
      { label: "", id: "GER_A1", gameX: -98800.0, gameY: 570.0, radius: 500, team: "ger", type: "point", rotation: -90.0 }, 
      { label: "", id: "GER_A2", gameX: -98800.0, gameY: 2695.0, radius: 500, team: "ger", type: "point", rotation: -90.0 }, 
      { label: "", id: "GER_A3", gameX: -98800.0, gameY: -1505.0, radius: 500, team: "ger", type: "point", rotation: -90.0 }, 
      { label: "", id: "GER_A4", gameX: -98613.016, gameY: 40709.0, radius: 500, team: "ger", type: "point", rotation: -90.0 }, 
      { label: "", id: "GER_A5", gameX: -98696.92, gameY: -29907.863, radius: 500, team: "ger", type: "point", rotation: -73.467476 }
    ] 
  },
STA: { 
    name: "Stalingrad", 
    image: "images/maps/map_stalingrad.webp", 
    thumbnail: "images/maps/thumbnail/STA.webp", 
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },
    history: {
      battle: "Battle of Stalingrad (August 23, 1942 - February 2, 1943)",
      description: "The Battle of Stalingrad was the largest and bloodiest battle of World War II, fought between Nazi Germany and the Soviet Union for control of the city that bore Stalin's name. Hitler ordered the capture of Stalingrad to destroy its industrial capacity, block Volga River traffic crucial for Soviet logistics, and achieve a major propaganda victory. The German 6th Army under General Friedrich Paulus advanced on the city in August 1942, beginning a brutal urban battle that lasted for months. The Soviet defenders, led by General Vasily Chuikov's 62nd Army, fought street-by-street and house-by-house, inflicting massive casualties on the Germans while holding key positions.",
      tactics: "The battle began with massive German air raids that devastated much of the city. The initial German advance was successful, but Soviet resistance stiffened in the urban environment, where German armor and air superiority were less effective. The Soviets used close-quarters combat, snipers, and fortified positions in buildings like Pavlov's House to delay the Germans. In November 1942, the Soviets launched Operation Uranus, a massive counter-offensive that struck the weaker Romanian and Italian flanks of the German forces, surrounding the 6th Army in Stalingrad. Subsequent operations (Koltso and Little Saturn) prevented German relief attempts and expanded the Soviet offensive.",
      significance: "The Battle of Stalingrad is widely regarded as the turning point of World War II on the Eastern Front and the entire war. The destruction of the German 6th Army, approximately 300,000 men, marked the greatest single defeat in German military history and shattered the myth of the invincible Wehrmacht. The Soviet victory restored national pride after the devastating losses of 1941-1942 and demonstrated that Germany could be defeated. The battle shifted the strategic initiative to the Soviet Union, from which Germany would never recover. Historians have described it as the most important military-political event of World War II and a battle that changed the course of history.",
      images: [
        {
          thumbnail: "images/history/stalingrad/stalingrad_1942.webp",
          full: "images/history/stalingrad/stalingrad_1942.webp",
          caption: "German gun position in Stalingrad, Soviet Union-South sector, 1942."
        },
        {
          thumbnail: "images/history/stalingrad/stalingrad_1942_soldier.webp",
          full: "images/history/stalingrad/stalingrad_1942_soldier.webp",
          caption: "Captain Wilhelm Traub with Russian submachine gun PPSh 41 in cover between ruins during the Battle for Stalingrad. Late autumn 1942."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/stalingrad/stalingrad_1942_german_tank_thumbnail.webp",
            full: "images/history/stalingrad/stalingrad_1942_german_tank.webp",
            caption: "German tank Pz.Kpfw. IV Ausf. F1 in positions during the battle for Stalingrad. In the foreground is a machine gunner armed with an MG 34. December 1942."
          },
          {
            thumbnail: "images/history/stalingrad/stalingrad_1943_soviet_soldiers.webp",
            full: "images/history/stalingrad/stalingrad_1943_soviet_soldiers.webp",
            caption: "Red Army soldiers fight the enemy from the roof of a house in Stalingrad, January 1943. The battle began July 1942. During the Soviet counter-offensive in November 1942, over 300,000 Axis troops were surrounded. The remaining 91,000 surrendered on January 31 and February 2, 1943."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/stalingrad/stalingrad_1943_axis_prisoners_thumbnail.webp",
            full: "images/history/stalingrad/stalingrad_1943_axis_prisoners.webp",
            caption: "Column of Axis prisoners of war: Germans, Italians, Hungarians. Voronezh Front. January 1943."
          },
          {
            thumbnail: "images/history/stalingrad/stalingrad_1943_liberation_thumbnail.webp",
            full: "images/history/stalingrad/stalingrad_1943_liberation.webp",
            caption: "Red Army soldier raising the Red Flag on February 2, 1943, in honor of the liberation of Stalingrad from German fascist invaders, on the square where the headquarters of German Field Marshal Friedrich Paulus was located in the central department store building."
          }
        ]
      }
    },
    
    // Confirmed 1984m (MbPBounds -99200 to 99200)
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // Soviets (East) face West (90), Germans (West) face East (-90)
    gunRotations: { "us": 90, "ger": -90 },
    gunSort: "y", 

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // NOTE: IDs updated to match SphereSectorCaptureBooster numbers.
      // Coordinates: Exact Booster location (Y inverted).
      // Radii: Confirmed from STA_gameplay file (Large radii: 7000-9500).

      // --- AXIS SECTORS (West - Negative X) ---
      // GER Base (Far West)
      { label: "CITY OVERLOOK", id: "B11", gameX: -69346.0, gameY: -48417.0, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 11 (North)
      { label: "NAIL FACTORY", id: "B10", gameX: -71016.0, gameY: -11068.0, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 10 (Mid)
      { label: "MAMAYEV APPROACH", id: "B9", gameX: -69500.0, gameY: 47966.0, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 9 (South)

      // GER Mid (Mid-West)
      { label: "KOMSOMOL HQ", id: "B14", gameX: -39683.0, gameY: -39676.0, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 14 (North)
      { label: "YELLOW HOUSE", id: "B12", gameX: -39693.0, gameY: 1.5, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 12 (Mid)
      { label: "DOLGIY RAVINE", id: "B8", gameX: -39681.0, gameY: 48845.0, radius: 7500.0, team: "ger", type: "strongpoint" }, // Booster 8 (South)

      // --- NEUTRAL SECTORS (Center - Near X=0) ---
      { label: "TRAIN STATION", id: "B15", gameX: 6.0, gameY: -39678.0, radius: 8000.0, team: "neu", type: "strongpoint" }, // Booster 15 (North)
      { label: "CARRIAGE DEPOT", id: "B13", gameX: -15.0, gameY: -13.0, radius: 8500.0, team: "neu", type: "strongpoint" }, // Booster 13 (Mid)
      { label: "RAILWAY CROSSING", id: "B7", gameX: 7.0, gameY: 39673.0, radius: 8000.0, team: "neu", type: "strongpoint" }, // Booster 7 (South)

      // --- SOVIET SECTORS (East - Positive X) ---
      // SOV Mid (Mid-East)
      { label: "THE BREWERY", id: "B3", gameX: 39674.0, gameY: -41970.0, radius: 7500.0, team: "us", type: "strongpoint" }, // Booster 3 (North)
      { label: "PAVLOV'S HOUSE", id: "B1", gameX: 48586.0, gameY: -1452.0, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 1 (Mid)
      { label: "HOUSE OF THE WORKERS", id: "B5", gameX: 36591.0, gameY: 40602.0, radius: 9500.0, team: "us", type: "strongpoint" }, // Booster 5 (South - Largest!)

      // SOV Base (Far East)
      { label: "VOLGA BANKS", id: "B4", gameX: 70121.0, gameY: -43351.0, radius: 7500.0, team: "us", type: "strongpoint" }, // Booster 4 (North)
      { label: "GRUDININ'S MILL", id: "B2", gameX: 70063.0, gameY: 32.0, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 2 (Mid)
      { label: "L-SHAPED HOUSE", id: "B6", gameX: 68875.0, gameY: 35043.0, radius: 7500.0, team: "us", type: "strongpoint" }, // Booster 6 (South)

      // --- GUN POSITIONS ---
      // SOVIETS (East - Positive X)
      { label: "", id: "SOV_A1", gameX: 78109.51, gameY: -5554.999, radius: 500, team: "us", type: "point", rotation: 87.2 }, 
      { label: "", id: "SOV_A2", gameX: 78366.555, gameY: -4298.889, radius: 500, team: "us", type: "point", rotation: 92.8 }, 
      { label: "", id: "SOV_A3", gameX: 78117.766, gameY: -3058.8193, radius: 500, team: "us", type: "point", rotation: 92.8 }, 

      // GERMANS (West - Negative X)
      { label: "", id: "GER_A1", gameX: -93251.61, gameY: -5937.273, radius: 500, team: "ger", type: "point", rotation: -89.5 }, 
      { label: "", id: "GER_A2", gameX: -93397.79, gameY: -3805.0764, radius: 500, team: "ger", type: "point", rotation: -89.5 }, 
      { label: "", id: "GER_A3", gameX: -93916.195, gameY: -2579.355, radius: 500, team: "ger", type: "point", rotation: -97.5 } 
    ] 
  },
  TOB: {
    name: "Tobruk",
    image: "images/maps/map_tobruk.webp",
    thumbnail: "images/maps/thumbnail/TOB.webp",
    teams: { t1: "BRITISH 8TH ARMY", t2: "GERMANY" },
    history: {
      battle: "Siege of Tobruk (April 10 - November 27, 1941)",
      description: "The Siege of Tobruk was a 241-day confrontation during the Western Desert Campaign of World War II. After the British defeat at Gazala, Axis forces under General Erwin Rommel advanced on the Libyan port of Tobruk, which was defended by British and Commonwealth forces, primarily the Australian 9th Division. The garrison of approximately 25,000 men held out against repeated Axis assaults, becoming a symbol of Allied resistance in North Africa. Tobruk's capture was crucial for Rommel's advance toward Egypt, but its stubborn defense denied the Axis a vital supply port and tied down significant Axis forces.",
      tactics: "The Tobruk perimeter was fortified with a double semi-circle of concrete strongpoints, an anti-tank ditch, and barbed wire defenses. The defenders used aggressive patrolling, counter-attacks, and artillery to maintain the perimeter. The port remained operational throughout the siege, allowing supply deliveries by sea despite Axis air attacks. Rommel attempted several assaults, most notably at El Adem road and Ras el Medauar, but Australian and British forces repelled these attacks. The Luftwaffe and Regia Aeronautica conducted heavy bombing raids, but the garrison held firm until relief came through Operation Crusader in November 1941.",
      significance: "The defense of Tobruk was a major Allied victory that boosted morale after earlier defeats in North Africa. The siege denied the Axis a critical supply port and forced Rommel to divert significant forces to contain the garrison, delaying his advance toward Egypt. The 241-day defense demonstrated the effectiveness of fortified positions and determined resistance against mechanized forces. The successful relief of Tobruk through Operation Crusader marked a turning point in the North African campaign and led to the recapture of Cyrenaica. The Australian defenders became known as the 'Rats of Tobruk,' a term adopted with pride as a badge of honor.",
      images: [
        {
          thumbnail: "images/history/tobruk/tobruk_1941_thumbnail.webp",
          full: "images/history/tobruk/tobruk_1941.webp",
          caption: "The British offensive in Libya. Artillery shelling enemy position. 1941."
        },
        {
          thumbnail: "images/history/tobruk/tobruk_1941_australian_forces.webp",
          full: "images/history/tobruk/tobruk_1941_australian_forces.webp",
          caption: "Australian Forces in North Africa during the Second World War. The 'Rats of Tobruk' - some of the 15,000 men of General Morshead's 9th Australian Division shelter in caves during an air raid during the siege of Tobruk. After six months besieged in the vital supply port the Australians were evacuated by sea and relieved by fresh troops. 823 men had been killed, 2214 wounded and 700 captured. 13 June 1941."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/tobruk/tobruk_1941_planning_thumbnail.webp",
            full: "images/history/tobruk/tobruk_1941_planning.webp",
            caption: "The second battle of Libya. Before zero hour. The Brigadier commanding tank units in Tobruk instructing tank commanders on the operations, using a sand table for demonstration purposes. 1941."
          },
          {
            thumbnail: "images/history/tobruk/tobruk_1941_message.webp",
            full: "images/history/tobruk/tobruk_1941_message.webp",
            caption: "The commanding officer of an armoured unit receives a message at his HQ located in a tunnel within the Tobruk perimeter, 12 September 1941."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/tobruk/tobruk_1941_ruins_thumbnail.webp",
            full: "images/history/tobruk/tobruk_1941_ruins.webp",
            caption: "Ruins of Tobruk. A soldier walking along the road is visible. February 1942."
          },
          {
            thumbnail: "images/history/tobruk/tobruk_1941_soldiers_of_the_allied_armies_thumbnail.webp",
            full: "images/history/tobruk/tobruk_1941_soldiers_of_the_allied_armies.webp",
            caption: "Soldiers from each of five different allied armies fighting together against the Germans and Italians in Tobruk, Libya. From the left they are Polish, British, Indian, Australian and Czech. 22 October 1941."
          }
        ]
      }
    },

    widthMeters: 2000,
    heightMeters: 2000,

    gunSort: "y",
    gunRotations: { "us": 90, "ger": -90 },

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // --- AXIS GUNS (Germany) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "GER_A3", gameX: -92423.66, gameY: -5152.503, radius: 500, team: "ger", type: "point", rotation: -109.7 },  // North
      { label: "", id: "GER_A2", gameX: -93282.37, gameY: -5983.347, radius: 500, team: "ger", type: "point", rotation: -90.0 },  // Mid
      { label: "", id: "GER_A1", gameX: -92338.164, gameY: -7535.631, radius: 500, team: "ger", type: "point", rotation: -78.7 }, // South

      // --- ALLIES GUNS (British) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "GB_A3", gameX: 93126.9, gameY: 7690.272, radius: 500, team: "us", type: "point", rotation: 114.4 },    // North
      { label: "", id: "GB_A2", gameX: 92639.85, gameY: 5926.3613, radius: 500, team: "us", type: "point", rotation: 87.8 },   // Mid
      { label: "", id: "GB_A1", gameX: 93045.516, gameY: 1597.4238, radius: 500, team: "us", type: "point", rotation: 61.6 },  // South

      // --- AXIS SECTORS (Col 1 & 2) ---
      { label: "GUARD ROOM", id: "B1", gameX: -68855.0, gameY: 27530.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "TANK GRAVEYARD", id: "B2", gameX: -69405.0, gameY: 2075.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "DIVISION HEADQUARTERS", id: "B3", gameX: -69835.0, gameY: -45005.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "WEST CREEK", id: "B4", gameX: -40077.0, gameY: 44015.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "ALBERGO RISTORANTE MODERNO", id: "B5", gameX: -29536.5, gameY: -2241.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "KING SQUARE", id: "B6", gameX: -29485.1, gameY: -39744.3, radius: 8000.0, team: "ger", type: "strongpoint" },

      // --- NEUTRAL SECTORS (Col 3) ---
      { label: "DESERT RAT CAVES", id: "B7", gameX: 31.2, gameY: 39665.2, radius: 8000.0, team: "neu", type: "strongpoint" },
      { label: "CHURCH GROUNDS", id: "B8", gameX: 59.9, gameY: -11770.0, radius: 7000.0, team: "neu", type: "strongpoint" },
      { label: "ADMIRALTY HOUSE", id: "B9", gameX: 7919.4, gameY: -48901.8, radius: 9000.0, team: "neu", type: "strongpoint" },

      // --- ALLIES SECTORS (Col 4 & 5) ---
      { label: "ABANDONED AMMO CACHE", id: "B10", gameX: 39687.5, gameY: 39659.9, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "8TH ARMY MEDICAL HOSPITAL", id: "B11", gameX: 40124.0, gameY: 2845.0, radius: 9000.0, team: "us", type: "strongpoint" },
      { label: "SUPPLY DUMP", id: "B12", gameX: 39820.5, gameY: -43918.3, radius: 9000.0, team: "us", type: "strongpoint" },
      { label: "ROAD TO SENUSSI MINE", id: "B13", gameX: 69522.8, gameY: 40790.0, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "MAKESHIFT AID STATION", id: "B14", gameX: 69380.0, gameY: -25.0, radius: 9000.0, team: "us", type: "strongpoint" },
      { label: "CARGO WAREHOUSES", id: "B15", gameX: 70047.3, gameY: -41171.9, radius: 8000.0, team: "us", type: "strongpoint" }
    ],
  },
UTA: { 
    name: "Utah Beach", 
    image: "images/maps/map_utahbeach.webp", 
    thumbnail: "images/maps/thumbnail/UTA.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    history: {
      battle: "Utah Beach Landings (June 6, 1944)",
      description: "Utah Beach was the westernmost of the five D-Day landing beaches, assaulted by the U.S. 4th Infantry Division along with airborne troops from the 101st and 82nd Airborne Divisions. The landing was preceded by airborne drops beginning at 01:30 to secure inland exits and destroy bridges over the Douve River. Naval bombardment commenced at 05:45, followed by air strikes at 06:10. The first infantry waves landed at 06:30. Strong currents pushed the landing craft about 2,000 yards south of their intended landing zone, but Brigadier General Theodore Roosevelt Jr. decided to continue from the new location, which proved advantageous with fewer enemy strongpoints.",
      tactics: "The 4th Infantry Division landed in four waves, with infantry first, followed by engineers, DD tanks, and conventional Sherman tanks. The misdirected landing actually benefited the assault, as the new sector had only one strongpoint (WN7) instead of two, and it had been heavily damaged by preliminary bombardment. Engineers quickly cleared obstacles and mines before the tide came in at 10:30. The beach was secured within an hour, and combat teams pushed inland along the causeways. The 101st Airborne secured the western flank and causeways, while the 82nd Airborne captured Sainte-Mère-Église, the first town liberated in the invasion.",
      significance: "Utah Beach was the most successful of the D-Day landings, with only 197 casualties among the 4th Infantry Division compared to thousands at Omaha Beach. The landing secured a vital beachhead and allowed Allied forces to penetrate 4 miles inland by the end of D-Day. The capture of Sainte-Mère-Église and the causeways linked Utah Beach with the rest of the Allied front. The success at Utah demonstrated the effectiveness of combined arms operations, airborne assaults, and the importance of flexible leadership in adapting to changing circumstances.",
      images: [
        {
          thumbnail: "images/history/utah_beach/utah_beach_1944.webp",
          full: "images/history/utah_beach/utah_beach_1944.webp",
          caption: "U.S. Army Air Forces C-47 transport planes fly low over a Coast Guard manned Landing Craft Infantry (LCI) off Utah Beach, during the Normandy invasion, 6 June 1944. U.S. Coast Guard Collection."
        },
        {
          thumbnail: "images/history/utah_beach/utah_beach_1944_uss_nevada_thumbnail.webp",
          full: "images/history/utah_beach/utah_beach_1944_uss_nevada.webp",
          caption: "Forward 14 inch/45 guns of USS Nevada (BB-36) fire on positions ashore, during the landings on Utah Beach, 6 June 1944."
        }
      ],
      tacticalSituation: {
        images: [
          {
            thumbnail: "images/history/utah_beach/utah_beach_1944_coast_guard_thumbnail.webp",
            full: "images/history/utah_beach/utah_beach_1944_coast_guard.webp",
            caption: "Allied troops storm Utah Beach under heavy German artillery and machine gun fire in Normandy, France, June 6, 1944. More than 23,000 men of the U.S. 4th Infantry Division landed on Utah Beach, the westernmost of the assault beaches. U.S. Coast Guard photo."
          },
          {
            thumbnail: "images/history/utah_beach/utah_beach_1944_troops_seawall_thumbnail.webp",
            full: "images/history/utah_beach/utah_beach_1944_troops_seawall.webp",
            caption: "U.S. Soldiers of the 8th Infantry Regiment, 4th Infantry Division, move out over the seawall on Utah Beach after coming ashore. Other troops are resting behind the concrete wall. 6 or 9 June 1944."
          }
        ]
      },
      strategicContext: {
        images: [
          {
            thumbnail: "images/history/utah_beach/utah_beach_1944_american_soldiers_thumbnail.webp",
            full: "images/history/utah_beach/utah_beach_1944_american_soldiers.webp",
            caption: "American soldiers land on Utah Beach and cross the barbed wire laid by German troops to slow the Allied advance. They are supported by a Sherman tank. 1944."
          },
          {
            thumbnail: "images/history/utah_beach/utah_beach_1944_supplies_thumbnail.webp",
            full: "images/history/utah_beach/utah_beach_1944_supplies.webp",
            caption: "Supplies move forward with advancing troops as they forge ahead on Utah Beach, France. 10 June 1944."
          }
        ]
      }
    },
    
    // Confirmed 1984m (Standard Warfare Map)
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // US (East) faces West (90), GER (West) faces East (-90)
    gunRotations: { "us": 90, "ger": -90 },
    gunSort: "y", 

    guns: ["HQ Gun 1 (North)", "HQ Gun 2 (Mid)", "HQ Gun 3 (South)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted.
      // Sorted North (Negative Y) to South (Positive Y).
      
      // --- AXIS BASE (West - Negative X) ---
      { label: "SAINTE MARIE APPROACH", id: "B17", gameX: -64837.0, gameY: -52705.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // North
      { label: "FLOODED HOUSE", id: "B16", gameX: -66464.0, gameY: 2944.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // Mid
      { label: "MAMMUT RADAR", id: "B15", gameX: -65158.0, gameY: 51522.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // South

      // --- AXIS MID (Mid-West) ---
      { label: "DROWNED FIELDS", id: "B13", gameX: -36400.0, gameY: -43928.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // North
      { label: "LA GRANDE CRIQUE", id: "B12", gameX: -28986.0, gameY: -508.0, radius: 3294.0, team: "ger", type: "strongpoint" }, // Mid
      { label: "SUNKEN BRIDGE", id: "B14", gameX: -30810.0, gameY: 47853.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // South

      // --- NEUTRAL (Center) ---
      { label: "WN7", id: "B9", gameX: 727.0, gameY: -50408.0, radius: 5000.0, team: "neu", type: "strongpoint" }, // North
      { label: "THE CHAPEL", id: "B10", gameX: 10650.0, gameY: 7786.0, radius: 3000.0, team: "neu", type: "strongpoint" }, // Mid
      { label: "WN4", id: "B11", gameX: 5359.0, gameY: 42267.0, radius: 3742.0, team: "neu", type: "strongpoint" }, // South (Note: Very tall oval shape in game)

      // --- ALLIES MID (Mid-East) ---
      { label: "WN5", id: "B8", gameX: 48763.0, gameY: -44080.0, radius: 3194.0, team: "us", type: "strongpoint" }, // North
      { label: "HILL 5", id: "B7", gameX: 36131.0, gameY: 1838.0, radius: 3000.0, team: "us", type: "strongpoint" }, // Mid
      { label: "AA BATTERY", id: "B18", gameX: 35101.0, gameY: 43589.0, radius: 3942.0, team: "us", type: "strongpoint" }, // South

      // --- ALLIES BASE (East - Positive X) ---
      { label: "UNCLE RED", id: "B5", gameX: 66675.0, gameY: -45162.0, radius: 2824.0, team: "us", type: "strongpoint" }, // North
      { label: "RED ROOF HOUSE", id: "B4", gameX: 64923.67, gameY: -3144.0, radius: 3250.0, team: "us", type: "strongpoint" }, // Mid
      { label: "TARE GREEN", id: "B3", gameX: 63845.0, gameY: 46581.0, radius: 3000.0, team: "us", type: "strongpoint" }, // South

      // --- GUN POSITIONS ---
      // SOVIETS (East - Positive X)
      { label: "", id: "US_A1", gameX: 77788.36, gameY: -6617.35, radius: 500, team: "us", type: "point", rotation: 87.2 }, // North
      { label: "", id: "US_A2", gameX: 78334.16, gameY: -4627.70, radius: 500, team: "us", type: "point", rotation: 92.8 }, // Mid
      { label: "", id: "US_A3", gameX: 77932.25, gameY: -2639.21, radius: 500, team: "us", type: "point", rotation: 92.8 }, // South

      // GERMANS (West - Negative X)
      { label: "", id: "GER_A1", gameX: -91738.08, gameY: -221.04, radius: 500, team: "ger", type: "point", rotation: -89.5 }, // North
      { label: "", id: "GER_A2", gameX: -91714.0, gameY: 752.0, radius: 500, team: "ger", type: "point", rotation: -89.5 }, // Mid
      { label: "", id: "GER_A3", gameX: -91649.22, gameY: 1828.61, radius: 500, team: "ger", type: "point", rotation: -89.5 } // South
    ] 
  },
};
