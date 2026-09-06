import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface RegionPosition {
  x: number;       // Label container percentage X (0 - 100)
  y: number;       // Label container percentage Y (0 - 100)
  pointX: number;  // Exact skin-analysis target spot container percentage X
  pointY: number;  // Exact skin-analysis target spot container percentage Y
  visible: boolean;
}

export interface DetectedFaceRegions {
  forehead: RegionPosition;
  tzone: RegionPosition;
  underEye: RegionPosition;      // Single under-eye region with generous lateral clearance from T-zone
  cheeks: RegionPosition;        // Single cheek region
  underEyeLeft?: RegionPosition; // preserved for compatibility
  underEyeRight?: RegionPosition;
  cheekLeft?: RegionPosition;
  cheekRight?: RegionPosition;
  jawline: RegionPosition;
  hasFace: boolean;
  boundingBox?: { minX: number; minY: number; maxX: number; maxY: number };
  rawLandmarks?: NormalizedLandmark[];
}

let landmarkerInstance: FaceLandmarker | null = null;
let landmarkerLoadingPromise: Promise<FaceLandmarker | null> | null = null;

/**
 * Initializes MediaPipe FaceLandmarker.
 * Tries local static assets first, then falls back to public CDN.
 * Tries GPU delegate first, then falls back to CPU.
 */
export async function initFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (landmarkerInstance) return landmarkerInstance;
  if (landmarkerLoadingPromise) return landmarkerLoadingPromise;

  landmarkerLoadingPromise = (async () => {
    // 1. Try local wasm files from /wasm
    let filesetResolver: any = null;
    try {
      filesetResolver = await FilesetResolver.forVisionTasks("/wasm");
    } catch (localWasmErr) {
      console.warn("Local wasm loader failed, falling back to CDN wasm:", localWasmErr);
      try {
        filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );
      } catch (cdnErr) {
        console.warn("CDN wasm loader failed:", cdnErr);
        return null;
      }
    }

    if (!filesetResolver) return null;

    // Try local model first, then CDN model
    const modelPaths = [
      "/models/face_landmarker.task",
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    ];

    for (const modelPath of modelPaths) {
      // Try GPU
      try {
        landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU"
          },
          runningMode: "IMAGE",
          numFaces: 2
        });
        if (landmarkerInstance) return landmarkerInstance;
      } catch (gpuErr) {
        // Try CPU
        try {
          landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: "CPU"
            },
            runningMode: "IMAGE",
            numFaces: 2
          });
          if (landmarkerInstance) return landmarkerInstance;
        } catch (cpuErr) {
          console.warn(`FaceLandmarker failed with model ${modelPath}:`, cpuErr);
        }
      }
    }

    return landmarkerInstance;
  })().finally(() => {
    landmarkerLoadingPromise = null;
  });

  return landmarkerLoadingPromise;
}

/**
 * Maps normalized [0, 1] coordinates from the natural image to container percentage coordinates [0, 100]
 * correctly handling object-fit: cover, object-fit: contain, image aspect ratio, scaling, and cropping.
 */
export function mapImageCoordsToContainer(
  normX: number,
  normY: number,
  imgElement: HTMLImageElement,
  containerElement: HTMLElement,
  objectFit: "cover" | "contain" = "cover"
): { x: number; y: number; visible: boolean } {
  const containerRect = containerElement.getBoundingClientRect();
  const cw = containerRect.width;
  const ch = containerRect.height;
  if (!cw || !ch) return { x: 50, y: 50, visible: false };

  const nw = imgElement.naturalWidth || cw;
  const nh = imgElement.naturalHeight || ch;
  if (!nw || !nh) return { x: 50, y: 50, visible: false };

  const containerAspect = cw / ch;
  const imageAspect = nw / nh;

  let rw = cw;
  let rh = ch;
  let offsetX = 0;
  let offsetY = 0;

  if (objectFit === "cover") {
    if (imageAspect > containerAspect) {
      // Image is wider than container: matches container height, cropped on left & right
      rh = ch;
      rw = ch * imageAspect;
      offsetX = (cw - rw) / 2;
      offsetY = 0;
    } else {
      // Image is taller than container: matches container width, cropped on top & bottom
      rw = cw;
      rh = cw / imageAspect;
      offsetX = 0;
      offsetY = (ch - rh) / 2;
    }
  } else {
    // object-fit: contain
    if (imageAspect > containerAspect) {
      rw = cw;
      rh = cw / imageAspect;
      offsetX = 0;
      offsetY = (ch - rh) / 2;
    } else {
      rh = ch;
      rw = ch * imageAspect;
      offsetX = (cw - rw) / 2;
      offsetY = 0;
    }
  }

  // Pixel position in container coordinate space
  const px = normX * rw + offsetX;
  const py = normY * rh + offsetY;

  // Percentage position in container
  const percentX = (px / cw) * 100;
  const percentY = (py / ch) * 100;

  // Check visibility inside container (with 2% margin)
  const visible = percentX >= 1 && percentX <= 99 && percentY >= 1 && percentY <= 99;

  return { x: percentX, y: percentY, visible };
}

/**
 * 1. FOREHEAD POSITION:
 * - Landmark 10: Hairline top border
 * - Landmark 151: Midline forehead
 * - Landmark 9 / 168: Glabella / eyebrow line
 * - Placed in the center of the forehead, strictly ABOVE eyebrows and below hairline.
 * - Adds a small upward offset so the label does not cover the skin-analysis target point.
 */
export function getForeheadPosition(
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): RegionPosition {
  const pt10 = landmarks[10];
  const pt151 = landmarks[151] || pt10;
  const pt9 = landmarks[9] || landmarks[168] || pt151;

  // Midline forehead center
  const targetX = pt151.x;
  // Position between eyebrows (pt9) and hairline (pt10)
  // pt10.y is smaller (higher up), pt9.y is larger (eyebrow height)
  const targetY = pt10.y * 0.40 + pt9.y * 0.60;

  const pointCoords = mapImageCoordsToContainer(targetX, targetY, img, container);

  // Label is placed slightly offset above the analysis point so skin remains visible
  const labelY = Math.max(pt10.y, targetY - Math.abs(pt9.y - pt10.y) * 0.22);
  const labelCoords = mapImageCoordsToContainer(targetX, labelY, img, container);

  return {
    x: labelCoords.x,
    y: labelCoords.y,
    pointX: pointCoords.x,
    pointY: pointCoords.y,
    visible: pointCoords.visible || labelCoords.visible
  };
}

/**
 * 2. T-ZONE POSITION:
 * - Placed around the center of the forehead-to-nose region (nasal bridge / nasion).
 * - Landmark 168 (glabella / upper bridge) / 6 (mid bridge) / 197.
 * - Centered on nasal bridge, above mouth and cheeks.
 */
export function getTZonePosition(
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): RegionPosition {
  // Landmark 6 / 168 is mid-upper nasal bridge
  const pt6 = landmarks[6] || landmarks[168] || landmarks[197];
  const pt197 = landmarks[197] || pt6;

  const targetX = pt6.x;
  const targetY = pt6.y;

  const pointCoords = mapImageCoordsToContainer(targetX, targetY, img, container);
  // Label slightly offset along bridge
  const labelCoords = mapImageCoordsToContainer(targetX, pt197.y, img, container);

  return {
    x: labelCoords.x,
    y: labelCoords.y,
    pointX: pointCoords.x,
    pointY: pointCoords.y,
    visible: pointCoords.visible
  };
}

/**
 * SINGLE UNDER-EYE POSITION:
 * Positioned laterally under the eye on the infraorbital margin, ensuring ample breathing
 * room away from the central nasal bridge so the T-Zone label is never obscured.
 */
export function getSingleUnderEyePosition(
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): RegionPosition {
  const eye1CenterNormX = (landmarks[33].x + landmarks[133].x) / 2;
  const eye2CenterNormX = (landmarks[362].x + landmarks[263].x) / 2;
  const isEye1ViewerLeft = eye1CenterNormX <= eye2CenterNormX;

  // Choose the viewer-right eye to balance against the viewer-left cheek
  const targetEye = isEye1ViewerLeft
    ? { inner: landmarks[362], outer: landmarks[263], lowerLid: landmarks[374], infra: landmarks[253] || landmarks[374] }
    : { inner: landmarks[133], outer: landmarks[33], lowerLid: landmarks[145], infra: landmarks[23] || landmarks[145] };

  // Place towards the lateral 65% of the eye width so it remains safely away from the nose bridge
  const normX = targetEye.inner.x * 0.32 + targetEye.outer.x * 0.68;
  const eyeWidth = Math.hypot(targetEye.outer.x - targetEye.inner.x, targetEye.outer.y - targetEye.inner.y);
  const targetY = targetEye.infra.y;
  const labelY = targetEye.lowerLid.y + eyeWidth * 0.28;

  const pointCoords = mapImageCoordsToContainer(normX, targetY, img, container);
  const labelCoords = mapImageCoordsToContainer(normX, labelY, img, container);

  return {
    x: labelCoords.x,
    y: labelCoords.y,
    pointX: pointCoords.x,
    pointY: pointCoords.y,
    visible: pointCoords.visible
  };
}

/**
 * SINGLE CHEEKS POSITION:
 * Positioned on the viewer-left cheek malar prominence to balance the viewer-right under-eye.
 */
export function getSingleCheekPosition(
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): RegionPosition {
  const cheek1 = landmarks[205] || landmarks[50] || landmarks[117];
  const cheek2 = landmarks[425] || landmarks[280] || landmarks[346];

  const isCheek1ViewerLeft = cheek1.x <= cheek2.x;
  const targetCheek = isCheek1ViewerLeft ? cheek1 : cheek2;

  const targetX = targetCheek.x;
  const targetY = targetCheek.y;

  const pointCoords = mapImageCoordsToContainer(targetX, targetY, img, container);
  const labelCoords = mapImageCoordsToContainer(targetX, targetY + 0.015, img, container);

  return {
    x: labelCoords.x,
    y: labelCoords.y,
    pointX: pointCoords.x,
    pointY: pointCoords.y,
    visible: pointCoords.visible
  };
}

/**
 * 3. UNDER-EYE POSITION (bilateral helper):
 * - Placed below each eye, centered under the corresponding eye.
 * - Dynamic left/right detection that handles mirrored/selfie cameras correctly.
 * - Right eye landmarks: 33 (outer), 133 (inner), 145 (lower lid), 23 (infraorbital margin).
 * - Left eye landmarks: 362 (inner), 263 (outer), 374 (lower lid), 253 (infraorbital margin).
 */
export function getUnderEyePosition(
  side: "left" | "right",
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): RegionPosition {
  // Calculate viewer-relative positions to handle mirrored images
  const eye1CenterNormX = (landmarks[33].x + landmarks[133].x) / 2;
  const eye2CenterNormX = (landmarks[362].x + landmarks[263].x) / 2;

  // The eye with the smaller screen X coordinate is viewer-left
  const isEye1ViewerLeft = eye1CenterNormX <= eye2CenterNormX;
  const isTargetEye1 = side === "left" ? isEye1ViewerLeft : !isEye1ViewerLeft;

  let normX: number;
  let targetY: number;
  let labelY: number;

  if (isTargetEye1) {
    const outer = landmarks[33];
    const inner = landmarks[133];
    const lowerLid = landmarks[145];
    const infra = landmarks[23] || lowerLid;
    const eyeWidth = Math.hypot(inner.x - outer.x, inner.y - outer.y);

    normX = (outer.x + inner.x) / 2;
    targetY = infra.y;
    // Label offset slightly lower so under-eye skin and orbital rim are visible
    labelY = lowerLid.y + eyeWidth * 0.26;
  } else {
    const inner = landmarks[362];
    const outer = landmarks[263];
    const lowerLid = landmarks[374];
    const infra = landmarks[253] || lowerLid;
    const eyeWidth = Math.hypot(outer.x - inner.x, outer.y - inner.y);

    normX = (inner.x + outer.x) / 2;
    targetY = infra.y;
    labelY = lowerLid.y + eyeWidth * 0.26;
  }

  const pointCoords = mapImageCoordsToContainer(normX, targetY, img, container);
  const labelCoords = mapImageCoordsToContainer(normX, labelY, img, container);

  return {
    x: labelCoords.x,
    y: labelCoords.y,
    pointX: pointCoords.x,
    pointY: pointCoords.y,
    visible: pointCoords.visible
  };
}

/**
 * 4. CHEEKS POSITION:
 * - Placed on each actual cheek prominence (malar region).
 * - Between side of nose (alar base) and outer cheek/ear boundary.
 * - Handles mirrored/selfie camera automatically.
 * - Subject right cheek: Landmark 50 / 205.
 * - Subject left cheek: Landmark 280 / 425.
 */
export function getCheekPosition(
  side: "left" | "right",
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): RegionPosition {
  const cheek1 = landmarks[205] || landmarks[50] || landmarks[117];
  const cheek2 = landmarks[425] || landmarks[280] || landmarks[346];

  // Cheek with smaller X is viewer-left
  const isCheek1ViewerLeft = cheek1.x <= cheek2.x;
  const targetCheek = side === "left"
    ? (isCheek1ViewerLeft ? cheek1 : cheek2)
    : (isCheek1ViewerLeft ? cheek2 : cheek1);

  const targetX = targetCheek.x;
  const targetY = targetCheek.y;

  const pointCoords = mapImageCoordsToContainer(targetX, targetY, img, container);
  // Label slightly offset outward or lower
  const labelCoords = mapImageCoordsToContainer(targetX, targetY + 0.015, img, container);

  return {
    x: labelCoords.x,
    y: labelCoords.y,
    pointX: pointCoords.x,
    pointY: pointCoords.y,
    visible: pointCoords.visible
  };
}

/**
 * 5. JAWLINE / CHIN POSITION:
 * - Placed on the lower jaw/chin contour.
 * - Landmark 199 (center of chin pad) or 152 (menton / chin contour).
 * - Follows lower facial contour, not in the middle of the neck.
 */
export function getJawlinePosition(
  landmarks: NormalizedLandmark[],
  img: HTMLImageElement,
  container: HTMLElement
): RegionPosition {
  const ptChin = landmarks[199] || landmarks[175] || landmarks[152];
  const ptMenton = landmarks[152] || ptChin;

  const targetX = ptChin.x;
  const targetY = ptChin.y;

  const pointCoords = mapImageCoordsToContainer(targetX, targetY, img, container);
  // Label positioned right on chin / lower contour
  const labelCoords = mapImageCoordsToContainer(targetX, (ptChin.y + ptMenton.y) / 2, img, container);

  return {
    x: labelCoords.x,
    y: labelCoords.y,
    pointX: pointCoords.x,
    pointY: pointCoords.y,
    visible: pointCoords.visible
  };
}

/**
 * Detects all face landmarks and calculates positions for all regions.
 * Selects the largest/primary face if multiple faces are present.
 * Returns null if no face is detected.
 */
export async function detectFaceLandmarkRegions(
  imgElement: HTMLImageElement,
  containerElement: HTMLElement
): Promise<DetectedFaceRegions | null> {
  const landmarker = await initFaceLandmarker();
  if (!landmarker) return null;

  try {
    const results = landmarker.detect(imgElement);
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }

    // Select primary face with largest bounding box
    let primaryFace = results.faceLandmarks[0];
    let maxBoundingBox = { minX: 1, minY: 1, maxX: 0, maxY: 0 };

    if (results.faceLandmarks.length > 1) {
      let maxArea = -1;
      for (const face of results.faceLandmarks) {
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        for (const pt of face) {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        }
        const area = (maxX - minX) * (maxY - minY);
        if (area > maxArea) {
          maxArea = area;
          primaryFace = face;
          maxBoundingBox = { minX, minY, maxX, maxY };
        }
      }
    } else {
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const pt of primaryFace) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
      maxBoundingBox = { minX, minY, maxX, maxY };
    }

    const forehead = getForeheadPosition(primaryFace, imgElement, containerElement);
    const tzone = getTZonePosition(primaryFace, imgElement, containerElement);
    const underEye = getSingleUnderEyePosition(primaryFace, imgElement, containerElement);
    const cheeks = getSingleCheekPosition(primaryFace, imgElement, containerElement);
    const underEyeLeft = getUnderEyePosition("left", primaryFace, imgElement, containerElement);
    const underEyeRight = getUnderEyePosition("right", primaryFace, imgElement, containerElement);
    const cheekLeft = getCheekPosition("left", primaryFace, imgElement, containerElement);
    const cheekRight = getCheekPosition("right", primaryFace, imgElement, containerElement);
    const jawline = getJawlinePosition(primaryFace, imgElement, containerElement);

    return {
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
      boundingBox: maxBoundingBox,
      rawLandmarks: primaryFace
    };
  } catch (err) {
    console.warn("Face detection error:", err);
    return null;
  }
}

/**
 * Calculates region positions from normalized coordinates (e.g. from server/Gemini fallback)
 */
export function calculateRegionsFromNormalizedPoints(
  landmarks: {
    forehead?: { x: number; y: number };
    tzone?: { x: number; y: number };
    underEye?: { x: number; y: number };
    cheeks?: { x: number; y: number };
    underEyeLeft?: { x: number; y: number };
    underEyeRight?: { x: number; y: number };
    cheekLeft?: { x: number; y: number };
    cheekRight?: { x: number; y: number };
    jawline?: { x: number; y: number };
  },
  imgElement: HTMLImageElement,
  containerElement: HTMLElement
): DetectedFaceRegions | null {
  if (!landmarks || !landmarks.forehead) return null;

  const toRegion = (pt?: { x: number; y: number }, offsetDy = 0): RegionPosition => {
    if (!pt) return { x: 50, y: 50, pointX: 50, pointY: 50, visible: false };
    const ptCoords = mapImageCoordsToContainer(pt.x, pt.y, imgElement, containerElement);
    const labelCoords = mapImageCoordsToContainer(pt.x, pt.y + offsetDy, imgElement, containerElement);
    return {
      x: labelCoords.x,
      y: labelCoords.y,
      pointX: ptCoords.x,
      pointY: ptCoords.y,
      visible: ptCoords.visible
    };
  };

  const singleUnderEyePoint = landmarks.underEye || landmarks.underEyeRight || landmarks.underEyeLeft;
  const singleCheekPoint = landmarks.cheeks || landmarks.cheekLeft || landmarks.cheekRight;

  return {
    forehead: toRegion(landmarks.forehead, -0.02),
    tzone: toRegion(landmarks.tzone, 0.01),
    underEye: toRegion(singleUnderEyePoint, 0.02),
    cheeks: toRegion(singleCheekPoint, 0.015),
    underEyeLeft: toRegion(landmarks.underEyeLeft, 0.02),
    underEyeRight: toRegion(landmarks.underEyeRight, 0.02),
    cheekLeft: toRegion(landmarks.cheekLeft, 0.015),
    cheekRight: toRegion(landmarks.cheekRight, 0.015),
    jawline: toRegion(landmarks.jawline, 0.01),
    hasFace: true
  };
}
