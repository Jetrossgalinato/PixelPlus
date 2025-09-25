"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useImage } from "../ImageContext";

export default function EditPage() {
  const router = useRouter();
  const { image } = useImage();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGrayscale = async () => {
    if (!image.file) return;
    setProcessing(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", image.file);
    try {
      const res = await fetch("http://localhost:8000/grayscale/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to process image");
      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch {
      alert("Error processing image");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Edit Image
      </h1>
      <div className="flex flex-row gap-8 w-full max-w-4xl">
        <div className="flex-1 flex flex-col items-center">
          <h2 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
            Original
          </h2>
          {image.dataUrl ? (
            <img
              src={image.dataUrl}
              alt="Original"
              className="rounded-lg shadow max-h-96 object-contain border border-gray-200 dark:border-gray-700"
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
            <img
              src={result}
              alt="Grayscale"
              className="rounded-lg shadow max-h-96 object-contain border border-gray-200 dark:border-gray-700"
            />
          ) : image.dataUrl ? (
            <img
              src={image.dataUrl}
              alt="Preview"
              className="rounded-lg shadow max-h-96 object-contain border border-gray-200 dark:border-gray-700 opacity-50"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          <button
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            onClick={handleGrayscale}
            disabled={processing || !image.file}
          >
            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : null}
            Convert to Grayscale
          </button>
          {!image.file && (
            <div className="mt-2 text-xs text-red-500">
              Image not ready for processing. Try re-uploading.
            </div>
          )}
        </div>
      </div>
      <button
        className="mt-8 text-blue-600 underline"
        onClick={() => router.push("/")}
      >
        Back to Upload
      </button>
    </div>
  );
}
