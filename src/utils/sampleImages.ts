/**
 * Real procedurally-generated biological leaf test images
 * Created on an HTML5 canvas with realistic chlorosis zones,
 * necrotic spots, and green foliage for instant verified testing.
 */

export function generateSampleLeafImage(type: 'tomato' | 'paddy' | 'chilli' | 'healthy' | 'blurry'): string {
  const width = 640;
  const height = 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background: warm field soil / mulch texture
  ctx.fillStyle = '#4A3B32';
  ctx.fillRect(0, 0, width, height);
  // Add some soil noise
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillStyle = Math.random() > 0.5 ? '#3A2B22' : '#5A4B42';
    ctx.fillRect(rx, ry, 2, 2);
  }

  if (type === 'healthy') {
    // Healthy, vibrant green leaf with pristine chlorophyll and crisp veins
    ctx.save();
    ctx.translate(width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(0, -185);
    ctx.bezierCurveTo(115, -110, 125, 45, 0, 165);
    ctx.bezierCurveTo(-125, 45, -115, -110, 0, -185);
    ctx.closePath();

    const hGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 140);
    hGrad.addColorStop(0, '#2E7D32'); // Rich deep chlorophyll
    hGrad.addColorStop(0.65, '#388E3C');
    hGrad.addColorStop(1.0, '#4CAF50'); // Vibrant green margin
    ctx.fillStyle = hGrad;
    ctx.fill();

    // Pristine, crisp veins
    ctx.strokeStyle = '#81C784';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -175);
    ctx.lineTo(0, 155);
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let y = -130; y <= 110; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(45, y - 8, 80, y - 22);
      ctx.moveTo(0, y + 10);
      ctx.quadraticCurveTo(-45, y, -80, y - 14);
      ctx.stroke();
    }
    ctx.restore();
  } else if (type === 'blurry') {
    // Out of focus / motion blur leaf with low sharpness (Laplacian variance < 60)
    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.translate(width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(0, -160);
    ctx.bezierCurveTo(90, -90, 90, 50, 0, 140);
    ctx.bezierCurveTo(-90, 50, -90, -90, 0, -160);
    ctx.closePath();

    ctx.fillStyle = '#689F38';
    ctx.fill();

    // Vague undefined blur zones
    ctx.beginPath();
    ctx.arc(20, -10, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#A1887F';
    ctx.fill();

    ctx.restore();

    // Extra full-canvas soft blur passes to ensure Laplacian variance falls below threshold 70
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = width;
    blurCanvas.height = height;
    const bCtx = blurCanvas.getContext('2d')!;
    bCtx.filter = 'blur(10px)';
    bCtx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(blurCanvas, 0, 0);
  } else if (type === 'tomato') {
    // Tomato composite leaf with serrated leaflets
    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Main leaflet shape
    ctx.beginPath();
    ctx.moveTo(0, -180);
    ctx.bezierCurveTo(90, -120, 110, 40, 0, 160);
    ctx.bezierCurveTo(-110, 40, -90, -120, 0, -180);
    ctx.closePath();

    // Leaf body gradient: green center transitioning to yellow/chlorotic margins
    const grad = ctx.createRadialGradient(0, 0, 30, 0, 0, 130);
    grad.addColorStop(0, '#388E3C'); // Healthy deep green
    grad.addColorStop(0.55, '#4CAF50'); // Vibrant green
    grad.addColorStop(0.85, '#D4E157'); // Chlorotic light yellow-green
    grad.addColorStop(1.0, '#E6B800'); // Yellow chlorosis at margins
    ctx.fillStyle = grad;
    ctx.fill();

    // Central & lateral veins
    ctx.strokeStyle = '#81C784';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -170);
    ctx.lineTo(0, 150);
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let y = -120; y <= 100; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(40, y - 10, 70, y - 25);
      ctx.moveTo(0, y + 10);
      ctx.quadraticCurveTo(-40, y, -70, y - 15);
      ctx.stroke();
    }

    // Several distinct necrotic brown lesion spots with concentric rings
    const spots = [
      { x: 35, y: -45, r: 18 },
      { x: -40, y: 30, r: 24 },
      { x: 20, y: 75, r: 15 },
      { x: -25, y: -90, r: 14 }
    ];

    spots.forEach(sp => {
      // Yellow halo around spot
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(234, 179, 8, 0.65)';
      ctx.fill();

      // Brown necrotic core
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fillStyle = '#8B3A1C'; // Rust brown
      ctx.fill();

      // Dark sunken center
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#2B1408'; // Dark necrotic
      ctx.fill();
    });

    ctx.restore();
  } else if (type === 'paddy') {
    // Elongated Rice/Paddy leaf blade
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-0.25);

    ctx.beginPath();
    ctx.moveTo(-240, 20);
    ctx.quadraticCurveTo(-100, -50, 0, -45);
    ctx.quadraticCurveTo(140, -40, 240, -8);
    ctx.quadraticCurveTo(140, 35, 0, 40);
    ctx.quadraticCurveTo(-100, 35, -240, 20);
    ctx.closePath();

    const pGrad = ctx.createLinearGradient(-240, 0, 240, 0);
    pGrad.addColorStop(0, '#2E7D32');
    pGrad.addColorStop(0.3, '#43A047');
    pGrad.addColorStop(0.7, '#D4E157');
    pGrad.addColorStop(1, '#FDD835');
    ctx.fillStyle = pGrad;
    ctx.fill();

    // Parallel venation
    ctx.strokeStyle = '#A5D6A7';
    ctx.lineWidth = 1.5;
    for (let offset = -35; offset <= 35; offset += 8) {
      ctx.beginPath();
      ctx.moveTo(-230, offset);
      ctx.quadraticCurveTo(0, offset * 0.8, 230, offset * 0.4);
      ctx.stroke();
    }

    // Spindle-shaped blast/blight lesion with gray center and brown margin
    const blightSpots = [
      { x: -50, y: -5, w: 60, h: 22 },
      { x: 60, y: 0, w: 75, h: 26 },
      { x: 150, y: -2, w: 45, h: 18 }
    ];

    blightSpots.forEach(b => {
      // Outer brown margin
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#793315';
      ctx.fill();

      // Inner necrotic gray center
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.w / 3.2, b.h / 3.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4A4238';
      ctx.fill();
    });

    ctx.restore();
  } else {
    // Chilli leaf with interveinal chlorosis & curled margins
    ctx.save();
    ctx.translate(width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(0, -170);
    ctx.bezierCurveTo(110, -90, 100, 70, 0, 150);
    ctx.bezierCurveTo(-100, 70, -110, -90, 0, -170);
    ctx.closePath();

    // Strong interveinal yellowing pattern
    ctx.fillStyle = '#F5EE73'; // Pale chlorotic yellow base
    ctx.fill();

    // Leaf veins remaining green (typical Iron/Zinc/Magnesium pattern)
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, -160);
    ctx.lineTo(0, 140);
    ctx.stroke();

    ctx.lineWidth = 4;
    for (let y = -110; y <= 90; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(35, y - 8, 75, y - 22);
      ctx.moveTo(0, y + 8);
      ctx.quadraticCurveTo(-35, y, -75, y - 14);
      ctx.stroke();
    }

    // Marginal scorch tips
    ctx.fillStyle = '#9C3E14';
    ctx.beginPath();
    ctx.moveTo(0, -170);
    ctx.lineTo(15, -150);
    ctx.lineTo(-15, -150);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}
