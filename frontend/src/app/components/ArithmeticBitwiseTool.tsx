//ArithmeticBitwiseTool.tsx
"use client";
import { useState } from "react";
import ReactDOM from "react-dom";
import { Calculator, Image as ImageIcon } from "lucide-react";
import {
  addImages,
  subtractImages,
  multiplyImages,
  divideImages,
  bitwiseAnd,
  bitwiseOr,
  bitwiseXor,
  bitwiseNot,
  type ArithmeticOperation,
  type BitwiseOperation,
} from "../services/arithmeticService";

type Props = {
  imageDataUrl: string | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?: {
      type: "arithmetic" | "bitwise";
      values: {
        operation: string;
        weight1?: number;
        weight2?: number;
        scale?: number;
      };
    }
  ) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ArithmeticBitwiseTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"arithmetic" | "bitwise">("arithmetic");

  // Arithmetic operation state
  const [arithmeticOp, setArithmeticOp] =
    useState<ArithmeticOperation>("add");
  const [weight1, setWeight1] = useState<number>(0.5);
  const [weight2, setWeight2] = useState<number>(0.5);
  const [scale, setScale] = useState<number>(1.0);

  // Bitwise operation state
  const [bitwiseOp, setBitwiseOp] = useState<BitwiseOperation>("and");

  // Second image for operations
  const [secondImage, setSecondImage] = useState<string | null>(null);
  const [secondImagePreview, setSecondImagePreview] = useState<string | null>(
    null
  );

  const closeModal = () => {
    setShowModal(false);
    onOpenChange?.(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSecondImage(result);
      setSecondImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    if (!imageDataUrl) return;

    try {
      let url = imageDataUrl;

      if (mode === "arithmetic") {
        // All arithmetic ops except NOT need a second image
        if (!secondImage) {
          alert("Please upload a second image for arithmetic operations");
          return;
        }

        if (arithmeticOp === "add") {
          url = await addImages(imageDataUrl, secondImage, weight1, weight2);
          onResult(url, imageDataUrl, {
            type: "arithmetic",
            values: { operation: "add", weight1, weight2 },
          });
        } else if (arithmeticOp === "subtract") {
          url = await subtractImages(imageDataUrl, secondImage);
          onResult(url, imageDataUrl, {
            type: "arithmetic",
            values: { operation: "subtract" },
          });
        } else if (arithmeticOp === "multiply") {
          url = await multiplyImages(imageDataUrl, secondImage, scale);
          onResult(url, imageDataUrl, {
            type: "arithmetic",
            values: { operation: "multiply", scale },
          });
        } else if (arithmeticOp === "divide") {
          url = await divideImages(imageDataUrl, secondImage, scale);
          onResult(url, imageDataUrl, {
            type: "arithmetic",
            values: { operation: "divide", scale },
          });
        }
      } else if (mode === "bitwise") {
        if (bitwiseOp === "not") {
          // NOT operation only needs one image
          url = await bitwiseNot(imageDataUrl);
          onResult(url, imageDataUrl, {
            type: "bitwise",
            values: { operation: "not" },
          });
        } else {
          // Other bitwise ops need second image
          if (!secondImage) {
            alert("Please upload a second image for bitwise operations");
            return;
          }

          if (bitwiseOp === "and") {
            url = await bitwiseAnd(imageDataUrl, secondImage);
          } else if (bitwiseOp === "or") {
            url = await bitwiseOr(imageDataUrl, secondImage);
          } else if (bitwiseOp === "xor") {
            url = await bitwiseXor(imageDataUrl, secondImage);
          }

          onResult(url, imageDataUrl, {
            type: "bitwise",
            values: { operation: bitwiseOp },
          });
        }
      }

      closeModal();
    } catch (err) {
      console.error("Apply failed:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const needsSecondImage =
    mode === "arithmetic" || (mode === "bitwise" && bitwiseOp !== "not");

  const modal = (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 min-w-[400px] w-[480px] relative max-h-[90vh] overflow-y-auto">
      <button
        className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl font-bold"
        onClick={closeModal}
        title="Close"
      >
        ×
      </button>
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white">
          Arithmetic & Bitwise Operations
        </h3>

        {/* Mode Selection */}
        <div className="flex gap-2 text-sm">
          <button
            className={`px-3 py-1 rounded ${
              mode === "arithmetic"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
            onClick={() => setMode("arithmetic")}
          >
            Arithmetic
          </button>
          <button
            className={`px-3 py-1 rounded ${
              mode === "bitwise"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200"
            }`}
            onClick={() => setMode("bitwise")}
          >
            Bitwise
          </button>
        </div>

        {/* Arithmetic Operations */}
        {mode === "arithmetic" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">
              Arithmetic Operation
            </div>

            <label className="text-xs text-gray-200">
              Operation
              <select
                value={arithmeticOp}
                onChange={(e) =>
                  setArithmeticOp(e.target.value as ArithmeticOperation)
                }
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="add">Add (Blend)</option>
                <option value="subtract">Subtract</option>
                <option value="multiply">Multiply</option>
                <option value="divide">Divide</option>
              </select>
            </label>

            {/* Weight controls for Add operation */}
            {arithmeticOp === "add" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-200">
                  Image 1 Weight: {weight1.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={weight1}
                    onChange={(e) => setWeight1(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </label>
                <label className="text-xs text-gray-200">
                  Image 2 Weight: {weight2.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={weight2}
                    onChange={(e) => setWeight2(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>
            )}

            {/* Scale controls for Multiply/Divide */}
            {(arithmeticOp === "multiply" || arithmeticOp === "divide") && (
              <label className="text-xs text-gray-200">
                Scale: {scale.toFixed(2)}
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </label>
            )}
          </div>
        )}

        {/* Bitwise Operations */}
        {mode === "bitwise" && (
          <div className="flex flex-col gap-3 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">
              Bitwise Operation
            </div>

            <label className="text-xs text-gray-200">
              Operation
              <select
                value={bitwiseOp}
                onChange={(e) =>
                  setBitwiseOp(e.target.value as BitwiseOperation)
                }
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="xor">XOR</option>
                <option value="not">NOT (Invert)</option>
              </select>
            </label>

            <div className="text-xs text-gray-400 italic">
              {bitwiseOp === "and" &&
                "Keeps only pixels that are bright in both images"}
              {bitwiseOp === "or" &&
                "Combines bright pixels from both images"}
              {bitwiseOp === "xor" &&
                "Highlights differences between images"}
              {bitwiseOp === "not" && "Inverts all pixel values"}
            </div>
          </div>
        )}

        {/* Second Image Upload */}
        {needsSecondImage && (
          <div className="flex flex-col gap-2 bg-gray-800/60 p-3 rounded border border-gray-700">
            <div className="text-sm text-gray-200 font-medium">
              Second Image (Required)
            </div>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition text-gray-200 text-sm">
                <ImageIcon className="w-4 h-4" />
                <span>Upload Second Image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {secondImagePreview && (
              <div className="mt-2">
                <img
                  src={secondImagePreview}
                  alt="Second image preview"
                  className="max-w-full h-32 object-contain rounded border border-gray-600"
                />
              </div>
            )}
          </div>
        )}

        {/* Apply/Cancel Buttons */}
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
            disabled={!imageDataUrl || (needsSecondImage && !secondImage)}
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
        title="Arithmetic & Bitwise Operations"
      >
        <Calculator className="w-4 h-4" />
        <span>Arithmetic/Bitwise</span>
      </button>

      {showModal && (
  <>
    <div className="fixed inset-0 z-[100]" onClick={closeModal} />
    {typeof window !== "undefined" &&
    document.getElementById("arithmetic-modal-anchor")
      ? ReactDOM.createPortal(
          <div className="z-[120] relative">{modal}</div>,
          document.getElementById(
            "arithmetic-modal-anchor"
          ) as HTMLElement
        )
      : null}
  </>
)}
    </div>
  );
}