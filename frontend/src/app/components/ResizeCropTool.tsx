"use client";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Scale3D } from "lucide-react";
import {
  resizeImage,
  applyInterpolation,
  cropImage,
  type InterpMethod,
} from "../services/scaleResizeService";

type Props = {
  imageDataUrl: string | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?:
      | {
          type: "resize";
          values: { w: number; h: number; interp: InterpMethod };
        }
      | { type: "interpolation"; values: { method: InterpMethod } }
      | { type: "crop"; values: { x: number; y: number; w: number; h: number } }
  ) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// Utility function to ensure valid dimensions
const ensureValidNumber = (value: string | number, min: number = 1): number => {
  const parsed = typeof value === "string" ? parseInt(value) : value;
  return isNaN(parsed) || parsed < min ? min : parsed;
};

export default function ResizeCropTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"resize" | "interpolation" | "crop">(
    "resize"
  );

  const [interp, setInterp] = useState<InterpMethod>("linear");

  // Store original image dimensions
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  // resize - now using scaling factors where 1.0 = original size
  const [scaleX, setScaleX] = useState<number>(1.0);
  const [scaleY, setScaleY] = useState<number>(1.0);
  const [keepAspect, setKeepAspect] = useState<boolean>(true); // Default to true for better UX

  // Computed width and height in pixels based on scaling factors
  const w = Math.round(originalWidth * scaleX);
  const h = Math.round(originalHeight * scaleY);

  // Initialize dimensions based on the actual image when it becomes available
  useEffect(() => {
    if (imageDataUrl) {
      const img = new Image();
      img.onload = () => {
        // Store original image dimensions
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);

        // Set scale factor to 1.0 (original size)
        setScaleX(1.0);
        setScaleY(1.0);

        // No need to set aspect ratio for scaling factors
      };
      img.src = imageDataUrl;
    }
  }, [imageDataUrl]);

  // crop
  const [cx, setCx] = useState<number>(0);
  const [cy, setCy] = useState<number>(0);
  const [cw, setCw] = useState<number>(256);
  const [ch, setCh] = useState<number>(256);
  const [clamp, setClamp] = useState<boolean>(true);

  const closeModal = () => {
    setShowModal(false);
    onOpenChange?.(false);
  };

  const handleApply = async () => {
    if (!imageDataUrl) return;
    try {
      let url = imageDataUrl;
      if (mode === "resize") {
        // Use computed w and h (from scaling factors) for resize API
        url = await resizeImage(imageDataUrl, w, h, interp);
        onResult(url, imageDataUrl, {
          type: "resize",
          values: { w, h, interp },
        });
      } else if (mode === "interpolation") {
        // reuse resize with method only; default to same size but different method if user set none
        url = await applyInterpolation(imageDataUrl, interp, {
          width: w,
          height: h,
        });
        onResult(url, imageDataUrl, {
          type: "interpolation",
          values: { method: interp },
        });
      } else if (mode === "crop") {
        url = await cropImage(imageDataUrl, cx, cy, cw, ch, clamp);
        onResult(url, imageDataUrl, {
          type: "crop",
          values: { x: cx, y: cy, w: cw, h: ch },
        });
      }
      closeModal();
    } catch (err) {
      console.error("Apply failed:", err);
    }
  };

  // We no longer need to store aspect ratio as a separate state
  // Track which dimension was last changed to avoid infinite loops
  const [lastChanged, setLastChanged] = useState<"width" | "height" | null>(
    null
  );

  // For scaling factors, we don't need a separate aspect ratio state
  // The original image's aspect ratio is maintained by the scaling factors themselves

  // Handle dimension changes to maintain aspect ratio
  // Now updating scale factors instead of direct dimensions
  const handleWidthChange = (value: string) => {
    const newPixelWidth = ensureValidNumber(value, 1);
    // Convert pixel width back to scale factor
    const newScaleX = originalWidth > 0 ? newPixelWidth / originalWidth : 1.0;
    setScaleX(newScaleX);
    setLastChanged("width");
  };

  const handleHeightChange = (value: string) => {
    const newPixelHeight = ensureValidNumber(value, 1);
    // Convert pixel height back to scale factor
    const newScaleY =
      originalHeight > 0 ? newPixelHeight / originalHeight : 1.0;
    setScaleY(newScaleY);
    setLastChanged("height");
  };

  // Crop dimension handlers
  const handleCropX = (value: string) => setCx(ensureValidNumber(value, 0));
  const handleCropY = (value: string) => setCy(ensureValidNumber(value, 0));
  const handleCropWidth = (value: string) => setCw(ensureValidNumber(value, 1));
  const handleCropHeight = (value: string) =>
    setCh(ensureValidNumber(value, 1));

  useEffect(() => {
    if (!keepAspect) return;

    // When keeping aspect ratio, both scale factors should be equal
    if (lastChanged === "width" && scaleX > 0) {
      // Set Y scale to match X scale to maintain aspect ratio
      if (scaleX !== scaleY) {
        setScaleY(scaleX);
      }
    } else if (lastChanged === "height" && scaleY > 0) {
      // Set X scale to match Y scale to maintain aspect ratio
      if (scaleY !== scaleX) {
        setScaleX(scaleY);
      }
    }
  }, [scaleX, scaleY, keepAspect, lastChanged]);

  const modal = (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 min-w-[360px] w-[420px] relative">
      <button
        className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl font-bold"
        onClick={closeModal}
        title="Close"
      >
        ×
      </button>
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white">Resize / Crop</h3>

        <div className="flex gap-2 text-sm">
          <button
            className={`px-3 py-1 rounded ${
              mode === "resize"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
            onClick={() => setMode("resize")}
          >
            Resize
          </button>
          <button
            className={`px-3 py-1 rounded ${
              mode === "interpolation"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
            onClick={() => setMode("interpolation")}
          >
            Interpolation
          </button>
          <button
            className={`px-3 py-1 rounded ${
              mode === "crop"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
            onClick={() => setMode("crop")}
          >
            Crop
          </button>
        </div>

        {/* Resize */}
        {mode === "resize" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">Resize</div>
            <div className="flex gap-2">
              <label className="text-xs text-gray-200 flex-1">
                Width ({w}px)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={scaleX.toFixed(1)}
                  onChange={(e) =>
                    handleWidthChange(
                      Math.round(
                        originalWidth * parseFloat(e.target.value)
                      ).toString()
                    )
                  }
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  title="Scale factor where 1.0 is original size"
                />
                <span className="text-gray-400 text-xs">
                  Scale: {scaleX.toFixed(1)}x
                </span>
              </label>
              <label className="text-xs text-gray-200 flex-1">
                Height ({h}px)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={scaleY.toFixed(1)}
                  onChange={(e) =>
                    handleHeightChange(
                      Math.round(
                        originalHeight * parseFloat(e.target.value)
                      ).toString()
                    )
                  }
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  title="Scale factor where 1.0 is original size"
                />
                <span className="text-gray-400 text-xs">
                  Scale: {scaleY.toFixed(1)}x
                </span>
              </label>
            </div>
            <label className="text-xs text-gray-200 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={keepAspect}
                onChange={(e) => setKeepAspect(e.target.checked)}
              />{" "}
              Keep Aspect
            </label>
            <label className="text-xs text-gray-200">
              Interpolation
              <select
                value={interp}
                onChange={(e) => setInterp(e.target.value as InterpMethod)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="nearest">Nearest</option>
                <option value="linear">Linear (Bilinear)</option>
                <option value="cubic">Cubic</option>
                <option value="area">Area</option>
                <option value="lanczos">Lanczos4</option>
              </select>
            </label>
          </div>
        )}

        {/* Interpolation (method focus) */}
        {mode === "interpolation" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">
              Interpolation
            </div>
            <label className="text-xs text-gray-200">
              Method
              <select
                value={interp}
                onChange={(e) => setInterp(e.target.value as InterpMethod)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="nearest">Nearest</option>
                <option value="linear">Linear (Bilinear)</option>
                <option value="cubic">Cubic</option>
                <option value="area">Area</option>
                <option value="lanczos">Lanczos4</option>
              </select>
            </label>
            <div className="text-xs text-gray-400">
              Applies resize with the chosen interpolation to target size.
            </div>
            <div className="flex gap-2">
              <label className="text-xs text-gray-200 flex-1">
                Width ({w}px)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={scaleX.toFixed(1)}
                  onChange={(e) =>
                    handleWidthChange(
                      Math.round(
                        originalWidth * parseFloat(e.target.value)
                      ).toString()
                    )
                  }
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  title="Scale factor where 1.0 is original size"
                />
                <span className="text-gray-400 text-xs">
                  Scale: {scaleX.toFixed(1)}x
                </span>
              </label>
              <label className="text-xs text-gray-200 flex-1">
                Height ({h}px)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={scaleY.toFixed(1)}
                  onChange={(e) =>
                    handleHeightChange(
                      Math.round(
                        originalHeight * parseFloat(e.target.value)
                      ).toString()
                    )
                  }
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  title="Scale factor where 1.0 is original size"
                />
                <span className="text-gray-400 text-xs">
                  Scale: {scaleY.toFixed(1)}x
                </span>
              </label>
            </div>
            <label className="text-xs text-gray-200 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={keepAspect}
                onChange={(e) => setKeepAspect(e.target.checked)}
              />{" "}
              Keep Aspect
            </label>
          </div>
        )}

        {/* Crop */}
        {mode === "crop" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">
              Crop Rectangle
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-200">
                X
                <input
                  type="number"
                  value={cx}
                  onChange={(e) => handleCropX(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200">
                Y
                <input
                  type="number"
                  value={cy}
                  onChange={(e) => handleCropY(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200">
                Width
                <input
                  type="number"
                  min={1}
                  value={cw}
                  onChange={(e) => handleCropWidth(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200">
                Height
                <input
                  type="number"
                  min={1}
                  value={ch}
                  onChange={(e) => handleCropHeight(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
            </div>
            <label className="text-xs text-gray-200 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={clamp}
                onChange={(e) => setClamp(e.target.checked)}
              />{" "}
              Clamp to bounds
            </label>
          </div>
        )}

        <div className="flex justify-between mt-2 pt-2 border-t border-gray-700">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition font-medium"
            disabled={!imageDataUrl}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-blue-600 transition font-medium ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => {
          setShowModal(true);
          onOpenChange?.(true);
        }}
        disabled={disabled}
        title="Resize/Crop"
      >
        <Scale3D className="w-4 h-4" />
        <span>Resize/Crop</span>
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={closeModal} />
          {typeof window !== "undefined" &&
          document.getElementById("resize-crop-modal-anchor")
            ? ReactDOM.createPortal(
                <div className="z-[120] relative">{modal}</div>,
                document.getElementById(
                  "resize-crop-modal-anchor"
                ) as HTMLElement
              )
            : null}
        </>
      )}
    </div>
  );
}
