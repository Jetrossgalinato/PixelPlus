"use client";
import Image from "next/image";

import { Loader2, ArrowLeft } from "lucide-react";
import UndoButton from "../components/UndoButton";
import ExportButton from "../components/ExportButton";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import GrayscaleTool from "../components/GrayscaleTool";
import RGBTool from "../components/RGBTool";
import HSVTool from "../components/HSVTool";
import { useImage } from "../ImageContext";

export default function EditPage() {
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
  // Removed unused showComparison for performance cleanliness
  const [error] = useState<string | null>(null);

  // For resetting RGB sliders on Undo
  const [rgbResetSignal, setRgbResetSignal] = useState(0);

  // Receive grayscale or RGB result from tool component
  const handleEditResult = useCallback(
    (url: string, originalForUndo?: string) => {
      if (!result && originalForUndo) setUndoStack([originalForUndo]);
      setResult(url);
    },
    [result]
  );

  // Back to default (original) handler
  const handleBackToDefault = () => {
    setRgbResetSignal((s) => s + 1); // trigger RGBTool slider reset
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
    alert("Download started!");
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
    <div className="min-h-screen flex flex-row bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 relative">
      <aside
        className="h-screen w-40 min-w-[160px] bg-white/70 dark:bg-gray-900/70 border-r border-gray-200 dark:border-gray-800 flex flex-col items-start py-8 gap-0 shadow-xl z-10 relative backdrop-blur-md"
        style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.10)" }}
      >
        {/* Back button at very top, left-aligned */}
        <button
          className="flex items-center gap-2 px-3 py-2 text-white hover:text-gray-200 font-medium mb-6 w-10 h-10 justify-start rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 transition ml-4"
          onClick={() => router.push("/")}
          style={{ zIndex: 20 }}
          title="Back to Upload"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {/* Sidebar label */}
        <div className="w-full px-4 mb-6">
          <span className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
            Tools
          </span>
        </div>
        {/* Tools, all left-aligned */}
        <div className="w-full flex flex-col items-start gap-4 px-4">
          {/* Grayscale Tool Button */}
          <div className="w-full flex flex-col items-start">
            <GrayscaleTool
              imageFile={image.file}
              originalDataUrl={image.dataUrl}
              onResult={handleEditResult}
              disabled={processing}
            />
          </div>
          {/* Divider */}
          <div className="w-10 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          {/* HSV Tool Button */}
          <div className="w-full flex flex-col items-start">
            <HSVTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              resetSlidersSignal={rgbResetSignal}
              layout="horizontal"
              popoutSliders={true}
            />
          </div>
          {/* Divider */}
          <div className="w-10 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          {/* RGB Tool Button */}
          <div className="w-full flex flex-col items-start">
            <RGBTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              resetSlidersSignal={rgbResetSignal}
              layout="horizontal"
              popoutSliders={true}
            />
          </div>
          {/* Divider */}
          <div className="w-10 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
        </div>
        {/* Spacer to push content to top */}
        <div className="flex-1" />
      </aside>
      {/* Main content area shifted right */}
      <main className="flex-1 flex flex-col items-center px-8 py-8">
        {/* HSV slider popout anchor - positioned outside sidebar */}
        <div
          id="hsv-slider-popout-anchor"
          className="absolute left-44 z-20"
          style={{ top: "250px" }}
        ></div>
        {/* RGB slider popout anchor - positioned outside sidebar */}
        <div
          id="rgb-slider-popout-anchor"
          className="absolute left-44 z-20"
          style={{ top: "350px" }}
        ></div>
        {/* Undo and Export buttons at top corners */}
        <div className="w-full flex justify-between items-start mb-2">
          <UndoButton onClick={handleBackToDefault} disabled={!result} />
          <ExportButton
            disabled={!result}
            imageDataUrl={image.dataUrl}
            result={result}
            handleExport={handleExport}
          />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Edit Image
        </h1>
        {/* Single large edit preview */}
        <div className="flex flex-col items-center w-full max-w-4xl mt-4">
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
        {processing && (
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing...
          </div>
        )}
        {!image.file && (
          <div className="mt-2 text-xs text-red-500">
            Image not ready for processing. Try re-uploading.
          </div>
        )}
        {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
      </main>

      {/* Export modal is now handled inside ExportButton */}
    </div>
  );
}
