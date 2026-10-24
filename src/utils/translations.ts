export interface TranslationStrings {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    scan: string;
    compare: string;
    ask: string;
    diary: string;
    reports: string;
    settings: string;
  };
  common: {
    loading: string;
    analyzing: string;
    downloadReport: string;
    saveToDiary: string;
    saved: string;
    cancel: string;
    close: string;
    viewDetails: string;
    delete: string;
    back: string;
    refresh: string;
    language: string;
    safetyDisclaimerTitle: string;
    safetyDisclaimerText: string;
    expertAdviceNote: string;
  };
  dashboard: {
    welcome: string;
    subheading: string;
    quickScanCta: string;
    liveTelemetryTitle: string;
    sensorLiveBadge: string;
    soilMoisture: string;
    soilTemp: string;
    airTemp: string;
    airHumidity: string;
    sunlight: string;
    npkStatus: string;
    recentScansTitle: string;
    noRecentScans: string;
    diagnosticGuideTitle: string;
    guideTip1: string;
    guideTip2: string;
    guideTip3: string;
    activeAlertsTitle: string;
    optimalStateText: string;
  };
  scan: {
    title: string;
    subtitle: string;
    dropzoneHeading: string;
    dropzoneSubheading: string;
    browseButton: string;
    samplePhotosHeading: string;
    samplePhotoTomato: string;
    samplePhotoPaddy: string;
    samplePhotoChilli: string;
    samplePhotoHealthy: string;
    samplePhotoBlurry: string;
    cropTypeLabel: string;
    cropTypePlaceholder: string;
    stageLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    runScanButton: string;
    processingTitle: string;
    stepPixelExtraction: string;
    stepLaplacianEdge: string;
    stepColorSegmentation: string;
    stepAgentEvaluation: string;
    resultsTitle: string;
    annotatedViewTab: string;
    originalViewTab: string;
    splitViewTab: string;
    qualityBadgeTitle: string;
    cvEvidenceTitle: string;
    sharpnessMetric: string;
    brightnessMetric: string;
    contrastMetric: string;
    greenRatioMetric: string;
    yellowRatioMetric: string;
    brownRatioMetric: string;
    hypothesesTitle: string;
    hypothesesSubtitle: string;
    relativeHypothesisRankingTitle: string;
    relativeHypothesisRankingDisclaimer: string;
    likelyConditionTitle: string;
    stillNeededForConfirmationTitle: string;
    whatIsMissingLabel: string;
    distinguishingObservationLabel: string;
    agentTraceTitle: string;
    questionsPromptTitle: string;
    questionsPromptSubtitle: string;
    recalculateButton: string;
    practicalNextStepsTitle: string;
    reScanButton: string;
    managementSectionTitle: string;
    managementSectionSubtitle: string;
    possibleConditionLabel: string;
    whySuspectedLabel: string;
    whatToDoNowLabel: string;
    treatmentManagementLabel: string;
    preventionStepsLabel: string;
    whenToSeekHelpLabel: string;
    safetyNoticeHeader: string;
  };
  compare: {
    title: string;
    subtitle: string;
    selectFirst: string;
    selectSecond: string;
    sliderLabel: string;
    deltaMetricsTitle: string;
    yellowDelta: string;
    brownDelta: string;
    greenDelta: string;
    sharpnessDelta: string;
    progressionAssessment: string;
    noScansWarning: string;
  };
  ask: {
    title: string;
    subtitle: string;
    micTooltip: string;
    listening: string;
    typePlaceholder: string;
    sendButton: string;
    readAloud: string;
    stopReading: string;
    samplePromptsTitle: string;
    privacyNote: string;
  };
  diary: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    emptyDiary: string;
    scannedOn: string;
  };
  reports: {
    title: string;
    subtitle: string;
    emptyReports: string;
    generatedOn: string;
    downloadPdf: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageSetting: string;
    iotApiKeyTitle: string;
    iotApiKeyDesc: string;
    iotKeyPlaceholder: string;
    simulateSensorCta: string;
    audioVoiceTitle: string;
    audioVoiceDesc: string;
    testSpeech: string;
  };
}

export const translations: Record<'en' | 'te', TranslationStrings> = {
  en: {
    appName: 'FarmSage AI',
    tagline: 'Evidence-Driven Smart Farming Assistant',
    nav: {
      dashboard: 'Dashboard',
      scan: 'Scan a Crop',
      compare: 'Compare Images',
      ask: 'Ask FarmSage',
      diary: 'Crop Diary',
      reports: 'Reports',
      settings: 'Settings'
    },
    common: {
      loading: 'Loading...',
      analyzing: 'Analyzing leaf pixel matrices...',
      downloadReport: 'Download PDF Report',
      saveToDiary: 'Save to Crop Diary',
      saved: 'Saved successfully',
      cancel: 'Cancel',
      close: 'Close',
      viewDetails: 'View Details',
      delete: 'Delete',
      back: 'Back',
      refresh: 'Refresh',
      language: 'Language',
      safetyDisclaimerTitle: 'Important Agricultural Safety Disclaimer',
      safetyDisclaimerText: 'FarmSage AI performs visual computer-vision measurements (sharpness, color distribution, lesion areas) for educational and decision-support guidance only. Color shifts and spots are visual symptoms that CANNOT prove or diagnose a specific pathogen or disease. Never apply restricted pesticides without verifying symptoms with your local agricultural university extension officer or qualified agronomist.',
      expertAdviceNote: 'When in doubt, consult your local Krishi Vigyan Kendra (KVK) or government Agricultural Extension Officer (AEO).'
    },
    dashboard: {
      welcome: 'Welcome back, Farmer',
      subheading: 'Monitor real-time field telemetry and run OpenCV-grade crop foliage scans.',
      quickScanCta: 'Scan New Leaf',
      liveTelemetryTitle: 'Live Field Telemetry (IoT Gateway)',
      sensorLiveBadge: 'Live Stream Active',
      soilMoisture: 'Soil Moisture',
      soilTemp: 'Soil Temp',
      airTemp: 'Air Temp',
      airHumidity: 'Air Humidity',
      sunlight: 'Sunlight Lux',
      npkStatus: 'NPK Balance (ppm)',
      recentScansTitle: 'Recent Crop Scans',
      noRecentScans: 'No crop scans recorded yet. Upload a leaf photo to begin.',
      diagnosticGuideTitle: 'Evidence-Based Diagnostic Protocol',
      guideTip1: 'Real Computer Vision: Sharpness is calculated with Laplacian variance to ensure reliable focus.',
      guideTip2: 'Visual Indicators: Yellowing and brown spots are color regions, not definitive disease proof.',
      guideTip3: 'Adaptive Agent: The system asks follow-up questions to adjust differential probabilities.',
      activeAlertsTitle: 'Field Status Alerts',
      optimalStateText: 'Sensors report optimal moisture and temperature for current crop stage.'
    },
    scan: {
      title: 'Scan a Crop Foliage',
      subtitle: 'Upload a clear photograph to run real pixel-level Laplacian sharpness and color segmentation.',
      dropzoneHeading: 'Drag and drop your crop photograph here',
      dropzoneSubheading: 'Supports JPEG, PNG, and WebP (Max 15MB). Clear daylight photos work best.',
      browseButton: 'Browse Photo',
      samplePhotosHeading: 'Or test instantly with verified field samples:',
      samplePhotoTomato: 'Tomato Leaf (Yellow Margins & Spots)',
      samplePhotoPaddy: 'Paddy / Rice Leaf (Blight-like Lesions)',
      samplePhotoChilli: 'Chilli Leaf (Chlorotic Yellowing)',
      samplePhotoHealthy: 'Healthy Leaf (Optimal Chlorophyll)',
      samplePhotoBlurry: 'Blurry / Out of Focus Leaf (Uncertainty Test)',
      cropTypeLabel: 'Crop Type',
      cropTypePlaceholder: 'e.g. Tomato, Paddy / Rice, Cotton, Chilli, Maize',
      stageLabel: 'Growth Stage',
      notesLabel: 'Field Observations & Symptoms (Optional)',
      notesPlaceholder: 'e.g. Yellowing started 3 days ago on lower leaves after heavy rain...',
      runScanButton: 'Analyze Foliage with OpenCV Engine',
      processingTitle: 'Executing Real Computer Vision Pipeline...',
      stepPixelExtraction: 'Extracting RGB pixel data and computing perceptual luminance...',
      stepLaplacianEdge: 'Calculating 3x3 Laplacian edge convolution matrix for sharpness variance...',
      stepColorSegmentation: 'Segmenting Excess Green, Chlorosis Yellow, and Necrotic Brown regions...',
      stepAgentEvaluation: 'Adaptive agent evaluating quality gates & differential hypotheses...',
      resultsTitle: 'Evidence & Differential Hypotheses',
      annotatedViewTab: 'Computer Vision HUD',
      originalViewTab: 'Original Photo',
      splitViewTab: 'Side-by-Side Split',
      qualityBadgeTitle: 'Image Quality Assessment',
      cvEvidenceTitle: 'Measured Computer-Vision Evidence',
      sharpnessMetric: 'Sharpness (Laplacian σ²)',
      brightnessMetric: 'Perceived Brightness',
      contrastMetric: 'Dynamic Contrast',
      greenRatioMetric: 'Green Foliage Area',
      yellowRatioMetric: 'Chlorotic Yellow Area',
      brownRatioMetric: 'Necrotic Brown Area',
      hypothesesTitle: 'Competing Differential Hypotheses',
      hypothesesSubtitle: 'Ranked by visual evidence weight and adjusted by physical field verification.',
      relativeHypothesisRankingTitle: 'RELATIVE HYPOTHESIS RANKING',
      relativeHypothesisRankingDisclaimer: 'These scores represent heuristic evidence-based rankings and are not confirmed disease probabilities.',
      likelyConditionTitle: 'LIKELY CONDITION / DISEASE',
      stillNeededForConfirmationTitle: 'Still Needed for Confirmation',
      whatIsMissingLabel: 'What is still missing:',
      distinguishingObservationLabel: 'Distinguishing field observation:',
      agentTraceTitle: 'Adaptive Agent Decision Trace (7-Stage Workflow)',
      questionsPromptTitle: 'Refine Diagnosis with Field Observations',
      questionsPromptSubtitle: 'Answer the physical inspection checks below to recalculate probabilities.',
      recalculateButton: 'Update Probabilities with Field Evidence',
      practicalNextStepsTitle: 'Recommended Practical Next Steps',
      reScanButton: 'Scan Another Image',
      managementSectionTitle: 'Recommended Management & Treatment',
      managementSectionSubtitle: 'Evidence-grounded action steps, treatment options, prevention, and expert consultation guidelines.',
      possibleConditionLabel: 'Possible Disease / Condition',
      whySuspectedLabel: 'Why It Is Suspected (CV Evidence)',
      whatToDoNowLabel: 'What To Do Now (Immediate Steps)',
      treatmentManagementLabel: 'Recommended Treatment / Management Options',
      preventionStepsLabel: 'Prevention Steps',
      whenToSeekHelpLabel: 'When To Contact Agricultural Expert / KVK',
      safetyNoticeHeader: 'Safety & Responsible Usage Disclaimer'
    },
    compare: {
      title: 'Compare Crop Scans',
      subtitle: 'Analyze visual changes over time between two field scans or symptomatic vs healthy leaves.',
      selectFirst: 'Select Baseline Scan (Day 1 / Previous)',
      selectSecond: 'Select Comparison Scan (Day 7 / Current)',
      sliderLabel: 'Interactive Comparison View',
      deltaMetricsTitle: 'Computer Vision Evidence Delta',
      yellowDelta: 'Change in Yellowing (% Chlorosis)',
      brownDelta: 'Change in Necrosis (% Brown Lesions)',
      greenDelta: 'Green Canopy Recovery Rate',
      sharpnessDelta: 'Sharpness Difference',
      progressionAssessment: 'Visual Progression Analysis',
      noScansWarning: 'You need at least 2 scans in your diary to compare images.'
    },
    ask: {
      title: 'Ask FarmSage Agronomist',
      subtitle: 'Ask questions using voice or text in English or Telugu. Evidence-grounded advice with zero hallucinations.',
      micTooltip: 'Click to speak using your microphone',
      listening: 'Listening to your voice... Speak clearly.',
      typePlaceholder: 'Ask anything about crop symptoms, soil moisture, or fertilizer timing...',
      sendButton: 'Ask Question',
      readAloud: 'Read Aloud (Voice)',
      stopReading: 'Stop Audio',
      samplePromptsTitle: 'Common Farmer Queries:',
      privacyNote: 'Audio is processed locally in your browser and never stored on any server.'
    },
    diary: {
      title: 'Crop Field Diary',
      subtitle: 'Historical record of leaf scans, computer-vision measurements, and field log notes.',
      searchPlaceholder: 'Search by crop type or location...',
      filterAll: 'All Crops',
      emptyDiary: 'No crop records found. Scanned crops will appear here automatically.',
      scannedOn: 'Scanned on'
    },
    reports: {
      title: 'Diagnostic Reports',
      subtitle: 'Downloadable PDF reports containing full visual evidence, agent traces, and advisory checklists.',
      emptyReports: 'No reports saved yet. Analyze a crop to generate an official PDF report.',
      generatedOn: 'Generated on',
      downloadPdf: 'Download PDF'
    },
    settings: {
      title: 'Application & Hardware Settings',
      subtitle: 'Configure language, IoT sensor connection key, and voice synthesizer preferences.',
      languageSetting: 'Interface Language (భాష)',
      iotApiKeyTitle: 'IoT Hardware Gateway API Key',
      iotApiKeyDesc: 'Use this token in your ESP32 or LoRa gateway "x-api-key" header when posting telemetry to /api/sensor-data.',
      iotKeyPlaceholder: 'YOUR_FARMSAGE_API_KEY',
      simulateSensorCta: 'Simulate Live Sensor Packet',
      audioVoiceTitle: 'Text-to-Speech & Voice Settings',
      audioVoiceDesc: 'Speech synthesis uses your browser native voice engines with support for English and Telugu.',
      testSpeech: 'Test Audio Output'
    }
  },
  te: {
    appName: 'ఫామ్‌సేజ్ AI (FarmSage AI)',
    tagline: 'ఖచ్చితమైన ఆధారాలతో కూడిన స్మార్ట్ వ్యవసాయ సహాయకుడు',
    nav: {
      dashboard: 'డ్యాష్‌బోర్డ్',
      scan: 'పంటను స్కాన్ చేయండి',
      compare: 'చిత్రాలను పోల్చండి',
      ask: 'ఫామ్‌సేజ్‌ని అడగండి',
      diary: 'పంట డైరీ',
      reports: 'నివేదికలు',
      settings: 'సెట్టింగ్‌లు'
    },
    common: {
      loading: 'లోడ్ అవుతోంది...',
      analyzing: 'ఆకు పిక్సెల్ గణనలను విశ్లేషిస్తోంది...',
      downloadReport: 'PDF నివేదికను డౌన్‌లోడ్ చేయండి',
      saveToDiary: 'డైరీలో భద్రపరచండి',
      saved: 'విజయవంతంగా భద్రపరచబడింది',
      cancel: 'రద్దు చేయండి',
      close: 'మూసివేయండి',
      viewDetails: 'వివరాలు చూడండి',
      delete: 'తొలగించండి',
      back: 'వెనుకకు',
      refresh: 'తాజాకరించండి',
      language: 'భాష',
      safetyDisclaimerTitle: 'ముఖ్యమైన వ్యవసాయ భద్రతా సమాచారం',
      safetyDisclaimerText: 'ఫామ్‌సేజ్ AI కేవలం దృశ్య ఆధారాలను (పదును, రంగుల విభజన, మచ్చల శాతం) కొలుస్తుంది. ఆకు రంగు మారినంత మాత్రాన ఖచ్చితమైన తెగులు ఉన్నట్లు నిర్ధారించలేము. స్థానిక వ్యవసాయ విస్తరణ అధికారి (AEO) లేదా శాస్త్రవేత్తల సలహా లేకుండా రసాయన మందులు పిచికారీ చేయవద్దు.',
      expertAdviceNote: 'సందేహం ఉన్నప్పుడు మీ సమీప కృషి విజ్ఞాన కేంద్రం (KVK) లేదా మండల వ్యవసాయ అధికారిని సంప్రదించండి.'
    },
    dashboard: {
      welcome: 'స్వాగతం, రైతు మిత్రమా',
      subheading: 'పొలంలోని సెన్సార్ సమాచారాన్ని మరియు పంట ఆకుల దృశ్య విశ్లేషణను ఒకేచోట గమనించండి.',
      quickScanCta: 'కొత్త ఆకును స్కాన్ చేయండి',
      liveTelemetryTitle: 'క్షేత్ర సెన్సార్ సమాచారం (IoT గేట్‌వే)',
      sensorLiveBadge: 'సెన్సార్ యాక్టివ్‌గా ఉంది',
      soilMoisture: 'నేలలో తేమ',
      soilTemp: 'నేల ఉష్ణోగ్రత',
      airTemp: 'గాలి ఉష్ణోగ్రత',
      airHumidity: 'గాలిలో తేమ',
      sunlight: 'సూర్యరశ్మి (Lux)',
      npkStatus: 'పోషకాలు N-P-K (ppm)',
      recentScansTitle: 'ఇటీవలి పంట స్కాన్లు',
      noRecentScans: 'ఇంతవరకు ఏ పంట స్కాన్ చేయబడలేదు. ఫోటో అప్‌లోడ్ చేసి ప్రారంభించండి.',
      diagnosticGuideTitle: 'ఆధారాలతో కూడిన విశ్లేషణ పద్ధతి',
      guideTip1: 'కంప్యూటర్ విజన్: ఫోటో స్పష్టతను కొలవడానికి లాప్లాసియన్ పదును పద్ధతిని ఉపయోగిస్తుంది.',
      guideTip2: 'దృశ్య సంకేతాలు: పసుపు మరియు గోధుమ రంగులు కేవలం సంకేతాలు మాత్రమే, వ్యాధి నిర్ధారణ కాదు.',
      guideTip3: 'స్మార్ట్ ఏజెంట్: ఖచ్చితమైన విశ్లేషణ కోసం తదుపరి క్షేత్ర ప్రశ్నలను అడుగుతుంది.',
      activeAlertsTitle: 'పొలం స్థితి హెచ్చరికలు',
      optimalStateText: 'ప్రస్తుత పంట దశకు నేలలో తేమ మరియు ఉష్ణోగ్రత అనుకూలంగా ఉన్నాయి.'
    },
    scan: {
      title: 'పంట ఆకును స్కాన్ చేయండి',
      subtitle: 'నిజమైన కంప్యూటర్ విజన్ పద్ధతిలో ఆకు పదును మరియు రంగులను విశ్లేషించండి.',
      dropzoneHeading: 'మీ పంట ఆకు ఫోటోను ఇక్కడ వేయండి లేదా ఎంచుకోండి',
      dropzoneSubheading: 'JPEG, PNG, WebP ఫైళ్లు (గరిష్టంగా 15MB). సహజ పగటి వెలుతురులో తీసిన ఫోటోలు మంచి ఫలితాలనిస్తాయి.',
      browseButton: 'ఫోటో ఎంచుకోండి',
      samplePhotosHeading: 'లేదా ఈ క్రింది నమూనా ఫోటోలతో వెంటనే పరీక్షించండి:',
      samplePhotoTomato: 'టమోటా ఆకు (పసుపు రంగు & మచ్చలు)',
      samplePhotoPaddy: 'వరి ఆకు (ఎండిన గోధుమ మచ్చలు)',
      samplePhotoChilli: 'మిరప ఆకు (పసుపు ఈనెలు)',
      samplePhotoHealthy: 'ఆరోగ్యకరమైన ఆకు (సమతుల్య క్లోరోఫిల్)',
      samplePhotoBlurry: 'మసక ఆకు (అస్పష్టమైన ఫోటో - అనిశ్చితి పరీక్ష)',
      cropTypeLabel: 'పంట రకం',
      cropTypePlaceholder: 'ఉదా: టమోటా, వరి, పత్తి, మిరప, మొక్కజొన్న',
      stageLabel: 'పంట దశ',
      notesLabel: 'రైతు గమనికలు / లక్షణాలు (ఐచ్ఛికం)',
      notesPlaceholder: 'ఉదా: వర్షం పడిన తర్వాత క్రింది ఆకులు పసుపుగా మారాయి...',
      runScanButton: 'కంప్యూటర్ విజన్ ఇంజిన్‌తో విశ్లేషించండి',
      processingTitle: 'కంప్యూటర్ విజన్ ప్రక్రియ నడుస్తోంది...',
      stepPixelExtraction: 'పిక్సెల్ డేటాను విశ్లేషించి కాంతిని కొలుస్తోంది...',
      stepLaplacianEdge: 'లాప్లాసియన్ పద్ధతిలో ఫోటో పదును (షార్ప్‌నెస్) లెక్కిస్తోంది...',
      stepColorSegmentation: 'ఆకుపచ్చ, పసుపు మరియు గోధుమ రంగు భాగాలను వేరు చేస్తోంది...',
      stepAgentEvaluation: 'ఏజెంట్ నాణ్యతను తనిఖీ చేసి సాధ్యమైన వివరణలను సిద్ధం చేస్తోంది...',
      resultsTitle: 'దృశ్య ఆధారాలు & సాధ్యమైన వివరణలు',
      annotatedViewTab: 'కంప్యూటర్ విజన్ HUD',
      originalViewTab: 'అసలు ఫోటో',
      splitViewTab: 'పోలిక దృశ్యం',
      qualityBadgeTitle: 'చిత్ర నాణ్యత పరిశీలన',
      cvEvidenceTitle: 'కొలిచిన కంప్యూటర్ విజన్ ఆధారాలు',
      sharpnessMetric: 'పదును (లాప్లాసియన్ σ²)',
      brightnessMetric: 'కాంతి తీవ్రత',
      contrastMetric: 'కాంట్రాస్ట్ తీవ్రత',
      greenRatioMetric: 'ఆకుపచ్చ భాగం (ఆరోగ్యవంతమైనది)',
      yellowRatioMetric: 'పసుపు భాగం (క్లోరోసిస్)',
      brownRatioMetric: 'గోధుమ భాగం (కుళ్ళిన కణజాలం)',
      hypothesesTitle: 'పోటీ పడే సాధ్యమైన వివరణలు',
      hypothesesSubtitle: 'దృశ్య రంగుల శాతం మరియు క్షేత్ర పరిశీలనల ఆధారంగా లెక్కింపబడింది.',
      relativeHypothesisRankingTitle: 'సాపేక్ష పరికల్పనల ర్యాంకింగ్ (హైపోథిసిస్ ర్యాంకింగ్)',
      relativeHypothesisRankingDisclaimer: 'ఈ స్కోర్లు గమనించిన దృశ్య ఆధారాలు మరియు క్షేత్ర సమాచారంపై ఆధారపడిన అంచనాలు మాత్రమే. ఇవి నిర్ధారిత వ్యాధి సంభావ్యతలు కావు.',
      likelyConditionTitle: 'సాధ్యమైన పరిస్థితి / తెగులు సూచన',
      stillNeededForConfirmationTitle: 'క్షేత్రస్థాయి నిర్ధారణకు ఇంకా కావలసినవి',
      whatIsMissingLabel: 'ఇంకా అవసరమైన వివరాలు:',
      distinguishingObservationLabel: 'ముఖ్యమైన వేరుచేసే పరిశీలన:',
      agentTraceTitle: 'స్మార్ట్ ఏజెంట్ నిర్ణయ క్రమం (7-దశల విశ్లేషణ)',
      questionsPromptTitle: 'క్షేత్ర సమాచారంతో ఖచ్చితత్వాన్ని మెరుగుపరచండి',
      questionsPromptSubtitle: 'మీరు పొలంలో చూసిన లక్షణాల ఆధారంగా క్రింది ప్రశ్నలకు సమాధానమివ్వండి.',
      recalculateButton: 'కొత్త ఆధారాలతో ఫలితాలను సవరించండి',
      practicalNextStepsTitle: 'రైతు చేయవలసిన ఆచరణాత్మక తదుపరి చర్యలు',
      reScanButton: 'మరో ఫోటో స్కాన్ చేయండి',
      managementSectionTitle: 'సిఫార్సు చేయబడిన యాజమాన్యం & నివారణ పద్ధతులు',
      managementSectionSubtitle: 'దృశ్య ఆధారాలు, తక్షణ చర్యలు, యాజమాన్య పద్ధతులు, ముందస్తు జాగ్రత్తలు మరియు నిపుణుల సలహాలు.',
      possibleConditionLabel: 'సాధ్యమైన సమస్య / తెగులు సూచన',
      whySuspectedLabel: 'ఎందుకు అనుమానించబడుతోంది (దృశ్య ఆధారాలు)',
      whatToDoNowLabel: 'రైతు వెంటనే చేయవలసిన తక్షణ పనులు',
      treatmentManagementLabel: 'సిఫార్సు చేయబడిన యాజమాన్యం & నివారణ పద్ధతులు',
      preventionStepsLabel: 'ముందస్తు నివారణ చర్యలు',
      whenToSeekHelpLabel: 'వ్యవసాయ నిపుణుడిని / KVK ని ఎప్పుడు సంప్రదించాలి',
      safetyNoticeHeader: 'ముఖ్యమైన భద్రత & రసాయన మందుల హెచ్చరిక'
    },
    compare: {
      title: 'పంట చిత్రాలను పోల్చండి',
      subtitle: 'కాలక్రమేణా వచ్చిన మార్పులను లేదా జబ్బు పడిన మరియు మంచి ఆకులను సరిపోల్చండి.',
      selectFirst: 'మొదటి చిత్రం ఎంచుకోండి (గతంలో తీసినది)',
      selectSecond: 'రెండవ చిత్రం ఎంచుకోండి (ప్రస్తుత చిత్రం)',
      sliderLabel: 'చిత్రాల పోలిక దృశ్యం',
      deltaMetricsTitle: 'దృశ్య ఆధారాలలో వచ్చిన మార్పులు (Delta)',
      yellowDelta: 'పసుపు రంగులో మార్పు (% క్లోరోసిస్)',
      brownDelta: 'గోధుమ మచ్చలలో మార్పు (% నెక్రోసిస్)',
      greenDelta: 'ఆకుపచ్చ రంగు కోలుకున్న రేటు',
      sharpnessDelta: 'పదునులో తేడా',
      progressionAssessment: 'మార్పుల విశ్లేషణ',
      noScansWarning: 'చిత్రాలను పోల్చడానికి మీ డైరీలో కనీసం 2 స్కాన్లు ఉండాలి.'
    },
    ask: {
      title: 'ఫామ్‌సేజ్ అగ్రోనమిస్ట్‌ని అడగండి',
      subtitle: 'తెలుగు లేదా ఇంగ్లీష్‌లో వాయిస్ లేదా టెక్స్ట్ ద్వారా సందేహాలను అడగండి. నిరాధారమైన విషయాలు లేకుండా నమ్మకమైన సమాచారం.',
      micTooltip: 'మాట్లాడటానికి మైక్రోఫోన్ క్లిక్ చేయండి',
      listening: 'మీ మాటలను వింటోంది... స్పష్టంగా మాట్లాడండి.',
      typePlaceholder: 'పంట సమస్యలు, ఎరువులు లేదా తేమ గురించి అడగండి...',
      sendButton: 'ప్రశ్నించండి',
      readAloud: 'వాయిస్‌లో చదివి వినిపించండి',
      stopReading: 'వాయిస్ ఆపండి',
      samplePromptsTitle: 'రైతులు తరచుగా అడిగే ప్రశ్నలు:',
      privacyNote: 'మీ వాయిస్ మీ బ్రౌజర్‌లోనే విశ్లేషించబడుతుంది, ఎక్కడా భద్రపరచబడదు.'
    },
    diary: {
      title: 'పంట క్షేత్ర డైరీ',
      subtitle: 'గతంలో చేసిన ఆకుల స్కాన్లు, కొలతలు మరియు గమనికల రికార్డు.',
      searchPlaceholder: 'పంట రకం లేదా ప్రాంతం ద్వారా వెతకండి...',
      filterAll: 'అన్ని పంటలు',
      emptyDiary: 'డైరీలో ఇంకా ఏ రికార్డులు లేవు. స్కాన్ చేసిన పంటలు ఇక్కడ కనిపిస్తాయి.',
      scannedOn: 'స్కాన్ చేసిన తేదీ'
    },
    reports: {
      title: 'నిర్ధారణ నివేదికలు',
      subtitle: 'పూర్తి దృశ్య ఆధారాలు, ఏజెంట్ వివరాలు మరియు ఆచరణాత్మక సలహాలతో కూడిన PDF నివేదికలు.',
      emptyReports: 'ఇంకా నివేదికలు లేవు. పంటను స్కాన్ చేసి అధికారిక నివేదికను పొందండి.',
      generatedOn: 'నివేదిక తేదీ',
      downloadPdf: 'PDF డౌన్‌లోడ్'
    },
    settings: {
      title: 'అప్లికేషన్ & హార్డ్‌వేర్ సెట్టింగ్‌లు',
      subtitle: 'భాష, సెన్సార్ API కీ మరియు వాయిస్ సెట్టింగ్‌లను మార్చుకోండి.',
      languageSetting: 'భాష మార్పు (Interface Language)',
      iotApiKeyTitle: 'IoT హార్డ్‌వేర్ గేట్‌వే API కీ',
      iotApiKeyDesc: 'మీ పొలంలోని ESP32 లేదా సెన్సార్ల నుండి డేటాను /api/sensor-data కి పంపడానికి "x-api-key" గా ఈ టోకెన్ వాడండి.',
      iotKeyPlaceholder: 'YOUR_FARMSAGE_API_KEY',
      simulateSensorCta: 'సెన్సార్ ప్యాకెట్‌ను సిమ్యులేట్ చేయండి',
      audioVoiceTitle: 'టెక్స్ట్-టు-స్పీచ్ & వాయిస్ సెట్టింగ్‌లు',
      audioVoiceDesc: 'తెలుగు మరియు ఇంగ్లీష్ భాషల కోసం మీ బ్రౌజర్ సహజ వాయిస్ ఇంజిన్‌ను ఉపయోగిస్తుంది.',
      testSpeech: 'వాయిస్ పరీక్షించండి'
    }
  }
};
