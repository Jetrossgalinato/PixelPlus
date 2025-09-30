"use client";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Scale3D } from "lucide-react";
import {
  scaleImage,
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
          type: "scale";
          values: { sx: number; sy: number; interp: InterpMethod };
        }
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

export default function ScaleResizeCropTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<
    "scale" | "resize" | "interpolation" | "crop"
  >("scale");

  // scale
  const [sx, setSx] = useState(1.0);
  const [sy, setSy] = useState(1.0);
  const [interp, setInterp] = useState<InterpMethod>("linear");

  // resize
  const [w, setW] = useState<number>(512);
  const [h, setH] = useState<number>(512);
  const [keepAspect, setKeepAspect] = useState<boolean>(false);

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
      if (mode === "scale") {
        url = await scaleImage(imageDataUrl, sx, sy, interp);
        onResult(url, imageDataUrl, {
          type: "scale",
          values: { sx, sy, interp },
        });
      } else if (mode === "resize") {
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

  useEffect(() => {
    if (keepAspect) {
      const aspect = w / Math.max(1, h);
      // keep minimal enforcement when one changes
      setH(Math.max(1, Math.round(w / Math.max(0.0001, aspect))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w]);

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
        <h3 className="text-lg font-semibold text-white">
          Scale / Resize / Crop
        </h3>

        <div className="flex gap-2 text-sm">
          <button
            className={`px-3 py-1 rounded ${
              mode === "scale"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
            onClick={() => setMode("scale")}
          >
            Scale
          </button>
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

        {/* Scale */}
        {mode === "scale" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">
              Scale Factors
            </div>
            <label className="text-xs text-gray-200">
              Scale X
              <input
                type="number"
                step={0.01}
                min={0.01}
                value={sx}
                onChange={(e) => setSx(parseFloat(e.target.value))}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              />
            </label>
            <label className="text-xs text-gray-200">
              Scale Y
              <input
                type="number"
                step={0.01}
                min={0.01}
                value={sy}
                onChange={(e) => setSy(parseFloat(e.target.value))}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              />
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

        {/* Resize */}
        {mode === "resize" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">Resize</div>
            <div className="flex gap-2">
              <label className="text-xs text-gray-200 flex-1">
                Width
                <input
                  type="number"
                  min={1}
                  value={w}
                  onChange={(e) => setW(parseInt(e.target.value || "1", 10))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200 flex-1">
                Height
                <input
                  type="number"
                  min={1}
                  value={h}
                  onChange={(e) => setH(parseInt(e.target.value || "1", 10))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
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
                Width
                <input
                  type="number"
                  min={1}
                  value={w}
                  onChange={(e) => setW(parseInt(e.target.value || "1", 10))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200 flex-1">
                Height
                <input
                  type="number"
                  min={1}
                  value={h}
                  onChange={(e) => setH(parseInt(e.target.value || "1", 10))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
            </div>
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
                  onChange={(e) => setCx(parseInt(e.target.value || "0", 10))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200">
                Y
                <input
                  type="number"
                  value={cy}
                  onChange={(e) => setCy(parseInt(e.target.value || "0", 10))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200">
                Width
                <input
                  type="number"
                  min={1}
                  value={cw}
                  onChange={(e) => setCw(parseInt(e.target.value || "1", 10))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
              </label>
              <label className="text-xs text-gray-200">
                Height
                <input
                  type="number"
                  min={1}
                  value={ch}
                  onChange={(e) => setCh(parseInt(e.target.value || "1", 10))}
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
        title="Scale/Resize/Crop"
      >
        <Scale3D className="w-4 h-4" />
        <span>Scale/Resize/Crop</span>
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={closeModal} />
          {typeof window !== "undefined" &&
          document.getElementById("scale-modal-anchor")
            ? ReactDOM.createPortal(
                <div className="z-[120] relative">{modal}</div>,
                document.getElementById("scale-modal-anchor") as HTMLElement
              )
            : null}
        </>
      )}
    </div>
  );
}
