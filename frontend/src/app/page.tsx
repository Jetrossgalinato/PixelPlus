"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useImage } from "./ImageContext";

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setImage } = useImage();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage({
        file,
        dataUrl: e.target?.result as string,
        fileName: file.name,
      });
      router.push("/edit");
    };
    reader.readAsDataURL(file);
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
      </div>
    </div>
  );
}
