import { jsPDF } from 'jspdf';
import { CropScanRecord } from '../types';

export async function generateFarmSagePDFReport(scan: CropScanRecord): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // 1. Header Banner (Forest Green #214E34)
  doc.setFillColor(33, 78, 52);
  doc.rect(margin, yPos, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FarmSage AI', margin + 6, yPos + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Evidence-Driven Smart Farming Assistant | Agronomy Field Report', margin + 6, yPos + 16);

  doc.setFontSize(8);
  doc.setTextColor(220, 240, 225);
  const dateStr = new Date(scan.timestamp).toLocaleString();
  doc.text(`Report ID: ${scan.id.slice(0, 12)}`, pageWidth - margin - 50, yPos + 9);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 50, yPos + 16);

  yPos += 27;

  // 2. Crop Information Bar
  doc.setFillColor(245, 241, 232); // Warm cream
  doc.setDrawColor(220, 210, 195);
  doc.rect(margin, yPos, contentWidth, 16, 'FD');

  doc.setTextColor(30, 41, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Crop Type:', margin + 4, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(scan.cropType || 'Field Crop', margin + 25, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Stage:', margin + 60, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(scan.growthStage.toUpperCase(), margin + 74, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Field Block:', margin + 115, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(scan.fieldLocation || 'Main Field', margin + 135, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Farmer Notes:', margin + 4, yPos + 12);
  doc.setFont('helvetica', 'italic');
  const cleanNotes = scan.farmerNotes ? scan.farmerNotes.slice(0, 75) : 'None reported';
  doc.text(cleanNotes, margin + 28, yPos + 12);

  yPos += 20;

  // 3. Side-by-Side Images: Original Photo & Computer Vision Annotated Image
  doc.setTextColor(33, 78, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Visual Imagery & Computer-Vision Feature Map', margin, yPos);
  yPos += 4;

  const imgWidth = (contentWidth - 6) / 2;
  const imgHeight = 52;

  try {
    if (scan.originalImage) {
      doc.addImage(scan.originalImage, 'JPEG', margin, yPos, imgWidth, imgHeight);
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, imgWidth, imgHeight);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Original Field Capture', margin + 2, yPos + imgHeight + 4);
    }
    if (scan.annotatedImage) {
      doc.addImage(scan.annotatedImage, 'JPEG', margin + imgWidth + 6, yPos, imgWidth, imgHeight);
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + imgWidth + 6, yPos, imgWidth, imgHeight);
      doc.text('CV HUD: Laplacian & Color Mask Overlay', margin + imgWidth + 8, yPos + imgHeight + 4);
    }
  } catch (err) {
    console.warn('Failed embedding images in PDF:', err);
  }

  yPos += imgHeight + 8;

  // 4. Measured Evidence Table
  doc.setTextColor(33, 78, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Measured Computer-Vision Evidence Matrix', margin, yPos);
  yPos += 4;

  // Table header
  doc.setFillColor(232, 242, 234);
  doc.rect(margin, yPos, contentWidth, 7, 'F');
  doc.setTextColor(33, 78, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Metric Name', margin + 4, yPos + 5);
  doc.text('Measured Value', margin + 65, yPos + 5);
  doc.text('Reference Standard / Interpretation', margin + 105, yPos + 5);
  yPos += 7;

  const m = scan.measurements;
  const metricsRows = [
    { name: 'Sharpness (Laplacian σ²)', val: `${m.sharpness}`, interp: m.sharpness > 80 ? 'Crisp edge detail (PASS)' : 'Low edge definition (BLUR WARNING)' },
    { name: 'Average Luminance (Brightness)', val: `${m.brightness} / 255`, interp: m.brightness >= 60 && m.brightness <= 210 ? 'Balanced daylight exposure (PASS)' : 'Exposure anomaly' },
    { name: 'Dynamic Contrast (Std Dev)', val: `${m.contrast}`, interp: m.contrast > 30 ? 'High tonal differentiation' : 'Low dynamic contrast' },
    { name: 'Foliage / Canopy Ratio', val: `${m.foliagePercentage}%`, interp: m.foliagePercentage > 25 ? 'Sufficient leaf framing' : 'Background soil dominant' },
    { name: 'Chlorotic Yellowing Index', val: `${m.yellowPercentage}%`, interp: 'Visual yellow indicator area' },
    { name: 'Necrotic Brown Lesion Area', val: `${m.brownPercentage}%`, interp: 'Tissue collapse / spot indicator area' },
    { name: 'Dark Micro-Spots', val: `${m.darkPercentage}%`, interp: 'Deep necrotic or sooty spot area' }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  metricsRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 248);
      doc.rect(margin, yPos, contentWidth, 5.5, 'F');
    }
    doc.setTextColor(40, 50, 45);
    doc.text(row.name, margin + 4, yPos + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(row.val, margin + 65, yPos + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(row.interp, margin + 105, yPos + 4);
    yPos += 5.5;
  });

  yPos += 4;

  // 5. Image Quality Warnings (if any)
  if (scan.quality.warnings.length > 0) {
    doc.setFillColor(254, 243, 199); // Yellow warning box
    doc.setDrawColor(245, 158, 11);
    doc.rect(margin, yPos, contentWidth, 10 + scan.quality.warnings.length * 4, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Image Quality Warnings:', margin + 4, yPos + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 53, 15);
    scan.quality.warnings.forEach((w, wi) => {
      doc.text(`• ${w.en}`, margin + 6, yPos + 9 + wi * 4);
    });
    yPos += 14 + scan.quality.warnings.length * 4;
  }

  // Check if we need a new page for Diagnostic Synthesis
  if (yPos > pageHeight - 65) {
    doc.addPage();
    yPos = margin;
  }

  // 3. Likely Condition / Disease Identification
  if (scan.managementAdvice) {
    doc.setTextColor(33, 78, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Likely Condition / Disease Identification', margin, yPos);
    yPos += 5;

    doc.setFillColor(245, 248, 245);
    doc.setDrawColor(180, 210, 190);
    doc.rect(margin, yPos, contentWidth, 20, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(25, 60, 40);
    doc.text(`Likely Condition: ${scan.managementAdvice.likelyConditionEn}`, margin + 4, yPos + 6);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(70, 80, 75);
    doc.text(`Confidence: ${scan.managementAdvice.confidenceWordingEn}`, margin + 4, yPos + 11);

    const whySnippet = scan.managementAdvice.whyEvidenceEn.slice(0, 2).join('; ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Evidence Summary: ${whySnippet.slice(0, 115)}...`, margin + 4, yPos + 16);

    yPos += 24;
  }

  // 4. Relative Hypothesis Ranking (Differential)
  if (scan.hypotheses.length > 0) {
    if (yPos > pageHeight - 55) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(33, 78, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. Relative Hypothesis Ranking (Heuristic Differential)', margin, yPos);
    yPos += 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 105);
    doc.text('Notice: These scores represent heuristic evidence-based rankings and are not confirmed disease probabilities.', margin, yPos);
    yPos += 5;

    scan.hypotheses.forEach(h => {
      doc.setFillColor(248, 249, 246);
      doc.setDrawColor(215, 225, 218);
      doc.rect(margin, yPos, contentWidth, 14, 'FD');

      // Title & Score
      doc.setTextColor(33, 78, 52);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${h.titleEn.split('/')[0].trim()}`, margin + 4, yPos + 5);

      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text(`Relative Score: ${h.currentProbability}%`, margin + 115, yPos + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(60, 70, 65);
      const summary = `${h.visualEvidenceEn} | Missing: ${h.whatIsMissingEn || h.whyConsideredEn}`;
      doc.text(summary.slice(0, 118) + '...', margin + 4, yPos + 10);

      yPos += 16;
    });
  }

  // 5. Recommended Management & Treatment (6-Point Protocol)
  if (scan.managementAdvice) {
    if (yPos > pageHeight - 65) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(33, 78, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('5. Recommended Management & Treatment (6-Point Protocol)', margin, yPos);
    yPos += 5;

    const plan = scan.managementAdvice.sixPointPlan;
    const planItems = [
      `1. Immediate Steps: ${plan?.immediateSteps.en[0] || 'Inspect plant canopy directly.'}`,
      `2. Environmental / Irrigation: ${plan?.environmentalIrrigation.en[0] || 'Maintain balanced moisture.'}`,
      `3. Plant Management: ${plan?.affectedPlantManagement.en[0] || 'Prune diseased lower leaves.'}`,
      `4. Prevention: ${plan?.preventionMeasures.en[0] || 'Rotate crops and use certified seeds.'}`,
      `5. Monitoring (48-72h): ${plan?.monitoringFollowUp.en[0] || 'Monitor tagged plants for symptom spread.'}`,
      `6. Expert Confirmation: ${plan?.expertConfirmation.en.slice(0, 95) || 'Contact local KVK agronomist.'}...`
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(45, 55, 50);
    planItems.forEach(item => {
      doc.text(item, margin + 4, yPos);
      yPos += 4.5;
    });

    yPos += 3;
  }

  // 6. Adaptive Agent Decision Trace (7-Stage Summary)
  if (yPos > pageHeight - 55) {
    doc.addPage();
    yPos = margin;
  }

  doc.setTextColor(33, 78, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('6. Adaptive Agent Decision Trace (Audit Trail)', margin, yPos);
  yPos += 5;

  scan.agentTrace.forEach(step => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(50, 60, 55);
    doc.text(`[${step.phase}] ${step.titleEn}`, margin + 2, yPos);
    yPos += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 90, 85);
    const splitDetails = doc.splitTextToSize(step.detailsEn, contentWidth - 4);
    doc.text(splitDetails, margin + 4, yPos);
    yPos += splitDetails.length * 3.2 + 2;
  });

  // 7. Mandatory Legal & Safety Disclaimer Box
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.rect(margin, yPos, contentWidth, 22, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MANDATORY SAFETY & LEGAL DISCLAIMER:', margin + 4, yPos + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(127, 29, 29);
  const disclaimerText =
    'FarmSage AI provides observational computer-vision measurements and educational hypotheses only. Color regions are physical visual markers and NEVER constitute a laboratory pathological diagnosis. Prioritize cultural and biological practices. Use only locally approved treatments recommended for this crop and condition, and follow product labels or guidance from a qualified agricultural professional (AEO / KVK).';
  const discLines = doc.splitTextToSize(disclaimerText, contentWidth - 8);
  doc.text(discLines, margin + 4, yPos + 9);

  // Save the PDF
  const filename = `FarmSage_Report_${(scan.cropType || 'Crop').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}
