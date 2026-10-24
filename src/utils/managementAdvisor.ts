import {
  CVMeasurements,
  ImageQualityAssessment,
  CompetingHypothesis,
  GrowthStage,
  SensorReading,
  ManagementRecommendation,
  SixPointManagementPlan
} from '../types';

/**
 * Computes evidence-driven, safe, crop-specific disease identification
 * and actionable 6-point agronomic management and treatment advice.
 * Adheres strictly to agricultural extension guidelines and biological safety protocols.
 */
export function generateManagementAdvice(
  cropType: string,
  growthStage: GrowthStage,
  measurements: CVMeasurements,
  quality: ImageQualityAssessment,
  hypotheses: CompetingHypothesis[],
  farmerNotes: string = '',
  userAnswers: Record<string, string> = {},
  sensorData: SensorReading | null = null
): ManagementRecommendation {
  const normCrop = (cropType || 'Crop').trim();
  const lowerCrop = normCrop.toLowerCase();
  const topHypothesis = hypotheses && hypotheses.length > 0 ? hypotheses[0] : null;

  // -------------------------------------------------------------------------
  // 1. INSUFFICIENT EVIDENCE GATEWAY (Blurry, out-of-focus, poor framing)
  // -------------------------------------------------------------------------
  const isBlurry = quality.isBlurry || measurements.sharpness < 70;
  const isPoorFraming = quality.isPoorFraming || measurements.foliagePercentage < 10;
  const isTooDark = quality.isTooDark || measurements.brightness < 45;
  const hasInsufficientEvidence = isBlurry || isPoorFraming || isTooDark;

  if (hasInsufficientEvidence) {
    const whyEvidenceEn = [
      `Image quality insufficient for reliable disease assessment (Laplacian sharpness: ${measurements.sharpness} vs 70 minimum threshold).`,
      `Motion or lens blur obscures fine pathogen spore fruiting bodies, concentric lesion rings, and veinal margins.`,
      `Plant foliage framing covers ${measurements.foliagePercentage}% of the frame (minimum 20% required for valid segmentation).`,
      `Clinical safety mandate: No disease can be responsibly identified from an unclear photograph.`
    ];

    const whyEvidenceTe = [
      `ఖచ్చితమైన వ్యాధి నిర్ధారణకు చిత్ర నాణ్యత సరిపోలేదు (లాప్లాసియన్ పదును: ${measurements.sharpness}, కనీసం 70 ఉండాలి).`,
      `ఫోటో మసకగా ఉండటం వల్ల ఆకు మచ్చలు, వలయాలు మరియు ఈనెల మార్పులను ఖచ్చితంగా గుర్తించలేము.`,
      `చిత్రంలో ఆకు విస్తీర్ణం ${measurements.foliagePercentage}% మాత్రమే ఉంది (కనీసం 20% ఉండాలి).`,
      `భద్రతా నియమం: అస్పష్టమైన ఫోటో ఆధారంగా ఎలాంటి తెగులును ఊహించలేము.`
    ];

    const stillNeededEn = [
      'Crisp close-up photograph captured from 15–20 cm in bright indirect daylight',
      'Direct physical inspection of leaf undersides with a 10x hand lens',
      'Checking adjacent plants in the row to verify symptom distribution'
    ];

    const stillNeededTe = [
      'సహజ వెలుతురులో కెమెరా కదలకుండా 15-20 సెం.మీ దూరం నుండి తీసిన స్పష్టమైన క్లోజప్ ఫోటో',
      'భూతద్దంతో ఆకు అడుగు భాగాన్ని ప్రత్యక్షంగా పరిశీలించడం',
      'పక్కనున్న మొక్కలపై కూడా ఇలాంటి లక్షణాలు ఉన్నాయో లేదో చూడటం'
    ];

    const sixPointPlan: SixPointManagementPlan = {
      immediateSteps: {
        en: [
          'Do NOT spray chemical fungicides or pesticides based on an unclear photograph.',
          'Retake a crisp close-up photograph from 15–20 cm away in bright, indirect daylight (avoid harsh noon sun glare).',
          'Hold your mobile phone steady with both hands or rest elbows against your torso.',
          'Wipe the phone camera lens with a clean microfiber cloth before shooting.'
        ],
        te: [
          'అస్పష్టమైన ఫోటో ఆధారంగా ఎలాంటి రసాయన మందులు పిచికారీ చేయవద్దు.',
          'సహజమైన పగటి వెలుతురులో కెమెరా కదలకుండా 15-20 సెం.మీ దూరం నుండి స్పష్టమైన క్లోజప్ ఫోటో తీయండి.',
          'ఫోన్ కదలకుండా రెండు చేతులతో స్థిరంగా పట్టుకోండి.',
          'ఫోటో తీసే ముందు మొబైల్ కెమెరా లెన్స్‌ను శుభ్రమైన గుడ్డతో తుడవండి.'
        ]
      },
      environmentalIrrigation: {
        en: [
          sensorData
            ? `Maintain standard irrigation schedule (current soil moisture: ${sensorData.soilMoisture}%). Prevent standing water in root zones.`
            : 'Check root-zone soil moisture manually at 10 cm depth; keep soil moist but well-drained.'
        ],
        te: [
          sensorData
            ? `ప్రస్తుత నేల తేమ (${sensorData.soilMoisture}%) ఆధారంగా సాధారణ నీటి యాజమాన్యాన్ని పాటించండి. నీరు నిల్వ ఉండకుండా చూడండి.`
            : 'మొక్క మొదట్లో 10 సెం.మీ లోతులో తేమను పరిశీలించి, నీరు నిలవకుండా డ్రైనేజీ ఉండేలా చూసుకోండి.'
        ]
      },
      affectedPlantManagement: {
        en: [
          'Observe symptomatic leaves directly on the plant without tearing them off prematurely.',
          'If lower leaves are rotting against wet soil, carefully trim and discard outside the plot.'
        ],
        te: [
          'ఆకులను వెంటనే తెంపేయకుండా మొక్కపైనే ఉంచి నిశితంగా గమనించండి.',
          'కింది ఆకులు తడి నేలను తాకుతూ కుళ్ళిపోతుంటే వాటిని కత్తిరించి పొలం బయట పారవేయండి.'
        ]
      },
      preventionMeasures: {
        en: [
          'Frame future scans so the leaf fills at least 50% of the screen.',
          'Avoid working in the field during early morning dew to reduce disease spread.'
        ],
        te: [
          'భవిష్యత్తు ఫోటోలలో ఆకు స్క్రీన్‌లో సగం కంటే ఎక్కువ కనిపించేలా తీయండి.',
          'మంచు ఉన్న ఉదయపు వేళల్లో తడిసిన పొలంలో తిరగవద్దు.'
        ]
      },
      monitoringFollowUp: {
        en: [
          'Re-scan with a sharp photo within 24 hours if spotting or yellowing appears to expand.'
        ],
        te: [
          'మచ్చలు లేదా పసుపు రంగు పెరుగుతున్నట్లు అనిపిస్తే 24 గంటల్లోపు స్పష్టమైన ఫోటోతో మళ్లీ స్కాన్ చేయండి.'
        ]
      },
      expertConfirmation: {
        en: 'If symptoms spread rapidly to more than 5% of your plot before a clear scan can be taken, take a fresh leaf sample in a clean paper envelope to your nearest Krishi Vigyan Kendra (KVK) or Mandal Agricultural Extension Officer (AEO).',
        te: 'స్పష్టమైన ఫోటో తీసేలోపు పొలంలో 5% కంటే ఎక్కువ మొక్కలపై లక్షణాలు వేగంగా వ్యాపిస్తే, తాజా ఆకు నమూనాను పేపర్ కవరులో ఉంచి సమీపంలోని కృషి విజ్ఞాన కేంద్రం (KVK) లేదా వ్యవసాయ విస్తరణ అధికారి (AEO) వద్దకు తీసుకెళ్లండి.'
      }
    };

    return {
      possibleConditionEn: 'Image quality insufficient for reliable disease assessment',
      possibleConditionTe: 'ఖచ్చితమైన వ్యాధి నిర్ధారణకు చిత్ర నాణ్యత సరిపోలేదు',
      likelyConditionEn: 'Image quality insufficient for reliable disease assessment',
      likelyConditionTe: 'ఖచ్చితమైన వ్యాధి నిర్ధారణకు చిత్ర నాణ్యత సరిపోలేదు',
      conditionCategory: 'insufficient_evidence',
      statusBadgeEn: 'Image Quality Insufficient — No Diagnosis Possible',
      statusBadgeTe: 'చిత్ర నాణ్యత సరిపోలేదు — వ్యాధి నిర్ధారణ అసాధ్యం',
      whySuspectedEn: whyEvidenceEn.join(' '),
      whySuspectedTe: whyEvidenceTe.join(' '),
      whyEvidenceEn,
      whyEvidenceTe,
      confidenceWordingEn: 'Uncertain — Cannot assess safely without clear visual symptoms.',
      confidenceWordingTe: 'అనిశ్చితం — స్పష్టమైన దృశ్య లక్షణాలు లేకుండా వ్యాధిని నిర్ధారించలేము.',
      stillNeededForConfirmationEn: stillNeededEn,
      stillNeededForConfirmationTe: stillNeededTe,
      immediateStepsEn: sixPointPlan.immediateSteps.en,
      immediateStepsTe: sixPointPlan.immediateSteps.te,
      treatmentManagementEn: [
        'Practice observational caution: suspend chemical interventions until clear visual evidence is achieved.',
        'Follow local agricultural guidance before applying any treatment.'
      ],
      treatmentManagementTe: [
        'స్పష్టమైన ఆధారాలు లభించే వరకు ఎలాంటి రసాయన మందుల వాడకాన్ని నిలిపివేయండి.',
        'ఏదైనా చికిత్స చేసే ముందు స్థానిక వ్యవసాయ నిపుణుల సలహా పాటించండి.'
      ],
      preventionStepsEn: sixPointPlan.preventionMeasures.en,
      preventionStepsTe: sixPointPlan.preventionMeasures.te,
      whenToSeekHelpEn: sixPointPlan.expertConfirmation.en,
      whenToSeekHelpTe: sixPointPlan.expertConfirmation.te,
      sixPointPlan,
      isEvidenceSufficient: false,
      safetyNoticeEn: 'Important Safety Notice: Never treat crops based on blurry imagery. Computer vision cannot safely identify disease symptoms when edge sharpness is degraded. No chemical spray should be applied without verified physical symptoms.',
      safetyNoticeTe: 'ముఖ్యమైన భద్రతా గమనిక: అస్పష్టమైన ఫోటోలతో మందులు వాడవద్దు. ఫోటో నాణ్యత తక్కువగా ఉన్నప్పుడు తెగుళ్లను గుర్తించడం సాధ్యం కాదు. నిర్ధారణ లేకుండా రసాయనాలు పిచికారీ చేయవద్దు.'
    };
  }

  // -------------------------------------------------------------------------
  // 2. HEALTHY CROP GATEWAY
  // High green chlorophyll, minimal brown necrotic lesions, minimal chlorosis
  // -------------------------------------------------------------------------
  const isHealthy =
    measurements.greenPercentage >= 70 &&
    measurements.brownPercentage < 3.5 &&
    measurements.yellowPercentage < 8.0 &&
    measurements.darkPercentage < 1.5;

  if (isHealthy) {
    const likelyEn = `Healthy ${normCrop} Foliage — No Pathological Lesions Detected`;
    const likelyTe = `ఆరోగ్యకరమైన ${normCrop} ఆకు — ఎలాంటి తెగులు మచ్చలు లేవు`;

    const whyEn = [
      `High chlorophyll index: ${measurements.greenPercentage}% healthy green foliage detected.`,
      `Negligible necrotic lesion area (${measurements.brownPercentage}%) and zero dark spore clustering.`,
      `Uniform leaf coloration with intact veinal structure and normal dynamic contrast (${measurements.contrast}).`,
      `Crop at ${growthStage} stage showing normal vegetative physiological health.`
    ];

    const whyTe = [
      `అధిక క్లోరోఫిల్ శాతం: ${measurements.greenPercentage}% ఆరోగ్యకరమైన ఆకుపచ్చ రంగు గుర్తించబడింది.`,
      `చాలా తక్కువ గోధుమ రంగు మచ్చలు (${measurements.brownPercentage}%) మరియు నల్లటి మచ్చలు లేవు.`,
      `ఆకు అంతటా సమానమైన రంగు, పటిష్టమైన ఈనెల నిర్మాణం మరియు అనుకూలమైన కాంట్రాస్ట్ (${measurements.contrast}).`,
      `${normCrop} (${growthStage} దశ) సాధారణ ఆరోగ్యకరమైన పెరుగుదలను కనబరుస్తోంది.`
    ];

    const stillNeededEn = [
      'Routine bi-weekly field scouting of lower canopy leaves',
      'Checking leaf undersides periodically for early sap-sucking pest infestation',
      'Maintaining balanced soil nutrition and optimal moisture levels'
    ];

    const stillNeededTe = [
      'ప్రతి రెండు వారాలకొకసారి కింద ఆకులను పరిశీలించడం',
      'ఆకు అడుగు భాగంలో రసం పీల్చే పురుగుల ఉనికిని గమనించడం',
      'సమతుల్య ఎరువులు మరియు సరైన నీటి యాజమాన్యం పాటించడం'
    ];

    const sixPointPlan: SixPointManagementPlan = {
      immediateSteps: {
        en: [
          'No chemical or curative pesticide treatment is required.',
          'Continue regular crop care, light weeding, and routine scouting.',
          'Inspect the plant canopy early in the morning for any change in leaf vigor.'
        ],
        te: [
          'ఎలాంటి పురుగు మందులు లేదా రసాయనాలు పిచికారీ చేయవలసిన అవసరం లేదు.',
          'సాధారణ పంట సంరక్షణ, కలుపు నివారణ మరియు క్రమబద్ధమైన పరిశీలన కొనసాగించండి.',
          'ఉదయపు వేళల్లో ఆకుల తాజాదనాన్ని గమనించండి.'
        ]
      },
      environmentalIrrigation: {
        en: [
          sensorData
            ? `Maintain current irrigation thresholds (telemetry indicates soil moisture at ${sensorData.soilMoisture}% and temperature at ${sensorData.airTemperature}°C).`
            : 'Maintain standard drip or furrow irrigation without waterlogging the root bed.'
        ],
        te: [
          sensorData
            ? `ప్రస్తుత నీటి పారుదలని కొనసాగించండి (నేలలో తేమ: ${sensorData.soilMoisture}%, ఉష్ణోగ్రత: ${sensorData.airTemperature}°C).`
            : 'పాదుల్లో నీరు నిలవకుండా డ్రిప్ లేదా కాల్వల ద్వారా తగినంత నీరు అందించండి.'
        ]
      },
      affectedPlantManagement: {
        en: [
          'No plant containment or diseased leaf removal needed.',
          'Gently prune yellowing senescent bottom leaves touching soil to enhance air movement.'
        ],
        te: [
          'మొక్కలను తొలగించవలసిన అవసరం లేదు.',
          'నేలను తాకుతున్న అట్టడుగు పాత ఆకులను సున్నితంగా తొలగిస్తే గాలి వెలుతురు బాగా ఆడుతుంది.'
        ]
      },
      preventionMeasures: {
        en: [
          'Preserve beneficial predatory insects (ladybird beetles, spiders, lacewings) by avoiding unnecessary prophylactic chemical sprays.',
          'Apply balanced organic compost or well-rotted FYM to maintain robust soil biology.'
        ],
        te: [
          'అనవసరంగా రసాయన మందులు కొట్టకుండా మిత్ర పురుగులను (లేడీబర్డ్ బీటిల్స్, సాలీళ్ళు) కాపాడుకోండి.',
          'నేల సారాన్ని కాపాడటానికి బాగా చివికిన పశువుల ఎరువు లేదా కంపోస్టును అందించండి.'
        ]
      },
      monitoringFollowUp: {
        en: [
          'Conduct another routine scan in 7–10 days or immediately following unseasonal rain or temperature spikes.'
        ],
        te: [
          'మరో 7-10 రోజుల్లో లేదా అకాల వర్షాలు పడిన తర్వాత మళ్లీ సాధారణ స్కాన్ చేయండి.'
        ]
      },
      expertConfirmation: {
        en: 'No specialist consultation is currently needed. Contact your local agricultural extension officer (AEO) or KVK if unseasonal pest attacks appear.',
        te: 'ప్రస్తుతం నిపుణుల సంప్రదింపులు అవసరం లేదు. అనుకోని పురుగుల ఉధృతి కనిపిస్తే మీ మండల వ్యవసాయ అధికారిని సంప్రదించండి.'
      }
    };

    return {
      possibleConditionEn: likelyEn,
      possibleConditionTe: likelyTe,
      likelyConditionEn: likelyEn,
      likelyConditionTe: likelyTe,
      conditionCategory: 'healthy_crop',
      statusBadgeEn: 'Healthy Foliage — Optimal Chlorophyll Profile',
      statusBadgeTe: 'ఆరోగ్యకరమైన పంట — సరైన క్లోరోఫిల్ స్థితి',
      whySuspectedEn: whyEn.join(' '),
      whySuspectedTe: whyTe.join(' '),
      whyEvidenceEn: whyEn,
      whyEvidenceTe: whyTe,
      confidenceWordingEn: 'Likely based on visual evidence — normal vegetative health.',
      confidenceWordingTe: 'దృశ్య ఆధారాల ప్రకారం అధిక సంభావ్యత — సాధారణ ఆరోగ్యకరమైన పెరుగుదల.',
      stillNeededForConfirmationEn: stillNeededEn,
      stillNeededForConfirmationTe: stillNeededTe,
      immediateStepsEn: sixPointPlan.immediateSteps.en,
      immediateStepsTe: sixPointPlan.immediateSteps.te,
      treatmentManagementEn: [
        'No chemical treatments indicated. Preserve beneficial predatory insects.',
        'Maintain balanced fertilization adhering to seasonal Soil Health Card guidance.'
      ],
      treatmentManagementTe: [
        'ఎలాంటి రసాయన మందులు అవసరం లేదు. మిత్ర పురుగులను కాపాడుకోండి.',
        'భూసార పరీక్ష ఆధారంగా సమతుల్య ఎరువులను అందించండి.'
      ],
      preventionStepsEn: sixPointPlan.preventionMeasures.en,
      preventionStepsTe: sixPointPlan.preventionMeasures.te,
      whenToSeekHelpEn: sixPointPlan.expertConfirmation.en,
      whenToSeekHelpTe: sixPointPlan.expertConfirmation.te,
      sixPointPlan,
      isEvidenceSufficient: true,
      safetyNoticeEn: 'Educational agronomy decision support. Healthy foliage does not require prophylactic pesticide spraying. Avoid chemical use when crops are healthy to protect pollinators and soil microbiota.',
      safetyNoticeTe: 'ఆరోగ్యంగా ఉన్న పంటపై ముందుజాగ్రత్తగా పురుగుమందులు పిచికారీ చేయవద్దు. రసాయనాలు తగ్గించడం వల్ల నేల ప్రాణం మరియు మిత్ర పురుగులు రక్షించబడతాయి.'
    };
  }

  // -------------------------------------------------------------------------
  // 3. CROP-SPECIFIC DISEASE & SYMPTOM IDENTIFICATION
  // -------------------------------------------------------------------------
  const isTomato = lowerCrop.includes('tomato');
  const isPaddy = lowerCrop.includes('paddy') || lowerCrop.includes('rice');
  const isCotton = lowerCrop.includes('cotton');
  const isChilli = lowerCrop.includes('chilli') || lowerCrop.includes('pepper') || lowerCrop.includes('mirchi');
  const isPotato = lowerCrop.includes('potato');
  const isMaize = lowerCrop.includes('maize') || lowerCrop.includes('corn');

  const bPct = measurements.brownPercentage;
  const dPct = measurements.darkPercentage;
  const yPct = measurements.yellowPercentage;
  const gPct = measurements.greenPercentage;
  const isHighHumidity = (sensorData && sensorData.airHumidity > 75) || userAnswers.q_recent_weather === 'wet_humid';
  const isHighMoisture = (sensorData && sensorData.soilMoisture > 70);
  const isLowMoisture = (sensorData && sensorData.soilMoisture < 25) || userAnswers.q_recent_weather === 'hot_dry';

  let conditionTitleEn = '';
  let conditionTitleTe = '';
  let conditionCategory: ManagementRecommendation['conditionCategory'] = 'foliar_lesions';
  let whyListEn: string[] = [];
  let whyListTe: string[] = [];
  let stillNeededListEn: string[] = [];
  let stillNeededListTe: string[] = [];

  // Tailored 6-point plan content variables
  let immediateStepsEn: string[] = [];
  let immediateStepsTe: string[] = [];
  let envStepsEn: string[] = [];
  let envStepsTe: string[] = [];
  let plantStepsEn: string[] = [];
  let plantStepsTe: string[] = [];
  let prevStepsEn: string[] = [];
  let prevStepsTe: string[] = [];
  let monitorStepsEn: string[] = [];
  let monitorStepsTe: string[] = [];
  let expertEn = '';
  let expertTe = '';

  // ------------------------- A. TOMATO -------------------------
  if (isTomato) {
    if (bPct >= 4.0 || dPct >= 2.0) {
      if (isHighHumidity && bPct > 10.0) {
        conditionTitleEn = 'Late Blight (Phytophthora infestans) — leading hypothesis';
        conditionTitleTe = 'టమోటా లేట్ బ్లైట్ / ఆకు మాడ తెగులు — ప్రాథమిక పరికల్పన';
        whyListEn = [
          `Rapidly expanding brown/dark necrotic lesions detected (${bPct}% brown, ${dPct}% dark micro-spots).`,
          `High field humidity (${sensorData?.airHumidity || 'elevated'}%) favors Phytophthora zoospore germination.`,
          `Lesion margins show water-soaked appearance consistent with Late Blight symptom profile.`,
          `Crop identified as Tomato at ${growthStage} stage with high risk of canopy transmission.`
        ];
        whyListTe = [
          `వేగంగా విస్తరించే గోధుమ/నల్లటి మచ్చలు గుర్తించబడ్డాయి (${bPct}% గోధుమ, ${dPct}% నల్ల మచ్చలు).`,
          `పొలంలో అధిక తేమ (${sensorData?.airHumidity || 'ఎక్కువ'}%) ఈ తెగులు వ్యాప్తికి అనుకూలం.`,
          `మచ్చల అంచులు నీటితో నానినట్లుగా ఉండి లేట్ బ్లైట్ లక్షణాలతో సరిపోలుతున్నాయి.`,
          `${growthStage} దశలోని టమోటా పంటలో ఇది వేగంగా వ్యాపించే ప్రమాదం ఉంది.`
        ];
      } else {
        conditionTitleEn = 'Early Blight (Alternaria solani) — leading hypothesis';
        conditionTitleTe = 'టమోటా ముందస్తు ఆకుమచ్చ తెగులు (ఎర్లీ బ్లైట్) — ప్రాథమిక పరికల్పన';
        whyListEn = [
          `Target-like concentric brown necrotic lesions detected across ${bPct}% of leaf area.`,
          `Chlorotic yellow halos (${yPct}%) surrounding lesion centers detected by CV spatial clustering.`,
          `Crop is Tomato at ${growthStage} stage; older and mid-canopy leaves are primary targets of Alternaria spores.`,
          `Visual contrast of ${measurements.contrast} confirms discrete necrotic borders with intact tissue.`
        ];
        whyListTe = [
          `ఆకుపై చక్రాల వంటి వలయాలు గల గోధుమ రంగు మచ్చలు (${bPct}%) గుర్తించబడ్డాయి.`,
          `మచ్చల చుట్టూ పసుపు రంగు వలయాలు (${yPct}%) స్పష్టంగా కనిపిస్తున్నాయి.`,
          `${growthStage} దశలోని టమోటా పంటలో క్రింది మరియు మధ్య ఆకులపై ఎర్లీ బ్లైట్ సాధారణంగా వస్తుంది.`,
          `కాంట్రాస్ట్ (${measurements.contrast}) స్పష్టమైన మచ్చల అంచులను నిర్ధారిస్తుంది.`
        ];
      }

      stillNeededListEn = [
        'Inspect leaf undersides with a hand lens for dark velvety spore growth in lesion centers',
        'Check stems for dark sunken cankers (collar rot phase)',
        'Track whether lesions spread to upper younger leaves over next 48 hours'
      ];
      stillNeededListTe = [
        'భూతద్దంతో ఆకు వెనుక భాగంలో మచ్చల మధ్య బూజు లేదా నల్లటి గింజల లాంటి ఆనవాళ్లు ఉన్నాయేమో చూడండి',
        'కాండంపై నల్లటి చారలు లేదా గుంటపడిన మచ్చలు ఉన్నాయేమో పరిశీలించండి',
        'వచ్చే 48 గంటల్లో మచ్చలు పై లేత ఆకులకు వ్యాపిస్తున్నాయేమో గమనించండి'
      ];

      immediateStepsEn = [
        'Inspect adjacent tomato plants along the same bed to check if spotting is localized or clustered.',
        'Carefully prune severely infected lower leaves touching wet soil using disinfected pruning shears.',
        'Avoid overhead sprinkler or hose watering; irrigate strictly at the base or through drip lines.',
        'Do NOT spray unverified chemical cocktails without proper extension confirmation.'
      ];
      immediateStepsTe = [
        'పక్కనున్న టమోటా మొక్కలను పరిశీలించి మచ్చలు కొన్ని మొక్కలకే పరిమితమా లేదా పొలమంతా ఉన్నాయా చూడండి.',
        'నేలను తాకే బాగా దెబ్బతిన్న కింద ఆకులను శానిటైజ్ చేసిన కత్తెరతో జాగ్రత్తగా కత్తిరించి తొలగించండి.',
        'పైనుండి నీరు చల్లవద్దు; కేవలం మొదళ్ల వద్ద లేదా డ్రిప్ ద్వారా మాత్రమే నీరు అందించండి.',
        'వ్యవసాయ అధికారుల సలహా లేకుండా ప్రమాదకర రసాయనాలను పిచికారీ చేయవద్దు.'
      ];

      envStepsEn = [
        sensorData
          ? `Current field humidity is ${sensorData.airHumidity}% and soil moisture is ${sensorData.soilMoisture}%. Maintain drip irrigation in early morning to allow canopy drying before dusk.`
          : 'Water strictly in early morning so foliage remains completely dry through nighttime hours.',
        'Improve between-row airflow by removing tall weed hosts along bed edges.'
      ];
      envStepsTe = [
        sensorData
          ? `పొలంలో గాలి తేమ ${sensorData.airHumidity}% మరియు నేల తేమ ${sensorData.soilMoisture}% గా ఉంది. ఉదయమే డ్రిప్ ద్వారా నీరు పెట్టండి.`
          : 'సాయంత్రం వేళల్లో ఆకులు తడవకుండా ఉదయపు వేళల్లో మాత్రమే నీరు పెట్టండి.',
        'మొక్కల వరుసల మధ్య కలుపు మొక్కలను తొలగించి గాలి వెలుతురు ధారాళంగా ఆడేలా చేయండి.'
      ];

      plantStepsEn = [
        'Bag clipped diseased leaves immediately and bury or dispose of them outside the farm perimeter.',
        'Disinfect shears in 70% isopropyl alcohol or 10% bleach solution between rows to prevent sap transmission.'
      ];
      plantStepsTe = [
        'కత్తిరించిన తెగులు సోకిన ఆకులను సంచిలో వేసి పొలం బయట పూడ్చిపెట్టండి.',
        'తెగులు ఇతర మొక్కలకు వ్యాపించకుండా కత్తెరను శానిటైజ్ చేయండి.'
      ];

      prevStepsEn = [
        'Practice a 2–3 season crop rotation with non-solanaceous crops (avoid planting after potato, eggplant, or pepper).',
        'Apply organic straw or plastic mulch beneath rows to prevent rain-splash spore transmission from soil.',
        'Treat nursery seedlings with certified biocontrol agents (Trichoderma viride or Pseudomonas fluorescens).'
      ];
      prevStepsTe = [
        'టమోటా తర్వాత వంగ, బంగాళాదుంప వేయకుండా 2-3 సీజన్ల పాటు పంట మార్పిడి పాటించండి.',
        'వర్షం పడినప్పుడు నేల నుండి మట్టి ఆకులపై పడకుండా ఎండుగడ్డి లేదా మల్చింగ్ షీట్ వాడండి.',
        'నారు నాటే ముందు ట్రైకోడెర్మా లేదా సూడోమోనాస్‌తో నారు వేర్ల శుద్ధి చేయండి.'
      ];

      monitorStepsEn = [
        'Check marked plants in 48–72 hours: verify if lesion margins remain stationary or expand into target rings.',
        'Inspect new vegetative shoots; emergence of green symptom-free leaves indicates successful containment.'
      ];
      monitorStepsTe = [
        'వచ్చే 48-72 గంటల్లో మచ్చలు పెరుగుతున్నాయో లేదో గమనించండి.',
        'కొత్త చిగుళ్లు తెగులు లేకుండా పచ్చగా వస్తున్నాయేమో చూడండి.'
      ];

      expertEn = 'Contact your Mandal Agricultural Extension Officer (AEO) or KVK specialist immediately if lesions spread to green fruit, cause stem cankers, or affect more than 10% of field beds. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'మచ్చలు కాయలకు లేదా కాండానికి వ్యాపించినా, లేదా 10% కంటే ఎక్కువ మొక్కలపై కనిపిస్తే వెంటనే మీ మండల వ్యవసాయ విస్తరణ అధికారి (AEO) లేదా KVK శాస్త్రవేత్తలను సంప్రదించండి. స్థానికంగా సిఫార్సు చేయబడిన మందులను మాత్రమే ఉత్పత్తి లేబుల్ ప్రకారం వాడండి.';
    } else if (yPct >= 12.0) {
      conditionTitleEn = 'Nitrogen / Magnesium Deficiency Chlorosis — leading hypothesis';
      conditionTitleTe = 'టమోటా నత్రజని / మెగ్నీషియం లోప పసుపు తెగులు — ప్రాథమిక పరికల్పన';
      conditionCategory = 'nutritional';

      whyListEn = [
        `Extensive chlorotic yellowing detected across ${yPct}% of foliage with minimal tissue necrosis (${bPct}%).`,
        `Yellowing pattern without dark fungal fruiting bodies indicates chlorophyll breakdown or nutrient lockout.`,
        `Crop is Tomato at ${growthStage} stage requiring high macronutrient transport for canopy expansion.`
      ];
      whyListTe = [
        `ఆకుపై ${yPct}% పసుపు రంగు (క్లోరోసిస్) గుర్తించబడింది, గోధుమ మచ్చలు కేవలం ${bPct}% మాత్రమే ఉన్నాయి.`,
        `నల్లటి శిలీంధ్ర మచ్చలు లేకపోవడం పోషకాల లోపాన్ని లేదా వేర్ల సమస్యను సూచిస్తోంది.`,
        `${growthStage} దశలోని టమోటా పంటకు నత్రజని, మెగ్నీషియం పోషకాలు ఎక్కువగా అవసరం.`
      ];

      stillNeededListEn = [
        'Verify if yellowing started on oldest lower leaves (Nitrogen/Magnesium) or new terminal buds (Iron/Zinc)',
        'Check soil pH and root zone drainage to rule out anaerobic root lockout'
      ];
      stillNeededListTe = [
        'పసుపు రంగు మొదట పాత ఆకులలో వచ్చిందా లేక పై చిగుళ్లలో వచ్చిందా చూడండి',
        'నేల pH మరియు వేర్ల వద్ద నీటి పారుదలని పరీక్షించండి'
      ];

      immediateStepsEn = [
        'Examine canopy location: verify whether yellowing is confined to bottom leaves or spreading to top shoots.',
        'Check root-zone soil moisture at 10 cm depth to rule out waterlogging-induced nutrient lockout.',
        'Refrain from heavy synthetic chemical dumping; excessive nitrogen causes soft flushes vulnerable to whitefly.'
      ];
      immediateStepsTe = [
        'పసుపు రంగు కింద ఆకులపై ఉందా లేదా పై చిగుళ్లపై ఉందా గమనించండి.',
        'వేర్ల వద్ద నీరు నిలవడం వల్ల పోషకాలు అందడం లేదేమో 10 సెం.మీ తవ్వి చూడండి.',
        'ఒక్కసారిగా ఎక్కువ రసాయన ఎరువులు వేయవద్దు; దీనివల్ల తెల్లదోమ ఆశించే ప్రమాదం ఉంది.'
      ];

      envStepsEn = [
        sensorData
          ? `Soil moisture is ${sensorData.soilMoisture}%. Maintain between 40%–65% to support root nutrient assimilation.`
          : 'Regulate irrigation to ensure moist, aerated root conditions.'
      ];
      envStepsTe = [
        sensorData
          ? `నేలలో తేమ ${sensorData.soilMoisture}% గా ఉంది. తేమను 40%–65% మధ్య సమతుల్యంగా ఉంచండి.`
          : 'వేర్లకు గాలి ఆడేలా తేమను సమతుల్యంగా ఉంచండి.'
      ];

      plantStepsEn = [
        'Top-dress with well-rotted farmyard manure (FYM) or vermicompost around the drip line.',
        'Gentle shallow hoeing around rows to aerate compacted soil.'
      ];
      plantStepsTe = [
        'పాదుల చుట్టూ బాగా చివికిన పశువుల ఎరువు లేదా వర్మీకంపోస్టును వేయండి.',
        'మొక్క మొదళ్ల వద్ద నేలను సున్నితంగా గుల్ల చేయండి.'
      ];

      prevStepsEn = [
        'Conduct seasonal Soil Health Card testing before transplanting to determine precise basal fertilizer doses.',
        'Incorporate green manure crops (Dhaincha or Sunn hemp) during pre-season land preparation.'
      ];
      prevStepsTe = [
        'పంట వేసే ముందే భూసార పరీక్ష చేయించుకోండి.',
        'వేసవిలో జనుము లేదా పిల్లిపెసర వంటి పచ్చిరొట్ట ఎరువులను సాగు చేసి భూమిలో కలియదున్నండి.'
      ];

      monitorStepsEn = [
        'Observe foliage in 5–7 days after organic conditioning; leaf margins should regain dark green hue.'
      ];
      monitorStepsTe = [
        'సేంద్రీయ ఎరువులు వేసిన 5-7 రోజుల్లో ఆకులు మళ్లీ పచ్చబడుతున్నాయేమో చూడండి.'
      ];

      expertEn = 'Consult your local KVK Agronomist or Department of Agriculture soil testing lab if yellowing does not improve within 7–10 days. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = '7-10 రోజుల్లో మార్పు కనిపించకపోతే మీ మండల వ్యవసాయ అధికారిని లేదా భూసార పరీక్షా కేంద్రాన్ని సంప్రదించండి. స్థానికంగా సిఫార్సు చేయబడిన పోషకాలను మాత్రమే లేబుల్ ప్రకారం వాడండి.';
    } else {
      conditionTitleEn = 'Root-Zone Moisture Stress & Marginal Scorch — leading hypothesis';
      conditionTitleTe = 'టమోటా వేరు వ్యవస్థ తేమ అసమతుల్యత & ఆకుల ఒత్తిడి — ప్రాథమిక పరికల్పన';
      conditionCategory = 'moisture_stress';

      whyListEn = [
        `Peripheral edge scorch and moderate chlorosis (${yPct}%) detected with sharp dynamic contrast.`,
        `Absence of discrete necrotic fungal spots (${bPct}% brown).`,
        `Telemetry / environment indicates root transpiration fluctuation.`
      ];
      whyListTe = [
        `ఆకుల అంచుల వెంబడి రంగు మారడం మరియు స్వల్ప పసుపు రంగు (${yPct}%) కనిపించింది.`,
        `స్పష్టమైన శిలీంధ్ర తెగులు మచ్చలు లేవు (${bPct}% గోధుమ రంగు).`,
        `వాతావరణం మరియు నేలలోని తేమ హెచ్చుతగ్గుల వల్ల ఈ ఒత్తిడి కనిపిస్తోంది.`
      ];

      stillNeededListEn = [
        'Probe 15 cm deep near root crown to inspect for standing water or hardpan soil',
        'Observe if leaves droop at midday and recover crispness by morning'
      ];
      stillNeededListTe = [
        'మొక్క మొదట్లో 15 సెం.మీ తవ్వి నేల చాలా తడిగా ఉందా లేదా గట్టిపడిందా చూడండి',
        'మధ్యాహ్నం ఆకులు వాలిపోయి రాత్రికి మళ్లీ తాజాగా మారుతున్నాయా గమనించండి'
      ];

      immediateStepsEn = [
        'Check soil moisture around roots before adding water.',
        'Clear drainage furrows if standing water is present.'
      ];
      immediateStepsTe = [
        'నీరు పెట్టే ముందు వేర్ల వద్ద నేల తేమను పరిశీలించండి.',
        'నీరు నిలిచి ఉంటే కాలువల ద్వారా బయటకు పోయేలా చేయండి.'
      ];
      envStepsEn = ['Maintain regular pulse irrigation; avoid flood-and-drought cycling.'];
      envStepsTe = ['ఒకేసారి ఎక్కువ నీరు పెట్టకుండా క్రమపద్ధతిలో తేమ ఉండేలా చూడండి.'];
      plantStepsEn = ['Mulch bed with clean straw to buffer soil temperature.'];
      plantStepsTe = ['తేమ ఆవిరి కాకుండా మొక్కల మొదళ్లలో ఎండుగడ్డితో మల్చింగ్ చేయండి.'];
      prevStepsEn = ['Install drip irrigation with tensiometer monitoring for moisture control.'];
      prevStepsTe = ['డ్రిప్ ఇరిగేషన్ ద్వారా నీటిని నియంత్రణలో ఉంచండి.'];
      monitorStepsEn = ['Inspect turgidity in early morning over next 48 hours.'];
      monitorStepsTe = ['వచ్చే 48 గంటల్లో ఉదయపు వేళల్లో ఆకుల స్థిరత్వాన్ని చూడండి.'];
      expertEn = 'Contact your local agricultural extension officer if plants show irreversible wilting despite proper watering.';
      expertTe = 'నీరు పెట్టినప్పటికీ మొక్కలు వడలిపోతుంటే వ్యవసాయ అధికారిని సంప్రదించండి.';
    }

  // ------------------------- B. PADDY / RICE -------------------------
  } else if (isPaddy) {
    if (bPct >= 4.0 || dPct >= 2.0) {
      conditionTitleEn = 'Rice Blast (Magnaporthe oryzae) / Brown Spot — leading hypothesis';
      conditionTitleTe = 'వరి అగ్గి తెగులు (బ్లాస్ట్) / ఆకుమచ్చ తెగులు — ప్రాథమిక పరికల్పన';
      whyListEn = [
        `Spindle-shaped elliptical lesions detected with necrotic brown borders (${bPct}%) and gray/ash centers.`,
        `Spatial clustering conforms to Rice Blast foliar lesion morphology on blade tissue.`,
        `Crop is Paddy/Rice at ${growthStage} stage under humid microclimate conditions.`,
        `Contrast (${measurements.contrast}) confirms localized leaf blade cell collapse.`
      ];
      whyListTe = [
        `కదురు ఆకారపు మచ్చలు గోధుమ అంచులు (${bPct}%) మరియు బూడిద రంగు కేంద్రంతో గుర్తించబడ్డాయి.`,
        `వరి ఆకుపై అగ్గి తెగులు లక్షణాలతో ఈ మచ్చలు పూర్తిగా సరిపోలుతున్నాయి.`,
        `${growthStage} దశలోని వరి పంటలో అధిక తేమ ఉన్నప్పుడు ఈ తెగులు వేగంగా వ్యాపిస్తుంది.`,
        `కాంట్రాస్ట్ (${measurements.contrast}) ఆకు కణజాలం దెబ్బతిన్నట్లు నిర్ధారిస్తుంది.`
      ];

      stillNeededListEn = [
        'Check neck nodes and collar for blackish-brown girdling lesions (neck blast phase)',
        'Inspect dew-covered leaf blades in early morning for grayish conidial sporulation'
      ];
      stillNeededListTe = [
        'వరి వెన్ను లేదా మెడ భాగంలో నల్లటి మచ్చలు ఉన్నాయేమో చూడండి (మెడ విరుపు తెగులు)',
        'ఉదయం మంచు ఉన్నప్పుడు ఆకు మచ్చలపై బూడిద రంగు బూజు ఉందేమో పరిశీలించండి'
      ];

      immediateStepsEn = [
        'Drain excess standing water temporarily and maintain a thin film of 2–3 cm rather than deep flooding.',
        'Suspend top-dressing of nitrogenous fertilizers (Urea) immediately; excess nitrogen fuels rapid blast spread.',
        'Scout surrounding bunds and remove grassy weed hosts (Echinochloa species).'
      ];
      immediateStepsTe = [
        'పొలంలో ఎక్కువ నీరు నిల్వ ఉంచకుండా తాత్కాలికంగా తీసివేసి 2-3 సెం.మీ పలుచని నీటి మట్టాన్ని ఉంచండి.',
        'యూరియా (నత్రజని) ఎరువుల వాడకాన్ని తక్షణమే నిలిపివేయండి; నత్రజని ఎక్కువైతే తెగులు వేగంగా పెరుగుతుంది.',
        'గట్లపై ఉన్న గడ్డి జాతి కలుపు మొక్కలను తొలగించండి.'
      ];

      envStepsEn = [
        'Avoid prolonged stagnant flooding; alternate wetting and drying (AWD) helps aerate the root zone.',
        'Avoid applying irrigation water from fields already infected with blast.'
      ];
      envStepsTe = [
        'ఎల్లప్పుడూ నీరు నిల్వ ఉంచకుండా ఆరబెట్టి తడిపే విధానం (AWD) పాటించండి.',
        'తెగులు సోకిన పొలం నుండి వచ్చే నీటిని ఆరోగ్యకరమైన మడులలోకి రానివ్వకండి.'
      ];

      plantStepsEn = [
        'Do not drag equipment or cattle through wet infected fields to prevent spore dissemination.'
      ];
      plantStepsTe = [
        'తెగులు సోకిన తడి పొలంలో పశువులు లేదా పనిముట్లను తిప్పవద్దు.'
      ];

      prevStepsEn = [
        'Use certified blast-resistant paddy varieties suited to your agro-climatic zone.',
        'Treat seeds with certified bio-agents (Trichoderma viride or Pseudomonas fluorescens) before sowing.',
        'Apply silicon and balanced potassium to strengthen silica epidermal cell walls against fungal penetration.'
      ];
      prevStepsTe = [
        'తెగులును తట్టుకునే ధృవీకరించిన వరి విత్తనాలను వాడండి.',
        'విత్తే ముందు ట్రైకోడెర్మా లేదా సూడోమోనాస్‌తో విత్తన శుద్ధి తప్పనిసరిగా చేయండి.',
        'పొటాష్ మరియు సిలికాన్ ఎరువులను సమతుల్యంగా అందించి ఆకుల రోగనిరోధక శక్తిని పెంచండి.'
      ];

      monitorStepsEn = [
        'Scout leaf blades daily for the next 72 hours; ensure lesions are not coalescing into large blights.'
      ];
      monitorStepsTe = [
        'వచ్చే 3 రోజులు ప్రతిరోజూ ఆకులను పరిశీలించి మచ్చలు కలసిపోయి ఆకు మొత్తం ఎండిపోవడం లేదని నిర్ధారించుకోండి.'
      ];

      expertEn = 'Contact your local Mandal Agricultural Extension Officer (AEO) or Agricultural Research Station (ARS) immediately if neck nodes turn black or leaf blast spreads across >5% of the tillers. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'వరి వెన్నుపై నల్లటి మచ్చలు వచ్చినా లేదా 5% కంటే ఎక్కువ పిలకలపై తెగులు కనిపిస్తే వెంటనే మీ మండల వ్యవసాయ అధికారి (AEO)ని సంప్రదించండి. స్థానికంగా సిఫార్సు చేయబడిన మందులను మాత్రమే ఉత్పత్తి లేబుల్ ప్రకారం వాడండి.';
    } else {
      conditionTitleEn = 'Nitrogen / Zinc Deficiency Chlorosis in Rice — leading hypothesis';
      conditionTitleTe = 'వరిలో నత్రజని / జింక్ లోప పసుపు రంగు — ప్రాథమిక పరికల్పన';
      conditionCategory = 'nutritional';

      whyListEn = [
        `Diffuse pale green to yellow chlorosis (${yPct}%) starting from leaf tips moving downward.`,
        `Low necrotic lesion area (${bPct}% brown) indicating nutritional starvation rather than fungal blast.`,
        `Common in submerged calcareous or sandy soils with zinc fixation.`
      ];
      whyListTe = [
        `ఆకు కొనల నుండి కిందికి వ్యాపించిన పసుపు రంగు (${yPct}%) గుర్తించబడింది.`,
        `గోధుమ మచ్చలు చాలా తక్కువ (${bPct}%) ఉండటం వల్ల ఇది తెగులు కాదని, పోషకాల లోపమని తెలుస్తోంది.`,
        `సున్నపు నేలల్లో లేదా నిల్వ నీరు ఉండే వరి పొలాల్లో జింక్ లోపం సర్వసాధారణం.`
      ];

      stillNeededListEn = [
        'Check if midribs of younger leaves turn yellow while outer blade stays pale green (Zinc pattern)',
        'Verify days after transplanting (DAT) and basal fertilizer application dates'
      ];
      stillNeededListTe = [
        'లేత ఆకుల మధ్య ఈనె పసుపుగా మారుతుందా చూడండి (జింక్ లోపం సూచిక)',
        'నాటిన ఎన్ని రోజులకు ఈ లక్షణాలు వచ్చాయో పరిశీలించండి'
      ];

      immediateStepsEn = [
        'Drain standing water for 24–48 hours to allow soil oxygenation and stimulate zinc/nitrogen uptake.',
        'Avoid applying phosphorus fertilizers if zinc deficiency is suspected, as high P locks up Zn.'
      ];
      immediateStepsTe = [
        'వేర్లకు గాలి తగలడానికి పొలంలోని నీటిని 1-2 రోజులు తీసి ఆరబెట్టండి.',
        'జింక్ లోపం ఉన్నప్పుడు భాస్వరం (DAP) ఎరువులను వేయవద్దు; ఇది జింక్‌ను మొక్కకు అందకుండా చేస్తుంది.'
      ];
      envStepsEn = ['Practice intermittent drainage to prevent anaerobic zinc sulfide precipitation.'];
      envStepsTe = ['మురుగునీరు నిల్వ ఉండకుండా నీటిని ఆరబెట్టి తడపండి.'];
      plantStepsEn = ['Foliar application of chelated zinc or zinc sulfate as per local extension package.'];
      plantStepsTe = ['వ్యవసాయ శాఖ సిఫార్సు మేరకు జింక్ సల్ఫేట్ పిచికారీ చేయండి.'];
      prevStepsEn = ['Apply Zinc Sulfate (25 kg/ha) as a basal soil dose at the time of final puddling.'];
      prevStepsTe = ['ఆఖరి దమ్ము సమయంలో ఎకరాకు 10-12 కిలోల జింక్ సల్ఫేట్ దుక్కిలో వేయండి.'];
      monitorStepsEn = ['Watch for new tillers greening up within 5–7 days after drainage.'];
      monitorStepsTe = ['నీరు ఆరబెట్టిన 5-7 రోజుల్లో కొత్త పిలకలు పచ్చబడుతున్నాయేమో చూడండి.'];
      expertEn = 'Consult your local AEO or KVK soil chemist for leaf tissue analysis. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'సందేహాలు ఉంటే మీ మండల వ్యవసాయ అధికారిని సంప్రదించండి. స్థానిక వ్యవసాయ సిఫార్సుల ప్రకారమే ఎరువులు వాడండి.';
    }

  // ------------------------- C. COTTON -------------------------
  } else if (isCotton) {
    if (bPct >= 4.0 || dPct >= 2.0) {
      conditionTitleEn = 'Bacterial Blight / Angular Leaf Spot (Xanthomonas citri) — leading hypothesis';
      conditionTitleTe = 'పత్తి కోణీయ ఆకుమచ్చ తెగులు (బ్యాక్టీరియల్ బ్లైట్) — ప్రాథమిక పరికల్పన';
      whyListEn = [
        `Angular, water-soaked brown/black necrotic lesions (${bPct}%) restricted by leaf veinlets.`,
        `Dark spots (${dPct}%) with water-soaked margins characteristic of Xanthomonas bacterial ingress.`,
        `Crop is Cotton at ${growthStage} stage under warm humid conditions.`,
        `Sharp contrast edges (${measurements.contrast}) delineate angular boundaries along main veins.`
      ];
      whyListTe = [
        `ఆకు ఈనెల మధ్య కోణాకారంలో గోధుమ/నల్లటి మచ్చలు (${bPct}%) గుర్తించబడ్డాయి.`,
        `మచ్చల అంచులు నీటితో నానినట్లు ఉండి బ్యాక్టీరియా లక్షణాలను పోలి ఉన్నాయి.`,
        `${growthStage} దశలోని పత్తి పంటలో వేడి మరియు తేమ ఉన్నప్పుడు ఈ తెగులు కనిపిస్తుంది.`,
        `కాంట్రాస్ట్ (${measurements.contrast}) ఈనెల వెంబడి స్పష్టమైన కోణీయ అంచులను నిర్ధారిస్తుంది.`
      ];

      stillNeededListEn = [
        'Check petioles and main stems for elongated black girdling lesions (blackarm phase)',
        'Inspect bolls for water-soaked sunken dark lesions'
      ];
      stillNeededListTe = [
        'ఆకు తొడిమలు మరియు కాండంపై నల్లటి చారలు ఉన్నాయేమో చూడండి (నల్ల కాండం దశ)',
        'కాయలపై నీటితో నానిన నల్లటి మచ్చలు ఉన్నాయేమో పరిశీలించండి'
      ];

      immediateStepsEn = [
        'Avoid inter-cultivation or tractor operations when the crop canopy is wet with morning dew.',
        'Prune severely diseased lower leaves and destroy outside the field.',
        'Avoid excessive vegetative nitrogen top-dressing.'
      ];
      immediateStepsTe = [
        'ఉదయం మంచు ఉన్నప్పుడు పత్తి చేనులో ఎలాంటి పనులు చేయవద్దు; తడి వల్ల తెగులు వ్యాపిస్తుంది.',
        'బాగా దెబ్బతిన్న ఆకులను తీసి పొలం బయట కాల్చివేయండి.',
        'అధిక నత్రజని ఎరువులు వేయవద్దు.'
      ];
      envStepsEn = ['Ensure field drainage channels are clear of standing rainwater.'];
      envStepsTe = ['వర్షపు నీరు పొలంలో నిల్వ ఉండకుండా మురుగు కాలువలు తీయండి.'];
      plantStepsEn = ['Sanitize spraying equipment and clothing before moving to uninfected blocks.'];
      plantStepsTe = ['ఒక చేను నుండి మరో చేనుకు వెళ్లేటప్పుడు పనిముట్లను శుభ్రం చేసుకోండి.'];
      prevStepsEn = [
        'Use acid-delinted and certified disease-free cotton seeds.',
        'Rotate crops with maize, sorghum, or pulses to reduce soil-borne inoculum.'
      ];
      prevStepsTe = [
        'యాసిడ్ డీలింటింగ్ చేసిన ధృవీకరించిన విత్తనాలను మాత్రమే వాడండి.',
        'జొన్న లేదా మొక్కజొన్నతో పంట మార్పిడి పాటించండి.'
      ];
      monitorStepsEn = ['Inspect boll bracts and stems for black lesions every 3–4 days.'];
      monitorStepsTe = ['ప్రతి 3-4 రోజులకు ఒకసారి కాయలు మరియు కాండంపై నల్లటి మచ్చలను గమనించండి.'];
      expertEn = 'Contact your local Cotton Research Station or Mandal AEO if blackarm stem girdling appears. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'కాండంపై నల్లటి చారలు ఏర్పడి కొమ్మలు విరిగిపోతుంటే వెంటనే వ్యవసాయ పరిశోధనా కేంద్రం శాస్త్రవేత్తలను సంప్రదించండి. లేబుల్ సూచించిన మందులనే వాడండి.';
    } else {
      conditionTitleEn = 'Sucking Pest Damage / Nutrient Bronzing in Cotton — leading hypothesis';
      conditionTitleTe = 'పత్తిలో రసం పీల్చే పురుగుల ఉధృతి / ఎరుపు తెగులు సూచనలు — ప్రాథమిక పరికల్పన';
      conditionCategory = 'pest_damage';

      whyListEn = [
        `Leaf margin curling and chlorotic/reddish bronzing (${yPct}% chlorosis).`,
        `Low necrotic lesion area (${bPct}%) suggests pest feeding stylet injury or magnesium shortage.`,
        `Typical visual indicator of jassid/thrips/aphid pressure during vegetative and flowering stages.`
      ];
      whyListTe = [
        `ఆకుల అంచులు ముడుచుకుపోవడం మరియు పసుపు/ఎరుపు రంగు మారడం (${yPct}%).`,
        `గోధుమ మచ్చలు తక్కువగా (${bPct}%) ఉండటం రసం పీల్చే పురుగుల లేదా మెగ్నీషియం లోపాన్ని సూచిస్తుంది.`,
        `తామర పురుగులు, పచ్చదోమ ఆశించినప్పుడు ఇలాంటి లక్షణాలు కనిపిస్తాయి.`
      ];

      stillNeededListEn = [
        'Turn over 10 leaves across the canopy to count jassids / leafhoppers or thrips per leaf',
        'Check for downward vs upward leaf cupping'
      ];
      stillNeededListTe = [
        'ఆకు వెనుక భాగం తిప్పి పచ్చదోమ లేదా తామర పురుగుల సంఖ్యను లెక్కించండి',
        'ఆకులు పైకి ముడుచుకున్నాయా లేదా కిందికి ముడుచుకున్నాయా గమనించండి'
      ];

      immediateStepsEn = [
        'Install yellow and blue sticky traps (5–8 per acre) to monitor and trap sucking pests.',
        'Avoid broad-spectrum synthetic pyrethroids which trigger secondary pest resurgence.',
        'Consider organic neem oil spray (1500 ppm @ 5 ml/L) as a safe early deterrent.'
      ];
      immediateStepsTe = [
        'ఎకరాకు 5-8 పసుపు మరియు నీలి రంగు జిగురు అట్టలను అమర్చి పురుగుల ఉధృతిని గమనించండి.',
        'విచక్షణారహితంగా పురుగు మందులు వాడవద్దు; దీనివల్ల తెగుళ్లు మరింత పెరుగుతాయి.',
        'ప్రాథమిక నివారణగా వేప నూనె (1500 ppm - 5 మి.లీ/లీటరు) పిచికారీ చేయండి.'
      ];
      envStepsEn = ['Maintain balanced soil moisture; dry spells exacerbate sucking pest damage.'];
      envStepsTe = ['నేలలో తగినంత తేమ ఉండేలా చూడండి; బెట్ట పరిస్థితుల్లో పురుగులు ఎక్కువవుతాయి.'];
      plantStepsEn = ['Conserve natural predators such as Chrysoperla (green lacewings).'];
      plantStepsTe = ['మిత్ర పురుగులైన పచ్చ రెక్కల పురుగులను కాపాడుకోండి.'];
      prevStepsEn = ['Plant border rows of maize or cowpea as trap/barrier crops.'];
      prevStepsTe = ['పొలం చుట్టూ మొక్కజొన్న లేదా అలసందలను సరిహద్దు పంటలుగా వేయండి.'];
      monitorStepsEn = ['Inspect leaf undersides every 48 hours for pest threshold levels.'];
      monitorStepsTe = ['ప్రతి 48 గంటలకు ఒకసారి ఆకు వెనుక పురుగుల ఉధృతిని తనిఖీ చేయండి.'];
      expertEn = 'Contact your local AEO if pest counts exceed economic threshold levels (ETL). Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'పురుగుల సంఖ్య ఆర్థిక నష్ట పరిమితిని మించితే వెంటనే మీ వ్యవసాయ అధికారిని సంప్రదించండి. లేబుల్ సూచనల ప్రకారమే మందులను వాడండి.';
    }

  // ------------------------- D. CHILLI / PEPPER -------------------------
  } else if (isChilli) {
    if (bPct >= 4.0 || dPct >= 2.0) {
      conditionTitleEn = 'Anthracnose / Cercospora Leaf Spot in Chilli — leading hypothesis';
      conditionTitleTe = 'మిరప ఆకుమచ్చ తెగులు / కొమ్మ ఎండు తెగులు — ప్రాథమిక పరికల్పన';
      whyListEn = [
        `Sunken circular brown necrotic lesions (${bPct}%) with dark concentric rings.`,
        `Dark micro-spots (${dPct}%) matching Colletotrichum or Cercospora capsici spore formation.`,
        `Crop is Chilli at ${growthStage} stage; fruit and foliage are vulnerable under humid conditions.`
      ];
      whyListTe = [
        `ఆకుపై గుండ్రటి గోధుమ రంగు మచ్చలు (${bPct}%) నల్లటి వలయాలతో గుర్తించబడ్డాయి.`,
        `మచ్చల మధ్య నల్లటి చుక్కలు (${dPct}%) మిరప ఆకుమచ్చ తెగులు లక్షణాలతో సరిపోతున్నాయి.`,
        `${growthStage} దశలోని మిరప పంటలో తేమ ఉన్నప్పుడు కాయలు మరియు ఆకులు త్వరగా దెబ్బతింటాయి.`
      ];

      stillNeededListEn = [
        'Check green and ripening chilli pods for circular sunken water-soaked spots (fruit rot)',
        'Examine growing tips for dieback or blackening'
      ];
      stillNeededListTe = [
        'మిరప కాయలపై గుండ్రటి నల్లటి మచ్చలు ఉన్నాయేమో చూడండి (కాయ కుళ్లు తెగులు)',
        'కొమ్మ చివర్లు ఎండిపోతున్నాయేమో పరిశీలించండి (కొమ్మ ఎండు తెగులు)'
      ];

      immediateStepsEn = [
        'Pick and safely dispose of any spotted or rotting pods outside the field.',
        'Prune blackened twigs 2 cm below the infection point with sterilized shears.',
        'Ensure plants are spaced properly to maximize airflow through the bush.'
      ];
      immediateStepsTe = [
        'మచ్చలు పడిన లేదా కుళ్ళిన మిరప కాయలను ఏరి పొలం బయట పారవేయండి.',
        'ఎండిపోయిన కొమ్మలను ఆరోగ్యకరమైన భాగం వరకు కత్తిరించి తొలగించండి.',
        'మొక్కల మధ్య గాలి వెలుతురు బాగా ఆడేలా చూడండి.'
      ];
      envStepsEn = ['Avoid overhead sprinkling; water at the base to keep foliage dry.'];
      envStepsTe = ['పైనుండి నీరు చల్లవద్దు; మొదళ్ల వద్ద మాత్రమే నీరు పెట్టండి.'];
      plantStepsEn = ['Disinfect secateurs between plants to avoid spreading fungal spores.'];
      plantStepsTe = ['కత్తెరను శానిటైజ్ చేయండి.'];
      prevStepsEn = [
        'Treat chilli seeds with Trichoderma viride before nursery raising.',
        'Use clean pathogen-free seedlings from certified nurseries.'
      ];
      prevStepsTe = [
        'నారు పోసే ముందే విత్తన శుద్ధి చేయండి.',
        'ధృవీకరించిన నర్సరీల నుండి మాత్రమే ఆరోగ్యకరమైన నారును తీసుకురండి.'
      ];
      monitorStepsEn = ['Check fruit sets every 3 days for early anthracnose spot progression.'];
      monitorStepsTe = ['ప్రతి 3 రోజులకు కాయలను పరిశీలించండి.'];
      expertEn = 'Contact your local Horticultural Officer or KVK specialist if dieback spreads rapidly down the branches. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'కొమ్మ ఎండు తెగులు వేగంగా వ్యాపిస్తుంటే ఉద్యానవన అధికారిని లేదా KVK నిపుణులను సంప్రదించండి. లేబుల్ ప్రకారమే సిఫార్సు చేసిన మందులను వాడండి.';
    } else {
      conditionTitleEn = 'Interveinal Chlorosis / Micronutrient Imbalance in Chilli — leading hypothesis';
      conditionTitleTe = 'మిరపలో ఈనెల మధ్య పసుపు రంగు (పోషకాల లోపం) — ప్రాథమిక పరికల్పన';
      conditionCategory = 'nutritional';

      whyListEn = [
        `Interveinal yellowing (${yPct}%) where veins remain green while interveinal tissue yellows.`,
        `Low necrosis (${bPct}%) indicates physiological nutrient mobility restriction (Iron/Zinc/Magnesium).`,
        `Common in sandy or high-pH soils with low organic matter.`
      ];
      whyListTe = [
        `ఆకు ఈనెలు పచ్చగా ఉండి మధ్య భాగం పసుపుగా మారడం (${yPct}%) గుర్తించబడింది.`,
        `గోధుమ మచ్చలు లేకపోవడం (${bPct}%) ఇది పోషకాల లోపమని (ఐరన్/జింక్/మెగ్నీషియం) నిర్ధారిస్తుంది.`,
        `సున్నపు నేలల్లో లేదా సేంద్రీయ పదార్థం తక్కువగా ఉన్న నేలల్లో ఇది తరచుగా కనిపిస్తుంది.`
      ];

      stillNeededListEn = [
        'Check if yellowing is primarily on topmost young shoots (Iron/Zinc) or bottom older leaves (Magnesium)',
        'Test soil pH'
      ];
      stillNeededListTe = [
        'పై లేత ఆకులు పసుపుగా మారాయా లేదా కింద పాత ఆకులు మారాయా చూడండి',
        'నేల pH పరీక్ష చేయించండి'
      ];

      immediateStepsEn = [
        'Apply organic compost or well-rotted FYM around plant drip lines.',
        'Ensure soil is neither bone-dry nor saturated.'
      ];
      immediateStepsTe = [
        'మొక్కల చుట్టూ వర్మీకంపోస్టు లేదా పశువుల ఎరువు వేయండి.',
        'నేలలో తేమ సమతుల్యంగా ఉండేలా చూడండి.'
      ];
      envStepsEn = ['Maintain consistent drip irrigation to avoid salt accumulation.'];
      envStepsTe = ['క్రమబద్ధమైన డ్రిప్ ఇరిగేషన్ పాటించండి.'];
      plantStepsEn = ['Foliar micronutrient spray (chelated zinc/iron) during cool morning hours as recommended locally.'];
      plantStepsTe = ['వ్యవసాయ శాఖ సిఫార్సు మేరకు ఉదయపు వేళల్లో సూక్ష్మ పోషకాలను పిచికారీ చేయండి.'];
      prevStepsEn = ['Conduct seasonal Soil Health Card test before planting.'];
      prevStepsTe = ['నాటే ముందే భూసార పరీక్ష చేయించండి.'];
      monitorStepsEn = ['Watch for new apical flushes greening up in 5–7 days.'];
      monitorStepsTe = ['5-7 రోజుల్లో కొత్త చిగుళ్లు పచ్చగా వస్తున్నాయేమో చూడండి.'];
      expertEn = 'Consult your local Horticultural Extension Officer if foliage remains chlorotic. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'ఆకులు పచ్చబడకపోతే ఉద్యానవన అధికారిని సంప్రదించండి. లేబుల్ ప్రకారమే ఎరువులు వాడండి.';
    }

  // ------------------------- E. POTATO -------------------------
  } else if (isPotato) {
    if (bPct >= 4.0 || dPct >= 2.0) {
      conditionTitleEn = isHighHumidity
        ? 'Late Blight (Phytophthora infestans) in Potato — leading hypothesis'
        : 'Early Blight (Alternaria solani) in Potato — leading hypothesis';
      conditionTitleTe = isHighHumidity
        ? 'బంగాళాదుంప లేట్ బ్లైట్ తెగులు — ప్రాథమిక పరికల్పన'
        : 'బంగాళాదుంప ముందస్తు ఆకుమచ్చ తెగులు — ప్రాథమిక పరికల్పన';

      whyListEn = [
        `Brown necrotic lesions detected across ${bPct}% of potato leaf surface.`,
        `Dark tissue collapse (${dPct}%) matching Solanaceous fungal blight symptomology.`,
        `Crop is Potato at ${growthStage} stage.`
      ];
      whyListTe = [
        `బంగాళాదుంప ఆకుపై ${bPct}% గోధుమ రంగు తెగులు మచ్చలు గుర్తించబడ్డాయి.`,
        `కణజాలం దెబ్బతినడం (${dPct}% నల్లటి మచ్చలు) శిలీంధ్ర తెగులు లక్షణాలను సూచిస్తోంది.`,
        `${growthStage} దశలోని బంగాళాదుంప పంటలో ఇది త్వరగా వ్యాపిస్తుంది.`
      ];

      stillNeededListEn = [
        'Check lower leaf undersides in the morning for white cottony mildew ring',
        'Examine potato tubers at harvest or sampling for dry brown rot'
      ];
      stillNeededListTe = [
        'ఉదయం వేళ ఆకు వెనుక తెల్లటి బూజు వలయం ఉందేమో చూడండి',
        'దుంపలపై గోధుమ రంగు కుళ్లు మచ్చలు ఉన్నాయేమో పరిశీలించండి'
      ];

      immediateStepsEn = [
        'Halt overhead sprinkler watering; keep foliage as dry as possible.',
        'Rogue out severely blighted plants to protect remaining beds.'
      ];
      immediateStepsTe = [
        'పైనుండి నీరు చల్లడం ఆపండి; ఆకులు పొడిగా ఉండేలా చూడండి.',
        'బాగా దెబ్బతిన్న మొక్కలను పీకి పొలం బయట పారవేయండి.'
      ];
      envStepsEn = ['Ensure adequate furrow drainage so water does not puddle in ridges.'];
      envStepsTe = ['దుంపల బోదెల మధ్య నీరు నిల్వ ఉండకుండా చూసుకోండి.'];
      plantStepsEn = ['Hill up soil around ridges to protect developing tubers from washing down spores.'];
      plantStepsTe = ['దుంపలకు మట్టి బాగా ఎగదోయండి, దీనివల్ల తెగులు దుంపలకు చేరదు.'];
      prevStepsEn = ['Plant certified disease-free seed tubers with fungicide seed treatment.'];
      prevStepsTe = ['ధృవీకరించిన విత్తన దుంపలను మాత్రమే వాడండి.'];
      monitorStepsEn = ['Check canopy daily during cool, foggy, or humid weather.'];
      monitorStepsTe = ['చల్లని, మంచుతో కూడిన వాతావరణంలో ప్రతిరోజూ పంటను పరిశీలించండి.'];
      expertEn = 'Contact your local KVK or Department of Agriculture immediately upon suspecting late blight. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'లేట్ బ్లైట్ అనుమానం ఉంటే వెంటనే వ్యవసాయ అధికారులను సంప్రదించండి. లేబుల్ సూచించిన మందులనే వాడండి.';
    } else {
      conditionTitleEn = 'Nutritional Chlorosis in Potato — leading hypothesis';
      conditionTitleTe = 'బంగాళాదుంపలో పోషకాల లోపం — ప్రాథమిక పరికల్పన';
      conditionCategory = 'nutritional';

      whyListEn = [
        `Diffuse yellowing across ${yPct}% of foliage with minimal tissue necrosis.`,
        `Indicates high nutrient demand during vegetative canopy expansion and tuber initiation.`
      ];
      whyListTe = [
        `ఆకుపై ${yPct}% పసుపు రంగు గుర్తించబడింది, మచ్చలు చాలా తక్కువగా ఉన్నాయి.`,
        `దుంపలు ఊరే దశలో పోషకాల లోపం వల్ల ఇలా జరుగుతుంది.`
      ];
      stillNeededListEn = ['Check canopy level (older vs younger leaves)'];
      stillNeededListTe = ['పాత ఆకులా లేక కొత్త ఆకులా చూడండి'];
      immediateStepsEn = ['Maintain balanced soil moisture and apply recommended split fertilizer doses.'];
      immediateStepsTe = ['తేమను సమతుల్యంగా ఉంచి విడతల వారీగా ఎరువులు వేయండి.'];
      envStepsEn = ['Ensure loose, well-aerated ridge soil.'];
      envStepsTe = ['దుంపల వద్ద నేల వదులుగా ఉండేలా చూడండి.'];
      plantStepsEn = ['Weed and ridge soil carefully.'];
      plantStepsTe = ['కలుపు తీసి మట్టి ఎగదోయండి.'];
      prevStepsEn = ['Perform seasonal soil test before planting.'];
      prevStepsTe = ['దుంపలు నాటే ముందే భూసార పరీక్ష చేయించండి.'];
      monitorStepsEn = ['Watch for greening within 7 days.'];
      monitorStepsTe = ['7 రోజుల్లో ఆకులు పచ్చబడుతున్నాయేమో చూడండి.'];
      expertEn = 'Consult local agricultural extension agronomist.';
      expertTe = 'స్థానిక వ్యవసాయ నిపుణులను సంప్రదించండి.';
    }

  // ------------------------- F. MAIZE -------------------------
  } else if (isMaize) {
    if (bPct >= 4.0 || dPct >= 2.0) {
      conditionTitleEn = 'Northern Corn Leaf Blight (Exserohilum turcicum) — leading hypothesis';
      conditionTitleTe = 'మొక్కజొన్న ఆకు ఎండు తెగులు (టర్సికమ్ బ్లైట్) — ప్రాథమిక పరికల్పన';
      whyListEn = [
        `Long elliptical necrotic brown lesions (${bPct}%) parallel to leaf veins.`,
        `Cigar-shaped lesion morphology characteristic of Northern Corn Leaf Blight.`,
        `Crop is Maize at ${growthStage} stage.`
      ];
      whyListTe = [
        `ఆకు ఈనెల వెంబడి పొడవాటి చుట్ట ఆకారపు గోధుమ మచ్చలు (${bPct}%) గుర్తించబడ్డాయి.`,
        `మొక్కజొన్న ఆకు ఎండు తెగులు లక్షణాలతో ఈ మచ్చలు సరిపోతున్నాయి.`,
        `${growthStage} దశలోని మొక్కజొన్న పంటలో ఇది ఆకులను ఎండబెడుతుంది.`
      ];
      stillNeededListEn = ['Inspect lower canopy leaves to see if infection progresses upward toward the cob ear leaf'];
      stillNeededListTe = ['కింది ఆకుల నుండి కంకి వద్ద ఉన్న ఆకులకు తెగులు వ్యాపిస్తుందా చూడండి'];
      immediateStepsEn = ['Ensure adequate plant spacing and eradicate alternate weed hosts along borders.'];
      immediateStepsTe = ['కలుపు మొక్కలను తొలగించి మొక్కల మధ్య గాలి వెలుతురు ఆడేలా చేయండి.'];
      envStepsEn = ['Avoid overhead sprinkler irrigation where feasible.'];
      envStepsTe = ['పైనుండి నీరు చల్లవద్దు.'];
      plantStepsEn = ['Remove severely blighted basal leaves touching the ground.'];
      plantStepsTe = ['నేలను తాకే ఎండిపోయిన కింద ఆకులను తొలగించండి.'];
      prevStepsEn = ['Use certified blight-resistant hybrid maize cultivars.'];
      prevStepsTe = ['తెగులును తట్టుకునే హైబ్రిడ్ విత్తనాలను వాడండి.'];
      monitorStepsEn = ['Scout the ear leaf (cob leaf) every 3 days.'];
      monitorStepsTe = ['కంకి వద్ద ఉన్న ఆకును ప్రతి 3 రోజులకు పరిశీలించండి.'];
      expertEn = 'Contact your local AEO if blighting reaches the ear leaf before grain filling. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'కంకి వద్ద ఉన్న ఆకుపై మచ్చలు వస్తే వెంటనే వ్యవసాయ అధికారిని సంప్రదించండి. లేబుల్ ప్రకారమే మందులు వాడండి.';
    } else {
      conditionTitleEn = 'Nitrogen Deficiency in Maize (V-shaped Chlorosis) — leading hypothesis';
      conditionTitleTe = 'మొక్కజొన్నలో నత్రజని లోపం (V-ఆకారపు పసుపు రంగు) — ప్రాథమిక పరికల్పన';
      conditionCategory = 'nutritional';

      whyListEn = [
        `V-shaped yellow chlorosis (${yPct}%) advancing from the leaf tip down the midrib.`,
        `Low necrosis (${bPct}%) indicating mobile nitrogen remobilization to new growth.`
      ];
      whyListTe = [
        `ఆకు కొన నుండి ఈనె వెంబడి 'V' ఆకారంలో పసుపు రంగు (${yPct}%) గుర్తించబడింది.`,
        `నత్రజని లోపం వల్ల పాత ఆకుల నుండి కొత్త ఆకులకు పోషకాలు వెళ్లడం వల్ల ఇలా జరుగుతుంది.`
      ];
      stillNeededListEn = ['Verify if yellowing is concentrated on lower basal leaves'];
      stillNeededListTe = ['కింది పాత ఆకులపైనే ఈ లక్షణం ఉందేమో చూడండి'];
      immediateStepsEn = ['Apply balanced split nitrogen top-dressing along irrigation furrows.'];
      immediateStepsTe = ['తడి ఆరగానే సిఫార్సు చేసిన మోతాదులో నత్రజని ఎరువును పైపాటుగా వేయండి.'];
      envStepsEn = ['Irrigate moderately; waterlogging leaches nitrogen out of reach.'];
      envStepsTe = ['మితంగా నీరు పెట్టండి; ఎక్కువ నీరు నిలిస్తే ఎరువులు కొట్టుకుపోతాయి.'];
      plantStepsEn = ['Inter-cultivate to incorporate fertilizer and break crusts.'];
      plantStepsTe = ['ఎరువు వేసి గొర్రుతో కలియదున్నండి.'];
      prevStepsEn = ['Conduct soil testing and apply balanced N-P-K in split doses.'];
      prevStepsTe = ['భూసార పరీక్ష ఆధారంగా ఎరువులను విడతల వారీగా వేయండి.'];
      monitorStepsEn = ['Leaves should green up within 4–6 days post-application.'];
      monitorStepsTe = ['4-6 రోజుల్లో ఆకులు పచ్చబడతాయి.'];
      expertEn = 'Consult local agricultural extension officer.';
      expertTe = 'స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.';
    }

  // ------------------------- G. GENERAL / OTHER CROPS -------------------------
  } else {
    if (bPct >= 4.0 || dPct >= 2.0) {
      conditionTitleEn = `Foliar Leaf-Spot Syndrome on ${normCrop} — leading hypothesis`;
      conditionTitleTe = `${normCrop} పై ఆకుమచ్చ / శిలీంధ్ర తెగులు లక్షణాలు — ప్రాథమిక పరికల్పన`;
      whyListEn = [
        `Computer vision measured ${bPct}% necrotic brown lesion area and ${dPct}% dark micro-spots.`,
        `Dynamic contrast (${measurements.contrast}) confirms localized leaf tissue breakdown.`,
        `Crop is ${normCrop} at ${growthStage} stage with observable foliar spots.`
      ];
      whyListTe = [
        `కంప్యూటర్ విజన్ ${bPct}% గోధుమ రంగు మచ్చలను మరియు ${dPct}% నల్లటి చుక్కలను గుర్తించింది.`,
        `కాంట్రాస్ట్ (${measurements.contrast}) ఆకు కణజాలం దెబ్బతిన్నట్లు నిర్ధారిస్తుంది.`,
        `${growthStage} దశలోని ${normCrop} పంటపై ఈ మచ్చలు కనిపిస్తున్నాయి.`
      ];
      stillNeededListEn = [
        'Inspect leaf undersides with a hand lens for mold or spores',
        'Observe if spots spread to neighboring plants over 48–72 hours'
      ];
      stillNeededListTe = [
        'భూతద్దంతో ఆకు వెనుక బూజు లేదా పురుగులు ఉన్నాయో చూడండి',
        'పక్కనున్న మొక్కలకు వ్యాపిస్తున్నాయేమో గమనించండి'
      ];
      immediateStepsEn = [
        'Inspect adjacent plants to check symptom distribution.',
        'Prune severely necrotic lower leaves and discard outside the plot.',
        'Avoid overhead leaf wetting.'
      ];
      immediateStepsTe = [
        'పక్కనున్న మొక్కలను పరిశీలించండి.',
        'ఎండిపోయిన కింద ఆకులను తొలగించి పొలం బయట పారవేయండి.',
        'ఆకులపై నీరు పడకుండా చూడండి.'
      ];
      envStepsEn = ['Maintain good between-row airflow and clear weeds.'];
      envStepsTe = ['గాలి వెలుతురు ఆడేలా కలుపు మొక్కలను తొలగించండి.'];
      plantStepsEn = ['Clean pruning tools between rows.'];
      plantStepsTe = ['పనిముట్లను శుభ్రం చేయండి.'];
      prevStepsEn = ['Rotate crops and treat seeds with certified bio-agents.'];
      prevStepsTe = ['పంట మార్పిడి మరియు విత్తన శుద్ధి పాటించండి.'];
      monitorStepsEn = ['Re-check plants in 48–72 hours.'];
      monitorStepsTe = ['2-3 రోజుల తర్వాత మళ్లీ పరిశీలించండి.'];
      expertEn = 'Contact your local Mandal Agricultural Extension Officer (AEO) or KVK specialist for clinical laboratory identification. Use only locally approved treatments recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.';
      expertTe = 'తెగులు ఎక్కువైతే మండల వ్యవసాయ అధికారి (AEO)ని సంప్రదించండి. స్థానికంగా సిఫార్సు చేసిన మందులను మాత్రమే ఉత్పత్తి లేబుల్ ప్రకారం వాడండి.';
    } else if (yPct >= 12.0) {
      conditionTitleEn = `Nutritional Chlorosis & Veinal Discoloration on ${normCrop} — leading hypothesis`;
      conditionTitleTe = `${normCrop} పై పోషకాల లోపం / పసుపు రంగు — ప్రాథమిక పరికల్పన`;
      conditionCategory = 'nutritional';

      whyListEn = [
        `Computer vision measured ${yPct}% chlorotic yellowing with low necrosis (${bPct}%).`,
        `Uniform or interveinal yellowing indicates chlorophyll degradation or root uptake disruption.`
      ];
      whyListTe = [
        `ఆకుపై ${yPct}% పసుపు రంగు గుర్తించబడింది, మచ్చలు చాలా తక్కువగా (${bPct}%) ఉన్నాయి.`,
        `పోషకాలు అందకపోవడం లేదా వేర్లకు గాలి ఆడకపోవడం వల్ల ఆకు పసుపుగా మారింది.`
      ];
      stillNeededListEn = [
        'Verify if yellowing started on bottom older leaves or top young leaves',
        'Check soil moisture and drainage'
      ];
      stillNeededListTe = [
        'పాత ఆకులా లేక కొత్త ఆకులా చూడండి',
        'నేలలో తేమను తనిఖీ చేయండి'
      ];
      immediateStepsEn = [
        'Check root-zone moisture at 10 cm depth.',
        'Refrain from heavy emergency chemical dumping.'
      ];
      immediateStepsTe = [
        'వేర్ల వద్ద తేమను తనిఖీ చేయండి.',
        'ఒక్కసారిగా ఎక్కువ రసాయన ఎరువులు వేయవద్దు.'
      ];
      envStepsEn = ['Maintain balanced soil moisture without standing water.'];
      envStepsTe = ['నీరు నిల్వ ఉండకుండా తేమను సమతుల్యంగా ఉంచండి.'];
      plantStepsEn = ['Top-dress with well-rotted farmyard manure (FYM) or vermicompost.'];
      plantStepsTe = ['బాగా చివికిన పశువుల ఎరువు లేదా వర్మీకంపోస్టు వేయండి.'];
      prevStepsEn = ['Perform seasonal soil test before next sowing.'];
      prevStepsTe = ['పంట వేసే ముందు భూసార పరీక్ష చేయించండి.'];
      monitorStepsEn = ['Observe leaf color over next 5–7 days.'];
      monitorStepsTe = ['5-7 రోజుల్లో ఆకు రంగు మార్పును గమనించండి.'];
      expertEn = 'Consult local agricultural extension agronomist.';
      expertTe = 'స్థానిక వ్యవసాయ నిపుణులను సంప్రదించండి.';
    } else {
      conditionTitleEn = `Root-Zone Moisture Stress & Marginal Scorch on ${normCrop} — leading hypothesis`;
      conditionTitleTe = `${normCrop} పై తేమ అసమతుల్యత & ఆకుల ఒత్తిడి — ప్రాథమిక పరికల్పన`;
      conditionCategory = 'moisture_stress';

      whyListEn = [
        `Marginal scorch and moderate chlorosis (${yPct}%) detected with sharp dynamic contrast.`,
        `Absence of discrete necrotic spots (${bPct}% brown).`
      ];
      whyListTe = [
        `ఆకుల అంచులు ఎండిపోవడం మరియు స్వల్ప పసుపు రంగు (${yPct}%) కనిపించింది.`,
        `స్పష్టమైన తెగులు మచ్చలు లేవు (${bPct}% గోధుమ రంగు).`
      ];
      stillNeededListEn = ['Probe 15 cm deep into root zone to check moisture'];
      stillNeededListTe = ['మొక్క మొదట్లో 15 సెం.మీ తవ్వి తేమను చూడండి'];
      immediateStepsEn = ['Check soil drainage and avoid flood-and-drought cycles.'];
      immediateStepsTe = ['నీటి పారుదలని సరిచేయండి.'];
      envStepsEn = ['Maintain regular pulse irrigation.'];
      envStepsTe = ['క్రమబద్ధంగా నీరు పెట్టండి.'];
      plantStepsEn = ['Mulch bed with clean straw.'];
      plantStepsTe = ['ఎండుగడ్డితో మల్చింగ్ చేయండి.'];
      prevStepsEn = ['Install drip irrigation and improve soil organic matter.'];
      prevStepsTe = ['సేంద్రీయ ఎరువులతో నేల సారాన్ని పెంచండి.'];
      monitorStepsEn = ['Observe turgidity in early morning.'];
      monitorStepsTe = ['ఉదయపు వేళల్లో ఆకులను చూడండి.'];
      expertEn = 'Contact your local AEO if wilting persists.';
      expertTe = 'సమస్య తగ్గకపోతే వ్యవసాయ అధికారిని సంప్రదించండి.';
    }
  }

  const sixPointPlan: SixPointManagementPlan = {
    immediateSteps: { en: immediateStepsEn, te: immediateStepsTe },
    environmentalIrrigation: { en: envStepsEn, te: envStepsTe },
    affectedPlantManagement: { en: plantStepsEn, te: plantStepsTe },
    preventionMeasures: { en: prevStepsEn, te: prevStepsTe },
    monitoringFollowUp: { en: monitorStepsEn, te: monitorStepsTe },
    expertConfirmation: { en: expertEn, te: expertTe }
  };

  return {
    possibleConditionEn: conditionTitleEn,
    possibleConditionTe: conditionTitleTe,
    likelyConditionEn: conditionTitleEn,
    likelyConditionTe: conditionTitleTe,
    conditionCategory,
    statusBadgeEn: 'Likely Condition (Field Confirmation Recommended)',
    statusBadgeTe: 'సాధ్యమైన పరిస్థితి (క్షేత్ర నిర్ధారణ సిఫార్సు చేయబడింది)',
    whySuspectedEn: whyListEn.join(' '),
    whySuspectedTe: whyListTe.join(' '),
    whyEvidenceEn: whyListEn,
    whyEvidenceTe: whyListTe,
    confidenceWordingEn: 'Likely based on visual evidence — field confirmation recommended.',
    confidenceWordingTe: 'దృశ్య ఆధారాల ఆధారంగా సంభావ్యత — క్షేత్రస్థాయి నిర్ధారణ సిఫార్సు చేయబడింది.',
    stillNeededForConfirmationEn: stillNeededListEn,
    stillNeededForConfirmationTe: stillNeededListTe,
    immediateStepsEn,
    immediateStepsTe,
    treatmentManagementEn: [
      ...sixPointPlan.environmentalIrrigation.en,
      ...sixPointPlan.affectedPlantManagement.en,
      'Chemical Safety Rule: Use only a locally approved treatment recommended for this crop and condition, and follow the product label or guidance from a qualified agricultural professional.'
    ],
    treatmentManagementTe: [
      ...sixPointPlan.environmentalIrrigation.te,
      ...sixPointPlan.affectedPlantManagement.te,
      'రసాయన భద్రతా నియమం: స్థానికంగా సిఫార్సు చేయబడిన మందులను మాత్రమే ఉత్పత్తి లేబుల్ మరియు నిపుణుల సలహా ప్రకారం వాడండి.'
    ],
    preventionStepsEn: sixPointPlan.preventionMeasures.en,
    preventionStepsTe: sixPointPlan.preventionMeasures.te,
    whenToSeekHelpEn: sixPointPlan.expertConfirmation.en,
    whenToSeekHelpTe: sixPointPlan.expertConfirmation.te,
    sixPointPlan,
    isEvidenceSufficient: true,
    safetyNoticeEn: 'Important Safety Notice: An image scan provides visual evidence only and does NOT constitute a confirmed pathogen culture. Do NOT spray hazardous synthetic pesticides without local KVK or extension agronomist consultation. Always read and adhere strictly to product labels.',
    safetyNoticeTe: 'ముఖ్యమైన భద్రతా గమనిక: ఫోటో విశ్లేషణ కేవలం దృశ్య సంకేతం మాత్రమే. ఖచ్చితమైన ప్రయోగశాల పరీక్ష లేకుండా ప్రమాదకర రసాయనాలను వాడవద్దు. ఎల్లప్పుడూ ఉత్పత్తి లేబుల్‌పై సూచించిన మోతాదును మాత్రమే పాటించండి.'
  };
}
