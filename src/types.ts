export interface RoutineStep {
  step: number;
  category: string;
  name: string;
  purpose: string;
  instructions: string;
  activeIngredients: string[];
  completed?: boolean;
}

export interface SkinMetrics {
  hydration: number;
  barrier: number;
  sebum: number;
  clarity: number;
}

export interface IngredientInsights {
  recommended: string[];
  avoid: string[];
}

export interface SkinAnalysis {
  skinScore: number;
  metrics: SkinMetrics;
  summary: string;
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  expertTips: string[];
  ingredientInsights: IngredientInsights;
}

export interface SkincareProduct {
  id: string;
  name: string;
  brand: string;
  category: "Cleanser" | "Toner" | "Serum" | "Moisturizer" | "Sunscreen" | "Mask";
  price: number; // Selling price in INR (e.g. 699)
  mrp?: number; // MRP price in INR (e.g. 899)
  rating: number;
  image: string;
  concerns: string[];
  skinTypes: string[];
  ingredients: string[];
  description: string;
  benefits: string[];
  howToUse: string;
  inStock?: boolean;
  stockCount?: number;
}

export interface ShippingAddress {
  fullName: string;
  mobileNumber: string; // 10 digit Indian format
  email?: string;
  houseBuilding: string; // House / Flat Number
  streetArea: string; // Street / Area
  landmark?: string; // Landmark (Optional)
  city: string;
  state: string;
  pinCode: string; // 6 digit Indian PIN code
  saveAddress?: boolean;
}

export type PaymentMethodType = "UPI" | "Card" | "NetBanking" | "Wallet" | "COD";

export interface PaymentDetails {
  method: PaymentMethodType;
  subMethod?: string; // e.g. "Google Pay", "PhonePe", "Paytm", "HDFC Bank", "Visa / MasterCard"
  upiId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  status: "Paid" | "Pending COD" | "Failed";
}

export interface OrderItem {
  product: SkincareProduct;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderRecord {
  id: string; // e.g. NG-20260813-98412
  userId?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  pricing: {
    subtotal: number;
    discount: number;
    shippingCharges: number;
    taxes: number; // 18% GST
    finalTotal: number;
  };
  payment: PaymentDetails;
  orderStatus: "Confirmed" | "Processing" | "Dispatched" | "Out for Delivery" | "Delivered" | "Cancelled";
  createdAt: string;
  estimatedDeliveryDate: string;
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  formattedDate?: string;
  skinRating: number; // 1 to 5 (or 1 to 10)
  emoji?: "😫" | "😟" | "😐" | "😊" | "🤩" | string;
  feelLabel?: string;
  concerns?: string[]; // ["breakout", "dryness", "oiliness", "redness", "irritation", "flaking", "tightness", "smooth"]
  waterIntake?: number; // glasses (e.g. 1 to 12)
  sleepHours?: number;
  stressLevel?: "Low" | "Medium" | "High";
  notes: string;
  amCompleted?: boolean;
  pmCompleted?: boolean;
  selfieUrl?: string;
  loggedAt: string;
}

export interface IngredientInfo {
  name: string;
  category: string;
  description: string;
  benefits: string[];
  skinTypes: string[];
  tier: "Gold Standard" | "Hydrator" | "Exfoliant" | "Soothe";
}

export interface PaymentCard {
  id: string;
  cardholderName: string;
  cardNumber: string; // last 4 digits visible or fully masked
  expiryDate: string; // MM/YY
  cardBrand: "Visa" | "MasterCard" | "Amex" | "Discover" | "Generic";
  isDefault: boolean;
  billingZip: string;
}

// Computer Vision Skin Scan Types
export interface VisionScanZone {
  zoneName: string; // e.g. "Forehead", "Cheeks", "T-Zone", "Under-Eye", "Jawline"
  status: "Optimal" | "Mild Concern" | "Attention Needed";
  hydrationScore: number; // 0 - 100
  poreDensityScore: number; // 0 - 100
  rednessScore: number; // 0 - 100
  fineLinesScore: number; // 0 - 100
  keyFinding: string;
}

export interface DetectedLandmarkPoint {
  x: number;
  y: number;
}

export interface DetectedFaceData {
  hasFace: boolean;
  landmarks?: {
    forehead?: DetectedLandmarkPoint;
    tzone?: DetectedLandmarkPoint;
    underEye?: DetectedLandmarkPoint;
    cheeks?: DetectedLandmarkPoint;
    underEyeLeft?: DetectedLandmarkPoint;
    underEyeRight?: DetectedLandmarkPoint;
    cheekLeft?: DetectedLandmarkPoint;
    cheekRight?: DetectedLandmarkPoint;
    jawline?: DetectedLandmarkPoint;
  };
}

export interface VisionScanResult {
  scanId: string;
  timestamp: string;
  imageUrl: string;
  overallDermalHealth: number; // 0 - 100
  skinAgeEstimate: number;
  detectedSkinType: string;
  primaryIdentifiedConcerns: string[];
  zones: VisionScanZone[];
  recommendedTreatments: string[];
  aiConfidenceScore: number;
  detectedFace?: DetectedFaceData;
}

// Smart Mirror IoT Types
export interface SmartMirrorConfig {
  deviceId: string;
  deviceName: string;
  isConnected: boolean;
  batteryLevel: number;
  wifiSignal: "Strong" | "Medium" | "Weak" | "Disconnected";
  firmwareVersion: string;
  lightTemperatureK: number; // e.g. 2700 - 6500 K
  lightBrightnessPercent: number; // 0 - 100
  antiFogHeatingEnabled: boolean;
  autoDisplayRoutine: boolean;
  proximitySensorEnabled: boolean;
  environmentSensors: {
    humidityPercent: number;
    temperatureC: number;
    uvIndex: number;
    waterTdsPpm: number;
  };
  lastSyncedAt: string;
}

// Tele-Dermatology Types
export interface Dermatologist {
  id: string;
  name: string;
  qualification: string; // e.g. "MBBS, MD (Dermatology)"
  specialist: string; // e.g. "Dermatologist & Skin Care Specialist"
  location: string; // e.g. "Mumbai, India"
  specialties: string[];
  rating: number;
  consultationFee: number;
  imageUrl: string;
  isDemo?: boolean;
  availableDays?: string[];
  availableSlots?: string[];
  title?: string;
  hospital?: string;
  reviewsCount?: number;
  experienceYears?: number;
  bio?: string;
}

export interface Appointment {
  id: string;
  doctor: Dermatologist;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  type: "Video Call" | "Image Diagnostic Review" | "Priority Text Chat";
  status: "Confirmed" | "Completed" | "Cancelled";
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "doctor" | "system";
  text: string;
  timestamp: string;
  imageUrl?: string;
  prescriptionNote?: string;
}


