"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import * as convolutionService from "../services/convolutionService";

type BlurValues = {
  blurType: "average" | "gaussian" | "median" | "bilateral";
  blurSize: number;
};

type BlurType = "average" | "gaussian" | "median" | "bilateral";


type SharpenValues = {
  sharpenIntensity?: number;
  unsharpAmount?: number;
  unsharpRadius?: number;
};

type EffectValues = {
  effect: string;
  method?: string;
};

type CustomKernelValues = {
  kernel: number[][];
  normalize: boolean;
};

type ConvolutionValues = BlurValues | SharpenValues | EffectValues | CustomKernelValues;

type ConvolutionToolProps = {
  imageDataUrl: string | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?: {
      type: "convolution" | "blur" | "sharpen";
      values: ConvolutionValues;
    }
  ) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ConvolutionTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
}: ConvolutionToolProps) {
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"blur" | "sharpen" | "effects" | "custom">("blur");
  
  // Blur settings
  const [blurType, setBlurType] = useState<"average" | "gaussian" | "median" | "bilateral">("gaussian");
  const [blurSize, setBlurSize] = useState(5);
  
  // Sharpen settings
  const [sharpenIntensity, setSharpenIntensity] = useState(1.0);
  const [useUnsharpMask, setUseUnsharpMask] = useState(false);
  const [unsharpAmount, setUnsharpAmount] = useState(1.5);
  const [unsharpRadius, setUnsharpRadius] = useState(5);
  
  // Custom kernel
  const [customKernel, setCustomKernel] = useState<number[][]>([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ]);
  const [kernelNormalize, setKernelNormalize] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showModal && onOpenChange) {
      onOpenChange(true);
    } else if (!showModal && onOpenChange) {
      onOpenChange(false);
    }
  }, [showModal, onOpenChange]);

  const handleApplyBlur = async () => {
    if (!imageDataUrl || processing) return;

    setProcessing(true);
    try {
      const result = await convolutionService.applyBlur(
        imageDataUrl,
        blurSize,
        blurType
      );
      
      onResult(result, imageDataUrl, {
        type: "blur",
        values: { blurType, blurSize }
      });
    } catch (error) {
      console.error("Error applying blur:", error);
      alert("Failed to apply blur. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApplySharpen = async () => {
    if (!imageDataUrl || processing) return;

    setProcessing(true);
    try {
      let result: string;
      
      if (useUnsharpMask) {
        result = await convolutionService.applyUnsharpMask(
          imageDataUrl,
          unsharpAmount,
          unsharpRadius
        );
      } else {
        result = await convolutionService.applySharpen(
          imageDataUrl,
          sharpenIntensity
        );
      }
      
      onResult(result, imageDataUrl, {
        type: "sharpen",
        values: useUnsharpMask 
          ? { unsharpAmount, unsharpRadius } 
          : { sharpenIntensity }
      });
    } catch (error) {
      console.error("Error applying sharpen:", error);
      alert("Failed to apply sharpen. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyEdgeDetection = async (method: "sobel" | "laplacian" | "canny") => {
    if (!imageDataUrl || processing) return;

    setProcessing(true);
    try {
      const result = await convolutionService.applyEdgeDetection(imageDataUrl, method);
      onResult(result, imageDataUrl, {
        type: "convolution",
        values: { effect: "edge", method }
      });
    } catch (error) {
      console.error("Error applying edge detection:", error);
      alert("Failed to apply edge detection. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyEmboss = async () => {
    if (!imageDataUrl || processing) return;

    setProcessing(true);
    try {
      const result = await convolutionService.applyEmboss(imageDataUrl);
      onResult(result, imageDataUrl, {
        type: "convolution",
        values: { effect: "emboss" }
      });
    } catch (error) {
      console.error("Error applying emboss:", error);
      alert("Failed to apply emboss. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyCustomKernel = async () => {
    if (!imageDataUrl || processing) return;

    setProcessing(true);
    try {
      const result = await convolutionService.applyCustomConvolution(
        imageDataUrl,
        customKernel,
        kernelNormalize
      );
      
      onResult(result, imageDataUrl, {
        type: "convolution",
        values: { kernel: customKernel, normalize: kernelNormalize }
      });
    } catch (error) {
      console.error("Error applying custom kernel:", error);
      alert("Failed to apply custom kernel. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleKernelCellChange = (row: number, col: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newKernel = customKernel.map((r, i) =>
      i === row ? r.map((c, j) => (j === col ? numValue : c)) : r
    );
    setCustomKernel(newKernel);
  };

  const loadPresetKernel = (preset: string) => {
    const presets: { [key: string]: number[][] } = {
      sharpen: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
      edge: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
      emboss: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
      blur: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
      identity: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    };
    
    if (presets[preset]) {
      setCustomKernel(presets[preset]);
      setKernelNormalize(preset === "blur");
    }
  };

  const modal = showModal && (
    <div
      ref={modalRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-[480px] border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Filters & Effects
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 font-medium transition ${
            activeTab === "blur"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("blur")}
        >
          Blur
        </button>
        <button
          className={`px-4 py-2 font-medium transition ${
            activeTab === "sharpen"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("sharpen")}
        >
          Sharpen
        </button>
        <button
          className={`px-4 py-2 font-medium transition ${
            activeTab === "effects"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("effects")}
        >
          Effects
        </button>
        <button
          className={`px-4 py-2 font-medium transition ${
            activeTab === "custom"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("custom")}
        >
          Custom
        </button>
      </div>

      {/* Blur Tab */}
      {activeTab === "blur" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Blur Type
            </label>
            <select
              value={blurType}
              onChange={(e) => setBlurType(e.target.value as BlurType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              <option value="average">Average Blur</option>
              <option value="gaussian">Gaussian Blur (Smooth)</option>
              <option value="median">Median Blur (Noise Reduction)</option>
              <option value="bilateral">Bilateral (Edge Preserving)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Blur Strength: {blurSize}
            </label>
            <input
              type="range"
              min="1"
              max="31"
              step="2"
              value={blurSize}
              onChange={(e) => setBlurSize(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Subtle</span>
              <span>Strong</span>
            </div>
          </div>

          <button
            onClick={handleApplyBlur}
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : "Apply Blur"}
          </button>
        </div>
      )}

      {/* Sharpen Tab */}
      {activeTab === "sharpen" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="unsharp-toggle"
              checked={useUnsharpMask}
              onChange={(e) => setUseUnsharpMask(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="unsharp-toggle" className="text-sm text-gray-700 dark:text-gray-300">
              Use Unsharp Mask (Professional)
            </label>
          </div>

          {!useUnsharpMask ? (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Sharpening Intensity: {sharpenIntensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={sharpenIntensity}
                onChange={(e) => setSharpenIntensity(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Subtle</span>
                <span>Strong</span>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Amount: {unsharpAmount.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={unsharpAmount}
                  onChange={(e) => setUnsharpAmount(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Radius: {unsharpRadius}
                </label>
                <input
                  type="range"
                  min="1"
                  max="21"
                  step="2"
                  value={unsharpRadius}
                  onChange={(e) => setUnsharpRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          <button
            onClick={handleApplySharpen}
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : "Apply Sharpen"}
          </button>
        </div>
      )}

      {/* Effects Tab */}
      {activeTab === "effects" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Apply special effects and edge detection filters
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleApplyEdgeDetection("sobel")}
              disabled={processing}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sobel Edge
            </button>

            <button
              onClick={() => handleApplyEdgeDetection("laplacian")}
              disabled={processing}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Laplacian Edge
            </button>

            <button
              onClick={() => handleApplyEdgeDetection("canny")}
              disabled={processing}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Canny Edge
            </button>

            <button
              onClick={handleApplyEmboss}
              disabled={processing}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Emboss
            </button>
          </div>

          {processing && (
            <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
              Processing...
            </p>
          )}
        </div>
      )}

      {/* Custom Kernel Tab */}
      {activeTab === "custom" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Preset Kernels
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => loadPresetKernel("sharpen")}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded"
              >
                Sharpen
              </button>
              <button
                onClick={() => loadPresetKernel("edge")}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded"
              >
                Edge
              </button>
              <button
                onClick={() => loadPresetKernel("emboss")}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded"
              >
                Emboss
              </button>
              <button
                onClick={() => loadPresetKernel("blur")}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded"
              >
                Blur
              </button>
              <button
                onClick={() => loadPresetKernel("identity")}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded"
              >
                Identity
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              3x3 Convolution Kernel
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {customKernel.map((row, i) =>
                row.map((cell, j) => (
                  <input
                    key={`${i}-${j}`}
                    type="number"
                    value={cell}
                    onChange={(e) => handleKernelCellChange(i, j, e.target.value)}
                    className="w-full px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    step="0.1"
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="normalize-kernel"
              checked={kernelNormalize}
              onChange={(e) => setKernelNormalize(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="normalize-kernel" className="text-sm text-gray-700 dark:text-gray-300">
              Normalize kernel values
            </label>
          </div>

          <button
            onClick={handleApplyCustomKernel}
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : "Apply Custom Kernel"}
          </button>
        </div>
      )}

      <button
        onClick={() => setShowModal(false)}
        className="w-full mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition"
      >
        Close
      </button>
    </div>
  );

  return (
  <>
    <button
      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={() => setShowModal(true)}
      disabled={disabled || !imageDataUrl}
    >
      <Sparkles className="w-4 h-4" />
      Filters
    </button>

    {showModal &&
      typeof window !== "undefined" &&
      createPortal(
        modal,
        document.getElementById("convolution-modal-anchor") as HTMLElement
      )}
  </>
);
}