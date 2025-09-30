"use client";
import { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { SlidersHorizontal, Wand2 } from "lucide-react";

type CombinedColorToolProps = {
  imageDataUrl: string | null;
  imageFile: File | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?:
      | { type: "hsv"; values: { h: number; s: number; v: number } }
      | { type: "rgb"; values: { r: number; g: number; b: number } }
  ) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function CombinedColorTool({
  imageDataUrl,
  imageFile,
  onResult,
  disabled,
  onOpenChange,
}: CombinedColorToolProps) {
  const [show, setShow] = useState(false);

  // HSV state
  const [h, setH] = useState(0);
  const [s, setS] = useState(1);
  const [v, setV] = useState(1);
  const [processingHSV, setProcessingHSV] = useState(false);
  const [errorHSV, setErrorHSV] = useState<string | null>(null);

  // RGB state
  const [r, setR] = useState(1);
  const [g, setG] = useState(1);
  const [b, setB] = useState(1);
  const [processingRGB, setProcessingRGB] = useState(false);
  const [errorRGB, setErrorRGB] = useState<string | null>(null);

  // Grayscale state
  const [processingGray, setProcessingGray] = useState(false);
  const [errorGray, setErrorGray] = useState<string | null>(null);
  const lastUrl = useRef<string | null>(null);

  const closeModal = () => {
    setShow(false);
    onOpenChange?.(false);
  };

  // Apply HSV adjustment using backend
  const applyHSV = async (nh: number, ns: number, nv: number) => {
    if (!imageDataUrl) return;
    setProcessingHSV(true);
    setErrorHSV(null);
    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "image.png", { type: blob.type });
      const formData = new FormData();
      formData.append("file", file);
      const apiRes = await fetch(
        `http://localhost:8000/hsv/?h=${nh}&s=${ns}&v=${nv}`,
        { method: "POST", body: formData }
      );
      if (!apiRes.ok) throw new Error("Backend error");
      const outBlob = await apiRes.blob();
      const url = URL.createObjectURL(outBlob);
      lastUrl.current = url;
      onResult(url, imageDataUrl, {
        type: "hsv",
        values: { h: nh, s: ns, v: nv },
      });
    } catch (e) {
      console.error("HSV processing error:", e);
      setErrorHSV("Error processing image");
    } finally {
      setProcessingHSV(false);
    }
  };

  // Apply RGB adjustment using backend
  const applyRGB = async (nr: number, ng: number, nb: number) => {
    if (!imageDataUrl) return;
    setProcessingRGB(true);
    setErrorRGB(null);
    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "image.png", { type: blob.type });
      const formData = new FormData();
      formData.append("file", file);
      const apiRes = await fetch(
        `http://localhost:8000/rgb/?r=${nr}&g=${ng}&b=${nb}`,
        { method: "POST", body: formData }
      );
      if (!apiRes.ok) throw new Error("Backend error");
      const outBlob = await apiRes.blob();
      const url = URL.createObjectURL(outBlob);
      lastUrl.current = url;
      onResult(url, imageDataUrl, {
        type: "rgb",
        values: { r: nr, g: ng, b: nb },
      });
    } catch (e) {
      console.error("RGB processing error:", e);
      setErrorRGB("Error processing image");
    } finally {
      setProcessingRGB(false);
    }
  };

  // Apply Grayscale
  const applyGrayscale = async () => {
    if (!imageFile) return;
    setProcessingGray(true);
    setErrorGray(null);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await fetch("http://localhost:8000/grayscale/?format=png", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Backend error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      lastUrl.current = url;
      onResult(url, imageDataUrl || undefined);
    } catch (e) {
      console.error("Grayscale processing error:", e);
      setErrorGray("Error processing image");
    } finally {
      setProcessingGray(false);
    }
  };

  const modal = (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 min-w-[340px] w-[380px] relative">
      <button
        className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl font-bold"
        onClick={closeModal}
        title="Close"
      >
        ×
      </button>

      <div className="flex flex-col gap-5">
        <h3 className="text-lg font-semibold text-white">Color Adjustments</h3>

        {/* HSV Section */}
        <div className="flex flex-col gap-2 bg-gray-800/60 p-3 rounded border border-gray-700">
          <div className="text-sm text-gray-200 font-medium">HSV</div>
          <label className="flex flex-col text-xs text-gray-200">
            Hue
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={h}
              onChange={(e) => {
                const nh = Number(e.target.value);
                setH(nh);
                applyHSV(nh, s, v);
              }}
            />
            <span className="text-xs">{h}</span>
          </label>
          <label className="flex flex-col text-xs text-gray-200">
            Saturation
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={s}
              onChange={(e) => {
                const ns = Number(e.target.value);
                setS(ns);
                applyHSV(h, ns, v);
              }}
            />
            <span className="text-xs">{s.toFixed(2)}</span>
          </label>
          <label className="flex flex-col text-xs text-gray-200">
            Value
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={v}
              onChange={(e) => {
                const nv = Number(e.target.value);
                setV(nv);
                applyHSV(h, s, nv);
              }}
            />
            <span className="text-xs">{v.toFixed(2)}</span>
          </label>
          {processingHSV && (
            <div className="text-xs text-gray-400">Processing HSV...</div>
          )}
          {errorHSV && (
            <div className="text-xs text-red-400" role="alert">
              {errorHSV}
            </div>
          )}
        </div>

        {/* RGB Section */}
        <div className="flex flex-col gap-2 bg-gray-800/60 p-3 rounded border border-gray-700">
          <div className="text-sm text-gray-200 font-medium">RGB</div>
          <label className="flex flex-col text-xs text-gray-200">
            Red
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={r}
              onChange={(e) => {
                const nr = Number(e.target.value);
                setR(nr);
                applyRGB(nr, g, b);
              }}
            />
            <span className="text-xs">{r.toFixed(2)}</span>
          </label>
          <label className="flex flex-col text-xs text-gray-200">
            Green
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={g}
              onChange={(e) => {
                const ng = Number(e.target.value);
                setG(ng);
                applyRGB(r, ng, b);
              }}
            />
            <span className="text-xs">{g.toFixed(2)}</span>
          </label>
          <label className="flex flex-col text-xs text-gray-200">
            Blue
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={b}
              onChange={(e) => {
                const nb = Number(e.target.value);
                setB(nb);
                applyRGB(r, g, nb);
              }}
            />
            <span className="text-xs">{b.toFixed(2)}</span>
          </label>
          {processingRGB && (
            <div className="text-xs text-gray-400">Processing RGB...</div>
          )}
          {errorRGB && (
            <div className="text-xs text-red-400" role="alert">
              {errorRGB}
            </div>
          )}
        </div>

        {/* Grayscale */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-200">Grayscale</div>
          <button
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            onClick={applyGrayscale}
            disabled={disabled || !imageFile}
          >
            <Wand2 className="w-4 h-4" /> Apply
          </button>
        </div>
        {processingGray && (
          <div className="text-xs text-gray-400">Processing Grayscale...</div>
        )}
        {errorGray && (
          <div className="text-xs text-red-400" role="alert">
            {errorGray}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-700">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white cursor-pointer rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-50"
        onClick={() => {
          setShow(true);
          onOpenChange?.(true);
        }}
        disabled={disabled || !imageDataUrl}
      >
        <SlidersHorizontal className="w-4 h-4" /> Adjust Colors
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={closeModal} />
          {typeof window !== "undefined" &&
          document.getElementById("color-modal-anchor")
            ? ReactDOM.createPortal(
                modal,
                document.getElementById("color-modal-anchor") as HTMLElement
              )
            : null}
        </>
      )}
    </div>
  );
}
