"use client";
import Image from "next/image";

import { Loader2, ArrowLeft } from "lucide-react";
import UndoButton from "../components/UndoButton";
import ExportButton from "../components/ExportButton";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import CombinedColorTool from "../components/CombinedColorTool";
import DrawingTool from "../components/DrawingTool";
import TranslationTool from "../components/TranslationTool";
import RotationTool from "../components/RotationTool";
import ResizeCropTool from "../components/ResizeCropTool";
import ArithmeticBitwiseTool from "../components/ArithmeticBitwiseTool";
import ConvolutionTool from "../components/ConvolutionTool";
import ThresholdTool from "../components/ThresholdTool";
import MorphologyTool from "../components/MorphologyTool";

import { useImage } from "../ImageContext";

export default function EditPage() {
  const router = useRouter();
  const { image } = useImage();
  const [processing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const prevResultUrl = useRef<string | null>(null);
  const isUndoClicked = useRef(false);
  const createdBlobUrls = useRef<Set<string>>(new Set());
  
  const [undoStack, setUndoStack] = useState<
    {
      url: string;
      hsv: { h: number; s: number; v: number };
      rgb?: { r: number; g: number; b: number };
      lastTool?:
        | "hsv"
        | "rgb"
        | "translation"
        | "rotation"
        | "rotation-transform"
        | "resize"
        | "interpolation"
        | "crop"
        | "arithmetic"
        | "bitwise"
        | "convolution"
        | "blur"
        | "sharpen"
        | "threshold"
        | "morphology";
    }[]
  >([]);
  
  const [translationVals, setTranslationVals] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  
  const [rotationVal, setRotationVal] = useState<{ angle: number }>({
    angle: 0,
  });
  
  const [editHistory, setEditHistory] = useState<
    {
      url: string;
      hsv: { h: number; s: number; v: number };
      rgb?: { r: number; g: number; b: number };
      translation?: { x: number; y: number };
      rotation?: { angle: number } | { op: string };
      lastTool?:
        | "hsv"
        | "rgb"
        | "translation"
        | "rotation"
        | "rotation-transform"
        | "resize"
        | "interpolation"
        | "crop"
        | "arithmetic"
        | "bitwise"
        | "convolution"
        | "blur"
        | "sharpen"
        | "threshold"
        | "morphology";
    }[]
  >([]);
  
  const [hsvSlider, setHsvSlider] = useState({ h: 0, s: 1, v: 1 });
  const [rgbSlider, setRgbSlider] = useState({ r: 1, g: 1, b: 1 });

  const [activeModal, setActiveModal] = useState<
    | null
    | "color"
    | "hsv"
    | "rgb"
    | "translation"
    | "rotation"
    | "resize"
    | "arithmetic"
    | "convolution"
    | "threshold"
    | "morphology"
  >(null);

  useEffect(() => {
    const saved = localStorage.getItem("pixelplus-edit-preview");
    if (saved) {
      setResult(saved);
    }
    setUndoStack([]);
    setHsvSlider({ h: 0, s: 1, v: 1 });
  }, [image.dataUrl, image.fileName]);
  
  const [error] = useState<string | null>(null);

  const handleEditResult = useCallback(
    (
      url: string,
      originalForUndo?: string,
      sliderValues?: {
        type:
          | "hsv"
          | "rgb"
          | "translation"
          | "rotation"
          | "rotation-transform"
          | "scale"
          | "resize"
          | "interpolation"
          | "crop"
          | "arithmetic"
          | "bitwise"
          | "convolution"
          | "blur"
          | "sharpen"
          | "threshold"
          | "morphology";
        values:
          | { h: number; s: number; v: number }
          | { r: number; g: number; b: number }
          | { x: number; y: number }
          | { angle: number }
          | { op: string }
          | { sx: number; sy: number; interp: string }
          | { w: number; h: number; interp: string }
          | { method: string }
          | { x: number; y: number; w: number; h: number }
          | { operation: string; weight1?: number; weight2?: number; scale?: number }
          | { blurType?: string; blurSize?: number }
          | { sharpenIntensity?: number; unsharpAmount?: number; unsharpRadius?: number }
          | { effect?: string; method?: string }
          | { kernel?: number[][]; normalize?: boolean }
          | { thresholdType?: string; thresholdValue?: number; maxValue?: number; adaptiveMethod?: string; blockSize?: number; cConstant?: number }
          | { operation?: string; kernelSize?: number; kernelShape?: string; iterations?: number; threshold1?: number; threshold2?: number };
      }
    ) => {
      console.log(`Received new edit result URL: ${url}`);

      if (url.startsWith("blob:")) {
        createdBlobUrls.current.add(url);
        console.log(
          `Added URL to tracked set, now tracking ${createdBlobUrls.current.size} URLs`
        );
      }

      if (result) {
        const currentTool = sliderValues?.type;
        console.log(
          `Adding current result to history: ${result}, tool: ${currentTool}`
        );

        const toolType = currentTool === "scale" ? "resize" : currentTool;

        setEditHistory((prev) => [
          ...prev,
          {
            url: result,
            hsv: hsvSlider,
            rgb: rgbSlider,
            translation: translationVals,
            rotation:
              sliderValues?.type === "rotation" ? rotationVal : undefined,
            lastTool: toolType,
          },
        ]);
      } else if (originalForUndo) {
        console.log(
          `First edit, saving original to undo stack: ${originalForUndo}`
        );

        const toolType =
          sliderValues?.type === "scale" ? "resize" : sliderValues?.type;

        setUndoStack([
          {
            url: originalForUndo,
            hsv: { h: 0, s: 1, v: 1 },
            rgb: { r: 1, g: 1, b: 1 },
            lastTool: toolType,
          },
        ]);
      }

      if (sliderValues) {
        if (sliderValues.type === "hsv") {
          setHsvSlider(sliderValues.values as { h: number; s: number; v: number });
        } else if (sliderValues.type === "rgb") {
          setRgbSlider(sliderValues.values as { r: number; g: number; b: number });
        } else if (sliderValues.type === "translation") {
          setTranslationVals(sliderValues.values as { x: number; y: number });
        } else if (sliderValues.type === "rotation") {
          setRotationVal(sliderValues.values as { angle: number });
        }
      }

      setResult(url);
    },
    [result, hsvSlider, rgbSlider, translationVals, rotationVal]
  );

  const handleBackToDefault = useCallback(() => {
    if (undoStack.length > 0) {
      setResult(undoStack[0].url);
      setHsvSlider(undoStack[0].hsv);
      if (undoStack[0].rgb) {
        setRgbSlider(undoStack[0].rgb);
      } else {
        setRgbSlider({ r: 1, g: 1, b: 1 });
      }
      setTranslationVals({ x: 0, y: 0 });
      setRotationVal({ angle: 0 });
      setUndoStack([]);
    } else if (image.dataUrl) {
      setResult(null);
      setHsvSlider({ h: 0, s: 1, v: 1 });
      setRgbSlider({ r: 1, g: 1, b: 1 });
      setTranslationVals({ x: 0, y: 0 });
      setRotationVal({ angle: 0 });
    }
    setEditHistory([]);
    setActiveModal(null);
  }, [undoStack, image.dataUrl]);

  const undoLastEdit = useCallback(() => {
    console.log(`Undo clicked: editHistory length = ${editHistory.length}`);
    isUndoClicked.current = true;

    if (editHistory.length > 0) {
      const newHistory = [...editHistory];
      const previousState = newHistory.pop();

      setActiveModal(null);
      setEditHistory(newHistory);
      console.log(
        `After pop: editHistory will be length = ${newHistory.length}`
      );

      if (previousState) {
        console.log(`Undoing to URL: ${previousState.url}`);
        console.log(
          `Previous state last tool: ${previousState.lastTool || "none"}`
        );
        console.log(`Previous state HSV values:`, previousState.hsv);
        if (previousState.rgb) {
          console.log(`Previous state RGB values:`, previousState.rgb);
        }
        console.log(`URL is blob: ${previousState.url.startsWith("blob:")}`);
        if (previousState.url.startsWith("blob:")) {
          console.log(
            `URL is in tracked set: ${createdBlobUrls.current.has(
              previousState.url
            )}`
          );
          console.log(`Tracked URLs count: ${createdBlobUrls.current.size}`);
        }

        const isValidUrl =
          !previousState.url.startsWith("blob:") ||
          createdBlobUrls.current.has(previousState.url);

        if (isValidUrl) {
          setResult(previousState.url);
          setHsvSlider(previousState.hsv);
          if (previousState.rgb) {
            setRgbSlider(previousState.rgb);
          }
          if (previousState.translation) {
            setTranslationVals(previousState.translation);
          } else {
            setTranslationVals({ x: 0, y: 0 });
          }
          if (previousState.rotation && "angle" in previousState.rotation) {
            setRotationVal(previousState.rotation as { angle: number });
          } else {
            setRotationVal({ angle: 0 });
          }
          setActiveModal(null);
        } else {
          console.warn(
            "Invalid URL detected in history, falling back to original"
          );
          if (undoStack.length > 0) {
            setResult(undoStack[0].url);
            setHsvSlider(undoStack[0].hsv);
            if (undoStack[0].rgb) {
              setRgbSlider(undoStack[0].rgb);
            }
            setTranslationVals({ x: 0, y: 0 });
            setRotationVal({ angle: 0 });
          } else {
            setResult(image.dataUrl);
            setHsvSlider({ h: 0, s: 1, v: 1 });
            setRgbSlider({ r: 1, g: 1, b: 1 });
            setTranslationVals({ x: 0, y: 0 });
            setRotationVal({ angle: 0 });
          }
        }
      } else if (undoStack.length > 0) {
        setResult(undoStack[0].url);
        setHsvSlider(undoStack[0].hsv);
        if (undoStack[0].rgb) {
          setRgbSlider(undoStack[0].rgb);
        }
        setTranslationVals({ x: 0, y: 0 });
        setRotationVal({ angle: 0 });
        setActiveModal(null);
      } else {
        setResult(null);
        setHsvSlider({ h: 0, s: 1, v: 1 });
        setRgbSlider({ r: 1, g: 1, b: 1 });
        setTranslationVals({ x: 0, y: 0 });
        setRotationVal({ angle: 0 });
        setActiveModal(null);
      }
    } else if (result) {
      handleBackToDefault();
    }
  }, [editHistory, result, undoStack, handleBackToDefault, image.dataUrl]);

  useEffect(() => {
    if (result && result.startsWith("blob:")) {
      prevResultUrl.current = result;
    }

    if (isUndoClicked.current) {
      isUndoClicked.current = false;
    }
  }, [result]);

  useEffect(() => {
    const currentUrls = new Set(createdBlobUrls.current);
    const urlAtMount = prevResultUrl.current;

    return () => {
      currentUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Failed to revoke URL:", url, e);
        }
      });

      if (urlAtMount) {
        try {
          URL.revokeObjectURL(urlAtMount);
        } catch (e) {
          console.error("Failed to revoke initial URL:", e);
        }
      }
    };
  }, []);

  const handleExport = (type: "png" | "jpg" | "pdf") => {
    if (!result) return;
    alert("Download started!");
    if (type === "pdf") {
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
      const link = document.createElement("a");
      link.href = result;
      link.download = `edited.${type}`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen flex flex-row bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 relative">
      <aside
        className="fixed top-0 left-0 h-screen w-[260px] min-w-[260px] bg-white/70 dark:bg-gray-900/70 border-r border-gray-200 dark:border-gray-800 flex flex-col items-start py-8 gap-0 shadow-xl z-10 backdrop-blur-md"
        style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.10)", height: "100vh" }}
      >
        <button
          className="flex items-center gap-2 px-3 py-2 text-white hover:text-gray-200 font-medium mb-6 w-10 h-10 justify-start rounded-full hover:bg-blue-50 dark:hover:bg-blue-900 transition ml-4"
          onClick={() => router.push("/")}
          style={{ zIndex: 20 }}
          title="Back to Upload"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-full px-4 mb-6">
          <span className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
            Tools
          </span>
        </div>
        <div className="w-full flex flex-col items-start gap-3 px-4 overflow-y-auto flex-1">
          <div className="w-full flex flex-col items-start">
            <CombinedColorTool
              imageDataUrl={result || image.dataUrl}
              imageFile={image.file}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) => setActiveModal(open ? "color" : null)}
              hsvValues={hsvSlider}
              rgbValues={rgbSlider}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <DrawingTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onDrawingChange={setIsDrawing}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <ConvolutionTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) => setActiveModal(open ? "convolution" : null)}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <ThresholdTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) => setActiveModal(open ? "threshold" : null)}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <MorphologyTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) => setActiveModal(open ? "morphology" : null)}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <ResizeCropTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) => setActiveModal(open ? "resize" : null)}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <TranslationTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) =>
                setActiveModal(open ? "translation" : null)
              }
              translationValues={translationVals}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <RotationTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) => setActiveModal(open ? "rotation" : null)}
              rotationValues={rotationVal}
            />
          </div>
          <div className="w-40 border-b border-gray-200 dark:border-gray-700 my-2 opacity-60 ml-1" />
          <div className="w-full flex flex-col items-start">
            <ArithmeticBitwiseTool
              imageDataUrl={result || image.dataUrl}
              onResult={handleEditResult}
              disabled={processing || !(result || image.dataUrl)}
              onOpenChange={(open) =>
                setActiveModal(open ? "arithmetic" : null)
              }
            />
          </div>
        </div>
      </aside>
      <main
        className="flex-1 flex flex-col items-center px-8 py-8"
        style={{ marginLeft: 260 }}
      >
        <>
          <div
            id="color-modal-anchor"
            className={`absolute z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              right: "32px",
              top: "150px",
              minWidth: "380px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "color" ? "none" : undefined,
            }}
          ></div>
          <div
            id="convolution-modal-anchor"
            className={`absolute right-8 z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              top: "150px",
              minWidth: "480px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "convolution" ? "none" : undefined,
            }}
          ></div>
          <div
            id="threshold-modal-anchor"
            className={`absolute right-8 z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              top: "150px",
              minWidth: "420px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "threshold" ? "none" : undefined,
            }}
          ></div>
          <div
            id="morphology-modal-anchor"
            className={`absolute right-8 z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              top: "150px",
              minWidth: "420px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "morphology" ? "none" : undefined,
            }}
          ></div>
          <div
            id="resize-crop-modal-anchor"
            className={`absolute right-8 z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              top: "150px",
              minWidth: "360px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "resize" ? "none" : undefined,
            }}
          ></div>
          <div
            id="translation-modal-anchor"
            className={`absolute right-8 z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              top: "150px",
              minWidth: "350px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "translation"
                  ? "none"
                  : undefined,
            }}
          ></div>
          <div
            id="rotation-modal-anchor"
            className={`absolute right-8 z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              top: "150px",
              minWidth: "350px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "rotation" ? "none" : undefined,
            }}
          ></div>
          <div
            id="arithmetic-modal-anchor"
            className={`absolute right-8 z-[110] ${
              isDrawing ? "pointer-events-none" : ""
            }`}
            style={{
              top: "150px",
              minWidth: "400px",
              minHeight: "180px",
              display:
                activeModal && activeModal !== "arithmetic"
                  ? "none"
                  : undefined,
            }}
          ></div>
        </>
        <div className="w-full flex justify-between items-start mb-2">
          <UndoButton
            onClick={undoLastEdit}
            disabled={
              (!result && editHistory.length === 0) ||
              (result === image.dataUrl && editHistory.length === 0)
            }
          />
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
        <div className="flex flex-col items-center w-full max-w-4xl mt-4">
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
    </div>
  );
}