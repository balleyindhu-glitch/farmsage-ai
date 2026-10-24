# 🌿 FarmSage AI — Evidence-Driven Smart Farming Assistant

FarmSage AI is an agricultural technology application combining client-side computer vision, adaptive agent reasoning, real-time IoT field telemetry, and multilingual voice interaction (English and Telugu) for field crop health monitoring.

---

## 🌟 Core Features

1. **OpenCV-Grade Leaf Vision Pipeline**:
   * **Sharpness**: Computes edge convolution variance ($\sigma^2_L$) via a $3 \times 3$ Laplacian kernel to detect focus/motion blur before leaf inspection.
   * **Luminance & Contrast**: Standardized ITU-R BT.601 perceptual luminance and dynamic tonal range.
   * **Color Segmentation**: Pixel-by-pixel classification into Healthy Foliage (Excess Green Index), Chlorotic Yellowing, Necrotic Brown Lesions, and Dark Micro-spots.
   * **HUD Overlays & Anomaly Bounding Boxes**: Automatically clusters lesions and overlays bounding boxes with live telemetry chips.
   * **Quality Gates**: Flags blurry images, poor framing, underexposure, and glare.

2. **Adaptive Agent Decision Process**:
   * Multi-stage decision cycle: **Perception $\rightarrow$ Decision $\rightarrow$ Action $\rightarrow$ Revised Decision**.
   * Formulates 3 competing differential hypotheses (Nutritional chlorosis vs Foliar lesions vs Moisture/root stress) with evidence weights.
   * Prompts the farmer with physical field inspection inquiries (canopy position, lesion texture, recent drainage).
   * Dynamically recalibrates hypothesis probabilities in real time and logs an auditable trace.

3. **🎙️ Ask Voice Agronomist & FarmSage Advisory**:
   * Voice input via browser microphone (Speech-to-Text) in **English (`en-US`)** and **Telugu (`te-IN`)**.
   * Text-to-Speech (TTS) read-aloud playback in native voices.
   * Text-input fallback if the microphone is unavailable.
   * Context-grounded agronomy advice powered by `@google/genai` (`gemini-3.8-flash`) and rule-based agronomy fallback engines.
   * Strictly adheres to safety constraints: zero invented chemicals, no clinical disease claims from photographs alone.

4. **IoT Field Telemetry (Hardware & Simulated Demo)**:
   * REST API (`POST /api/sensor-data`) with API key verification for ESP32/LoRaWAN field gateways.
   * Real-time monitoring of soil moisture, soil temperature, air temperature, air humidity, sunlight lux, and N-P-K balance.
   * One-click field simulation trigger clearly badged as **Demo / Simulated Data**.

5. **Downloadable Agronomy PDF Reports**:
   * One-click client export via `jsPDF` containing report ID, crop metadata, side-by-side original and annotated imagery, measured CV evidence matrix, agent trace, practical field next steps, and safety disclaimers.

6. **Crop Diary & Split Compare View**:
   * Historical record of crop scans with search, filter, and comparison.
   * Interactive comparison slider calculating evidence deltas ($\Delta$ Yellowing, $\Delta$ Necrosis, $\Delta$ Green recovery, $\Delta$ Sharpness).

---

## 🔐 Security & Privacy Architecture

* **Zero Client-Side Secrets**: All Gemini AI calls and IoT API authentications occur strictly server-side in `server.ts`. No API keys or secrets are ever exposed in frontend bundles.
* **Environment Variables**: Managed via `FARMSAGE_API_KEY` (or `GEMINI_API_KEY`). Real `.env` files are ignored in `.gitignore`.
* **Zero Audio Persistence**: Browser microphone input is processed directly in memory via Web Speech APIs and is never stored on disk or server databases.

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18 or higher)
* npm, yarn, or bun

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy the template environment file:
```bash
cp .env.example .env
```
Configure your keys in `.env`:
```env
# Optional: Gemini API key for smart agronomy voice reasoning & hardware sensor authentication
FARMSAGE_API_KEY="your_api_key_here"

# Standard Gemini API key (auto-injected in Google AI Studio)
GEMINI_API_KEY="your_gemini_api_key_here"

# Application host URL
APP_URL="http://localhost:3000"
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📡 IoT Hardware Sensor API

Hardware gateways (such as ESP32 or Arduino nodes) can stream live telemetry into FarmSage AI:

```bash
curl -X POST "http://localhost:3000/api/sensor-data" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_FARMSAGE_API_KEY" \
  -d '{
    "fieldId": "North-Block-4",
    "cropType": "Tomato",
    "soilMoisture": 45.2,
    "soilTemperature": 24.5,
    "airTemperature": 29.1,
    "airHumidity": 65.0,
    "sunlightLux": 52000
  }'
```

---

## 🛡️ Agricultural Safety Notice

FarmSage AI provides visual computer-vision measurements and educational decision-support only. Color shifts and spots are visual symptoms that **cannot prove or diagnose a specific pathogen or disease**. Never purchase or spray restricted chemical pesticides without verified on-field confirmation from your local Agricultural Extension Officer (AEO) or certified university agronomist (KVK).
