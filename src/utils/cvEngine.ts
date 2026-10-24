import { CVMeasurements, ImageQualityAssessment } from '../types';

/**
 * Real Computer Vision Processing Engine for FarmSage AI
 * Performs client-side canvas-based image analysis equivalent to OpenCV:
 * - Laplacian variance for sharpness / blur detection
 * - Luminance histogram for brightness & dynamic contrast
 * - Pixel-by-pixel color segmentation (Excess Green, Chlorosis Yellow, Necrotic Brown, Deep Dark)
 * - Spatial clustering for anomaly bounding boxes
 * - Canvas annotation overlay generation
 */

export interface AnalysisResult {
  measurements: CVMeasurements;
  quality: ImageQualityAssessment;
  annotatedImageUrl: string;
  maskImageUrl: string;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for processing: ' + e));
    img.src = src;
  });
}

export async function processCropImage(imageDataUrl: string): Promise<AnalysisResult> {
  const img = await loadImage(imageDataUrl);
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  // Scale down slightly for responsive real-time pixel processing while maintaining fidelity
  const maxDim = 800;
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;
  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  // Create canvas for pixel analysis
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context not available for computer vision processing.');
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const totalPixels = targetWidth * targetHeight;

  // 1. Convert to grayscale & compute brightness and contrast
  let sumLuminance = 0;
  const grayPixels = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Standard perceptual luminance formula (ITU-R BT.601)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    grayPixels[i] = lum;
    sumLuminance += lum;
  }

  const meanBrightness = sumLuminance / totalPixels;

  // Standard deviation of luminance for dynamic contrast
  let sumSquaredDiff = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = grayPixels[i] - meanBrightness;
    sumSquaredDiff += diff * diff;
  }
  const contrast = Math.sqrt(sumSquaredDiff / totalPixels);

  // 2. Real Laplacian Edge Detection & Variance (Blurriness Metric)
  // Convolution kernel:
  // [ 0,  1,  0 ]
  // [ 1, -4,  1 ]
  // [ 0,  1,  0 ]
  let sumLaplacian = 0;
  let validLaplacianCount = 0;
  const laplacianValues = new Float32Array((targetWidth - 2) * (targetHeight - 2));

  for (let y = 1; y < targetHeight - 1; y++) {
    for (let x = 1; x < targetWidth - 1; x++) {
      const idx = y * targetWidth + x;
      const top = (y - 1) * targetWidth + x;
      const bottom = (y + 1) * targetWidth + x;
      const left = y * targetWidth + (x - 1);
      const right = y * targetWidth + (x + 1);

      const lap = grayPixels[top] + grayPixels[bottom] + grayPixels[left] + grayPixels[right] - 4 * grayPixels[idx];
      laplacianValues[validLaplacianCount] = lap;
      sumLaplacian += lap;
      validLaplacianCount++;
    }
  }

  const meanLaplacian = sumLaplacian / validLaplacianCount;
  let sumLaplacianVar = 0;
  for (let i = 0; i < validLaplacianCount; i++) {
    const diff = laplacianValues[i] - meanLaplacian;
    sumLaplacianVar += diff * diff;
  }
  // Sharpness variance: higher means crisp edges; < 85 indicates significant motion or lens blur
  const sharpness = Number((sumLaplacianVar / validLaplacianCount).toFixed(2));

  // 3. Color Classification & Segmentation
  let greenPixels = 0;
  let yellowPixels = 0;
  let brownPixels = 0;
  let darkPixels = 0;
  let leafPixels = 0;

  // Grid for spatial clustering & bounding boxes (e.g. 24 columns x 24 rows)
  const gridCols = 24;
  const gridRows = 24;
  const cellW = targetWidth / gridCols;
  const cellH = targetHeight / gridRows;
  const anomalyGrid = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => ({
      yellow: 0,
      brown: 0,
      dark: 0,
      total: 0
    }))
  );

  // Create mask canvas for colored overlay
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = targetWidth;
  maskCanvas.height = targetHeight;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskImgData = maskCtx.createImageData(targetWidth, targetHeight);
  const mData = maskImgData.data;

  for (let y = 0; y < targetHeight; y++) {
    const gy = Math.min(gridRows - 1, Math.floor(y / cellH));
    for (let x = 0; x < targetWidth; x++) {
      const gx = Math.min(gridCols - 1, Math.floor(x / cellW));
      const i = y * targetWidth + x;
      const p = i * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const lum = grayPixels[i];

      anomalyGrid[gy][gx].total++;

      // Color classification rules
      // A. Excess Green Index (Vegetation / Foliage)
      const exG = 2 * g - r - b;
      const isGreen = g > r * 0.98 && g > b * 1.05 && (exG > 12 || (g > 70 && g > r && g > b));

      // B. Yellowing / Chlorosis indicator: Elevated red and green, low blue
      const isYellow =
        r > 125 &&
        g > 120 &&
        b < 115 &&
        r - b > 35 &&
        g - b > 30 &&
        Math.abs(r - g) < 55 &&
        lum > 90;

      // C. Necrotic Brown / Lesion indicator: R > G > B, muted tones, moderate-low luminance
      const isBrown =
        r > 65 &&
        r < 185 &&
        g > 35 &&
        g < 135 &&
        b > 15 &&
        b < 95 &&
        r > g &&
        g > b &&
        r - b > 25 &&
        lum < 160 &&
        !isYellow;

      // D. Dark spot / Deep necrosis / Soot indicator
      const isDark = lum < 48 && (isGreen || isBrown || isYellow || (r < 55 && g < 55 && b < 55));

      if (isGreen || isYellow || isBrown) {
        leafPixels++;
      }

      if (isYellow) {
        yellowPixels++;
        anomalyGrid[gy][gx].yellow++;
        // Mask: Golden Amber
        mData[p] = 245;
        mData[p + 1] = 195;
        mData[p + 2] = 30;
        mData[p + 3] = 180;
      } else if (isBrown) {
        brownPixels++;
        anomalyGrid[gy][gx].brown++;
        // Mask: Deep Rust / Terracotta
        mData[p] = 190;
        mData[p + 1] = 65;
        mData[p + 2] = 25;
        mData[p + 3] = 190;
      } else if (isDark) {
        darkPixels++;
        anomalyGrid[gy][gx].dark++;
        // Mask: Dark plum/charcoal
        mData[p] = 70;
        mData[p + 1] = 25;
        mData[p + 2] = 35;
        mData[p + 3] = 190;
      } else if (isGreen) {
        greenPixels++;
        // Translucent green tint on healthy zones
        mData[p] = 34;
        mData[p + 1] = 139;
        mData[p + 2] = 34;
        mData[p + 3] = 40;
      } else {
        // Transparent background
        mData[p + 3] = 0;
      }
    }
  }

  maskCtx.putImageData(maskImgData, 0, 0);

  // 4. Cluster Anomaly Hotspots into Bounding Boxes
  interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'yellow_zone' | 'brown_lesion' | 'dark_spot';
    areaPct: number;
  }
  const boundingBoxes: Box[] = [];

  // Identify high-density cells
  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      const cell = anomalyGrid[gy][gx];
      if (cell.total === 0) continue;
      const yellowRatio = cell.yellow / cell.total;
      const brownRatio = cell.brown / cell.total;
      const darkRatio = cell.dark / cell.total;

      if (brownRatio > 0.28) {
        boundingBoxes.push({
          x: Math.round(gx * cellW),
          y: Math.round(gy * cellH),
          width: Math.round(cellW),
          height: Math.round(cellH),
          type: 'brown_lesion',
          areaPct: Number((brownRatio * 100).toFixed(1))
        });
      } else if (yellowRatio > 0.35) {
        boundingBoxes.push({
          x: Math.round(gx * cellW),
          y: Math.round(gy * cellH),
          width: Math.round(cellW),
          height: Math.round(cellH),
          type: 'yellow_zone',
          areaPct: Number((yellowRatio * 100).toFixed(1))
        });
      } else if (darkRatio > 0.30) {
        boundingBoxes.push({
          x: Math.round(gx * cellW),
          y: Math.round(gy * cellH),
          width: Math.round(cellW),
          height: Math.round(cellH),
          type: 'dark_spot',
          areaPct: Number((darkRatio * 100).toFixed(1))
        });
      }
    }
  }

  // Merge nearby / adjacent boxes of the same type to create clean region indicators
  const mergedBoxes: Box[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < boundingBoxes.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);
    let box = { ...boundingBoxes[i] };

    for (let j = i + 1; j < boundingBoxes.length; j++) {
      if (visited.has(j)) continue;
      const other = boundingBoxes[j];
      if (box.type === other.type) {
        // If overlapping or directly touching
        const touchDist = 18;
        if (
          other.x <= box.x + box.width + touchDist &&
          other.x + other.width >= box.x - touchDist &&
          other.y <= box.y + box.height + touchDist &&
          other.y + other.height >= box.y - touchDist
        ) {
          visited.add(j);
          const minX = Math.min(box.x, other.x);
          const minY = Math.min(box.y, other.y);
          const maxX = Math.max(box.x + box.width, other.x + other.width);
          const maxY = Math.max(box.y + box.height, other.y + other.height);
          box.x = minX;
          box.y = minY;
          box.width = maxX - minX;
          box.height = maxY - minY;
        }
      }
    }
    // Only keep boxes with meaningful area
    if (box.width > 20 && box.height > 20) {
      mergedBoxes.push(box);
    }
  }

  // Limit to top 8 most prominent bounding boxes to keep HUD clean
  mergedBoxes.sort((a, b) => b.width * b.height - a.width * a.height);
  const finalBoxes = mergedBoxes.slice(0, 8);

  // 5. Build Annotated Image Canvas with HUD overlay
  const annotatedCanvas = document.createElement('canvas');
  annotatedCanvas.width = targetWidth;
  annotatedCanvas.height = targetHeight;
  const aCtx = annotatedCanvas.getContext('2d')!;

  // Draw original image
  aCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Draw translucent mask layer
  aCtx.globalAlpha = 0.55;
  aCtx.drawImage(maskCanvas, 0, 0);
  aCtx.globalAlpha = 1.0;

  // Draw Bounding Boxes with labels
  finalBoxes.forEach((box, index) => {
    let strokeColor = '#EAB308'; // Yellow
    let label = `ZONE ${index + 1}: Chlorosis Indicator`;
    if (box.type === 'brown_lesion') {
      strokeColor = '#DC2626'; // Red/Brown
      label = `ZONE ${index + 1}: Necrotic Tissue Marker`;
    } else if (box.type === 'dark_spot') {
      strokeColor = '#9333EA'; // Dark
      label = `ZONE ${index + 1}: Dark Spot Indicator`;
    }

    aCtx.strokeStyle = strokeColor;
    aCtx.lineWidth = 2.5;
    aCtx.setLineDash([6, 3]);
    aCtx.strokeRect(box.x, box.y, box.width, box.height);
    aCtx.setLineDash([]);

    // Label pill
    aCtx.font = 'bold 11px system-ui, sans-serif';
    const textWidth = aCtx.measureText(label).width;
    const badgeY = Math.max(16, box.y - 4);
    aCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    aCtx.fillRect(box.x, badgeY - 12, textWidth + 12, 16);
    aCtx.fillStyle = strokeColor;
    aCtx.fillRect(box.x, badgeY - 12, 3, 16);
    aCtx.fillStyle = '#FFFFFF';
    aCtx.fillText(label, box.x + 8, badgeY);

    // Crosshairs at center
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    aCtx.strokeStyle = strokeColor;
    aCtx.lineWidth = 1.5;
    aCtx.beginPath();
    aCtx.moveTo(cx - 6, cy);
    aCtx.lineTo(cx + 6, cy);
    aCtx.moveTo(cx, cy - 6);
    aCtx.lineTo(cx, cy + 6);
    aCtx.stroke();
  });

  // Computer Vision telemetry HUD banner at bottom
  const bannerHeight = 38;
  aCtx.fillStyle = 'rgba(15, 30, 20, 0.88)';
  aCtx.fillRect(0, targetHeight - bannerHeight, targetWidth, bannerHeight);
  aCtx.strokeStyle = '#2F5D3A';
  aCtx.lineWidth = 1;
  aCtx.beginPath();
  aCtx.moveTo(0, targetHeight - bannerHeight);
  aCtx.lineTo(targetWidth, targetHeight - bannerHeight);
  aCtx.stroke();

  // Metrics text on banner
  aCtx.font = '600 11px "JetBrains Mono", monospace, sans-serif';
  aCtx.fillStyle = '#A3E635';
  aCtx.fillText(`FarmSage CV Engine`, 12, targetHeight - 22);

  const greenPct = Number(((greenPixels / totalPixels) * 100).toFixed(1));
  const yellowPct = Number(((yellowPixels / totalPixels) * 100).toFixed(1));
  const brownPct = Number(((brownPixels / totalPixels) * 100).toFixed(1));
  const darkPct = Number(((darkPixels / totalPixels) * 100).toFixed(1));
  const foliagePct = Number(((leafPixels / totalPixels) * 100).toFixed(1));

  aCtx.font = '10px "JetBrains Mono", monospace, sans-serif';
  aCtx.fillStyle = '#E2E8F0';
  aCtx.fillText(
    `Sharpness: ${sharpness} | Brightness: ${Math.round(meanBrightness)} | Green: ${greenPct}% | Yellow: ${yellowPct}% | Brown: ${brownPct}%`,
    12,
    targetHeight - 8
  );

  // Disclaimer watermark
  aCtx.font = 'bold 9px system-ui, sans-serif';
  aCtx.fillStyle = '#FBBF24';
  const discText = 'VISUAL COMPUTER-VISION INDICATORS ONLY • NOT A CLINICAL DIAGNOSIS';
  const discWidth = aCtx.measureText(discText).width;
  if (targetWidth > discWidth + 300) {
    aCtx.fillText(discText, targetWidth - discWidth - 12, targetHeight - 14);
  }

  // 6. Quality Checks & Thresholds
  const isBlurry = sharpness < 70;
  const isTooDark = meanBrightness < 55;
  const isOverexposed = meanBrightness > 215;
  const isLowContrast = contrast < 28;
  const isPoorFraming = foliagePct < 8; // less than 8% leaf/plant coverage in image

  const warnings: ImageQualityAssessment['warnings'] = [];

  if (isBlurry) {
    warnings.push({
      code: 'BLURRY_IMAGE',
      level: 'warning',
      en: 'Low image sharpness detected (Laplacian variance < 70). Details may be obscured.',
      te: 'చిత్రం స్పష్టంగా లేదు (లాప్లాసియన్ పదును తక్కువ). ఆకు వివరాలు స్పష్టంగా కనిపించడం లేదు.'
    });
  }

  if (isTooDark) {
    warnings.push({
      code: 'POOR_LIGHTING_DARK',
      level: 'warning',
      en: 'Image is significantly underexposed. Color hues may be artificially darkened.',
      te: 'చిత్రంలో కాంతి తక్కువగా ఉంది. రంగులు నల్లగా కనిపించవచ్చు.'
    });
  }

  if (isOverexposed) {
    warnings.push({
      code: 'POOR_LIGHTING_BRIGHT',
      level: 'warning',
      en: 'Image has harsh glare or overexposure. Surface textures may be washed out.',
      te: 'చిత్రంలో అధిక కాంతి లేదా ఎండ మెరుపు ఉంది. ఆకు మచ్చలు తెల్లగా మారిపోవచ్చు.'
    });
  }

  if (isLowContrast) {
    warnings.push({
      code: 'LOW_CONTRAST',
      level: 'info',
      en: 'Hazy or low contrast photograph. Dynamic range is narrow.',
      te: 'చిత్రం మసకగా ఉంది. కాంట్రాస్ట్ తక్కువగా ఉంది.'
    });
  }

  if (isPoorFraming) {
    warnings.push({
      code: 'POOR_FOLIAGE_FRAMING',
      level: 'warning',
      en: 'Foliage covers under 8% of the frame. Please take a closer photo focusing on the leaf.',
      te: 'ఫోటోలో మొక్క ఆకు చాలా చిన్నగా ఉంది. దయచేసి ఆకు దగ్గరగా పెట్టి ఫోటో తీయండి.'
    });
  }

  let qualityScore = 100;
  if (isBlurry) qualityScore -= 30;
  if (isTooDark || isOverexposed) qualityScore -= 25;
  if (isLowContrast) qualityScore -= 15;
  if (isPoorFraming) qualityScore -= 25;
  qualityScore = Math.max(10, Math.min(100, qualityScore));

  const qualityAssessment: ImageQualityAssessment = {
    isValid: !isBlurry && !isPoorFraming && !isTooDark,
    isBlurry,
    isTooDark,
    isOverexposed,
    isLowContrast,
    isPoorFraming,
    qualityScore,
    warnings,
    recommendation: {
      en: isBlurry
        ? 'Hold your phone steady in natural indirect daylight at 15-20cm distance for sharper focus.'
        : isTooDark
        ? 'Capture in shaded daylight without heavy shadows for true color fidelity.'
        : isOverexposed
        ? 'Shield the leaf from direct harsh noon sunlight to prevent reflective glare.'
        : isPoorFraming
        ? 'Frame the affected leaf in the center so it fills at least 40% of the photograph.'
        : 'Image quality is suitable for visual evidence analysis and hypothesis generation.',
      te: isBlurry
        ? 'కెమెరా కదలకుండా స్థిరంగా ఉంచి, సహజ వెలుతురులో 15-20 సెం.మీ దూరం నుండి ఫోటో తీయండి.'
        : isTooDark
        ? 'నీడ ఉన్న సహజ పగటి వెలుతురులో ఫోటో తీయండి.'
        : isOverexposed
        ? 'ఎండ నేరుగా ఆకుపై పడకుండా చేతితో నీడ చేసి ఫోటో తీయండి.'
        : isPoorFraming
        ? 'ఆకు ఫోటోలో కనీసం సగభాగం కనిపించేలా దగ్గరగా ఫోటో తీయండి.'
        : 'దృశ్య విశ్లేషణ కోసం చిత్ర నాణ్యత అనుకూలంగా ఉంది.'
    }
  };

  const measurements: CVMeasurements = {
    width: naturalWidth,
    height: naturalHeight,
    megapixels: Number(((naturalWidth * naturalHeight) / 1000000).toFixed(2)),
    brightness: Math.round(meanBrightness),
    contrast: Math.round(contrast),
    sharpness,
    greenPercentage: greenPct,
    yellowPercentage: yellowPct,
    brownPercentage: brownPct,
    darkPercentage: darkPct,
    foliagePercentage: foliagePct,
    dominantColorHex: greenPct > yellowPct && greenPct > brownPct ? '#2F6D38' : yellowPct > brownPct ? '#CA8A04' : '#92400E',
    anomalyBoundingBoxes: finalBoxes
  };

  return {
    measurements,
    quality: qualityAssessment,
    annotatedImageUrl: annotatedCanvas.toDataURL('image/jpeg', 0.92),
    maskImageUrl: maskCanvas.toDataURL('image/png')
  };
}
