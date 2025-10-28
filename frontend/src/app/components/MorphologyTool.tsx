"use client";
import { useState } from "react";
import ReactDOM from "react-dom";
import { Shapes } from "lucide-react";
import {
  applyDilation,
  applyErosion,
  applyOpening,
  applyClosing,
  applyCannyEdgeDetection,
} from "../services/morphologyService";

interface MorphologyToolProps {
  imageDataUrl: string | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?: {
      type: "morphology";
      values: {
        operation?: string;
        kernelSize?: number;
        kernelShape?: string;
        iterations?: number;
        threshold1?: number;
        threshold2?: number;
      };
    }
  ) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function MorphologyTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
}: MorphologyToolProps) {
  const [showModal, setShowModal] = useState(false);
  const [operation, setOperation] = useState<"dilation" | "erosion" | "opening" | "closing" | "canny">("dilation");
  const [isProcessing, setIsProcessing] = useState(false);

  // Common morphology parameters
  const [kernelSize, setKernelSize] = useState(5);
  const [kernelShape, setKernelShape] = useState<"rect" | "ellipse" | "cross">("rect");
  const [iterations, setIterations] = useState(1);

  // Canny edge detection parameters
  const [threshold1, setThreshold1] = useState(100);
  const [threshold2, setThreshold2] = useState(200);
  const [apertureSize, setApertureSize] = useState<3 | 5 | 7>(3);
  const [l2Gradient, setL2Gradient] = useState(false);

  const closeModal = () => {
    setShowModal(false);
    onOpenChange?.(false);
  };

  const handleApplyDilation = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyDilation(imageDataUrl, kernelSize, kernelShape, iterations);
      onResult(result, imageDataUrl, {
        type: "morphology",
        values: { operation: "dilation", kernelSize, kernelShape, iterations },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying dilation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyErosion = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyErosion(imageDataUrl, kernelSize, kernelShape, iterations);
      onResult(result, imageDataUrl, {
        type: "morphology",
        values: { operation: "erosion", kernelSize, kernelShape, iterations },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying erosion:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyOpening = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyOpening(imageDataUrl, kernelSize, kernelShape);
      onResult(result, imageDataUrl, {
        type: "morphology",
        values: { operation: "opening", kernelSize, kernelShape },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying opening:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyClosing = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyClosing(imageDataUrl, kernelSize, kernelShape);
      onResult(result, imageDataUrl, {
        type: "morphology",
        values: { operation: "closing", kernelSize, kernelShape },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying closing:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyCanny = async () => {
    if (!imageDataUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await applyCannyEdgeDetection(
        imageDataUrl,
        threshold1,
        threshold2,
        apertureSize,
        l2Gradient
      );
      onResult(result, imageDataUrl, {
        type: "morphology",
        values: { operation: "canny", threshold1, threshold2 },
      });
      closeModal();
    } catch (error) {
      console.error("Error applying Canny edge detection:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    switch (operation) {
      case "dilation":
        handleApplyDilation();
        break;
      case "erosion":
        handleApplyErosion();
        break;
      case "opening":
        handleApplyOpening();
        break;
      case "closing":
        handleApplyClosing();
        break;
      case "canny":
        handleApplyCanny();
        break;
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
        <h3 className="text-lg font-semibold text-white">Morphology & Edge Detection</h3>

        <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
          <div className="text-sm text-gray-200 font-medium">Operation</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setOperation("dilation")}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                operation === "dilation"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Dilation
            </button>
            <button
              onClick={() => setOperation("erosion")}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                operation === "erosion"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Erosion
            </button>
            <button
              onClick={() => setOperation("opening")}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                operation === "opening"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Opening
            </button>
            <button
              onClick={() => setOperation("closing")}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                operation === "closing"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Closing
            </button>
            <button
              onClick={() => setOperation("canny")}
              className={`col-span-2 px-3 py-2 rounded text-sm font-medium transition ${
                operation === "canny"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Canny Edge Detection
            </button>
          </div>
        </div>

        {operation !== "canny" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">Morphology Settings</div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-200">
                  Kernel Size: {kernelSize}
                  <input
                    type="range"
                    min="3"
                    max="31"
                    step="2"
                    value={kernelSize}
                    onChange={(e) => setKernelSize(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Kernel Shape
                  <select
                    value={kernelShape}
                    onChange={(e) => setKernelShape(e.target.value as "rect" | "ellipse" | "cross")}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  >
                    <option value="rect">Rectangle</option>
                    <option value="ellipse">Ellipse</option>
                    <option value="cross">Cross</option>
                  </select>
                </label>
              </div>

              {(operation === "dilation" || operation === "erosion") && (
                <div>
                  <label className="text-xs text-gray-200">
                    Iterations: {iterations}
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={iterations}
                      onChange={(e) => setIterations(Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {operation === "canny" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">Canny Edge Detection</div>
            <div className="space-y-4">
              <div className="text-xs text-gray-400">
                Detects edges in images using the Canny algorithm. Lower threshold detects more edges.
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Lower Threshold: {threshold1}
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={threshold1}
                    onChange={(e) => setThreshold1(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Upper Threshold: {threshold2}
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={threshold2}
                    onChange={(e) => setThreshold2(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-200">
                  Aperture Size
                  <select
                    value={apertureSize}
                    onChange={(e) => setApertureSize(Number(e.target.value) as 3 | 5 | 7)}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  >
                    <option value={3}>3x3</option>
                    <option value={5}>5x5</option>
                    <option value={7}>7x7</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="l2gradient"
                  checked={l2Gradient}
                  onChange={(e) => setL2Gradient(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="l2gradient" className="text-xs text-gray-200">
                  Use L2 Gradient (more accurate)
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
            onClick={handleApply}
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
        title="Morphology & Edges"
      >
        <Shapes className="w-4 h-4" />
        <span>Morphology</span>
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/50" onClick={closeModal} />
          {typeof window !== "undefined" &&
          document.getElementById("morphology-modal-anchor") ? (
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">{modal}</div>
              </div>,
              document.getElementById("morphology-modal-anchor") as HTMLElement
            )
          ) : null}
        </>
      )}
    </div>
  );
}