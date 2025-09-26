"use client";
import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";

type RGBToolProps = {
  imageDataUrl: string | null;
  onResult: (url: string, originalForUndo?: string) => void;
  disabled?: boolean;
  className?: string;
  resetSlidersSignal?: number; // increment to trigger reset
  layout?: "vertical" | "horizontal";
};

export default function RGBTool({
  imageDataUrl,
  onResult,
  disabled,
  className = "",
  resetSlidersSignal,
  layout = "vertical",
}: RGBToolProps) {
  const [showSliders, setShowSliders] = useState(false);
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

  // When sliders change, update image
  function handleSliderChange(newR: number, newG: number, newB: number) {
    setR(newR);
    setG(newG);
    setB(newB);
    applyRGB(newR, newG, newB);
  }

  return (
    <div
      className={className}
      style={
        layout === "horizontal" ? { display: "flex", alignItems: "center" } : {}
      }
    >
      <button
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition disabled:opacity-50"
        onClick={() => setShowSliders((v) => !v)}
        disabled={disabled || !imageDataUrl}
        aria-expanded={showSliders}
        aria-controls="rgb-sliders"
        style={{ marginBottom: layout === "vertical" && showSliders ? 0 : 0 }}
      >
        <SlidersHorizontal className="w-4 h-4" /> RGB
      </button>
      {/* Sliders: right of button if horizontal, below if vertical */}
      {layout === "horizontal" ? (
        showSliders && (
          <div
            id="rgb-sliders"
            className="ml-4 flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded shadow max-w-xs"
            style={{ minWidth: 180 }}
          >
            <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
              Red:{" "}
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={r}
                onChange={(e) =>
                  handleSliderChange(Number(e.target.value), g, b)
                }
              />
              <span className="text-xs">{r.toFixed(2)}</span>
            </label>
            <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
              Green:{" "}
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={g}
                onChange={(e) =>
                  handleSliderChange(r, Number(e.target.value), b)
                }
              />
              <span className="text-xs">{g.toFixed(2)}</span>
            </label>
            <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
              Blue:{" "}
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={b}
                onChange={(e) =>
                  handleSliderChange(r, g, Number(e.target.value))
                }
              />
              <span className="text-xs">{b.toFixed(2)}</span>
            </label>
          </div>
        )
      ) : (
        <div style={{ minHeight: 120, transition: "min-height 0.2s" }}>
          {showSliders && (
            <div
              id="rgb-sliders"
              className="mt-3 flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded shadow max-w-xs"
            >
              <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
                Red:{" "}
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  value={r}
                  onChange={(e) =>
                    handleSliderChange(Number(e.target.value), g, b)
                  }
                />
                <span className="text-xs">{r.toFixed(2)}</span>
              </label>
              <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
                Green:{" "}
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  value={g}
                  onChange={(e) =>
                    handleSliderChange(r, Number(e.target.value), b)
                  }
                />
                <span className="text-xs">{g.toFixed(2)}</span>
              </label>
              <label className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
                Blue:{" "}
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  value={b}
                  onChange={(e) =>
                    handleSliderChange(r, g, Number(e.target.value))
                  }
                />
                <span className="text-xs">{b.toFixed(2)}</span>
              </label>
            </div>
          )}
        </div>
      )}
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
    </div>
  );
}
