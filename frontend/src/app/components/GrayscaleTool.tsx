"use client";
import { useState, useRef } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { safeSetItem } from "../utils/storage";

interface GrayscaleToolProps {
  imageFile: File | null;
  originalDataUrl: string | null;
  onResult: (url: string, originalForUndo?: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GrayscaleTool({
  imageFile,
  originalDataUrl,
  onResult,
  disabled,
  className = "",
}: GrayscaleToolProps) {
  const [processing, setProcessing] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevResultUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function computeHash(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function handleGrayscale() {
    if (!imageFile) return;
    setError(null);
    let h = hash;
    if (!h) {
      h = await computeHash(imageFile);
      setHash(h);
    }
    const cacheKey = `pixelplus-cache-${h}-grayscale`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      onResult(cached);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
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
      onResult(url, originalDataUrl || undefined);
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
  }

  return (
    <div className={className}>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
        onClick={handleGrayscale}
        disabled={processing || disabled || !imageFile}
      >
        <Wand2 className="w-4 h-4" />
        {processing && <Loader2 className="animate-spin w-4 h-4" />}
        Grayscale
      </button>
      {processing && (
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing...
        </div>
      )}
      {error && (
        <div className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default GrayscaleTool;
