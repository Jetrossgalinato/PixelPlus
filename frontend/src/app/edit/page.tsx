"use client";
import Image from "next/image";

import { Loader2, ArrowLeft, Wand2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useImage } from "../ImageContext";

export default function EditPage() {
  const [exportDropdown, setExportDropdown] = useState(false);
  const router = useRouter();
  const { image } = useImage();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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

  // Persist edit preview and undo stack to localStorage when they change
  useEffect(() => {
    if (result) {
      localStorage.setItem("pixelplus-edit-preview", result);
    } else {
      localStorage.removeItem("pixelplus-edit-preview");
    }
    localStorage.setItem("pixelplus-edit-undo", JSON.stringify(undoStack));
  }, [result, undoStack]);
  const [showComparison, setShowComparison] = useState(false);

  // Editing options
  const handleGrayscale = async () => {
    if (!image.file) return;
    setProcessing(true);
    setResult(null);
    setShowComparison(false);
    const formData = new FormData();
    formData.append("file", image.file);
    try {
      const res = await fetch("http://localhost:8000/grayscale/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to process image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Only allow undo to the original image
      if (!result && image.dataUrl) {
        setUndoStack([image.dataUrl]);
      }
      setResult(url);
    } catch (err) {
      alert("Error processing image");
    } finally {
      setProcessing(false);
    }
  };

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
    setShowComparison(true);
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

      {/* Export dropdown top right */}
      <div style={{ position: "absolute", top: 24, right: 24, zIndex: 20 }}>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50"
          onClick={() => setExportDropdown((v) => !v)}
          disabled={!result}
        >
          <Download className="w-4 h-4" /> Export
        </button>
        {exportDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col">
            <button
              className="px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                handleExport("png");
                setExportDropdown(false);
              }}
              disabled={!result}
            >
              Export to PNG
            </button>
            <button
              className="px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                handleExport("jpg");
                setExportDropdown(false);
              }}
              disabled={!result}
            >
              Export to JPG
            </button>
            <button
              className="px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                handleExport("pdf");
                setExportDropdown(false);
              }}
              disabled={!result}
            >
              Export to PDF
            </button>
          </div>
        )}
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100 self-center">
        Edit Image
      </h1>
      {/* Always show editing split view */}
      <div className="flex flex-row gap-8 w-full max-w-4xl self-center mt-8">
        <div className="flex-1 flex flex-col items-center">
          <h2 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
            Original
          </h2>
          {image.dataUrl ? (
            <Image
              src={image.dataUrl}
              alt="Original"
              width={1400}
              height={1400}
              unoptimized
              className="rounded-lg shadow max-h-[1400px] object-contain border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center">
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
      </div>
      {/* Show comparison only after export - removed as requested */}
      {/* Editing options bar */}
      <div className="flex flex-row gap-4 justify-center items-center mt-10 mb-2 self-center">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleGrayscale}
          disabled={processing || !image.file}
        >
          <Wand2 className="w-4 h-4" />
          {processing ? <Loader2 className="animate-spin w-4 h-4" /> : null}
          Grayscale
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-50"
          onClick={() => {
            if (undoStack.length > 0) {
              setResult(undoStack[0]);
              setUndoStack([]);
            }
          }}
          disabled={undoStack.length === 0}
        >
          Undo
        </button>
      </div>
      {!image.file && (
        <div className="mt-2 text-xs text-red-500 self-center">
          Image not ready for processing. Try re-uploading.
        </div>
      )}
    </div>
  );
}
