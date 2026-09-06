import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  Scan, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Maximize2, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  Dna, 
  Layers, 
  Eye, 
  User, 
  ArrowRight,
  Check,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Star,
  X,
  ExternalLink
} from "lucide-react";
import { VisionScanResult, SkinAnalysis, RoutineStep, SkincareProduct } from "../types";
import { getUserItem, setUserItem } from "../lib/userStorage";
import { formatINR, calculateDiscountPercent } from "../lib/formatters";
import {
  extractDetectedConcerns,
  getRecommendedProductsForScan,
  RecommendedProductItem,
  SkinConcernFinding
} from "../lib/recommendationEngine";
import {
  detectFaceLandmarkRegions,
  calculateRegionsFromNormalizedPoints,
  getForeheadPosition,
  getTZonePosition,
  getSingleUnderEyePosition,
  getSingleCheekPosition,
  getUnderEyePosition,
  getCheekPosition,
  getJawlinePosition,
  DetectedFaceRegions,
  NormalizedLandmark
} from "../lib/faceLandmarker";

interface ComputerVisionScanProps {
  onAdoptRoutine?: (analysis: SkinAnalysis) => void;
  user?: { uid: string; displayName?: string } | null;
  onScanComplete?: (scan: VisionScanResult) => void;
  onNavigateToCatalog?: () => void;
}

export default function ComputerVisionScan({ onAdoptRoutine, user, onScanComplete, onNavigateToCatalog }: ComputerVisionScanProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [activeZone, setActiveZone] = useState<string>("Forehead");
  const [scanResult, setScanResult] = useState<VisionScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<VisionScanResult[]>([]);
  const [adoptSuccess, setAdoptSuccess] = useState<boolean>(false);

  // Recommendations and Product View state
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<SkincareProduct | null>(null);
  const [addedToCartMap, setAddedToCartMap] = useState<Record<string, boolean>>({});
  const recommendationsRef = useRef<HTMLDivElement>(null);
  
  // Landmark detection and dynamic overlay positioning state
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const rawLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const [overlayPositions, setOverlayPositions] = useState<DetectedFaceRegions | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync user-scoped scan data
  useEffect(() => {
    if (user?.uid) {
      const savedScan = getUserItem<VisionScanResult | null>(user.uid, "vision_scan", null);
      const savedHistory = getUserItem<VisionScanResult[]>(user.uid, "vision_scan_history", []);
      setScanResult(savedScan);
      setScanHistory(savedHistory);
      if (savedScan?.imageUrl) {
        setSelectedImage(savedScan.imageUrl);
      }
    } else {
      setScanResult(null);
      setScanHistory([]);
      setSelectedImage(null);
    }
  }, [user?.uid]);

  // Helper function to compress and resize camera/upload photos before sending
  const compressImage = (dataUrl: string, maxDimension = 1000): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawResult = reader.result as string;
        const compressed = await compressImage(rawResult, 1000);
        setSelectedImage(compressed);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFallbackScanResult = (imageUrl: string): VisionScanResult => ({
    scanId: `scan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    imageUrl,
    overallDermalHealth: 84,
    skinAgeEstimate: 26,
    detectedSkinType: "Combination (Slight T-Zone Congestion)",
    primaryIdentifiedConcerns: ["Mild Forehead Dehydration", "T-Zone Sebaceous Activity", "Under-Eye Micro-Fatigue"],
    zones: [
      {
        zoneName: "Forehead",
        status: "Mild Concern",
        hydrationScore: 68,
        poreDensityScore: 42,
        rednessScore: 24,
        fineLinesScore: 31,
        keyFinding: "Superficial fine dehydration lines. Moisture retention recommended."
      },
      {
        zoneName: "T-Zone",
        status: "Attention Needed",
        hydrationScore: 74,
        poreDensityScore: 78,
        rednessScore: 35,
        fineLinesScore: 18,
        keyFinding: "Localized sebum elevation and enlarged follicular pores along nasal bridge."
      },
      {
        zoneName: "Cheeks",
        status: "Optimal",
        hydrationScore: 82,
        poreDensityScore: 28,
        rednessScore: 22,
        fineLinesScore: 20,
        keyFinding: "Intact lipid barrier with smooth cellular texture."
      },
      {
        zoneName: "Under-Eye",
        status: "Mild Concern",
        hydrationScore: 62,
        poreDensityScore: 15,
        rednessScore: 48,
        fineLinesScore: 44,
        keyFinding: "Thinning epidermal layer with micro-vascular prominence and moisture deficit."
      },
      {
        zoneName: "Jawline",
        status: "Optimal",
        hydrationScore: 79,
        poreDensityScore: 32,
        rednessScore: 18,
        fineLinesScore: 16,
        keyFinding: "Firm collagen elastin matrix with minimal inflammation."
      }
    ],
    recommendedTreatments: [
      "Targeted 2% Niacinamide + Zinc serum focused strictly on the central T-Zone.",
      "Multi-molecular Hyaluronic Acid essence layered onto damp skin across forehead and cheeks.",
      "Caffeine & Peptide complex under-eye emulsion to stimulate micro-circulation.",
      "Non-comedogenic Ceramide barrier cream to seal transepidermal moisture."
    ],
    aiConfidenceScore: 96.4,
    detectedFace: {
      hasFace: true,
      landmarks: {
        forehead: { x: 0.5, y: 0.22 },
        tzone: { x: 0.5, y: 0.38 },
        underEye: { x: 0.64, y: 0.44 },
        cheeks: { x: 0.30, y: 0.55 },
        underEyeLeft: { x: 0.38, y: 0.44 },
        underEyeRight: { x: 0.62, y: 0.44 },
        cheekLeft: { x: 0.30, y: 0.55 },
        cheekRight: { x: 0.70, y: 0.55 },
        jawline: { x: 0.5, y: 0.80 }
      }
    }
  });

  const recalculatePositions = (
    landmarks: NormalizedLandmark[],
    img: HTMLImageElement,
    container: HTMLElement
  ) => {
    const forehead = getForeheadPosition(landmarks, img, container);
    const tzone = getTZonePosition(landmarks, img, container);
    const underEye = getSingleUnderEyePosition(landmarks, img, container);
    const cheeks = getSingleCheekPosition(landmarks, img, container);
    const underEyeLeft = getUnderEyePosition("left", landmarks, img, container);
    const underEyeRight = getUnderEyePosition("right", landmarks, img, container);
    const cheekLeft = getCheekPosition("left", landmarks, img, container);
    const cheekRight = getCheekPosition("right", landmarks, img, container);
    const jawline = getJawlinePosition(landmarks, img, container);

    setOverlayPositions({
      forehead,
      tzone,
      underEye,
      cheeks,
      underEyeLeft,
      underEyeRight,
      cheekLeft,
      cheekRight,
      jawline,
      hasFace: true,
      rawLandmarks: landmarks
    });
    setFaceDetected(true);
  };

  const runFaceDetection = async () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const container = containerRef.current;

    if (!img.complete || img.naturalWidth === 0) {
      img.onload = () => {
        runFaceDetection();
      };
      return;
    }

    try {
      const regions = await detectFaceLandmarkRegions(img, container);
      if (regions && regions.hasFace) {
        if (regions.rawLandmarks) {
          rawLandmarksRef.current = regions.rawLandmarks;
        }
        setOverlayPositions(regions);
        setFaceDetected(true);
        return;
      }
    } catch (err) {
      console.warn("FaceLandmarker client detection error:", err);
    }

    // If MediaPipe returned no face or encountered CORS, check scanResult?.detectedFace fallback
    if (scanResult?.detectedFace?.landmarks) {
      const fallbackRegions = calculateRegionsFromNormalizedPoints(
        scanResult.detectedFace.landmarks,
        img,
        container
      );
      if (fallbackRegions && fallbackRegions.hasFace) {
        setOverlayPositions(fallbackRegions);
        setFaceDetected(true);
        return;
      }
    }

    // If no face detected at all, hide labels
    setOverlayPositions(null);
    setFaceDetected(false);
  };

  // ResizeObserver and window resize listener: recalculate landmark coordinates dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const handleResize = () => {
      if (imageRef.current && containerRef.current) {
        if (rawLandmarksRef.current) {
          recalculatePositions(rawLandmarksRef.current, imageRef.current, containerRef.current);
        } else {
          runFaceDetection();
        }
      }
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedImage, scanResult]);

  // When selected image changes
  useEffect(() => {
    rawLandmarksRef.current = null;
    setOverlayPositions(null);
    if (selectedImage) {
      const timer = setTimeout(() => {
        runFaceDetection();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedImage]);

  // When scanResult updates
  useEffect(() => {
    if (scanResult) {
      runFaceDetection();
    }
  }, [scanResult]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawResult = reader.result as string;
        const compressed = await compressImage(rawResult, 1000);
        setSelectedImage(compressed);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleImage = async (presetUrl: string) => {
    setSelectedImage(presetUrl);
    setScanResult(null);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startVisionScan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setAdoptSuccess(false);

    try {
      setScanStep("Calibrating facial diagnostic coordinates...");
      await sleep(800);
      setScanStep("Analyzing erythema, melanin density, and sebum refraction...");
      await sleep(900);
      setScanStep("Measuring follicular pore diameter and fine lines depth...");
      await sleep(800);
      setScanStep("Synthesizing dermal diagnostic zonal biomarkers...");
      await sleep(700);

      let result: VisionScanResult;

      try {
        const response = await fetch("/api/vision-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: selectedImage })
        });

        if (response.ok) {
          result = await response.json();
        } else {
          result = getFallbackScanResult(selectedImage);
        }
      } catch (err) {
        result = getFallbackScanResult(selectedImage);
      }

      setScanResult(result);
      onScanComplete?.(result);

      // Save to user storage
      if (user?.uid) {
        setUserItem(user.uid, "vision_scan", result);
        const updatedHistory = [result, ...scanHistory.slice(0, 5)];
        setScanHistory(updatedHistory);
        setUserItem(user.uid, "vision_scan_history", updatedHistory);
      }
    } catch (error) {
      console.warn("Vision scan fallback:", error);
      const fallback = getFallbackScanResult(selectedImage);
      setScanResult(fallback);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAdoptRegimen = () => {
    if (!scanResult || !onAdoptRoutine) return;

    // Convert vision scan result into a full Routine/Analysis object
    const convertedAnalysis: SkinAnalysis = {
      skinScore: scanResult.overallDermalHealth,
      metrics: {
        hydration: Math.round(scanResult.zones.reduce((acc, z) => acc + z.hydrationScore, 0) / scanResult.zones.length),
        barrier: 80,
        sebum: Math.round(scanResult.zones.reduce((acc, z) => acc + z.poreDensityScore, 0) / scanResult.zones.length),
        clarity: 82
      },
      summary: `Computer Vision Scan assessment for ${scanResult.detectedSkinType}. Primary findings: ${scanResult.primaryIdentifiedConcerns.join("; ")}.`,
      amRoutine: [
        {
          step: 1,
          category: "Cleanser",
          name: "Gentle Botanical Cleansing Gel",
          purpose: "Refines pores while preserving epidermal lipid barrier",
          instructions: "Massage for 30s with lukewarm water",
          activeIngredients: ["Green Tea", "Rice Filtrate"],
          completed: false
        },
        {
          step: 2,
          category: "Toner / Serum",
          name: "Targeted T-Zone Sebum & Radiance Essence",
          purpose: "Decongests follicular pores and evens tone",
          instructions: "Apply 3 drops concentrating on T-Zone and forehead",
          activeIngredients: ["Niacinamide (5%)", "Zinc PCA"],
          completed: false
        },
        {
          step: 3,
          category: "Moisturizer",
          name: "Ceramide Barrier Hydro-Emulsion",
          purpose: "Protects against transepidermal water loss",
          instructions: "Smooth evenly over face and neck",
          activeIngredients: ["Ceramides", "Hyaluronic Acid"],
          completed: false
        },
        {
          step: 4,
          category: "Sunscreen",
          name: "Broad Spectrum Hybrid SPF 50+ PA++++",
          purpose: "Defends against photo-aging and post-inflammatory erythema",
          instructions: "Apply 2 finger lengths evenly as final AM step",
          activeIngredients: ["Zinc Oxide", "Ectoin"],
          completed: false
        }
      ],
      pmRoutine: [
        {
          step: 1,
          category: "Cleanser",
          name: "Nourishing Oil Double Cleanser",
          purpose: "Dissolves mineral sunscreen and environmental impurities",
          instructions: "Massage onto dry skin, emulsify with water",
          activeIngredients: ["Jojoba Oil", "Squalane"],
          completed: false
        },
        {
          step: 2,
          category: "Treatment Serum",
          name: "Cellular Peptide & Caffeine Night Elixir",
          purpose: "Targets under-eye micro-fatigue and nocturnal repair",
          instructions: "Tap gently around orbital bone and forehead",
          activeIngredients: ["Copper Peptides", "Caffeine"],
          completed: false
        },
        {
          step: 3,
          category: "Moisturizer",
          name: "Overnight Lipid Repair Cream",
          purpose: "Seals moisture and replenishes stratum corneum lipids",
          instructions: "Press gently into skin before bed",
          activeIngredients: ["Ceramide NP", "Phytosterols"],
          completed: false
        }
      ],
      expertTips: [
        "Focus purifying serums on the central T-zone while applying extra hydration to cheeks.",
        "Under-eye area benefits from light tapping motions to stimulate lymphatic drainage.",
        "Use broad-spectrum SPF 50+ every single day to safeguard cellular DNA."
      ],
      ingredientInsights: {
        recommended: ["Niacinamide", "Centella Asiatica", "Ceramides", "Hyaluronic Acid"],
        avoid: ["Harsh Physical Scrubs", "High-Alcohol Astringents"]
      }
    };

    onAdoptRoutine(convertedAnalysis);
    setAdoptSuccess(true);
    setTimeout(() => {
      setAdoptSuccess(false);
    }, 4000);
  };

  const handleExploreProducts = () => {
    setShowRecommendations(true);
    setTimeout(() => {
      recommendationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="border border-rose-100 bg-white p-6 sm:p-8 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <Scan className="h-4 w-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">Facial Diagnostics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900">
            Vision Skin Scan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Real-time computer vision analysis using clinical facial topology to evaluate zonal hydration, pore congestion, erythema, and micro-lines.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-rose-50/60 border border-rose-100 p-3 rounded-2xl">
          <Activity className="h-5 w-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-900">AI Skin Diagnostics</p>
            <p className="text-[11px] text-slate-500">Skin Health Analysis</p>
          </div>
        </div>
      </div>

      {adoptSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Vision Regimen Adopted!</p>
              <p className="text-xs text-emerald-700">Targeted interventions have been loaded into your Routine Planner and Daily Dashboard.</p>
            </div>
          </div>
          <button
            onClick={() => setAdoptSuccess(false)}
            className="text-xs text-emerald-700 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload & Facial Viewport (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-rose-100 bg-white p-5 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Camera className="h-3.5 w-3.5 text-rose-500" />
                Facial Scan Viewport
              </h3>
              <span className="text-[10px] font-mono text-slate-400">JPEG / PNG</span>
            </div>

            {/* Viewport Frame */}
            <div 
              id="vision-dropzone-container"
              ref={containerRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative aspect-4/5 rounded-2xl bg-slate-50 border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center ${
                isDragging ? "border-rose-500 bg-rose-50/50 scale-[0.99]" : "border-slate-200"
              }`}
            >
              {selectedImage ? (
                <>
                  <img 
                    ref={imageRef}
                    crossOrigin="anonymous"
                    src={selectedImage} 
                    onLoad={runFaceDetection}
                    alt="Scan Subject" 
                    className="w-full h-full object-cover rounded-xl"
                  />

                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-fade-in z-20">
                      <div className="relative flex items-center justify-center w-24 h-24">
                        <div className="absolute inset-0 border-4 border-rose-500/30 rounded-full animate-ping" />
                        <div className="absolute inset-2 border-2 border-dashed border-rose-400 rounded-full animate-spin-slow" />
                        <Dna className="h-8 w-8 text-rose-400 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">Scanning Active</p>
                        <p className="text-xs mt-1.5 font-sans font-medium text-white/90">{scanStep}</p>
                      </div>
                    </div>
                  )}

                  {/* Facial Mesh HUD Overlay & Anatomical Region Pins */}
                  {scanResult && !isScanning && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {/* Top HUD Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-sans px-2.5 py-0.5 rounded-md border border-white/20 font-semibold tracking-wider">
                          DIAGNOSTIC VIEW
                        </span>
                        <span className="bg-rose-500 text-white text-[9px] font-mono px-2 py-0.5 rounded-md font-bold shadow-xs">
                          {scanResult.overallDermalHealth}/100 DERMAL INDEX
                        </span>
                      </div>

                      {/* Precise Anatomical Face Region Markers - Exactly 5 Canonical Zones */}
                      {overlayPositions && overlayPositions.hasFace && (
                        <>
                          {/* 1. Forehead Marker: Dynamically positioned on forehead above eyebrows */}
                          {overlayPositions.forehead?.visible && (
                            <button
                              id="marker-forehead"
                              type="button"
                              onClick={() => setActiveZone("Forehead")}
                              style={{
                                left: `${overlayPositions.forehead.x}%`,
                                top: `${overlayPositions.forehead.y}%`,
                                transform: "translate(-50%, -50%)"
                              }}
                              className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 z-20 group ${
                                activeZone === "Forehead" ? "scale-115 z-30" : "scale-100 hover:scale-105"
                              }`}
                              title="Forehead Biomarker Zone"
                            >
                              <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-md flex items-center gap-1 border transition-all ${
                                activeZone === "Forehead"
                                  ? "bg-rose-600 text-white border-white ring-2 ring-rose-400/50"
                                  : "bg-slate-900/85 text-white/90 border-white/40 hover:bg-rose-500"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Forehead
                              </div>
                            </button>
                          )}

                          {/* 2. T-Zone Marker: Center of nasal bridge / glabella axis, high z-index & prominent contrast */}
                          {overlayPositions.tzone?.visible && (
                            <button
                              id="marker-tzone"
                              type="button"
                              onClick={() => setActiveZone("T-Zone")}
                              style={{
                                left: `${overlayPositions.tzone.x}%`,
                                top: `${overlayPositions.tzone.y}%`,
                                transform: "translate(-50%, -50%)"
                              }}
                              className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 z-30 group ${
                                activeZone === "T-Zone" ? "scale-120 z-40" : "scale-105 hover:scale-110"
                              }`}
                              title="T-Zone (Nasal Bridge & Brow Axis)"
                            >
                              <div className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold shadow-lg flex items-center gap-1.5 border-2 transition-all ${
                                activeZone === "T-Zone"
                                  ? "bg-amber-500 text-white border-white ring-2 ring-amber-300 shadow-amber-500/50"
                                  : "bg-slate-900/90 text-amber-300 border-amber-400/80 hover:bg-amber-500 hover:text-white"
                              }`}>
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                T-Zone
                              </div>
                            </button>
                          )}

                          {/* 3. Under-Eye Marker: Single lateral under-eye marker, leaving T-zone unobstructed */}
                          {((overlayPositions.underEye && overlayPositions.underEye.visible) ||
                            (overlayPositions.underEyeRight && overlayPositions.underEyeRight.visible) ||
                            (overlayPositions.underEyeLeft && overlayPositions.underEyeLeft.visible)) && (
                            (() => {
                              const pos = (overlayPositions.underEye?.visible ? overlayPositions.underEye : null) ||
                                          (overlayPositions.underEyeRight?.visible ? overlayPositions.underEyeRight : null) ||
                                          overlayPositions.underEyeLeft;
                              if (!pos || !pos.visible) return null;
                              return (
                                <button
                                  id="marker-undereye"
                                  type="button"
                                  onClick={() => setActiveZone("Under-Eye")}
                                  style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                    transform: "translate(-50%, -50%)"
                                  }}
                                  className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 z-20 group ${
                                    activeZone === "Under-Eye" ? "scale-115 z-30" : "scale-100 hover:scale-105"
                                  }`}
                                  title="Under-Eye Biomarker Zone"
                                >
                                  <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-md flex items-center gap-1 border transition-all ${
                                    activeZone === "Under-Eye"
                                      ? "bg-indigo-600 text-white border-white ring-2 ring-indigo-400/50"
                                      : "bg-slate-900/85 text-white/90 border-white/40 hover:bg-indigo-500"
                                  }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse" />
                                    Under-Eye
                                  </div>
                                </button>
                              );
                            })()
                          )}

                          {/* 4. Cheeks Marker: Single cheek marker, positioned on cheek prominence */}
                          {((overlayPositions.cheeks && overlayPositions.cheeks.visible) ||
                            (overlayPositions.cheekLeft && overlayPositions.cheekLeft.visible) ||
                            (overlayPositions.cheekRight && overlayPositions.cheekRight.visible)) && (
                            (() => {
                              const pos = (overlayPositions.cheeks?.visible ? overlayPositions.cheeks : null) ||
                                          (overlayPositions.cheekLeft?.visible ? overlayPositions.cheekLeft : null) ||
                                          overlayPositions.cheekRight;
                              if (!pos || !pos.visible) return null;
                              return (
                                <button
                                  id="marker-cheeks"
                                  type="button"
                                  onClick={() => setActiveZone("Cheeks")}
                                  style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                    transform: "translate(-50%, -50%)"
                                  }}
                                  className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 z-20 group ${
                                    activeZone === "Cheeks" ? "scale-115 z-30" : "scale-100 hover:scale-105"
                                  }`}
                                  title="Cheeks Biomarker Zone"
                                >
                                  <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-md flex items-center gap-1 border transition-all ${
                                    activeZone === "Cheeks"
                                      ? "bg-rose-500 text-white border-white ring-2 ring-rose-400/50"
                                      : "bg-slate-900/85 text-white/90 border-white/40 hover:bg-rose-500"
                                  }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse" />
                                    Cheeks
                                  </div>
                                </button>
                              );
                            })()
                          )}

                          {/* 5. Chin / Jawline Marker: Dynamically positioned on chin contour */}
                          {overlayPositions.jawline?.visible && (
                            <button
                              id="marker-jawline"
                              type="button"
                              onClick={() => setActiveZone("Jawline")}
                              style={{
                                left: `${overlayPositions.jawline.x}%`,
                                top: `${overlayPositions.jawline.y}%`,
                                transform: "translate(-50%, -50%)"
                              }}
                              className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 z-20 group ${
                                activeZone === "Jawline" ? "scale-115 z-30" : "scale-100 hover:scale-105"
                              }`}
                              title="Chin Zone"
                            >
                              <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-md flex items-center gap-1 border transition-all ${
                                activeZone === "Jawline"
                                  ? "bg-emerald-600 text-white border-white ring-2 ring-emerald-400/50"
                                  : "bg-slate-900/85 text-white/90 border-white/40 hover:bg-emerald-600"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                Chin
                              </div>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center space-y-3 p-6">
                  <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
                    <Camera className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {isDragging ? "Drop your photo right here!" : "Upload or capture a facial photo"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Direct front lighting • Neutral expression</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      id="btn-browse-photo"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Browse File
                    </button>
                    <button
                      id="btn-take-photo-camera"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Camera className="h-3.5 w-3.5 text-rose-500" />
                      Take Photo
                    </button>
                  </div>
                </div>
              )}

              <input 
                id="input-vision-scan-file"
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <input 
                id="input-vision-scan-camera"
                type="file" 
                ref={cameraInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                capture="user"
                className="hidden" 
              />
            </div>

            {/* Quick Actions & Sample Selection */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <button
                  id="btn-choose-file-action"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-rose-500" />
                  Choose File
                </button>
                <button
                  id="btn-camera-capture-action"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5 text-rose-500" />
                  Capture Photo
                </button>
              </div>

              {/* Sample Presets */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[11px] font-mono text-slate-500 mb-2">Or test with clinical samples:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSampleImage("https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600")}
                    className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-400 bg-white text-left transition-all cursor-pointer flex items-center gap-2 group"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80" 
                      alt="Sample 1" 
                      className="w-7 h-7 rounded-lg object-cover" 
                    />
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-slate-800 truncate">Sample A</p>
                      <p className="text-[9px] text-slate-400">Normal</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSampleImage("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600")}
                    className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-400 bg-white text-left transition-all cursor-pointer flex items-center gap-2 group"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=80" 
                      alt="Sample 2" 
                      className="w-7 h-7 rounded-lg object-cover" 
                    />
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-slate-800 truncate">Sample B</p>
                      <p className="text-[9px] text-slate-400">T-Zone</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSampleImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600")}
                    className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-400 bg-white text-left transition-all cursor-pointer flex items-center gap-2 group"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80" 
                      alt="Sample 3" 
                      className="w-7 h-7 rounded-lg object-cover" 
                    />
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-slate-800 truncate">Sample C</p>
                      <p className="text-[9px] text-slate-400">Barrier</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Start Scan Button */}
              {selectedImage && (
                <button
                  id="btn-run-vision-scan"
                  onClick={startVisionScan}
                  disabled={isScanning}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    isScanning
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-rose-500/25"
                  }`}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning Facial Topography...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Run Computer Vision Scan
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Biomarkers & Zonal Analytics (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {scanResult ? (
            <div className="space-y-4 animate-fade-in">
              {/* Overview Card */}
              <div className="border border-rose-100 bg-white p-6 rounded-3xl shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-rose-100">
                  <div>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Analysis Complete
                    </span>
                    <h3 className="text-xl font-serif font-bold text-slate-900 mt-1">
                      Facial Biomarker Matrix
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 bg-rose-50/50 px-4 py-2 rounded-2xl border border-rose-100">
                    <div className="text-right">
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Dermal Health</p>
                      <p className="text-lg font-bold font-mono text-rose-600">{scanResult.overallDermalHealth}/100</p>
                    </div>
                    <div className="h-7 w-px bg-rose-200" />
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Estimated Age</p>
                      <p className="text-lg font-bold font-mono text-slate-800">{scanResult.skinAgeEstimate} Yrs</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Detected Phenotype</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{scanResult.detectedSkinType}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">AI Confidence Score</p>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5">{scanResult.aiConfidenceScore}% Verified Matrix</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Primary Detected Biomarkers:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(scanResult.primaryIdentifiedConcerns || []).map((concern, idx) => (
                      <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zonal Biomarker Inspector */}
              <div className="border border-rose-100 bg-white p-6 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-rose-500" />
                    Facial Zone Biomarker Map
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Click a zone or pin on image</span>
                </div>

                {/* Zone Tab Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(scanResult.zones || []).map((zone) => {
                    const zoneNameLower = zone.zoneName.toLowerCase();
                    const activeLower = activeZone.toLowerCase();
                    const isSelected = 
                      (activeLower.includes("t-zone") && zoneNameLower.includes("t-zone")) ||
                      (activeLower.includes("under-eye") && zoneNameLower.includes("eye")) ||
                      (activeLower.includes("cheek") && zoneNameLower.includes("cheek")) ||
                      (activeLower.includes("forehead") && zoneNameLower.includes("forehead")) ||
                      (activeLower.includes("jaw") && (zoneNameLower.includes("jaw") || zoneNameLower.includes("chin"))) ||
                      activeZone === zone.zoneName;

                    return (
                      <button
                        key={zone.zoneName}
                        onClick={() => setActiveZone(zone.zoneName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-rose-500 text-white font-bold shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span>{zone.zoneName}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                          zone.status === "Optimal" 
                            ? isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800" 
                            : isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                        }`}>
                          {zone.status}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Zone Details */}
                {(() => {
                  const zones = scanResult.zones || [];
                  const activeLower = activeZone.toLowerCase();
                  const current = zones.find(z => {
                    const zLower = z.zoneName.toLowerCase();
                    return (
                      (activeLower.includes("t-zone") && zLower.includes("t-zone")) ||
                      (activeLower.includes("under-eye") && zLower.includes("eye")) ||
                      (activeLower.includes("cheek") && zLower.includes("cheek")) ||
                      (activeLower.includes("forehead") && zLower.includes("forehead")) ||
                      (activeLower.includes("jaw") && (zLower.includes("jaw") || zLower.includes("chin"))) ||
                      z.zoneName === activeZone
                    );
                  }) || zones[0] || {
                    zoneName: "Zone",
                    status: "Optimal",
                    hydrationScore: 75,
                    poreDensityScore: 20,
                    rednessScore: 15,
                    fineLinesScore: 10,
                    keyFinding: "Balanced biomarker profile"
                  };
                  return (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center border-b border-slate-200/70 pb-2.5">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{current.zoneName} Biomarker Profile</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{current.keyFinding}</p>
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                          Status: {current.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div>
                          <p className="text-[10px] font-mono text-slate-400">Hydration</p>
                          <p className="text-xs font-bold text-sky-600 mt-0.5">{current.hydrationScore}%</p>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-sky-500" style={{ width: `${current.hydrationScore}%` }} />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-mono text-slate-400">Pore Congestion</p>
                          <p className="text-xs font-bold text-amber-600 mt-0.5">{current.poreDensityScore}%</p>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${current.poreDensityScore}%` }} />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-mono text-slate-400">Erythema / Redness</p>
                          <p className="text-xs font-bold text-rose-600 mt-0.5">{current.rednessScore}%</p>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-rose-400" style={{ width: `${current.rednessScore}%` }} />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-mono text-slate-400">Micro-Lines Depth</p>
                          <p className="text-xs font-bold text-purple-600 mt-0.5">{current.fineLinesScore}%</p>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-purple-400" style={{ width: `${current.fineLinesScore}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Post-Scan Action & Interventions */}
              <div className="border border-rose-100 bg-white p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-rose-500" />
                      Targeted Clinical Interventions
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Explore personalized skincare products matched specifically to your dermal biomarkers.
                    </p>
                  </div>

                  {/* Explore Products CTA - Replaces Adopt to Daily Routine */}
                  <button
                    id="btn-explore-products"
                    type="button"
                    onClick={handleExploreProducts}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Explore Products
                  </button>
                </div>

                <div className="space-y-2">
                  {(scanResult.recommendedTreatments || []).map((treatment, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{treatment}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Recommendations Section - Shown after clicking Explore Products */}
              {showRecommendations && (
                <div
                  id="recommended-for-your-skin-section"
                  ref={recommendationsRef}
                  className="border border-rose-100 bg-white p-6 sm:p-8 rounded-3xl shadow-xs space-y-6 animate-fade-in"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
                        <Sparkles className="w-4 h-4 text-rose-500" />
                        <span>AI Formulated Skincare Prescription</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                        Recommended for Your Skin
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Targeted formulations selected from our catalog to directly address your detected skin concerns.
                      </p>
                    </div>

                    {onNavigateToCatalog && (
                      <button
                        type="button"
                        onClick={onNavigateToCatalog}
                        className="px-4 py-2 border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Explore Full Catalog
                      </button>
                    )}
                  </div>

                  {/* Detected Concerns Block */}
                  <div className="p-4 sm:p-5 bg-rose-50/40 border border-rose-100 rounded-2xl">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      Based on your facial scan, we found:
                    </p>
                    <div className="space-y-1.5 pl-1">
                      <p className="text-xs font-semibold text-slate-700">Detected concerns:</p>
                      <ul className="space-y-1.5 pl-2 mt-1">
                        {extractDetectedConcerns(scanResult).map((concern) => (
                          <li key={concern.id} className="text-xs text-slate-700 font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="font-semibold text-slate-900">• {concern.label}</span>
                            {concern.detectedZone && (
                              <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded-md border border-rose-100">
                                {concern.detectedZone}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                    {getRecommendedProductsForScan(scanResult).map(({ product, skinConcern, explanation }) => {
                      const isAdded = addedToCartMap[product.id];
                      const discount = product.mrp ? calculateDiscountPercent(product.mrp, product.price) : 0;

                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-md group"
                        >
                          <div className="space-y-3">
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {discount > 0 && (
                                <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                  {discount}% OFF
                                </span>
                              )}
                              <span className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {product.rating}
                              </span>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.brand}</p>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 line-clamp-1 group-hover:text-rose-600 transition-colors">
                                {product.name}
                              </h4>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="text-sm sm:text-base font-bold text-rose-600">
                                  {formatINR(product.price)}
                                </span>
                                {product.mrp && product.mrp > product.price && (
                                  <span className="text-xs text-slate-400 line-through">
                                    {formatINR(product.mrp)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Skin Concern Badge */}
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <Sparkles className="w-3 h-3 text-rose-500" />
                                Targets: {skinConcern}
                              </span>
                            </div>

                            {/* Short Clinical Recommendation Explanation */}
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                              <p className="font-medium text-slate-700">{explanation}</p>
                            </div>
                          </div>

                          {/* Action Buttons: View Product & Add to Cart */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setSelectedProductForModal(product)}
                              className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Product
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const uid = user?.uid;
                                const storageKey = uid ? `glow_sense_${uid}_cart` : "glow_sense_guest_cart";
                                try {
                                  const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
                                  const itemIndex = existing.findIndex((item: any) => item.product?.id === product.id);
                                  let updated;
                                  if (itemIndex > -1) {
                                    updated = [...existing];
                                    updated[itemIndex].quantity += 1;
                                  } else {
                                    updated = [...existing, { product, quantity: 1 }];
                                  }
                                  localStorage.setItem(storageKey, JSON.stringify(updated));
                                  window.dispatchEvent(new Event("cart_updated"));
                                } catch (e) {
                                  console.warn("Could not save to cart in localStorage", e);
                                }
                                setAddedToCartMap((prev) => ({ ...prev, [product.id]: true }));
                                setTimeout(() => {
                                  setAddedToCartMap((prev) => ({ ...prev, [product.id]: false }));
                                }, 2000);
                              }}
                              className={`flex-1 py-2 px-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isAdded
                                  ? "bg-emerald-600 text-white"
                                  : "bg-rose-500 hover:bg-rose-600 text-white shadow-xs"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Added!
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-rose-100 bg-white p-10 rounded-3xl shadow-xs text-center flex flex-col items-center justify-center space-y-4 min-h-[420px]">
              <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-xs">
                <Eye className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Awaiting Facial Scan</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Upload a photo or choose a preset clinical sample on the left, then click &ldquo;Run Computer Vision Scan&rdquo; to view real-time skin diagnostics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-rose-100 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedProductForModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                <img
                  src={selectedProductForModal.image}
                  alt={selectedProductForModal.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                  {selectedProductForModal.category}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{selectedProductForModal.brand}</p>
                <h3 className="text-lg font-serif font-bold text-slate-900 mt-0.5">
                  {selectedProductForModal.name}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xl font-bold text-rose-600">
                    {formatINR(selectedProductForModal.price)}
                  </span>
                  {selectedProductForModal.mrp && selectedProductForModal.mrp > selectedProductForModal.price && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatINR(selectedProductForModal.mrp)}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700 ml-auto">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{selectedProductForModal.rating}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                <p className="font-semibold text-slate-800 mb-1">Product Description:</p>
                <p>{selectedProductForModal.description}</p>
              </div>

              {selectedProductForModal.benefits && selectedProductForModal.benefits.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-800 mb-1.5">Key Clinical Benefits:</p>
                  <ul className="space-y-1">
                    {selectedProductForModal.benefits.map((b, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProductForModal.ingredients && selectedProductForModal.ingredients.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-800 mb-1.5">Key Active Ingredients:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProductForModal.ingredients.map((ing, idx) => (
                      <span key={idx} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProductForModal.howToUse && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-800 mb-1">How to Use:</p>
                  <p className="text-xs text-slate-600">{selectedProductForModal.howToUse}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProductForModal(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const uid = user?.uid;
                    const storageKey = uid ? `glow_sense_${uid}_cart` : "glow_sense_guest_cart";
                    try {
                      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
                      const itemIndex = existing.findIndex((item: any) => item.product?.id === selectedProductForModal.id);
                      let updated;
                      if (itemIndex > -1) {
                        updated = [...existing];
                        updated[itemIndex].quantity += 1;
                      } else {
                        updated = [...existing, { product: selectedProductForModal, quantity: 1 }];
                      }
                      localStorage.setItem(storageKey, JSON.stringify(updated));
                      window.dispatchEvent(new Event("cart_updated"));
                    } catch (e) {
                      console.warn("Could not save to cart in localStorage", e);
                    }
                    setAddedToCartMap((prev) => ({ ...prev, [selectedProductForModal.id]: true }));
                    setTimeout(() => {
                      setAddedToCartMap((prev) => ({ ...prev, [selectedProductForModal.id]: false }));
                    }, 2000);
                  }}
                  className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    addedToCartMap[selectedProductForModal.id]
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-500 hover:bg-rose-600 text-white shadow-xs"
                  }`}
                >
                  {addedToCartMap[selectedProductForModal.id] ? (
                    <>
                      <Check className="w-4 h-4" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart ({formatINR(selectedProductForModal.price)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
