import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import './SignaturePad.css';

export interface SignaturePadRef {
  clearSignature: () => void;
  readSignature: () => void;
}

interface SignaturePadProps {
  onOK: (signature: string) => void;
  defaultValue?: string;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onOK, defaultValue }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    clearSignature: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Re-fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    },
    readSignature: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUri = canvas.toDataURL('image/png');
        onOK(dataUri);
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      // Setup canvas size based on container
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';

        // Load existing signature if available
        if (defaultValue) {
          const img = new window.Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = defaultValue;
        }
      }
    }
  }, [defaultValue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Prevent scrolling when drawing on touch devices
    const handleTouchMove = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };
    
    if (canvas) {
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      return () => {
        canvas.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [isDrawing]); // Only run when isDrawing state changes

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.PointerEvent).clientX - rect.left,
        y: (e as React.PointerEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div ref={containerRef} className="signature-pad-container">
      <canvas
        ref={canvasRef}
        className="signature-pad-canvas"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      />
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
