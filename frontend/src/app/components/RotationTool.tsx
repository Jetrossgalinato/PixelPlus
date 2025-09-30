import { useState } from "react";
import { rotateImage } from "../services/rotationService";
import { RotateCw } from "lucide-react";
import ReactDOM from "react-dom";

interface RotationToolProps {
  imageDataUrl: string | null;
  onResult: (url: string, originalForUndo?: string) => void;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function RotationTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onOpenChange,
}: RotationToolProps) {
  const [angle, setAngle] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => {
    setShowModal(false);
    onOpenChange?.(false);
  };

  const handleRotate = async () => {
    if (!imageDataUrl) return;
    setLoading(true);
    try {
      const result = await rotateImage(imageDataUrl, angle);
      onResult(result, imageDataUrl);
      closeModal();
    } catch (error) {
      console.error("Rotation failed:", error);
    } finally {
      setLoading(false);
    }
  };

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
        title="Rotate Image"
      >
        <RotateCw className="w-4 h-4" />
        <span>Rotate</span>
      </button>

      {showModal && (
        <>
          {/* Backdrop for closing modal when clicking outside */}
          <div className="fixed inset-0 z-[90]" onClick={closeModal} />

          {typeof window !== "undefined" &&
          document.getElementById("rotation-modal-anchor")
            ? ReactDOM.createPortal(
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 min-w-[320px] w-[350px] relative">
                  <button
                    className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl font-bold"
                    onClick={closeModal}
                    title="Close"
                  >
                    ×
                  </button>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-white">
                      Image Rotation
                    </h3>

                    <p className="text-sm text-gray-300">
                      Rotate your image by specifying an angle in degrees.
                    </p>

                    <div className="flex flex-col gap-4">
                      <label className="text-sm text-gray-300 flex flex-col gap-1">
                        <span>Angle (degrees):</span>
                        <input
                          type="number"
                          value={angle}
                          onChange={(e) => setAngle(Number(e.target.value))}
                          className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                          disabled={loading}
                          min={-360}
                          max={360}
                        />
                        <span className="text-xs text-gray-400 mt-1">
                          (positive = clockwise, negative = counter-clockwise)
                        </span>
                      </label>

                      {/* Scale option removed */}

                      {/* Keep original dimensions option removed */}
                    </div>

                    <div className="flex justify-between mt-4 pt-2 border-t border-gray-700">
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition"
                        disabled={loading}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleRotate}
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
                            Rotating...
                          </>
                        ) : (
                          "Apply Rotation"
                        )}
                      </button>
                    </div>
                  </div>
                </div>,
                document.getElementById("rotation-modal-anchor") as HTMLElement
              )
            : null}
        </>
      )}
    </div>
  );
}
