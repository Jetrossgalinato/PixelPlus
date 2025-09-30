import { useEffect, useState } from "react";
import { translateImage } from "../services/translationService";
import { Move } from "lucide-react";
import ReactDOM from "react-dom";

interface TranslationToolProps {
  imageDataUrl: string | null;
  onResult: (
    url: string,
    originalForUndo?: string,
    sliderValues?: { type: "translation"; values: { x: number; y: number } }
  ) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Externally controlled values so parent can sync UI (e.g., on Undo)
  translationValues?: { x: number; y: number };
}

export default function TranslationTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
  translationValues,
}: TranslationToolProps) {
  const [shiftX, setShiftX] = useState<number>(0);
  const [shiftY, setShiftY] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => {
    setShowModal(false);
    onOpenChange?.(false);
  };

  const handleTranslate = async () => {
    if (!imageDataUrl) return;
    setLoading(true);
    try {
      const result = await translateImage(imageDataUrl, shiftX, shiftY);
      onResult(result, imageDataUrl, {
        type: "translation",
        values: { x: shiftX, y: shiftY },
      });
      closeModal();
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync internal state from external values (e.g., Undo)
  useEffect(() => {
    if (translationValues) {
      setShiftX(translationValues.x);
      setShiftY(translationValues.y);
    }
  }, [translationValues]);
  const modalContent = (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 min-w-[320px] w-[350px] relative">
      <button
        className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl font-bold"
        onClick={closeModal}
        title="Close"
      >
        ×
      </button>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white">Image Translation</h3>

        <p className="text-sm text-gray-300">
          Shift your image along the X and Y axes.
        </p>

        <div className="flex flex-col gap-4">
          <label className="text-sm text-gray-300 flex flex-col gap-1">
            <span>Shift X (pixels):</span>
            <input
              type="number"
              value={shiftX}
              onChange={(e) => setShiftX(Number(e.target.value))}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              disabled={loading}
              min={-1000}
              max={1000}
            />
            <span className="text-xs text-gray-400 mt-1">
              (positive = right, negative = left)
            </span>
          </label>

          <label className="text-sm text-gray-300 flex flex-col gap-1">
            <span>Shift Y (pixels):</span>
            <input
              type="number"
              value={shiftY}
              onChange={(e) => setShiftY(Number(e.target.value))}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              disabled={loading}
              min={-1000}
              max={1000}
            />
            <span className="text-xs text-gray-400 mt-1">
              (positive = down, negative = up)
            </span>
          </label>
        </div>

        <div className="flex justify-between mt-4 pt-2 border-t border-gray-700">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleTranslate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition font-medium"
            disabled={loading || !imageDataUrl}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Translating...
              </>
            ) : (
              "Apply Translation"
            )}
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
        title="Translate Image"
      >
        <Move className="w-4 h-4" />
        <span>Translate</span>
      </button>

      {showModal && (
        <>
          {/* Backdrop for closing modal when clicking outside */}
          <div className="fixed inset-0 z-[90]" onClick={closeModal} />

          {typeof window !== "undefined" &&
            document.getElementById("translation-modal-anchor") &&
            ReactDOM.createPortal(
              modalContent,
              document.getElementById("translation-modal-anchor") as HTMLElement
            )}
        </>
      )}
    </div>
  );
}
