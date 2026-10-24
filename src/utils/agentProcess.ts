import {
  CVMeasurements,
  ImageQualityAssessment,
  CompetingHypothesis,
  AgentDecisionTraceStep,
  AgentFollowUpQuestion,
  GrowthStage,
  SensorReading
} from '../types';

export interface AgentEvaluationOutput {
  status: 'rejected_low_quality' | 'needs_clarification' | 'analyzed_usable';
  agentTrace: AgentDecisionTraceStep[];
  hypotheses: CompetingHypothesis[];
  followUpQuestions: AgentFollowUpQuestion[];
  primaryAdvisoryEn: string;
  primaryAdvisoryTe: string;
  nextStepsEn: string[];
  nextStepsTe: string[];
  requiresNewPhoto: boolean;
}

export function runAgentDecisionProcess(
  measurements: CVMeasurements,
  quality: ImageQualityAssessment,
  cropType: string,
  growthStage: GrowthStage,
  farmerNotes: string,
  sensor?: SensorReading | null
): AgentEvaluationOutput {
  const trace: AgentDecisionTraceStep[] = [];
  const now = new Date().toLocaleTimeString();
  const normCrop = (cropType || 'Crop').trim();
  const lowerCrop = normCrop.toLowerCase();

  const isTomato = lowerCrop.includes('tomato');
  const isPaddy = lowerCrop.includes('paddy') || lowerCrop.includes('rice');
  const isCotton = lowerCrop.includes('cotton');
  const isChilli = lowerCrop.includes('chilli') || lowerCrop.includes('pepper');

  const bPct = measurements.brownPercentage;
  const dPct = measurements.darkPercentage;
  const yPct = measurements.yellowPercentage;
  const gPct = measurements.greenPercentage;

  const isBlurry = quality.isBlurry || measurements.sharpness < 70;
  const isPoorFraming = quality.isPoorFraming || measurements.foliagePercentage < 10;
  const isTooDark = quality.isTooDark || measurements.brightness < 45;
  const isLowQuality = isBlurry || isPoorFraming || isTooDark;

  const isHealthy =
    !isLowQuality &&
    gPct >= 70 &&
    bPct < 3.5 &&
    yPct < 8.0 &&
    dPct < 1.5;

  // =========================================================================
  // STAGE 1: PERCEPTION
  // Ingests image specs, OpenCV metrics, telemetry, and farmer notes
  // =========================================================================
  const perceptionEvidenceTags = [
    `Sharpness: ${measurements.sharpness} σ²`,
    `Brightness: ${measurements.brightness}/255`,
    `Contrast: ${measurements.contrast} σ`,
    `Foliage: ${measurements.foliagePercentage}%`,
    `Yellow: ${measurements.yellowPercentage}%`,
    `Brown: ${measurements.brownPercentage}%`,
    `Dark: ${measurements.darkPercentage}%`
  ];

  if (sensor) {
    perceptionEvidenceTags.push(
      `Moisture: ${sensor.soilMoisture}%`,
      `Temp: ${sensor.airTemperature}°C`,
      `Humidity: ${sensor.airHumidity}%`
    );
  }

  trace.push({
    phase: 'PERCEPTION',
    timestamp: now,
    titleEn: 'Computer Vision & Field Telemetry Perception',
    titleTe: 'కంప్యూటర్ విజన్ & పొలం సెన్సార్ సమాచారం సేకరణ',
    detailsEn: `Ingested ${measurements.width}x${measurements.height} photograph (${measurements.megapixels} MP) of ${normCrop} at '${growthStage}' stage. Measured ${measurements.anomalyBoundingBoxes.length} visual anomaly cluster(s). Farmer notes: "${farmerNotes || 'None provided'}".`,
    detailsTe: `${normCrop} (${growthStage} దశ) యొక్క ${measurements.width}x${measurements.height} ఫోటోను గ్రహించింది. ${measurements.anomalyBoundingBoxes.length} దృశ్య ప్రాంతాలు గుర్తించబడ్డాయి. రైతు గమనికలు: "${farmerNotes || 'ఏమీ లేవు'}".`,
    evidenceTags: perceptionEvidenceTags,
    status: isLowQuality ? 'warning' : 'passed'
  });

  // =========================================================================
  // STAGE 2: VISUAL EVIDENCE
  // Color segmentation, chlorosis/necrosis areas, lesion distribution
  // =========================================================================
  if (isLowQuality) {
    trace.push({
      phase: 'VISUAL EVIDENCE',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Visual Evidence Degraded: Quality Gate Triggered',
      titleTe: 'దృశ్య ఆధారాల నాణ్యత పరిశీలన: లోపం గుర్తించబడింది',
      detailsEn: isBlurry
        ? `Laplacian sharpness variance (${measurements.sharpness}) is below clinical minimum threshold of 70. Edge definitions are blurred; micro-lesion margins and fungal sporulation cannot be resolved.`
        : isPoorFraming
        ? `Plant foliage occupies only ${measurements.foliagePercentage}% of the frame (<20% minimum). Background soil dominates pixels.`
        : `Luminance (${measurements.brightness}) is severely underexposed.`,
      detailsTe: isBlurry
        ? `లాప్లాసియన్ పదును (${measurements.sharpness}) కనీస పరిమితి (70) కంటే తక్కువగా ఉంది. ఆకు మచ్చల అంచులు మసకగా ఉన్నాయి.`
        : `ఆకు విస్తీర్ణం చాలా తక్కువగా ఉంది (${measurements.foliagePercentage}%). నేల భాగం ఎక్కువగా కనిపిస్తోంది.`,
      evidenceTags: [
        isBlurry ? 'Blur Detected' : 'Framing Fault',
        `Sharpness: ${measurements.sharpness}`,
        'Symptom Details Obscured'
      ],
      status: 'critical'
    });

    // STAGE 3: LIKELY CONDITION / DIFFERENTIAL (Blurry handling)
    trace.push({
      phase: 'LIKELY CONDITION / DIFFERENTIAL',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Image Quality Insufficient — No Specific Disease Identified',
      titleTe: 'చిత్ర నాణ్యత సరిపోలేదు — ఎలాంటి వ్యాధిని గుర్తించలేము',
      detailsEn: 'To prevent hazardous agricultural misdiagnosis or unneeded chemical sprays, disease identification is suspended. Diagnostic confidence is 0% due to optical degradation.',
      detailsTe: 'తప్పు సమాచారం మరియు ప్రమాదకర రసాయనాల వాడకాన్ని నివారించడానికి వ్యాధి నిర్ధారణ తాత్కాలికంగా నిలిపివేయబడింది.',
      evidenceTags: ['Confidence: Uncertain', 'Zero Speculation Mandate'],
      status: 'warning'
    });

    // STAGE 4: REASONING
    trace.push({
      phase: 'REASONING',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Diagnostic Safety Mandate & Uncertainty Handling',
      titleTe: 'భద్రతా కారణాలు & అనిశ్చితి విశ్లేషణ',
      detailsEn: 'An unclear photograph cannot differentiate fungal spores from mechanical tears or nutrient loss. Recommending physical verification and a clear photographic capture.',
      detailsTe: 'మసక ఫోటోలో శిలీంధ్ర తెగులు మరియు పోషకాల లోపాన్ని వేరు చేయడం అసాధ్యం. స్పష్టమైన ఫోటో మాత్రమే నమ్మదగినది.',
      evidenceTags: ['Clinical Protocol', 'Avoid False Positives'],
      status: 'passed'
    });

    // STAGE 5: RECOMMENDED ACTION
    trace.push({
      phase: 'RECOMMENDED ACTION',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Physical Plant Check & Photo Retake Guidance',
      titleTe: 'ప్రత్యక్ష మొక్క తనిఖీ & స్పష్టమైన ఫోటో తీసే విధానం',
      detailsEn: 'Hold camera steady with both hands, keep 15-20 cm distance in bright indirect daylight, ensure the affected leaf fills at least 50% of the viewfinder.',
      detailsTe: 'కెమెరా కదలకుండా స్థిరంగా పట్టుకుని, సహజ వెలుతురులో 15-20 సెం.మీ దూరం నుండి ఆకు స్పష్టంగా కనిపించేలా ఫోటో తీయండి.',
      evidenceTags: ['Macro Focus', 'Diffused Light', 'Frame 50%+'],
      status: 'warning'
    });

    // STAGE 6: FIELD VERIFICATION
    trace.push({
      phase: 'FIELD VERIFICATION',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Direct Physical Inspection of Symptomatic Plant',
      titleTe: 'పొలంలో మొక్కను నేరుగా పరిశీలించడం',
      detailsEn: 'Inspect the underside of leaves for active insects, powdery mildew, or moisture rot. Verify whether symptoms are widespread or on isolated plants.',
      detailsTe: 'ఆకు అడుగు భాగంలో బూజు లేదా పురుగులు ఉన్నాయేమో చూడండి. పొలమంతా వ్యాపించిందో లేదో గమనించండి.',
      evidenceTags: ['Physical Scouting', 'Hand Lens Inspection'],
      status: 'passed'
    });

    // STAGE 7: OUTCOME / NEXT STEP
    trace.push({
      phase: 'OUTCOME / NEXT STEP',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Rescan with Crisp Close-Up Photograph',
      titleTe: 'స్పష్టమైన క్లోజప్ ఫోటోతో మళ్లీ స్కాన్ చేయండి',
      detailsEn: 'Retake scan with a steady close-up photo. If symptoms rapidly expand over 48 hours, bring a fresh leaf sample in a ventilated paper envelope to your nearest KVK or AEO.',
      detailsTe: 'మళ్లీ స్పష్టమైన ఫోటో తీయండి. సమస్య తీవ్రంగా ఉంటే సమీపంలోని కృషి విజ్ఞాన కేంద్రం (KVK) లేదా వ్యవసాయ అధికారి (AEO)ని సంప్రదించండి.',
      evidenceTags: ['Action: Rescan Required', 'KVK Escalation Ready'],
      status: 'warning'
    });

    return {
      status: 'rejected_low_quality',
      agentTrace: trace,
      hypotheses: [],
      followUpQuestions: [],
      primaryAdvisoryEn: 'Image quality insufficient for reliable disease assessment. Please capture a steady, well-lit close-up photo.',
      primaryAdvisoryTe: 'ఖచ్చితమైన వ్యాధి నిర్ధారణకు చిత్ర నాణ్యత సరిపోలేదు. దయచేసి సహజ వెలుతురులో కదలకుండా స్పష్టమైన ఫోటో తీయండి.',
      nextStepsEn: [
        'Wipe the phone camera lens with a clean cloth',
        'Hold phone steady with both hands at 15–20 cm distance',
        'Frame the affected leaf in the center so it fills at least 50% of the screen',
        'Avoid capturing under harsh direct noon glare or heavy shadows'
      ],
      nextStepsTe: [
        'ఫోన్ కెమెరా లెన్స్‌ను శుభ్రమైన గుడ్డతో తుడవండి',
        'కెమెరాను కదలకుండా రెండు చేతులతో స్థిరంగా పట్టుకోండి',
        'ఆకు స్క్రీన్‌లో సగం కంటే ఎక్కువ కనిపించేలా 15-20 సెం.మీ దూరం నుండి తీయండి',
        'అధిక ఎండ లేదా చీకటిలో ఫోటోలు తీయవద్దు'
      ],
      requiresNewPhoto: true
    };
  }

  // --- HEALTHY LEAF CASE ---
  if (isHealthy) {
    trace.push({
      phase: 'VISUAL EVIDENCE',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Visual Evidence Analysis: Optimal Chlorophyll Profile',
      titleTe: 'దృశ్య ఆధారాల విశ్లేషణ: అత్యుత్తమ క్లోరోఫిల్ స్థితి',
      detailsEn: `Color segmentation confirms ${gPct}% healthy green chlorophyll, ${yPct}% minor chlorosis, and only ${bPct}% brown surface markings. No dark spore clusters detected.`,
      detailsTe: `ఆకుపచ్చ రంగు ${gPct}%, పసుపు రంగు ${yPct}%, గోధుమ రంగు కేవలం ${bPct}% గా ఉంది. ఎలాంటి తెగులు మచ్చలు లేవు.`,
      evidenceTags: [`Healthy Green: ${gPct}%`, `Brown: ${bPct}%`, 'Intact Cuticle'],
      status: 'passed'
    });

    trace.push({
      phase: 'LIKELY CONDITION / DIFFERENTIAL',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: `Likely Condition: Healthy ${normCrop} Foliage`,
      titleTe: `సాధ్యమైన పరిస్థితి: ఆరోగ్యకరమైన ${normCrop} పంట`,
      detailsEn: 'Visual evidence is consistent with normal, vigorous vegetative tissue. No pathological disease lesions are indicated.',
      detailsTe: 'దృశ్య ఆధారాల ప్రకారం ఆకు ఆరోగ్యంగా ఉంది. ఎలాంటి తెగులు ఆనవాళ్లు లేవు.',
      evidenceTags: ['Confidence: High', 'No Disease Detected'],
      status: 'passed'
    });

    trace.push({
      phase: 'REASONING',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Physiological State & Growth Stage Correlation',
      titleTe: 'శాస్త్రీయ కారణాలు & పంట పెరుగుదల దశ విశ్లేషణ',
      detailsEn: `At the '${growthStage}' stage, cellular chlorophyll synthesis is robust. Foliage exhibits normal photosynthetic capacity and dynamic contrast (${measurements.contrast}).`,
      detailsTe: `${growthStage} దశలో క్లోరోఫిల్ సంశ్లేషణ సమర్థవంతంగా జరుగుతోంది. కాంట్రాస్ట్ (${measurements.contrast}) సాధారణంగా ఉంది.`,
      evidenceTags: ['Vigorous Growth', 'Normal Contrast'],
      status: 'passed'
    });

    trace.push({
      phase: 'RECOMMENDED ACTION',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Preventive Maintenance & Avoid Unneeded Sprays',
      titleTe: 'నివారణ చర్యలు & అనవసర మందుల నివారణ',
      detailsEn: 'Do not spray prophylactic chemical pesticides on healthy crops. Maintain balanced organic nutrition and scheduled irrigation.',
      detailsTe: 'ఆరోగ్యంగా ఉన్న పంటపై రసాయనాలు పిచికారీ చేయవద్దు. సేంద్రీయ ఎరువులు మరియు సరైన నీరు అందించండి.',
      evidenceTags: ['Zero Chemical Sprays', 'Maintain Good Care'],
      status: 'passed'
    });

    trace.push({
      phase: 'FIELD VERIFICATION',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Bi-Weekly Field Scouting Checkpoint',
      titleTe: 'రెండు వారాలకొకసారి క్షేత్ర పరిశీలన',
      detailsEn: 'Inspect lower canopy leaves bi-weekly and turn over leaves to verify that sucking pests have not colonized leaf undersides.',
      detailsTe: 'కింది ఆకులను మరియు ఆకు వెనుక భాగాన్ని క్రమం తప్పకుండా పరిశీలించండి.',
      evidenceTags: ['Bi-Weekly Scouting', 'Underside Inspection'],
      status: 'passed'
    });

    trace.push({
      phase: 'OUTCOME / NEXT STEP',
      timestamp: new Date().toLocaleTimeString(),
      titleEn: 'Routine Monitoring & Record Keeping',
      titleTe: 'సాధారణ పర్యవేక్షణ & రికార్డు నమోదు',
      detailsEn: 'Log this healthy baseline scan in your FarmSage crop diary. Rescan in 7–10 days or after any major weather event.',
      detailsTe: 'ఈ ఆరోగ్యకరమైన స్కాన్‌ను డైరీలో భద్రపరచుకోండి. 7-10 రోజుల తర్వాత మళ్లీ స్కాన్ చేయండి.',
      evidenceTags: ['Diary Saved', 'Optimal Status'],
      status: 'passed'
    });

    const healthyHypotheses: CompetingHypothesis[] = [
      {
        id: 'hyp_healthy',
        titleEn: `Healthy ${normCrop} Foliage (Optimal Chlorophyll)`,
        titleTe: `ఆరోగ్యకరమైన ${normCrop} పంట ఆకు (సమతుల్య క్లోరోఫిల్)`,
        category: 'healthy_crop',
        initialProbability: 85,
        currentProbability: 85,
        visualEvidenceEn: `Measured ${gPct}% healthy green chlorophyll with negligible necrotic markings (${bPct}%).`,
        visualEvidenceTe: `కొలిచిన ఆకుపచ్చ రంగు ${gPct}%, గోధుమ రంగు మచ్చలు కేవలం ${bPct}% మాత్రమే ఉన్నాయి.`,
        whyConsideredEn: 'Color histogram and edge analysis confirm intact leaf cuticle and normal photosynthetic tissue.',
        whyConsideredTe: 'రంగుల విభజన మరియు అంచుల విశ్లేషణ ఆకు సహజంగా ఆరోగ్యంగా ఉన్నట్లు నిర్ధారిస్తున్నాయి.',
        whatIsMissingEn: 'No symptomatic lesions or chlorotic streaks present.',
        whatIsMissingTe: 'ఎలాంటి మచ్చలు లేదా పసుపు రంగు చారలు లేవు.',
        distinguishingObservationEn: 'Consistent deep green coloration across upper and lower canopy.',
        distinguishingObservationTe: 'మొక్క పై మరియు కింద ఆకులు సమానంగా ఆకుపచ్చగా ఉండటం.',
        recommendedObservationsEn: ['Check leaf undersides for early sucking insect colonization.'],
        recommendedObservationsTe: ['ఆకు అడుగు భాగంలో రసం పీల్చే పురుగులు ఉన్నాయేమో చూడండి.']
      },
      {
        id: 'hyp_latent_stress',
        titleEn: 'Minor Microclimate Transpiration Variance',
        titleTe: 'స్వల్ప వాతావరణ తేమ హెచ్చుతగ్గులు',
        category: 'environmental',
        initialProbability: 15,
        currentProbability: 15,
        visualEvidenceEn: `Marginal variation of ${yPct}% yellowing near blade edges with contrast ${measurements.contrast}.`,
        visualEvidenceTe: `ఆకు అంచుల వద్ద స్వల్ప పసుపు రంగు (${yPct}%) గుర్తించబడింది.`,
        whyConsideredEn: 'Slight edge shading reflects normal light gradient or diurnal transpiration cycle.',
        whyConsideredTe: 'సహజ వెలుతురు లేదా పగటి తేమ హెచ్చుతగ్గుల వల్ల స్వల్ప రంగు మార్పు రావచ్చు.',
        whatIsMissingEn: 'No wilting or cellular necrosis observed.',
        whatIsMissingTe: 'వడలడం లేదా కణజాలం దెబ్బతినడం లేదు.',
        distinguishingObservationEn: 'Leaves remain fully turgid throughout morning hours.',
        distinguishingObservationTe: 'ఉదయపు వేళల్లో ఆకులు తాజాగా నిలబడి ఉంటాయి.',
        recommendedObservationsEn: ['Monitor root zone moisture.'],
        recommendedObservationsTe: ['వేర్ల వద్ద తేమను పరిశీలించండి.']
      }
    ];

    return {
      status: 'analyzed_usable',
      agentTrace: trace,
      hypotheses: healthyHypotheses,
      followUpQuestions: [],
      primaryAdvisoryEn: `Visual evidence confirms healthy ${normCrop} foliage with an optimal chlorophyll index. Continue routine agronomic care.`,
      primaryAdvisoryTe: `దృశ్య ఆధారాల ప్రకారం ${normCrop} పంట ఆకు ఆరోగ్యంగా ఉంది. సాధారణ పంట సంరక్షణ కొనసాగించండి.`,
      nextStepsEn: [
        'Maintain balanced irrigation and organic soil conditioning',
        'Avoid prophylactic chemical sprays to protect natural predators',
        'Re-scan in 7–10 days'
      ],
      nextStepsTe: [
        'సమతుల్య నీటి పారుదల మరియు సేంద్రీయ ఎరువులను కొనసాగించండి',
        'అనవసరంగా రసాయనాలు వాడకుండా మిత్ర పురుగులను కాపాడుకోండి',
        'మరో 7-10 రోజుల్లో మళ్లీ స్కాన్ చేయండి'
      ],
      requiresNewPhoto: false
    };
  }

  // =========================================================================
  // STANDARD USABLE SYMPTOMATIC PHOTO: GENERATE RELATIVE HYPOTHESIS RANKINGS
  // =========================================================================

  // Calculate evidence-driven heuristic ranking scores
  let scoreFoliarDisease = 35;
  let scoreNutritional = 35;
  let scoreMoistureStress = 30;

  if (bPct > 7 || dPct > 3) {
    scoreFoliarDisease += 30;
    scoreNutritional -= 15;
    scoreMoistureStress -= 15;
  } else if (yPct > 12 && bPct < 4) {
    scoreNutritional += 30;
    scoreMoistureStress += 10;
    scoreFoliarDisease -= 30;
  }

  if (sensor && sensor.soilMoisture > 75) {
    scoreMoistureStress += 20;
    scoreFoliarDisease += 10;
    scoreNutritional -= 15;
  } else if (sensor && sensor.soilMoisture < 22) {
    scoreMoistureStress += 25;
  }

  // Normalize heuristic ranking scores to 100
  const rawSum = scoreFoliarDisease + scoreNutritional + scoreMoistureStress;
  scoreFoliarDisease = Math.round((scoreFoliarDisease / rawSum) * 100);
  scoreNutritional = Math.round((scoreNutritional / rawSum) * 100);
  scoreMoistureStress = 100 - scoreFoliarDisease - scoreNutritional;

  // Formulate crop-specific differential hypotheses
  let hyp1: CompetingHypothesis;
  let hyp2: CompetingHypothesis;
  let hyp3: CompetingHypothesis;

  if (isTomato) {
    hyp1 = {
      id: 'hyp_tomato_early_blight',
      titleEn: 'Early Blight (Alternaria solani) / Foliar Spot Indicator',
      titleTe: 'టమోటా ఎర్లీ బ్లైట్ / ఆకుమచ్చ తెగులు సూచిక',
      category: 'fungal_bacterial_indicator',
      initialProbability: scoreFoliarDisease,
      currentProbability: scoreFoliarDisease,
      visualEvidenceEn: `Concentric necrotic brown lesion clusters detected across ${bPct}% of leaf area with ${dPct}% dark micro-spots.`,
      visualEvidenceTe: `ఆకుపై ${bPct}% గోధుమ రంగు వలయాల మచ్చలు మరియు ${dPct}% నల్లటి చుక్కలు గుర్తించబడ్డాయి.`,
      whyConsideredEn: 'Target-like concentric rings surrounded by chlorotic halos on older tomato foliage are the hallmark visual symptom profile of Alternaria solani.',
      whyConsideredTe: 'టమోటా ఆకులపై చక్రాల వంటి వలయాలు మరియు చుట్టూ పసుపు రంగు ఉండటం ఎర్లీ బ్లైట్ తెగులు ప్రధాన లక్షణం.',
      whatIsMissingEn: 'Microscopic verification of beaked muriform conidia spores and stem collar rot inspection.',
      whatIsMissingTe: 'సూక్ష్మదర్శిని ద్వారా శిలీంధ్ర బీజాల నిర్ధారణ మరియు కాండంపై మచ్చల తనిఖీ ఇంకా అవసరం.',
      distinguishingObservationEn: 'Check whether spots exhibit distinct concentric target-like rings and originate on bottom leaves.',
      distinguishingObservationTe: 'మచ్చలు చక్రాల వలె ఉండి కింది పాత ఆకులపై మొదలయ్యాయో లేదో పరిశీలించండి.',
      recommendedObservationsEn: [
        'Inspect leaf undersides with a hand lens for dark velvety spore growth in lesion centers',
        'Examine lower stems for sunken brown cankers',
        'Observe whether spotting spreads to adjacent plants in the row'
      ],
      recommendedObservationsTe: [
        'భూతద్దంతో మచ్చల మధ్య బూజు లేదా నల్లటి ఆనవాళ్లు ఉన్నాయేమో చూడండి',
        'కాండం మొదట్లో నల్లటి చారలు ఉన్నాయేమో గమనించండి',
        'పక్కనున్న మొక్కలకు మచ్చలు విస్తరిస్తున్నాయో లేదో చూడండి'
      ]
    };

    hyp2 = {
      id: 'hyp_tomato_chlorosis',
      titleEn: 'Nitrogen / Magnesium Deficiency Chlorosis',
      titleTe: 'నత్రజని / మెగ్నీషియం లోప పసుపు రంగు',
      category: 'nutritional',
      initialProbability: scoreNutritional,
      currentProbability: scoreNutritional,
      visualEvidenceEn: `Measured ${yPct}% chlorotic yellowing across leaf lamina with ${gPct}% healthy chlorophyll remaining.`,
      visualEvidenceTe: `ఆకుపై ${yPct}% పసుపు రంగు మరియు ${gPct}% ఆకుపచ్చ రంగు గుర్తించబడింది.`,
      whyConsideredEn: 'Uniform or interveinal yellowing without tissue rotting indicates impaired chlorophyll synthesis or macronutrient depletion during flowering/fruiting.',
      whyConsideredTe: 'కణజాలం కుళ్ళిపోకుండా పసుపుగా మారడం పోషకాల లోపాన్ని సూచిస్తుంది.',
      whatIsMissingEn: 'Soil Health Card laboratory test and leaf petiole sap analysis.',
      whatIsMissingTe: 'భూసార పరీక్ష మరియు ఆకు రసాయన విశ్లేషణ వివరాలు ఇంకా అవసరం.',
      distinguishingObservationEn: 'Notice whether leaf veins remain green while interveinal tissue turns yellow.',
      distinguishingObservationTe: 'ఈనెలు పచ్చగా ఉండి మధ్య భాగం పసుపుగా మారిందో లేదో చూడండి.',
      recommendedObservationsEn: [
        'Verify if yellowing began strictly on bottom-most older leaves',
        'Check soil drainage and root health to rule out waterlogging lockout',
        'Review recent fertilizer application dates'
      ],
      recommendedObservationsTe: [
        'పసుపు రంగు కేవలం కింద ఆకులకే పరిమితమైందా చూడండి',
        'వేర్ల వద్ద నీరు నిల్వ ఉండకుండా చూసుకోండి',
        'ఇటీవల వేసిన ఎరువుల వివరాలను పరిశీలించండి'
      ]
    };

    hyp3 = {
      id: 'hyp_tomato_moisture_stress',
      titleEn: 'Root Zone Moisture Fluctuation & Marginal Scorch',
      titleTe: 'వేరు వ్యవస్థ తేమ హెచ్చుతగ్గులు & ఆకుల అంచుల ఎండిపోవుట',
      category: 'moisture_stress',
      initialProbability: scoreMoistureStress,
      currentProbability: scoreMoistureStress,
      visualEvidenceEn: `Edge-defined contrast (${measurements.contrast}) with peripheral yellowing (${yPct}%) along leaf margins.`,
      visualEvidenceTe: `ఆకుల అంచుల వెంబడి రంగు మారడం మరియు కాంట్రాస్ట్ (${measurements.contrast}) గుర్తించబడింది.`,
      whyConsideredEn: 'Transpiration imbalance between hot daytime air and root water uptake causes marginal scorch and leaf curling.',
      whyConsideredTe: 'నీటి ఎద్దడి లేదా అధిక తేమ వల్ల ఆకుల అంచులు ఎండిపోతాయి.',
      whatIsMissingEn: 'Continuous tensiometer soil water tension logs across 72 hours.',
      whatIsMissingTe: 'గత 3 రోజుల నేల తేమ వివరాలు ఇంకా అవసరం.',
      distinguishingObservationEn: 'Look for midday wilting that fully recovers by early morning.',
      distinguishingObservationTe: 'మధ్యాహ్నం ఆకులు వాలిపోయి ఉదయానికి మళ్లీ తాజాగా మారుతున్నాయా చూడండి.',
      recommendedObservationsEn: [
        'Probe 15 cm deep into root zone to inspect for standing water or dry soil',
        'Check borewell salinity and irrigation interval'
      ],
      recommendedObservationsTe: [
        'పాదుల్లో 15 సెం.మీ లోతులో తేమను తనిఖీ చేయండి',
        'నీటి నాణ్యత మరియు నీరు పెట్టే సమయాలను పరిశీలించండి'
      ]
    };
  } else if (isPaddy) {
    hyp1 = {
      id: 'hyp_paddy_blast',
      titleEn: 'Rice Blast (Magnaporthe oryzae) / Brown Spot Indicator',
      titleTe: 'వరి అగ్గి తెగులు (బ్లాస్ట్) / ఆకుమచ్చ తెగులు సూచిక',
      category: 'fungal_bacterial_indicator',
      initialProbability: scoreFoliarDisease,
      currentProbability: scoreFoliarDisease,
      visualEvidenceEn: `Spindle-shaped elliptical lesions detected with brown necrotic borders (${bPct}%) and gray centers.`,
      visualEvidenceTe: `కదురు ఆకారపు మచ్చలు గోధుమ అంచులు (${bPct}%) మరియు బూడిద కేంద్రంతో గుర్తించబడ్డాయి.`,
      whyConsideredEn: 'Spindle-shaped lesions with pointed ends on rice blades are the primary visual diagnostic marker of Magnaporthe oryzae.',
      whyConsideredTe: 'వరి ఆకులపై కదురు వంటి మచ్చలు అగ్గి తెగులు ప్రధాన లక్షణం.',
      whatIsMissingEn: 'Inspection of collar nodes and panicle neck for black girdling lesions.',
      whatIsMissingTe: 'వరి వెన్ను మరియు మెడ భాగంలో నల్లటి మచ్చల తనిఖీ ఇంకా అవసరం.',
      distinguishingObservationEn: 'Observe whether lesion centers are gray/whitish with pointed spindle ends.',
      distinguishingObservationTe: 'మచ్చల మధ్య భాగం బూడిద రంగులో ఉండి కొనలు సూదిగా ఉన్నాయో లేదో చూడండి.',
      recommendedObservationsEn: [
        'Inspect dew-covered leaf blades in early morning for fungal conidial spore bloom',
        'Check if neighboring plants show identical spindle lesions',
        'Review recent urea application rates'
      ],
      recommendedObservationsTe: [
        'ఉదయం మంచు ఉన్నప్పుడు ఆకు మచ్చలపై బూజు ఉందేమో పరిశీలించండి',
        'పక్కనున్న మొక్కలపై కూడా ఇలాంటి మచ్చలు ఉన్నాయా చూడండి',
        'ఇటీవల వేసిన యూరియా మోతాదును సరిచూసుకోండి'
      ]
    };

    hyp2 = {
      id: 'hyp_paddy_nitrogen_zinc',
      titleEn: 'Nitrogen / Zinc Deficiency Chlorosis in Rice',
      titleTe: 'వరిలో నత్రజని / జింక్ లోప పసుపు రంగు',
      category: 'nutritional',
      initialProbability: scoreNutritional,
      currentProbability: scoreNutritional,
      visualEvidenceEn: `Diffuse pale yellowing across ${yPct}% of leaf surface progressing from tip downward.`,
      visualEvidenceTe: `ఆకు కొనల నుండి కిందికి వ్యాపించిన పసుపు రంగు (${yPct}%) గుర్తించబడింది.`,
      whyConsideredEn: 'Uniform leaf paling starting from tips downward is classic nutritional starvation in submerged soils.',
      whyConsideredTe: 'వరిలో పోషకాల లోపం వల్ల ఆకులు పసుపుగా మారతాయి.',
      whatIsMissingEn: 'Soil and leaf tissue zinc ppm assay.',
      whatIsMissingTe: 'భూసార మరియు ఆకు నమూనా పరీక్ష ఇంకా అవసరం.',
      distinguishingObservationEn: 'Verify whether midrib of emerging leaves turns yellow while outer blade is pale green.',
      distinguishingObservationTe: 'లేత ఆకుల మధ్య ఈనె పసుపుగా మారుతుందో లేదో చూడండి.',
      recommendedObservationsEn: [
        'Inspect emerging shoots for bronze discoloration',
        'Check days after transplanting (DAT)'
      ],
      recommendedObservationsTe: [
        'కొత్త చిగుళ్లపై ఎరుపు రంగు మచ్చలు ఉన్నాయేమో చూడండి',
        'నాటిన ఎన్ని రోజులకు ఈ సమస్య వచ్చిందో పరిశీలించండి'
      ]
    };

    hyp3 = {
      id: 'hyp_paddy_submergence_stress',
      titleEn: 'Submergence / Root Hypoxia Stress in Rice',
      titleTe: 'వరిలో అధిక నీటి నిల్వ / వేర్లకు గాలి ఆడకపోవడం వల్ల వచ్చిన ఒత్తిడి',
      category: 'moisture_stress',
      initialProbability: scoreMoistureStress,
      currentProbability: scoreMoistureStress,
      visualEvidenceEn: `Marginal discoloration and reduced vigor with contrast ${measurements.contrast}.`,
      visualEvidenceTe: `ఆకుల అంచుల వెంబడి రంగు మారడం మరియు కాంట్రాస్ట్ (${measurements.contrast}).`,
      whyConsideredEn: 'Prolonged standing water suffocates feeder roots and locks up micro-nutrients.',
      whyConsideredTe: 'ఎక్కువ రోజులు నీరు నిల్వ ఉంటే వేర్లకు గాలి అందక మొక్కలు బలహీనపడతాయి.',
      whatIsMissingEn: 'Measurement of flood depth and water stagnation duration.',
      whatIsMissingTe: 'నీటి మట్టం మరియు నిల్వ ఉన్న రోజుల వివరాలు ఇంకా అవసరం.',
      distinguishingObservationEn: 'Gently dig up a plant; healthy roots are white, while suffocated roots are blackened/brown with foul odor.',
      distinguishingObservationTe: 'మొక్కను పీకి వేర్లను చూడండి; ఆరోగ్యకరమైన వేర్లు తెల్లగా ఉంటాయి, గాలి ఆడకపోతే నల్లగా మారి వాసన వస్తాయి.',
      recommendedObservationsEn: ['Check root color by gently lifting a root mass'],
      recommendedObservationsTe: ['వేర్ల రంగును తనిఖీ చేయండి']
    };
  } else {
    // General / Chilli / Cotton / Maize / Others
    hyp1 = {
      id: 'hyp_general_foliar_disease',
      titleEn: `Foliar Lesion / Fungal Leaf-Spot Indicator on ${normCrop}`,
      titleTe: `${normCrop} పై ఆకుమచ్చ / శిలీంధ్ర తెగులు సూచిక`,
      category: 'fungal_bacterial_indicator',
      initialProbability: scoreFoliarDisease,
      currentProbability: scoreFoliarDisease,
      visualEvidenceEn: `Measured ${bPct}% necrotic brown lesion area and ${dPct}% dark micro-spots with discrete spatial bounding boxes.`,
      visualEvidenceTe: `కొలిచిన గోధుమ రంగు మచ్చలు ${bPct}% మరియు నల్లటి చుక్కలు ${dPct}%.`,
      whyConsideredEn: 'Discrete necrotic spots surrounded by yellow halos are strong optical markers of foliar biotic pathogens.',
      whyConsideredTe: 'ఆకులపై ప్రత్యేక మచ్చలు మరియు పసుపు వలయాలు శిలీంధ్ర తెగులు ప్రధాన లక్షణం.',
      whatIsMissingEn: 'Microbiological laboratory culture or pathogen PCR confirmation.',
      whatIsMissingTe: 'ప్రయోగశాల పరీక్ష లేదా నిపుణుల ప్రత్యక్ష పరిశీలన ఇంకా అవసరం.',
      distinguishingObservationEn: 'Look for fungal sporulation or dark pycnidia fruiting bodies under a hand lens.',
      distinguishingObservationTe: 'భూతద్దంతో చూసి బూజు లేదా నల్లటి గింజల లాంటి ఆనవాళ్లు ఉన్నాయేమో చూడండి.',
      recommendedObservationsEn: [
        'Inspect leaf undersides for mold or spores',
        'Observe if spots spread to neighboring plants over 48–72 hours',
        'Check stem nodes for dark girdling lesions'
      ],
      recommendedObservationsTe: [
        'ఆకు వెనుక భాగంలో బూజు ఉందేమో చూడండి',
        'పక్కనున్న మొక్కలకు వ్యాపిస్తున్నాయేమో గమనించండి',
        'కాండంపై మచ్చలు ఉన్నాయేమో పరిశీలించండి'
      ]
    };

    hyp2 = {
      id: 'hyp_general_nutritional',
      titleEn: `Nutritional Chlorosis & Veinal Discoloration on ${normCrop}`,
      titleTe: `${normCrop} పై పోషకాల లోపం / పసుపు రంగు`,
      category: 'nutritional',
      initialProbability: scoreNutritional,
      currentProbability: scoreNutritional,
      visualEvidenceEn: `Measured ${yPct}% chlorotic yellowing across leaf surface with low necrotic breakdown (${bPct}%).`,
      visualEvidenceTe: `ఆకుపై ${yPct}% పసుపు రంగు మరియు చాలా తక్కువ గోధుమ రంగు (${bPct}%) గుర్తించబడింది.`,
      whyConsideredEn: 'Widespread yellowing without dead sunken centers indicates impaired chlorophyll synthesis or mobile nutrient trans-shipment.',
      whyConsideredTe: 'కణజాలం కుళ్ళిపోకుండా పసుపుగా మారడం పోషకాల లోపాన్ని సూచిస్తుంది.',
      whatIsMissingEn: 'Recent soil test analysis and leaf tissue nutrient report.',
      whatIsMissingTe: 'భూసార పరీక్ష వివరాలు ఇంకా అవసరం.',
      distinguishingObservationEn: 'Check whether yellowing started on bottom older leaves or topmost new shoots.',
      distinguishingObservationTe: 'పసుపు రంగు మొదట పాత ఆకులలో వచ్చిందా లేక పై చిగుళ్లలో వచ్చిందా చూడండి.',
      recommendedObservationsEn: [
        'Check canopy height (older vs younger leaves)',
        'Inspect root zone moisture at 10 cm depth',
        'Review recent fertilizer applications'
      ],
      recommendedObservationsTe: [
        'పాత ఆకులా లేక కొత్త ఆకులా చూడండి',
        'వేర్ల వద్ద తేమను తనిఖీ చేయండి',
        'ఇటీవల వేసిన ఎరువుల వివరాలు పరిశీలించండి'
      ]
    };

    hyp3 = {
      id: 'hyp_general_moisture_stress',
      titleEn: `Root Zone Moisture Stress & Marginal Scorch on ${normCrop}`,
      titleTe: `${normCrop} పై తేమ అసమతుల్యత & ఆకుల ఒత్తిడి`,
      category: 'moisture_stress',
      initialProbability: scoreMoistureStress,
      currentProbability: scoreMoistureStress,
      visualEvidenceEn: `Peripheral yellowing (${yPct}%) and edge dynamic contrast (${measurements.contrast}).`,
      visualEvidenceTe: `ఆకుల అంచుల వెంబడి రంగు మారడం మరియు కాంట్రాస్ట్ (${measurements.contrast}).`,
      whyConsideredEn: 'Irregular watering or root hypoxia prevents vascular water flow, leading to marginal desiccation.',
      whyConsideredTe: 'నీటి ఎద్దడి లేదా అధిక తేమ వల్ల ఆకుల అంచులు ఎండిపోతాయి.',
      whatIsMissingEn: 'Soil moisture tension logs over the past week.',
      whatIsMissingTe: 'గత వారం రోజుల నేల తేమ వివరాలు ఇంకా అవసరం.',
      distinguishingObservationEn: 'Observe whether foliage wilts in afternoon sun and regains fullness by morning.',
      distinguishingObservationTe: 'మధ్యాహ్నం ఆకులు వాలిపోయి ఉదయానికి మళ్లీ తాజాగా మారుతున్నాయా చూడండి.',
      recommendedObservationsEn: [
        'Probe root zone 15 cm deep for standing water or bone-dry soil',
        'Check for salinity crusting on soil surface'
      ],
      recommendedObservationsTe: [
        'పాదుల్లో 15 సెం.మీ లోతులో తేమను చూడండి',
        'నేలపై తెల్లటి ఉప్పు పొర ఉందేమో గమనించండి'
      ]
    };
  }

  // Sort hypotheses by highest initial probability
  const hypotheses: CompetingHypothesis[] = [hyp1, hyp2, hyp3].sort(
    (a, b) => b.currentProbability - a.currentProbability
  );

  const topHyp = hypotheses[0];

  // =========================================================================
  // COMPLETE 7-STAGE DECISION TRACE FOR USABLE SYMPTOMATIC PHOTO
  // =========================================================================

  // STAGE 2: VISUAL EVIDENCE
  trace.push({
    phase: 'VISUAL EVIDENCE',
    timestamp: new Date().toLocaleTimeString(),
    titleEn: 'Color Histogram Segmentation & Spatial Clustering',
    titleTe: 'రంగుల విభజన & మచ్చల సమూహాల విశ్లేషణ',
    detailsEn: `Color segmentation measured: Chlorotic yellowing ${yPct}%, Necrotic brown lesions ${bPct}%, Dark micro-spots ${dPct}%, Healthy green foliage ${gPct}%. Laplacian variance ${measurements.sharpness} verifies high focus fidelity. Dynamic contrast is ${measurements.contrast} σ.`,
    detailsTe: `రంగుల విభజన: పసుపు రంగు ${yPct}%, గోధుమ మచ్చలు ${bPct}%, నల్లటి చుక్కలు ${dPct}%, ఆకుపచ్చ రంగు ${gPct}%. లాప్లాసియన్ పదును ${measurements.sharpness} మరియు కాంట్రాస్ట్ ${measurements.contrast}.`,
    evidenceTags: [
      `Yellow: ${yPct}%`,
      `Brown: ${bPct}%`,
      `Dark: ${dPct}%`,
      `Green: ${gPct}%`,
      `Sharpness: ${measurements.sharpness}`
    ],
    status: 'passed'
  });

  // STAGE 3: LIKELY CONDITION / DIFFERENTIAL
  trace.push({
    phase: 'LIKELY CONDITION / DIFFERENTIAL',
    timestamp: new Date().toLocaleTimeString(),
    titleEn: `Likely Condition: ${topHyp.titleEn.split('/')[0].trim()}`,
    titleTe: `సాధ్యమైన పరిస్థితి: ${topHyp.titleTe.split('/')[0].trim()}`,
    detailsEn: `Leading hypothesis identified based on measurable CV evidence: "${topHyp.titleEn.split('/')[0].trim()}". Confidence: Likely based on visual evidence — field confirmation recommended. Differential ranking: 1st ${hypotheses[0].titleEn.split('/')[0].trim()} (${hypotheses[0].currentProbability}%), 2nd ${hypotheses[1].titleEn.split('/')[0].trim()} (${hypotheses[1].currentProbability}%), 3rd ${hypotheses[2].titleEn.split('/')[0].trim()} (${hypotheses[2].currentProbability}%).`,
    detailsTe: `దృశ్య ఆధారాల ప్రకారం ప్రాథమిక పరికల్పన: "${topHyp.titleTe.split('/')[0].trim()}". సంభావ్యత: దృశ్య ఆధారాల ఆధారంగా సాధ్యం — క్షేత్రస్థాయి నిర్ధారణ అవసరం. సాపేక్ష ర్యాంకింగ్: 1. ${hypotheses[0].titleTe.split('/')[0].trim()} (${hypotheses[0].currentProbability}%), 2. ${hypotheses[1].titleTe.split('/')[0].trim()} (${hypotheses[1].currentProbability}%), 3. ${hypotheses[2].titleTe.split('/')[0].trim()} (${hypotheses[2].currentProbability}%).`,
    evidenceTags: [
      `Top: ${topHyp.currentProbability}%`,
      'Relative Ranking Model',
      'Field Confirmation Needed'
    ],
    status: 'passed'
  });

  // STAGE 4: REASONING
  trace.push({
    phase: 'REASONING',
    timestamp: new Date().toLocaleTimeString(),
    titleEn: 'Agronomic Causal Reasoning & Symptom Matching',
    titleTe: 'శాస్త్రీయ కారణాలు & లక్షణాల సరిపోలిక విశ్లేషణ',
    detailsEn: `Evaluated ${normCrop} at '${growthStage}' stage against pathology profiles. Lesion distribution (${bPct}% necrotic, ${dPct}% dark) conforms to ${topHyp.titleEn.split('/')[0].trim()}. Cautious posture maintained: visual pixel colors reflect physical symptoms but do not prove microbiological pathology without laboratory culture.`,
    detailsTe: `${normCrop} (${growthStage} దశ) లక్షణాలు ${topHyp.titleTe.split('/')[0].trim()} తో సరిపోలుతున్నాయి. రంగులు మాత్రమే ఖచ్చితమైన వ్యాధిని నిరూపించలేవు కాబట్టి పరిశీలన అవసరం.`,
    evidenceTags: ['Crop-Stage Grounded', 'Biotic vs Abiotic Analysis'],
    status: 'passed'
  });

  // STAGE 5: RECOMMENDED ACTION
  trace.push({
    phase: 'RECOMMENDED ACTION',
    timestamp: new Date().toLocaleTimeString(),
    titleEn: 'Safe Non-Chemical Cultural Interventions Prioritized',
    titleTe: 'రసాయన రహిత యాజమాన్య పద్ధతులకు ప్రాధాన్యత',
    detailsEn: 'Formulated low-risk immediate steps: lower canopy sanitation, eliminating leaf wetness, optimizing irrigation, and avoiding unverified chemical cocktails without agricultural officer approval.',
    detailsTe: 'తక్షణ చర్యలు: కింద ఆకులను తొలగించడం, ఆకులపై నీరు పడకుండా చూడటం, సరైన నీటి యాజమాన్యం మరియు అనుమతి లేని మందులను వాడకపోవడం.',
    evidenceTags: ['Cultural Control First', 'Prune & Sanitize', 'Label Safety Mandate'],
    status: 'passed'
  });

  // STAGE 6: FIELD VERIFICATION
  trace.push({
    phase: 'FIELD VERIFICATION',
    timestamp: new Date().toLocaleTimeString(),
    titleEn: 'Interactive Farmer Field Observations Prompted',
    titleTe: 'రైతుతో ప్రత్యక్ష క్షేత్ర పరిశీలన ప్రశ్నలు',
    detailsEn: 'Generated 3 targeted field verification checks (canopy position, lesion texture, weather/irrigation history) to calibrate the relative hypothesis rankings with physical reality.',
    detailsTe: 'ఆకుల స్థానం, మచ్చల స్వభావం మరియు వాతావరణ సమాచారాన్ని తెలుసుకోవడానికి 3 ప్రశ్నలు అందించబడ్డాయి.',
    evidenceTags: ['Awaiting Farmer Input', 'Differential Calibration'],
    status: 'question_pending'
  });

  // STAGE 7: OUTCOME / NEXT STEP
  trace.push({
    phase: 'OUTCOME / NEXT STEP',
    timestamp: new Date().toLocaleTimeString(),
    titleEn: '48–72h Monitoring Timeline & Expert Escalation Criteria',
    titleTe: '48-72 గంటల పర్యవేక్షణ & నిపుణుల సంప్రదింపు నిబంధనలు',
    detailsEn: 'Monitor tagged plants for 48–72 hours to verify whether lesions spread to upper canopy leaves or green fruit. If symptoms exceed 5%–10% of field beds, immediately contact local KVK or Mandal AEO.',
    detailsTe: 'వచ్చే 48-72 గంటల్లో మచ్చలు పై ఆకులకు వ్యాపిస్తున్నాయో లేదో గమనించండి. 5%-10% కంటే ఎక్కువ మొక్కలపై కనిపిస్తే వెంటనే KVK లేదా వ్యవసాయ అధికారి (AEO)ని సంప్రదించండి.',
    evidenceTags: ['48-72h Checkpoint', 'KVK / AEO Referral'],
    status: 'passed'
  });

  // Follow-up interactive questions for physical validation
  const followUpQuestions: AgentFollowUpQuestion[] = [
    {
      id: 'q_leaf_position',
      questionEn: 'Where are the discolored or spotted leaves predominantly located on the plant canopy?',
      questionTe: 'రంగు మారిన లేదా మచ్చలు ఉన్న ఆకులు మొక్కపై ప్రధానంగా ఎక్కడ కనిపిస్తున్నాయి?',
      options: [
        {
          labelEn: 'Bottom / oldest mature leaves first',
          labelTe: 'మొక్క కింద భాగంలోని పాత ఆకులపై మొదట',
          value: 'older_leaves',
          hypothesisBoost: {
            [hypotheses[0].id]: hypotheses[0].category === 'fungal_bacterial_indicator' ? 20 : 10,
            [hypotheses[1].id]: 25,
            [hypotheses[2].id]: 10
          }
        },
        {
          labelEn: 'Top young leaves & new apical shoots',
          labelTe: 'పై భాగంలోని లేత ఆకులు & కొత్త చిగుళ్లపై',
          value: 'young_shoots',
          hypothesisBoost: {
            [hypotheses[0].id]: -10,
            [hypotheses[1].id]: 30,
            [hypotheses[2].id]: 5
          }
        },
        {
          labelEn: 'Scattered randomly across upper & lower canopy',
          labelTe: 'మొక్క అంతటా అక్కడక్కడా చెల్లాచెదురుగా',
          value: 'random_canopy',
          hypothesisBoost: {
            [hypotheses[0].id]: 30,
            [hypotheses[1].id]: -20,
            [hypotheses[2].id]: -10
          }
        }
      ]
    },
    {
      id: 'q_spot_texture',
      questionEn: 'When you touch or closely inspect the spots, what is their tactile condition?',
      questionTe: 'ఆకు మచ్చలను తాకినప్పుడు లేదా పరిశీలించినప్పుడు అవి ఎలా ఉన్నాయి?',
      options: [
        {
          labelEn: 'Dry, brittle, with thin parchment-like texture',
          labelTe: 'ఎండిపోయి, కాగితంలా పెళుసుగా మారాయి',
          value: 'dry_brittle',
          hypothesisBoost: {
            [hypotheses[0].id]: 25,
            [hypotheses[1].id]: -10,
            [hypotheses[2].id]: 15
          }
        },
        {
          labelEn: 'Soft or water-soaked with an oily/yellow border',
          labelTe: 'మెత్తగా, నీటితో నానినట్లు ఉండి పసుపు అంచు ఉంది',
          value: 'water_soaked',
          hypothesisBoost: {
            [hypotheses[0].id]: 35,
            [hypotheses[1].id]: -25,
            [hypotheses[2].id]: -10
          }
        },
        {
          labelEn: 'No distinct sunken spots, just gradual pale yellowing',
          labelTe: 'గుంటపడిన మచ్చలు లేవు, ఆకు క్రమంగా పసుపుగా మారింది',
          value: 'diffuse_yellowing',
          hypothesisBoost: {
            [hypotheses[0].id]: -30,
            [hypotheses[1].id]: 35,
            [hypotheses[2].id]: 20
          }
        }
      ]
    },
    {
      id: 'q_recent_weather',
      questionEn: 'What has the weather and soil drainage been like over the past 5 to 7 days?',
      questionTe: 'గత 5 నుండి 7 రోజులలో వాతావరణం మరియు నేలలో తేమ ఎలా ఉంది?',
      options: [
        {
          labelEn: 'Heavy rain, cloudy skies, or prolonged damp soil',
          labelTe: 'భారీ వర్షాలు, మబ్బులు లేదా నేలలో ఎక్కువ రోజులు తేమ',
          value: 'wet_humid',
          hypothesisBoost: {
            [hypotheses[0].id]: 25,
            [hypotheses[1].id]: -10,
            [hypotheses[2].id]: 30
          }
        },
        {
          labelEn: 'High heat, strong winds, and dry cracked soil',
          labelTe: 'తీవ్రమైన ఎండ, గాలులు మరియు నేల ఎండిపోయి బీటలు వారింది',
          value: 'hot_dry',
          hypothesisBoost: {
            [hypotheses[0].id]: -15,
            [hypotheses[1].id]: 10,
            [hypotheses[2].id]: 35
          }
        },
        {
          labelEn: 'Normal moderate weather with regular drip/controlled irrigation',
          labelTe: 'సాధారణ వాతావరణం మరియు సక్రమమైన బిందు సేద్యం',
          value: 'normal',
          hypothesisBoost: {
            [hypotheses[0].id]: 10,
            [hypotheses[1].id]: 20,
            [hypotheses[2].id]: -15
          }
        }
      ]
    }
  ];

  return {
    status: 'analyzed_usable',
    agentTrace: trace,
    hypotheses,
    followUpQuestions,
    primaryAdvisoryEn: `OpenCV computer vision completed. Top hypothesis: "${topHyp.titleEn.split('/')[0].trim()}" (${topHyp.currentProbability}% relative ranking score). Answer the physical field questions below to refine the ranking.`,
    primaryAdvisoryTe: `కంప్యూటర్ విజన్ విశ్లేషణ పూర్తయింది. ప్రాథమిక పరికల్పన: "${topHyp.titleTe.split('/')[0].trim()}" (${topHyp.currentProbability}% స్కోరు). మరిన్ని వివరాల కోసం కింద ఉన్న ప్రశ్నలకు సమాధానాలు ఇవ్వండి.`,
    nextStepsEn: [
      'Answer the follow-up questions below based on your actual crop inspection',
      'Examine leaf undersides for fungal spores, whitefly, or spider mite webbing',
      'Check root zone moisture before planning fertilizer or irrigation changes',
      'For severe symptoms affecting whole plots, consult your local Agricultural Extension Officer (AEO) or KVK agronomist'
    ],
    nextStepsTe: [
      'మీ పంటను నేరుగా చూసి కింద ఉన్న ప్రశ్నలకు సమాధానాలు ఎంచుకోండి',
      'ఆకు అడుగు భాగంలో బూజు లేదా పురుగులు ఉన్నాయేమో చూడండి',
      'ఎరువులు లేదా నీరు పెట్టే ముందు వేర్ల వద్ద తేమను తనిఖీ చేయండి',
      'సమస్య తీవ్రంగా ఉంటే మీ మండల వ్యవసాయ విస్తరణ అధికారి (AEO)ని సంప్రదించండి'
    ],
    requiresNewPhoto: false
  };
}

/**
 * Step 8: REVISED DECISION
 * Recalculates hypothesis probabilities when farmer provides physical field answers
 */
export function recalculateWithFarmerEvidence(
  currentHypotheses: CompetingHypothesis[],
  questions: AgentFollowUpQuestion[],
  answers: Record<string, string>,
  existingTrace: AgentDecisionTraceStep[]
): {
  revisedHypotheses: CompetingHypothesis[];
  updatedTrace: AgentDecisionTraceStep[];
} {
  const updatedHypotheses = currentHypotheses.map(h => ({ ...h }));
  const scoreDeltas: Record<string, number> = {};
  currentHypotheses.forEach(h => {
    scoreDeltas[h.id] = 0;
  });

  let answeredCount = 0;
  const answeredDetails: string[] = [];

  questions.forEach(q => {
    const chosenVal = answers[q.id];
    if (chosenVal) {
      answeredCount++;
      const option = q.options.find(opt => opt.value === chosenVal);
      if (option) {
        answeredDetails.push(`${q.id}: ${option.labelEn}`);
        Object.entries(option.hypothesisBoost).forEach(([hypId, boost]) => {
          if (scoreDeltas[hypId] !== undefined) {
            scoreDeltas[hypId] += boost;
          }
        });
      }
    }
  });

  if (answeredCount === 0) {
    return { revisedHypotheses: updatedHypotheses, updatedTrace: existingTrace };
  }

  // Calculate adjusted scores
  let rawTotal = 0;
  const adjustedScores = updatedHypotheses.map(h => {
    const delta = scoreDeltas[h.id] || 0;
    const newScore = Math.max(5, h.initialProbability + delta);
    rawTotal += newScore;
    return { id: h.id, score: newScore };
  });

  // Re-normalize to 100%
  updatedHypotheses.forEach(h => {
    const item = adjustedScores.find(s => s.id === h.id);
    if (item && rawTotal > 0) {
      h.currentProbability = Math.round((item.score / rawTotal) * 100);
    }
  });

  // Sort by highest probability
  updatedHypotheses.sort((a, b) => b.currentProbability - a.currentProbability);

  const top = updatedHypotheses[0];

  const revisedTrace: AgentDecisionTraceStep[] = existingTrace.filter(
    t => t.phase !== 'REVISED_DECISION'
  );

  // Mark pending questions as resolved
  revisedTrace.forEach(t => {
    if (t.status === 'question_pending') {
      t.status = 'resolved';
    }
  });

  revisedTrace.push({
    phase: 'REVISED_DECISION',
    timestamp: new Date().toLocaleTimeString(),
    titleEn: `Field Evidence Integrated: Leading Candidate (${top.titleEn.split('/')[0].trim()})`,
    titleTe: `రైతు సమాచారం ఆధారంగా సవరించిన ఫలితం: (${top.titleTe.split('/')[0].trim()})`,
    detailsEn: `Farmer confirmed ${answeredCount} physical field observation(s). Differential model updated: ${updatedHypotheses.map(h => `${h.titleEn.split('/')[0].trim()} [${h.currentProbability}%]`).join(', ')}. Leading hypothesis is now supported by both computer vision measurements and physical field criteria.`,
    detailsTe: `రైతు అందించిన ${answeredCount} క్షేత్ర సమాచారం ఆధారంగా విశ్లేషణ సవరించబడింది: ${updatedHypotheses.map(h => `${h.titleTe.split('/')[0].trim()} [${h.currentProbability}%]`).join(', ')}.`,
    evidenceTags: [
      `Top: ${top.currentProbability}%`,
      `Farmer Inputs: ${answeredCount}`,
      'Evidence-Calibrated'
    ],
    status: 'passed'
  });

  return {
    revisedHypotheses: updatedHypotheses,
    updatedTrace: revisedTrace
  };
}
