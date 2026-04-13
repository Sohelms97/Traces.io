import SignaturePad from 'signature_pad';

export interface SignatureData {
  pad: SignaturePad;
  canvas: HTMLCanvasElement;
}

export function initSignaturePad(canvasId: string): SignatureData | null {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return null;

  const pad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255,255,255)',
    penColor: 'rgb(0,0,128)',
    minWidth: 0.5,
    maxWidth: 2.5
  });

  const resizeCanvas = () => {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Only resize if dimensions actually changed and are non-zero
    if (width > 0 && height > 0 && (canvas.width !== width * ratio || canvas.height !== height * ratio)) {
      const data = pad.toData(); // Save existing signature
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      pad.fromData(data); // Restore signature
    }
  };

  // Use ResizeObserver for better reliability with responsive layouts and animations
  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  resizeObserver.observe(canvas);

  // Initial resize
  resizeCanvas();

  return { pad, canvas };
}

export function saveSignature(pad: SignaturePad): string | null {
  if (pad.isEmpty()) {
    return null;
  }
  return pad.toDataURL('image/png');
}

export function clearSignature(pad: SignaturePad) {
  pad.clear();
}

export function createTypedSignature(name: string, font: string = 'cursive'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 300, 80);
  ctx.fillStyle = '#000080';
  ctx.font = `36px ${font}`;
  ctx.fillText(name, 10, 55);
  return canvas.toDataURL('image/png');
}

export function verifySignature(signatureData: string | null): boolean {
  if (!signatureData || signatureData === 'data:,') {
    return false;
  }
  return true;
}
