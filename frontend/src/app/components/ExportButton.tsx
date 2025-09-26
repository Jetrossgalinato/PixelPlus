"use client";
import { Download } from "lucide-react";
import React, { useState } from "react";
import Image from "next/image";

type ExportButtonProps = {
  disabled?: boolean;
  imageDataUrl: string | null;
  result: string | null;
  handleExport: (type: "png" | "jpg" | "pdf") => void;
};

export default function ExportButton({
  disabled,
  imageDataUrl,
  result,
  handleExport,
}: ExportButtonProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  return (
    <>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50"
        onClick={() => setShowExportModal(true)}
        disabled={disabled}
      >
        <Download className="w-4 h-4" /> Export
      </button>
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
                {imageDataUrl ? (
                  <Image
                    src={imageDataUrl}
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
    </>
  );
}
