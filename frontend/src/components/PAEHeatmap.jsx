import { useRef, useEffect, forwardRef } from 'react';

/**
 * Renders an N x N matrix as an HTML Canvas Heatmap.
 * For nuestro sistema PAE: lower error -> dark blue/green. higher error -> white/red/yellow.
 */
const PAEHeatmap = forwardRef(function PAEHeatmap({ matrix, className = "" }, forwardedRef) {
  const canvasRef = useRef(null);

  const setRef = (el) => {
    canvasRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) forwardedRef.current = el;
  };

  useEffect(() => {
    if (!matrix || !matrix.length || !canvasRef.current) return;
    
    // N x N size
    const n = matrix.length;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set internal resolution of the canvas exactly to matrix size
    // to avoid blurring. CSS will handle the actual visual size scaling.
    canvas.width = n;
    canvas.height = n;
    
    // nuestro sistema style PAE mapping: 0 -> Dark blue/green, 30 -> White
    // A strict and fast implementation using ImageData
    const imgData = ctx.createImageData(n, n);
    const data = imgData.data;
    
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const val = matrix[y][x]; 
        // Normalize 0 to ~30 (max typical PAE)
        // val = 0 -> deep blue
        // val = 30 -> white
        let norm = val / 30.0;
        if (norm > 1.0) norm = 1.0;
        if (norm < 0) norm = 0;
        
        // Simple distinct gradient from deep emerald to soft white
        let r, g, b;
        
        // nuestro sistema color scheme logic:
        // Dark blue: 0, 83, 214 (Very Low Error)
        // Light blue: 101, 203, 243
        // Yellow: 255, 219, 19
        // Orange/Red: 255, 125, 69 (High Error)
        if (norm < 0.33) {
           const t = norm / 0.33;
           r = Math.round(0 + t * (101 - 0));
           g = Math.round(83 + t * (203 - 83));
           b = Math.round(214 + t * (243 - 214));
        } else if (norm < 0.66) {
           const t = (norm - 0.33) / 0.33;
           r = Math.round(101 + t * (255 - 101));
           g = Math.round(203 + t * (219 - 203));
           b = Math.round(243 + t * (19 - 243));
        } else {
           const t = (norm - 0.66) / 0.34;
           r = Math.round(255 + t * (255 - 255));
           g = Math.round(219 + t * (125 - 219));
           b = Math.round(19 + t * (69 - 19));
        }
        
        const idx = (y * n + x) * 4;
        data[idx] = r;     // Red
        data[idx + 1] = g; // Green
        data[idx + 2] = b; // Blue
        data[idx + 3] = 255; // Alpha
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  }, [matrix]);

  if (!matrix || matrix.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400 text-xs text-center rounded-lg ${className}`}>
        No PAE Data
      </div>
    );
  }

  return (
    <canvas
      ref={setRef}
      className={`image-pixelated rounded outline outline-1 outline-slate-200 dark:outline-slate-700 shadow-sm ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
});

export default PAEHeatmap;
