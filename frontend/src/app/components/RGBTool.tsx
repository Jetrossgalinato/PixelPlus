"use client";
import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { SlidersHorizontal } from "lucide-react";

type RGBToolProps = {
  imageDataUrl: string | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?: {
      type: "rgb";
      values: { r: number; g: number; b: number };
    }
  ) => void;
  disabled?: boolean;
  className?: string;
  resetSlidersSignal?: number; // increment to trigger reset
  layout?: "vertical" | "horizontal";
  popoutSliders?: boolean;
};

export default function RGBTool({
  imageDataUrl,
  onResult,
  disabled,
  resetSlidersSignal,
  popoutSliders = false,
  showSliders: showSlidersProp,
  setShowSliders: setShowSlidersProp,
}: RGBToolProps & {
  showSliders?: boolean;
  setShowSliders?: (show: boolean) => void;
}) {
  const [internalShowSliders, internalSetShowSliders] = useState(false);
  const showSliders =
    showSlidersProp !== undefined ? showSlidersProp : internalShowSliders;
  const setShowSliders =
    setShowSlidersProp !== undefined
      ? setShowSlidersProp
      : internalSetShowSliders;
  const [r, setR] = useState(1);
  const [g, setG] = useState(1);
  const [b, setB] = useState(1);
  // Reset sliders to default when resetSlidersSignal changes
  useEffect(() => {
    setR(1);
    setG(1);
    setB(1);
    // Optionally re-apply RGB with defaults if an image is loaded
    if (imageDataUrl) applyRGB(1, 1, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSlidersSignal]);

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const anchorElement = document.getElementById("rgb-slider-popout-anchor");
      const target = event.target as Node;

      // Check if click was outside both the sliders and the anchor element
      if (showSliders && popoutSliders && anchorElement) {
        // Find the first child of the anchor (the slider container)
        const sliderContainer = anchorElement.firstChild as Node;

        // If the click wasn't on the sliders, close them
        if (sliderContainer && !sliderContainer.contains(target)) {
          setShowSliders(false);
        }
      }
    }

    if (showSliders && popoutSliders) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSliders, popoutSliders, setShowSliders]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUrl = useRef<string | null>(null);

  // Apply RGB adjustment using backend
  const applyRGB = async (r: number, g: number, b: number) => {
    if (!imageDataUrl) return;
    setProcessing(true);
    setError(null);
    try {
      // Convert data URL to File
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "image.png", { type: blob.type });
      const formData = new FormData();
      formData.append("file", file);
      // Send to backend
      const apiRes = await fetch(
        `http://localhost:8000/rgb/?r=${r}&g=${g}&b=${b}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!apiRes.ok) throw new Error("Backend error");
      const outBlob = await apiRes.blob();
      // Create new URL but do NOT revoke the previous one - let the parent component manage URL lifecycle
      const url = URL.createObjectURL(outBlob);
      // Keep track of our last URL but don't revoke it here
      lastUrl.current = url;
      // Pass the URL and original to parent for history tracking
      onResult(url, imageDataUrl, {
        type: "rgb",
        values: { r, g, b },
      });
      console.log(`RGBTool: Created new blob URL: ${url}`);
      setProcessing(false);
    } catch (error) {
      console.error("RGB processing error:", error);
      setError("Error processing image");
      setProcessing(false);
    }
  };

  // When sliders change, update image
  function handleSliderChange(newR: number, newG: number, newB: number) {
    setR(newR);
    setG(newG);
    setB(newB);
    applyRGB(newR, newG, newB);
  }

  // Sliders UI component
  const slidersUI = (
    <div
      id="rgb-sliders"
      className="flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded shadow max-w-xs border border-gray-200 dark:border-gray-700"
      style={{ minWidth: 200 }}
    >
      <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
        Red:
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={r}
          onChange={(e) => handleSliderChange(Number(e.target.value), g, b)}
        />
        <span className="text-xs">{r.toFixed(2)}</span>
      </label>
      <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
        Green:
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={g}
          onChange={(e) => handleSliderChange(r, Number(e.target.value), b)}
        />
        <span className="text-xs">{g.toFixed(2)}</span>
      </label>
      <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
        Blue:
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={b}
          onChange={(e) => handleSliderChange(r, g, Number(e.target.value))}
        />
        <span className="text-xs">{b.toFixed(2)}</span>
      </label>
    </div>
  );

  return (
    <>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white cursor-pointer rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-50"
        onClick={() => setShowSliders(!showSliders)}
        disabled={disabled || !imageDataUrl}
        aria-expanded={showSliders}
        aria-controls="rgb-sliders"
        style={{ marginBottom: 0 }}
      >
        <SlidersHorizontal className="w-4 h-4" /> RGB
      </button>

      {/* Render sliders outside sidebar using portal if popoutSliders is true */}
      {popoutSliders && showSliders
        ? ReactDOM.createPortal(
            <div className="rgb-slider-container">{slidersUI}</div>,
            document.getElementById("rgb-slider-popout-anchor") as HTMLElement
          )
        : showSliders && slidersUI}

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
