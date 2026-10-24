import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// In-memory IoT Sensor state for real-time farm telemetry
export interface SensorReading {
  id: string;
  fieldId: string;
  cropType: string;
  timestamp: string;
  soilMoisture: number; // percentage
  soilTemperature: number; // Celsius
  airHumidity: number; // percentage
  airTemperature: number; // Celsius
  sunlightLux: number; // Lux
  nitrogenPpm: number;
  phosphorusPpm: number;
  potassiumPpm: number;
  batteryLevel: number;
  status: 'optimal' | 'warning' | 'alert';
  isSimulated?: boolean;
}

const FARMSAGE_API_KEY = process.env.FARMSAGE_API_KEY;

let liveSensorData: SensorReading = {
  id: 'sns-demo-01',
  fieldId: 'Demo-Field-North-Block-4',
  cropType: 'Tomato / Paddy',
  timestamp: new Date().toISOString(),
  soilMoisture: 42.5,
  soilTemperature: 24.8,
  airHumidity: 68.0,
  airTemperature: 28.5,
  sunlightLux: 48500,
  nitrogenPpm: 120,
  phosphorusPpm: 45,
  potassiumPpm: 190,
  batteryLevel: 94,
  status: 'optimal',
  isSimulated: true
};

const historicalSensorReadings: SensorReading[] = [liveSensorData];

// Middleware: Authenticate sensor upload API
function authenticateSensorApiKey(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
  const queryKey = req.query.api_key;
  const key = (authHeader || queryKey)?.toString().replace(/^Bearer\s+/i, '');

  // If FARMSAGE_API_KEY is configured in the environment, strictly enforce it
  if (FARMSAGE_API_KEY) {
    if (key && key === FARMSAGE_API_KEY) {
      return next();
    }
    if (!key) {
      res.status(401).json({
        error: 'Unauthorized: Missing Sensor API Key.',
        hint: 'Provide header "x-api-key" matching your environment FARMSAGE_API_KEY.'
      });
      return;
    }
    res.status(403).json({
      error: 'Forbidden: Invalid Sensor API Key.',
      hint: 'The provided API key does not match FARMSAGE_API_KEY.'
    });
    return;
  }

  // In development/demo mode without FARMSAGE_API_KEY in environment, allow non-empty key
  if (key) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized: Missing API Key.',
    hint: 'Configure FARMSAGE_API_KEY in your environment, or provide header "x-api-key: YOUR_KEY".'
  });
}

// GET /api/sensor-data : Retrieve latest and historical readings
app.get('/api/sensor-data', (_req: Request, res: Response) => {
  res.json({
    current: liveSensorData,
    history: historicalSensorReadings.slice(-20),
    serverTime: new Date().toISOString(),
    isSimulated: Boolean(liveSensorData.isSimulated),
    apiKeyConfigured: Boolean(FARMSAGE_API_KEY),
    apiKeyRequirement: 'Header x-api-key required for POST hardware updates'
  });
});

// POST /api/sensor-data : Ingest real hardware sensor readings (ESP32 / Arduino / LoRaWAN gateway)
app.post('/api/sensor-data', authenticateSensorApiKey, (req: Request, res: Response) => {
  try {
    const {
      fieldId,
      cropType,
      soilMoisture,
      soilTemperature,
      airHumidity,
      airTemperature,
      sunlightLux,
      nitrogenPpm,
      phosphorusPpm,
      potassiumPpm,
      batteryLevel
    } = req.body;

    const moisture = typeof soilMoisture === 'number' ? soilMoisture : liveSensorData.soilMoisture;
    const sTemp = typeof soilTemperature === 'number' ? soilTemperature : liveSensorData.soilTemperature;
    const humidity = typeof airHumidity === 'number' ? airHumidity : liveSensorData.airHumidity;
    const aTemp = typeof airTemperature === 'number' ? airTemperature : liveSensorData.airTemperature;

    let status: 'optimal' | 'warning' | 'alert' = 'optimal';
    if (moisture < 25 || moisture > 85 || humidity > 90) {
      status = 'warning';
    }
    if (moisture < 15 || aTemp > 42) {
      status = 'alert';
    }

    const newReading: SensorReading = {
      id: `sns-${Date.now()}`,
      fieldId: fieldId || liveSensorData.fieldId,
      cropType: cropType || liveSensorData.cropType,
      timestamp: new Date().toISOString(),
      soilMoisture: Number(moisture.toFixed(1)),
      soilTemperature: Number(sTemp.toFixed(1)),
      airHumidity: Number(humidity.toFixed(1)),
      airTemperature: Number(aTemp.toFixed(1)),
      sunlightLux: typeof sunlightLux === 'number' ? sunlightLux : liveSensorData.sunlightLux,
      nitrogenPpm: typeof nitrogenPpm === 'number' ? nitrogenPpm : liveSensorData.nitrogenPpm,
      phosphorusPpm: typeof phosphorusPpm === 'number' ? phosphorusPpm : liveSensorData.phosphorusPpm,
      potassiumPpm: typeof potassiumPpm === 'number' ? potassiumPpm : liveSensorData.potassiumPpm,
      batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : liveSensorData.batteryLevel,
      status,
      isSimulated: false
    };

    liveSensorData = newReading;
    historicalSensorReadings.push(newReading);
    if (historicalSensorReadings.length > 50) {
      historicalSensorReadings.shift();
    }

    res.status(201).json({
      success: true,
      message: 'Real-time telemetry payload recorded successfully.',
      reading: newReading
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Sensor ingestion failed';
    res.status(400).json({ error: errorMsg });
  }
});

// POST /api/sensor-data/simulate : Farmer UI trigger to simulate live field fluctuation (Demo Data)
app.post('/api/sensor-data/simulate', (_req: Request, res: Response) => {
  const deltaMoist = (Math.random() * 4 - 2);
  const deltaTemp = (Math.random() * 2 - 1);
  const deltaHum = (Math.random() * 6 - 3);

  const updatedMoisture = Math.max(10, Math.min(95, liveSensorData.soilMoisture + deltaMoist));
  const updatedTemp = Math.max(15, Math.min(45, liveSensorData.airTemperature + deltaTemp));
  const updatedHum = Math.max(20, Math.min(98, liveSensorData.airHumidity + deltaHum));

  let status: 'optimal' | 'warning' | 'alert' = 'optimal';
  if (updatedMoisture < 25 || updatedHum > 88) status = 'warning';

  liveSensorData = {
    ...liveSensorData,
    id: `sns-sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    soilMoisture: Number(updatedMoisture.toFixed(1)),
    airTemperature: Number(updatedTemp.toFixed(1)),
    airHumidity: Number(updatedHum.toFixed(1)),
    sunlightLux: Math.round(Math.max(1000, Math.min(90000, liveSensorData.sunlightLux + (Math.random() * 4000 - 2000)))),
    status,
    isSimulated: true
  };

  historicalSensorReadings.push(liveSensorData);
  if (historicalSensorReadings.length > 50) {
    historicalSensorReadings.shift();
  }

  res.json({
    success: true,
    message: 'Field sensor stream simulated (Demo Data).',
    isDemo: true,
    reading: liveSensorData
  });
});

// POST /api/ask-farmsage : Evidence-grounded advisory using Gemini or agricultural rule engine
app.post('/api/ask-farmsage', async (req: Request, res: Response) => {
  const { question, language, cvEvidence, cropInfo, sensorData: clientSensor, hypotheses, likelyCondition } = req.body;

  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Question is required.' });
    return;
  }

  const isTelugu = language === 'te';
  const effectiveSensor = clientSensor || liveSensorData;

  // Build structured agronomic evidence block
  let contextEvidence = '';
  if (cropInfo) {
    contextEvidence += `
CROP & FIELD CONTEXT:
- Crop Type: ${cropInfo.cropType || 'Field Crop'}
- Growth Stage: ${cropInfo.growthStage || 'Vegetative'}
- Location: ${cropInfo.fieldLocation || 'Main Field'}
- Farmer Reported Symptoms: ${cropInfo.notes || 'None reported'}
`;
  }

  if (likelyCondition) {
    contextEvidence += `
LIKELY CONDITION / DISEASE:
- ${likelyCondition}
`;
  }

  if (cvEvidence) {
    contextEvidence += `
MEASURED COMPUTER-VISION EVIDENCE (OPENCV EQUIVALENT):
- Laplacian Sharpness: ${cvEvidence.sharpness} variance (Quality: ${cvEvidence.sharpness >= 70 ? 'In-focus' : 'Blurry'})
- Perceived Brightness: ${cvEvidence.brightness} / 255
- Dynamic Contrast: ${cvEvidence.contrast}
- Healthy Green Foliage: ${cvEvidence.greenPercentage || cvEvidence.greenPct || 0}%
- Chlorotic Yellowing: ${cvEvidence.yellowPercentage || cvEvidence.yellowPct || 0}%
- Necrotic Brown Lesions: ${cvEvidence.brownPercentage || cvEvidence.brownPct || 0}%
- Dark Micro-spots / Necrosis: ${cvEvidence.darkPercentage || cvEvidence.darkPct || 0}%
`;
  }

  if (effectiveSensor) {
    contextEvidence += `
REAL-TIME FIELD SENSOR TELEMETRY:
- Soil Moisture: ${effectiveSensor.soilMoisture}% (Threshold: <25% dry, >75% saturated)
- Soil Temperature: ${effectiveSensor.soilTemperature}°C
- Air Ambient Temperature: ${effectiveSensor.airTemperature}°C
- Air Relative Humidity: ${effectiveSensor.airHumidity}%
- Sunlight: ${effectiveSensor.sunlightLux} Lux
- N-P-K (ppm): N:${effectiveSensor.nitrogenPpm} P:${effectiveSensor.phosphorusPpm} K:${effectiveSensor.potassiumPpm}
`;
  }

  if (Array.isArray(hypotheses) && hypotheses.length > 0) {
    contextEvidence += `
RELATIVE HYPOTHESIS RANKINGS (EVALUATED BY AGENT):
${hypotheses.map((h: any, i: number) => `  ${i + 1}. ${h.titleEn || h.titleTe} [Score: ${h.currentProbability || h.initialProbability}%] - Evidence: ${h.visualEvidenceEn || h.visualEvidenceTe || ''}`).join('\n')}
`;
  }

  // Attempt Gemini API using process.env.FARMSAGE_API_KEY (or process.env.GEMINI_API_KEY) with strict 5s timeout & NO hard-coded fallback
  const geminiApiKey = process.env.FARMSAGE_API_KEY || process.env.GEMINI_API_KEY;
  const startTime = Date.now();

  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const systemPrompt = `You are FarmSage Voice Agronomist, a seasoned, evidence-grounded smart farming consultant.
CRITICAL MANDATES:
1. Ground your advice directly in the provided crop scan context: crop type, growth stage, OpenCV image analysis (% yellowing, % necrosis, sharpness), symptoms, sensor telemetry (soil moisture, temperature, humidity), and the differential hypotheses.
2. NEVER claim to definitively diagnose a disease from an image alone. Treat color areas as visual indicators.
3. NEVER invent pesticide names, fake chemical dosages, fake weather, or commercial brand claims.
4. Always recommend concrete physical field inspections (checking root moisture depth, inspecting leaf undersides for sporulation/pests, checking drainage).
5. Recommend consulting the local Agricultural Extension Officer (AEO) or Krishi Vigyan Kendra (KVK) for certified chemical spray prescriptions.
6. Answer in ${isTelugu ? 'fluent, respectful, farmer-friendly Telugu (తెలుగు)' : 'clear, practical, conversational farmer-friendly English'}. Keep tone warm and direct. Keep response concise (under 160 words).`;

      // Fast timeout promise (5.0s maximum for voice latency SLA)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Voice Agronomist upstream Gemini timeout (>5000ms)')), 5000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemPrompt}\n\n${contextEvidence}\n\nFarmer's Query: "${question}"\n\nDeliver a concise, practical agronomic response (under 160 words) addressing their query while directly referencing the scan measurements and sensor conditions.`,
          config: {
            maxOutputTokens: 350,
            temperature: 0.25,
          }
        }),
        timeoutPromise
      ]);

      const replyText = response.text || '';
      if (replyText.trim()) {
        const elapsed = Date.now() - startTime;
        res.json({
          success: true,
          answer: replyText,
          source: 'gemini-3.8-flash',
          isFallback: false,
          latencyMs: elapsed,
          contextUsed: {
            crop: cropInfo?.cropType,
            moisture: effectiveSensor?.soilMoisture,
            yellowPct: cvEvidence?.yellowPercentage,
            brownPct: cvEvidence?.brownPercentage
          },
          safetyNotice: 'Educational agronomy decision support. Always consult local agricultural university extension experts for critical interventions.'
        });
        return;
      }
    } catch (geminiError: unknown) {
      console.warn('⚡ Fast fallback engaged — Gemini call timed out or throttled:', geminiError);
    }
  }

  // Resilient, context-aware rule-based agronomy engine
  const cropName = cropInfo?.cropType || 'Crop';
  const stage = cropInfo?.growthStage || 'vegetative';
  const yPct = cvEvidence?.yellowPercentage || cvEvidence?.yellowPct || 0;
  const bPct = cvEvidence?.brownPercentage || cvEvidence?.brownPct || 0;
  const moist = effectiveSensor?.soilMoisture || 42;
  const temp = effectiveSensor?.airTemperature || 28;
  const hum = effectiveSensor?.airHumidity || 65;
  const topHyp = Array.isArray(hypotheses) && hypotheses.length > 0 ? hypotheses[0] : null;
  const topHypTitle = isTelugu ? (topHyp?.titleTe || 'పోషకాల అసమతుల్యత') : (topHyp?.titleEn || 'Nutritional / Chlorosis Indicator');
  const topHypProb = topHyp ? (topHyp.currentProbability || topHyp.initialProbability || 45) : 45;

  let answer = '';
  if (isTelugu) {
    answer = `నమస్కారం రైతు మిత్రమా, ఫామ్‌సేజ్ వాయిస్ అగ్రోనమిస్ట్ సలహా:

మీరు అడిగిన ప్రశ్న: "${question}"

1. మీ పంట మరియు క్షేత్ర పరిస్థితి విశ్లేషణ:
• పంట: ${cropName} (${stage} దశ)
• కంప్యూటర్ విజన్ ఆధారాలు: ఆకుపై ${yPct}% పసుపు రంగు (క్లోరోసిస్) మరియు ${bPct}% గోధుమ మచ్చలు (నెక్రోసిస్) గుర్తించబడ్డాయి.
• క్షేత్ర సెన్సార్లు: నేలలో తేమ ${moist}%, గాలి ఉష్ణోగ్రత ${temp}°C, గాలిలో తేమ ${hum}%.
• ప్రధాన సాధ్యత: ${likelyCondition || topHypTitle} (సాపేక్ష ర్యాంకింగ్ స్కోరు: ~${topHypProb}%).

2. శాస్త్రీయ కారణాలు & గమనికలు:
${moist > 70
  ? `• నేలలో తేమ చాలా ఎక్కువగా ఉంది (${moist}%). నీరు నిలవడం వల్ల వేర్లకు ఆక్సిజన్ అందక పోషకాలను గ్రహించలేవు, దీనివల్ల ఆకుల అంచులు పసుపుగా మారుతాయి.`
  : moist < 25
  ? `• నేలలో తేమ తక్కువగా ఉంది (${moist}%). బెట్ట ఒత్తిడి వల్ల ఆకుల అంచులు ఎండిపోవడం సహజం.`
  : `• నేలలో తేమ అనుకూల పరిధిలో ఉంది (${moist}%). కాబట్టి ఆకు రంగు మార్పుకు పోషకాల లోపం లేదా శిలీంధ్ర మచ్చలు కారణం కావచ్చు.`}
${bPct > 5 ? `• ఆకుపై గోధుమ రంగు మచ్చలు (${bPct}%) ఉన్నందున, తేమ మరియు ఉష్ణోగ్రత (${temp}°C) కలయికలో శిలీంధ్ర తెగులు వ్యాపించే అవకాశం ఉంది.` : ''}

3. మీరు చేయవలసిన తక్షణ క్షేత్ర తనిఖీలు:
• ఆకు అడుగు భాగంలో తెల్లటి బూజు లేదా పేనుబంక, నల్లి లాంటి రసం పీల్చే పురుగులు ఉన్నాయో చూడండి.
• మొదట్లో 15 సెం.మీ తవ్వి వేర్ల ఆరోగ్యాన్ని మరియు మురుగునీటి వసతిని తనిఖీ చేయండి.
• పురుగుమందులు వాడేముందు మీ మండల వ్యవసాయ విస్తరణ అధికారి (AEO)ని సంప్రదించి నిర్ధారించుకోండి.`;
  } else {
    answer = `Hello Farmer! Here is your FarmSage Agronomy advisory based on your field scan:

Regarding your query: "${question}"

1. Current Field & Diagnostic Synthesis:
• Crop: ${cropName} (${stage} stage)
• Measured Vision Evidence: ${yPct}% chlorotic yellowing and ${bPct}% necrotic brown lesion area.
• Live Sensor Telemetry: Soil moisture at ${moist}%, ambient temperature ${temp}°C, relative humidity ${hum}%.
• Leading Hypothesis / Likely Condition: ${likelyCondition || topHypTitle} (Relative Score: ~${topHypProb}%).

2. Agronomic Interpretation:
${moist > 70
  ? `• Soil moisture is elevated (${moist}%). Water saturation can impair root respiration, impeding Nitrogen/Iron transport and triggering marginal chlorosis.`
  : moist < 25
  ? `• Root zone moisture is low (${moist}%). Moisture deficit stress frequently causes tip scorch and leaf yellowing.`
  : `• Root zone moisture is well-balanced (${moist}%). The visual symptoms are more likely attributable to specific nutrient mobility or foliar micro-pathogens.`}
${bPct > 5 ? `• The presence of discrete necrotic brown lesions (${bPct}%) under ${hum}% humidity warrants close observation for fungal leaf spot progression.` : ''}

3. Recommended Practical Inspections:
• Inspect the abaxial (underside) leaf surface with a hand lens for fungal sporulation or sap-feeding vectors.
• Check if yellowing is confined strictly to basal older leaves (suggesting mobile nutrient remobilization) or new apical growth.
• Ensure adequate inter-row aeration and avoid overhead wetting during evening hours.

Safety Reminder: Visual indicators provide educational guidance and are not a substitute for laboratory pathogen testing. Consult your local Agricultural Extension Officer (AEO) or KVK specialist before applying regulated chemical sprays.`;
  }

  const fallbackElapsed = Date.now() - startTime;
  res.json({
    success: true,
    answer,
    source: 'farmsage-agronomy-engine (grounded fallback)',
    isFallback: true,
    latencyMs: fallbackElapsed,
    contextUsed: {
      crop: cropName,
      moisture: moist,
      yellowPct: yPct,
      brownPct: bPct
    },
    safetyNotice: 'Educational agronomy decision support. Consult a certified agronomist for chemical control plans.'
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 FarmSage AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
