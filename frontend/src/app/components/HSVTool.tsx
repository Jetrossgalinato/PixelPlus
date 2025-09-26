"use client";
import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { SlidersHorizontal } from "lucide-react";

type HSVToolProps = {
  imageDataUrl: string | null;
  onResult: (url: string, originalForUndo?: string) => void;
  disabled?: boolean;
  className?: string;
  resetSlidersSignal?: number;
  layout?: "vertical" | "horizontal";
  popoutSliders?: boolean;
};

export default function HSVTool({
  imageDataUrl,
  onResult,
  disabled,
  resetSlidersSignal,
  popoutSliders = false,
}: HSVToolProps) {
  const [showSliders, setShowSliders] = useState(false);
  const [h, setH] = useState(0);
  const [s, setS] = useState(1);
  const [v, setV] = useState(1);
  useEffect(() => {
    setH(0);
    setS(1);
    setV(1);
    if (imageDataUrl) applyHSV(0, 1, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSlidersSignal]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUrl = useRef<string | null>(null);

  // Apply HSV adjustment using backend
  const applyHSV = async (h: number, s: number, v: number) => {
    if (!imageDataUrl) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "image.png", { type: blob.type });
      const formData = new FormData();
      formData.append("file", file);
      // Send to backend
      const apiRes = await fetch(
        `http://localhost:8000/hsv/?h=${h}&s=${s}&v=${v}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!apiRes.ok) throw new Error("Backend error");
      const outBlob = await apiRes.blob();
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
      const url = URL.createObjectURL(outBlob);
      lastUrl.current = url;
      onResult(url, imageDataUrl);
      setProcessing(false);
    } catch {
      setError("Error processing image");
      setProcessing(false);
    }
  };

  function handleSliderChange(newH: number, newS: number, newV: number) {
    setH(newH);
    setS(newS);
    setV(newV);
    applyHSV(newH, newS, newV);
  }

  const sliders = (
    <div
      id="hsv-sliders"
      className="flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded shadow max-w-xs border border-gray-200 dark:border-gray-700"
      style={{ minWidth: 200 }}
    >
      <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
        Hue:
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={h}
          onChange={(e) => handleSliderChange(Number(e.target.value), s, v)}
        />
        <span className="text-xs">{h}</span>
      </label>
      <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
        Saturation:
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={s}
          onChange={(e) => handleSliderChange(h, Number(e.target.value), v)}
        />
        <span className="text-xs">{s.toFixed(2)}</span>
      </label>
      <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
        Value:
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={v}
          onChange={(e) => handleSliderChange(h, s, Number(e.target.value))}
        />
        <span className="text-xs">{v.toFixed(2)}</span>
      </label>
    </div>
  );

  return (
    <>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg shadow hover:bg-yellow-700 transition disabled:opacity-50"
        onClick={() => setShowSliders((v) => !v)}
        disabled={disabled || !imageDataUrl}
        aria-expanded={showSliders}
        aria-controls="hsv-sliders"
        style={{ marginBottom: 0 }}
      >
        <SlidersHorizontal className="w-4 h-4" /> HSV
      </button>
      {popoutSliders && showSliders
        ? typeof window !== "undefined" &&
          document.getElementById("hsv-slider-popout-anchor")
          ? ReactDOM.createPortal(
              sliders,
              document.getElementById("hsv-slider-popout-anchor") as HTMLElement
            )
          : null
        : showSliders && sliders}
      {processing && (
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          Processing...
        </div>
      )}
      {error && (
        <div className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
