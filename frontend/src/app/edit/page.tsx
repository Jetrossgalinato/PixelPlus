"use client";
import Image from "next/image";

import { Loader2, ArrowLeft, Download, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import GrayscaleTool from "../components/GrayscaleTool";
import { useImage } from "../ImageContext";

export default function EditPage() {
  const [showExportModal, setShowExportModal] = useState(false);
  const router = useRouter();
  const { image } = useImage();
  const [processing] = useState(false); // retained for future multi-tool orchestration
  const [result, setResult] = useState<string | null>(null);
  const prevResultUrl = useRef<string | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);

  // Restore edit preview from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pixelplus-edit-preview");
    if (saved) {
      setResult(saved);
    }
    // Always start with empty undo stack on mount (or new image)
    setUndoStack([]);
  }, [image.dataUrl, image.fileName]);

  // Persist edit preview and undo stack to localStorage when they change (guarded)
  // Safe storage helpers (avoid quota errors with large images)
  const MAX_ITEM_BYTES = 2_500_000; // ~2.5MB max per item
  const GRAYSCALE_PREFIX = "pixelplus-cache-";
  function approximateSize(str: string) {
    return str.length * 2; // conservative (UTF-16)
  }
  // stable helper (won't change across renders)
  function safeSetItem(key: string, value: string) {
    if (approximateSize(value) > MAX_ITEM_BYTES) {
      console.warn("PixelPlus: item too large to cache", key);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      try {
        // Evict half of grayscale cache entries (simple heuristic) then retry
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith(GRAYSCALE_PREFIX)
        );
        for (let i = 0; i < Math.ceil(keys.length / 2); i++) {
          localStorage.removeItem(keys[i]);
        }
        localStorage.setItem(key, value);
      } catch (err) {
        console.warn("PixelPlus: failed to cache after eviction", err);
      }
    }
  }
  useEffect(() => {
    if (result) {
      safeSetItem("pixelplus-edit-preview", result);
    } else {
      localStorage.removeItem("pixelplus-edit-preview");
    }
    // undo stack is tiny; store normally
    try {
      localStorage.setItem("pixelplus-edit-undo", JSON.stringify(undoStack));
    } catch {
      /* ignore */
    }
    // safeSetItem is stable; exhaustive-deps not required
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, undoStack]);
  // Removed unused showComparison for performance cleanliness
  const [error] = useState<string | null>(null);

  // Receive grayscale result from tool component
  const handleGrayscaleResult = useCallback(
    (url: string, originalForUndo?: string) => {
      if (!result && originalForUndo) setUndoStack([originalForUndo]);
      setResult(url);
    },
    [result]
  );

  // Back to default (original) handler
  const handleBackToDefault = () => {
    if (undoStack.length > 0) {
      setResult(undoStack[0]);
      setUndoStack([]);
    } else if (image.dataUrl) {
      setResult(null); // will show original placeholder
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    const urlAtMount = prevResultUrl.current;
    return () => {
      if (urlAtMount) URL.revokeObjectURL(urlAtMount);
    };
  }, []);

  // Export handlers
  const handleExport = (type: "png" | "jpg" | "pdf") => {
    if (!result) return;
    if (type === "pdf") {
      // Export both images to PDF
      import("jspdf").then((jsPDFModule) => {
        const jsPDF = jsPDFModule.default;
        const doc = new jsPDF();
        let y = 10;
        if (image.dataUrl) {
          doc.text("Original", 10, y);
          doc.addImage(image.dataUrl, "JPEG", 10, y + 5, 80, 60);
          y += 70;
        }
        doc.text("Edited", 10, y);
        doc.addImage(result, "JPEG", 10, y + 5, 80, 60);
        doc.save("comparison.pdf");
      });
    } else {
      // Download the edited image as PNG or JPG
      const link = document.createElement("a");
      link.href = result;
      link.download = `edited.${type}`;
      link.click();
    }
    // keep modal open so user can export multiple formats; optional: auto-close
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4 relative">
      {/* Back button top left */}
      <button
        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium mb-4 w-fit"
        onClick={() => router.push("/")}
        style={{ position: "absolute", top: 24, left: 24, zIndex: 20 }}
      >
        <ArrowLeft className="w-5 h-5" /> Back to Upload
      </button>

      {/* Export button triggers modal */}
      <div style={{ position: "absolute", top: 24, right: 24, zIndex: 20 }}>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50"
          onClick={() => setShowExportModal(true)}
          disabled={!result}
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100 self-center">
        Edit Image
      </h1>
      {/* Single large edit preview */}
      <div className="flex flex-col items-center w-full max-w-4xl self-center mt-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
          Edit Preview
        </h2>
        {result ? (
          <Image
            src={result}
            alt="Edited"
            width={1400}
            height={1400}
            unoptimized
            className="rounded-lg shadow max-h-[1400px] object-contain border border-gray-200 dark:border-gray-700"
          />
        ) : image.dataUrl ? (
          <Image
            src={image.dataUrl}
            alt="Preview"
            width={1400}
            height={1400}
            unoptimized
            className="rounded-lg shadow max-h-[1400px] object-contain border border-gray-200 dark:border-gray-700 opacity-50"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      {/* Show comparison only after export - removed as requested */}
      {/* Editing options bar */}
      <div className="flex flex-row flex-wrap gap-4 justify-center items-center mt-10 mb-2 self-center relative">
        <GrayscaleTool
          imageFile={image.file}
          originalDataUrl={image.dataUrl}
          onResult={handleGrayscaleResult}
          disabled={processing}
        />
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-50"
          onClick={handleBackToDefault}
          disabled={!result}
        >
          <RotateCcw className="w-4 h-4" /> Undo
        </button>
        {processing && (
          <div className="absolute -bottom-8 text-xs text-gray-500 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing...
          </div>
        )}
      </div>
      {!image.file && (
        <div className="mt-2 text-xs text-red-500 self-center">
          Image not ready for processing. Try re-uploading.
        </div>
      )}
      {error && (
        <div className="mt-2 text-xs text-red-500 self-center">{error}</div>
      )}

      {showExportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Export comparison"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowExportModal(false);
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full p-6 relative">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-3 right-3 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              aria-label="Close export modal"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Export & Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col items-center">
                <h4 className="mb-2 font-medium text-gray-600 dark:text-gray-300">
                  Original
                </h4>
                {image.dataUrl ? (
                  <Image
                    src={image.dataUrl}
                    alt="Original"
                    width={800}
                    height={800}
                    unoptimized
                    className="rounded border border-gray-200 dark:border-gray-700 object-contain max-h-[600px]"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <h4 className="mb-2 font-medium text-gray-600 dark:text-gray-300">
                  Edited
                </h4>
                {result ? (
                  <Image
                    src={result}
                    alt="Edited"
                    width={800}
                    height={800}
                    unoptimized
                    className="rounded border border-gray-200 dark:border-gray-700 object-contain max-h-[600px]"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-gray-400">
                    No edit preview
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={() => handleExport("png")}
                disabled={!result}
              >
                Download PNG
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={() => handleExport("jpg")}
                disabled={!result}
              >
                Download JPG
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
                onClick={() => handleExport("pdf")}
                disabled={!result}
              >
                Download PDF
              </button>
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowExportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
