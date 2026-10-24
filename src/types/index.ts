export type Language = 'en' | 'te';

export type GrowthStage = 
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'maturation'
  | 'harvest';

export interface CVMeasurements {
  width: number;
  height: number;
  megapixels: number;
  brightness: number; // 0-255 perceived luminance
  contrast: number; // std dev
  sharpness: number; // Laplacian variance
  greenPercentage: number; // Healthy chlorophyll index
  yellowPercentage: number; // Chlorotic visual regions
  brownPercentage: number; // Necrotic / lesion visual regions
  darkPercentage: number; // Deep necrotic / sooty visual regions
  foliagePercentage: number; // Leaf surface vs background
  dominantColorHex: string;
  anomalyBoundingBoxes: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'yellow_zone' | 'brown_lesion' | 'dark_spot';
    areaPct: number;
  }[];
}

export interface ImageQualityAssessment {
  isValid: boolean;
  isBlurry: boolean;
  isTooDark: boolean;
  isOverexposed: boolean;
  isLowContrast: boolean;
  isPoorFraming: boolean;
  qualityScore: number; // 0 - 100
  warnings: {
    code: string;
    level: 'info' | 'warning' | 'error';
    en: string;
    te: string;
  }[];
  recommendation: {
    en: string;
    te: string;
  };
}

export interface CompetingHypothesis {
  id: string;
  titleEn: string;
  titleTe: string;
  category: 'nutritional' | 'moisture_stress' | 'fungal_bacterial_indicator' | 'pest_damage_indicator' | 'environmental' | 'healthy_crop';
  initialProbability: number; // 0 - 100% (Relative hypothesis ranking score)
  currentProbability: number; // adjusted by agent follow-up evidence
  visualEvidenceEn: string;
  visualEvidenceTe: string;
  whyConsideredEn: string;
  whyConsideredTe: string;
  whatIsMissingEn?: string;
  whatIsMissingTe?: string;
  distinguishingObservationEn?: string;
  distinguishingObservationTe?: string;
  recommendedObservationsEn: string[];
  recommendedObservationsTe: string[];
}

export type DecisionTracePhase =
  | 'PERCEPTION'
  | 'VISUAL EVIDENCE'
  | 'LIKELY CONDITION / DIFFERENTIAL'
  | 'REASONING'
  | 'RECOMMENDED ACTION'
  | 'FIELD VERIFICATION'
  | 'OUTCOME / NEXT STEP'
  | 'DECISION'
  | 'ACTION'
  | 'REVISED_DECISION';

export interface AgentDecisionTraceStep {
  phase: DecisionTracePhase;
  timestamp: string;
  titleEn: string;
  titleTe: string;
  detailsEn: string;
  detailsTe: string;
  evidenceTags: string[];
  status: 'passed' | 'warning' | 'question_pending' | 'resolved' | 'critical';
}

export interface AgentFollowUpQuestion {
  id: string;
  questionEn: string;
  questionTe: string;
  options: {
    labelEn: string;
    labelTe: string;
    value: string;
    hypothesisBoost: Record<string, number>; // e.g. { 'nitrogen_deficiency': +25, 'fungal_spot': -15 }
  }[];
  answeredValue?: string;
}

export interface SixPointManagementPlan {
  immediateSteps: { en: string[]; te: string[] };
  environmentalIrrigation: { en: string[]; te: string[] };
  affectedPlantManagement: { en: string[]; te: string[] };
  preventionMeasures: { en: string[]; te: string[] };
  monitoringFollowUp: { en: string[]; te: string[] };
  expertConfirmation: { en: string; te: string };
}

export interface ManagementRecommendation {
  possibleConditionEn: string;
  possibleConditionTe: string;
  likelyConditionEn: string;
  likelyConditionTe: string;
  conditionCategory: 'foliar_lesions' | 'nutritional' | 'moisture_stress' | 'pest_damage' | 'insufficient_evidence' | 'healthy_crop';
  statusBadgeEn: string;
  statusBadgeTe: string;
  whySuspectedEn: string;
  whySuspectedTe: string;
  whyEvidenceEn: string[];
  whyEvidenceTe: string[];
  confidenceWordingEn: string;
  confidenceWordingTe: string;
  stillNeededForConfirmationEn: string[];
  stillNeededForConfirmationTe: string[];
  immediateStepsEn: string[];
  immediateStepsTe: string[];
  treatmentManagementEn: string[];
  treatmentManagementTe: string[];
  preventionStepsEn: string[];
  preventionStepsTe: string[];
  whenToSeekHelpEn: string;
  whenToSeekHelpTe: string;
  sixPointPlan: SixPointManagementPlan;
  isEvidenceSufficient: boolean;
  safetyNoticeEn: string;
  safetyNoticeTe: string;
}

export interface CropScanRecord {
  id: string;
  timestamp: string;
  cropType: string;
  growthStage: GrowthStage;
  fieldLocation: string;
  farmerNotes: string;
  originalImage: string; // Base64 data URL
  annotatedImage: string; // Base64 data URL with CV annotations
  measurements: CVMeasurements;
  quality: ImageQualityAssessment;
  hypotheses: CompetingHypothesis[];
  agentTrace: AgentDecisionTraceStep[];
  followUpQuestions: AgentFollowUpQuestion[];
  managementAdvice?: ManagementRecommendation;
  isArchived?: boolean;
}

export interface SensorReading {
  id: string;
  fieldId: string;
  cropType: string;
  timestamp: string;
  soilMoisture: number;
  soilTemperature: number;
  airHumidity: number;
  airTemperature: number;
  sunlightLux: number;
  nitrogenPpm: number;
  phosphorusPpm: number;
  potassiumPpm: number;
  batteryLevel: number;
  status: 'optimal' | 'warning' | 'alert';
  isSimulated?: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}
