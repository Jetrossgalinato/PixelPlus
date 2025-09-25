"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

export default function HomePage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/grayscale/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to process image");
      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch (err) {
      alert("Error processing image");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
        PixelPlus: Photo Editor
      </h1>
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col items-center border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
        <p className="mb-2 text-gray-700 dark:text-gray-300">
          Drag & drop an image here, or{" "}
          <span className="text-blue-600 underline">browse</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />
        {image && (
          <div className="mt-6 w-full flex flex-col items-center">
            <img
              src={image}
              alt="Uploaded preview"
              className="rounded-lg shadow max-h-64 object-contain border border-gray-200 dark:border-gray-700"
            />
            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {fileName}
            </span>
            <button
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? <Loader2 className="animate-spin w-4 h-4" /> : null}
              Convert to Grayscale
            </button>
          </div>
        )}
      </div>
      {result && (
        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
            Result
          </h2>
          <img
            src={result}
            alt="Grayscale result"
            className="rounded-lg shadow max-h-64 object-contain border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}
    </div>
  );
}
