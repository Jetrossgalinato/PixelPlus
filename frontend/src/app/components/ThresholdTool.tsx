//ThresholdTool.tsx
"use client";
import { useState } from "react";
import ReactDOM from "react-dom";
import { Filter } from "lucide-react";
import {
  applyBinaryThreshold,
  applyAdaptiveThreshold,
  applyOtsuThreshold,
} from "../services/thresholdService";

interface ThresholdToolProps {
  imageDataUrl: string | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?: {
      type: "threshold";
      values: {
        thresholdType?: string;
        thresholdValue?: number;
        maxValue?: number;
        adaptiveMethod?: string;
        blockSize?: number;
        cConstant?: number;
      };
    }
  ) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ThresholdTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
}: ThresholdToolProps) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"binary" | "adaptive" | "otsu">("binary");
  const [isProcessing, setIsProcessing] = useState(false);

  // Binary threshold parameters
  const [thresholdValue, setThresholdValue] = useState(97);
  const [maxValue, setMaxValue] = useState(87);
  const [thresholdType, setThresholdType] = useState<
    "binary" | "binary_inv" | "trunc" | "tozero" | "tozero_inv"
  >("binary");

  // Adaptive threshold parameters
  const [adaptiveMaxValue, setAdaptiveMaxValue] = useState(255);
  const [adaptiveMethod, setAdaptiveMethod] = useState<"mean" | "gaussian">("gaussian");
  const [adaptiveThresholdType, setAdaptiveThresholdType] = useState<"binary" | "binary_inv">("binary");
  const [blockSize, setBlockSize] = useState(11);
  const [cConstant, setCConstant] = useState(2);

  // Otsu threshold parameters
  const [otsuThresholdType, setOtsuThresholdType] = useState<"binary" | "binary_inv">("binary");

  const closeModal = () => {
    setShowModal(false);
    onOpenChange?.(false);
  };

  const handleApplyBinary = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyBinaryThreshold(
        imageDataUrl,
        thresholdValue,
        maxValue,
        thresholdType
      );
      onResult(result, imageDataUrl, {
        type: "threshold",
        values: { thresholdType: "binary", thresholdValue, maxValue },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying binary threshold:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyAdaptive = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyAdaptiveThreshold(
        imageDataUrl,
        adaptiveMaxValue,
        adaptiveMethod,
        adaptiveThresholdType,
        blockSize,
        cConstant
      );
      onResult(result, imageDataUrl, {
        type: "threshold",
        values: {
          thresholdType: "adaptive",
          adaptiveMethod,
          blockSize,
          cConstant,
        },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying adaptive threshold:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyOtsu = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyOtsuThreshold(imageDataUrl, otsuThresholdType);
      onResult(result, imageDataUrl, {
        type: "threshold",
        values: { thresholdType: "otsu" },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying Otsu threshold:", error);
    } finally {
      setIsProcessing(false);
    }
  };

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
        <h3 className="text-lg font-semibold text-white">Threshold & Binarization</h3>

        <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
          <div className="text-sm text-gray-200 font-medium">Mode</div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("binary")}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                mode === "binary"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Binary
            </button>
            <button
              onClick={() => setMode("adaptive")}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                mode === "adaptive"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Adaptive
            </button>
            <button
              onClick={() => setMode("otsu")}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                mode === "otsu"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Otsu
            </button>
          </div>
        </div>

        {mode === "binary" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">Binary Threshold</div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-200">
                  Threshold Value: {thresholdValue}
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Max Value: {maxValue}
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={maxValue}
                    onChange={(e) => setMaxValue(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Type
                  <select
                    value={thresholdType}
                    onChange={(e) => setThresholdType(e.target.value as "binary" | "binary_inv" | "trunc" | "tozero" | "tozero_inv")}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  >
                    <option value="binary">Binary</option>
                    <option value="binary_inv">Binary Inverted</option>
                    <option value="trunc">Truncate</option>
                    <option value="tozero">To Zero</option>
                    <option value="tozero_inv">To Zero Inverted</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        {mode === "adaptive" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">Adaptive Threshold</div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-200">
                  Max Value: {adaptiveMaxValue}
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={adaptiveMaxValue}
                    onChange={(e) => setAdaptiveMaxValue(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Method
                  <select
                    value={adaptiveMethod}
                    onChange={(e) => setAdaptiveMethod(e.target.value as "mean" | "gaussian")}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  >
                    <option value="mean">Mean</option>
                    <option value="gaussian">Gaussian</option>
                  </select>
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Block Size: {blockSize}
                  <input
                    type="range"
                    min="3"
                    max="99"
                    step="2"
                    value={blockSize}
                    onChange={(e) => setBlockSize(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  C Constant: {cConstant}
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    value={cConstant}
                    onChange={(e) => setCConstant(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {mode === "otsu" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">Otsu Threshold</div>
            <div className="space-y-4">
              <div className="text-xs text-gray-400">
                Otsu method automatically calculates the optimal threshold value.
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Type
                  <select
                    value={otsuThresholdType}
                    onChange={(e) => setOtsuThresholdType(e.target.value as "binary" | "binary_inv")}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  >
                    <option value="binary">Binary</option>
                    <option value="binary_inv">Binary Inverted</option>
                  </select>
                </label>
              </div>
            </div>
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
            onClick={
              mode === "binary"
                ? handleApplyBinary
                : mode === "adaptive"
                ? handleApplyAdaptive
                : handleApplyOtsu
            }
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition font-medium"
          >
            {isProcessing ? "Processing..." : "Apply"}
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
        title="Threshold"
      >
        <Filter className="w-4 h-4" />
        <span>Threshold</span>
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/50" onClick={closeModal} />
          {typeof window !== "undefined" &&
          document.getElementById("threshold-modal-anchor") ? (
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">{modal}</div>
              </div>,
              document.getElementById("threshold-modal-anchor") as HTMLElement
            )
          ) : null}
        </>
      )}
    </div>
  );
}