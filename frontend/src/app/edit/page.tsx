"use client";
import Image from "next/image";

import { Loader2, ArrowLeft, Wand2, Download, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useImage } from "../ImageContext";

export default function EditPage() {
  const [exportDropdown, setExportDropdown] = useState(false);
  const router = useRouter();
  const { image } = useImage();
  const [processing, setProcessing] = useState(false);
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
  const abortRef = useRef<AbortController | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editing options
  async function computeHash(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const handleGrayscale = async () => {
    if (!image.file) return;
    setError(null);
    // Hash original once
    let h = hash;
    if (!h) {
      h = await computeHash(image.file);
      setHash(h);
    }
    const cacheKey = `pixelplus-cache-${h}-grayscale`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      // Use cached without network
      setUndoStack((stack) =>
        result ? stack : image.dataUrl ? [image.dataUrl] : stack
      );
      setResult(cached);
      return;
    }
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", image.file);
      const res = await fetch("http://localhost:8000/grayscale/?format=png", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: { "X-Image-Hash": h },
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const blob = await res.blob();
      if (prevResultUrl.current) URL.revokeObjectURL(prevResultUrl.current);
      const url = URL.createObjectURL(blob);
      prevResultUrl.current = url;
      if (!result && image.dataUrl) setUndoStack([image.dataUrl]);
      setResult(url);
      // Persist data URL for caching
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      safeSetItem(cacheKey, dataUrl);
    } catch (e: unknown) {
      const abort =
        typeof e === "object" &&
        e !== null &&
        "name" in (e as Record<string, unknown>) &&
        (e as Record<string, unknown>).name === "AbortError";
      if (!abort) setError("Error processing image");
    } finally {
      setProcessing(false);
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (prevResultUrl.current) {
        URL.revokeObjectURL(prevResultUrl.current);
      }
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
    // no-op: removed comparison feature for performance
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
      <div className="flex flex-row gap-4 justify-center items-center mt-10 mb-2 self-center relative">
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
    </div>
  );
}
