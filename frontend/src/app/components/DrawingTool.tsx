"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { Pencil, Square, Circle, Type, Move, Trash2 } from "lucide-react";
import * as fabric from "fabric";

type DrawingToolProps = {
  imageDataUrl: string | null;
  onResult: (url: string, originalForUndo?: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function DrawingTool({
  imageDataUrl,
  onResult,
  disabled = false,
}: DrawingToolProps) {
  const [showCanvas, setShowCanvas] = useState(false);
  const [activeShape, setActiveShape] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const backgroundImageRef = useRef<fabric.Image | null>(null);

  const isDrawingRef = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const polygonPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Initialize canvas when showCanvas becomes true
  useEffect(() => {
    if (showCanvas && !canvasRef.current && canvasWrapperRef.current) {
      const canvas = new fabric.Canvas("drawing-canvas", {
        width: canvasWrapperRef.current.clientWidth,
        height: canvasWrapperRef.current.clientHeight,
        selection: true,
        preserveObjectStacking: true,
      });

      canvasRef.current = canvas;

      // Load the current image as background
      if (imageDataUrl) {
        // @ts-expect-error - Type issues with fabric.js Image.fromURL
        fabric.Image.fromURL(imageDataUrl, (img) => {
          // Scale image to fit canvas
          const canvasWidth = canvas.width || 800;
          const canvasHeight = canvas.height || 600;

          // Calculate scaling to fit image within canvas
          const scale = Math.min(
            canvasWidth / (img.width ?? 100),
            canvasHeight / (img.height ?? 100)
          );

          img.scale(scale);

          // Center the image
          img.set({
            left: (canvasWidth - (img.width ?? 100) * scale) / 2,
            top: (canvasHeight - (img.height ?? 100) * scale) / 2,
            selectable: false,
            evented: false,
          });

          // Store background image reference
          backgroundImageRef.current = img;

          // Set as background
          // @ts-expect-error - setBackgroundImage exists but TS doesn't recognize it
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        });
      }

      // Setup window resize handler
      const handleResize = () => {
        if (canvasWrapperRef.current && canvas) {
          canvas.setDimensions({
            width: canvasWrapperRef.current.clientWidth,
            height: canvasWrapperRef.current.clientHeight,
          });
          canvas.renderAll();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        canvas.dispose();
        canvasRef.current = null;
      };
    }
  }, [showCanvas, imageDataUrl]);

  // This section was removed to avoid duplicate declarations

  // Set up mouse event handlers for drawing shapes
  useEffect(() => {
    if (!canvasRef.current || !activeShape) return;

    const canvas = canvasRef.current;

    // @ts-expect-error - Fabric.js type definitions are incomplete
    const mouseDownHandler = (options) => {
      if (!activeShape || !canvas || options.target) return;

      const pointer = canvas.getPointer(options.e);
      isDrawingRef.current = true;
      startPointRef.current = { x: pointer.x, y: pointer.y };

      switch (activeShape) {
        case "line":
          shapeRef.current = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: strokeColor,
              strokeWidth,
              selectable: false,
            }
          );
          break;
        case "rectangle":
          shapeRef.current = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: strokeColor,
            strokeWidth,
            selectable: false,
          });
          break;
        case "circle":
          shapeRef.current = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: "transparent",
            stroke: strokeColor,
            strokeWidth,
            selectable: false,
          });
          break;
        case "polygon":
          if (polygonPointsRef.current.length === 0) {
            polygonPointsRef.current.push({ x: pointer.x, y: pointer.y });

            // Create a new polygon with initial point
            shapeRef.current = new fabric.Polygon(
              [{ x: pointer.x, y: pointer.y }],
              {
                fill: "transparent",
                stroke: strokeColor,
                strokeWidth,
                selectable: false,
              }
            );
            canvas.add(shapeRef.current);
          } else {
            // Add new point to existing polygon
            polygonPointsRef.current.push({ x: pointer.x, y: pointer.y });

            // Update polygon with new points
            if (shapeRef.current) {
              (shapeRef.current as fabric.Polygon).set({
                points: [...polygonPointsRef.current],
              });
              canvas.renderAll();
            }
          }
          return;
      }

      if (shapeRef.current && activeShape !== "polygon") {
        canvas.add(shapeRef.current);
      }
    };

    // @ts-expect-error - Fabric.js type definitions are incomplete
    const mouseMoveHandler = (options) => {
      if (
        !isDrawingRef.current ||
        !shapeRef.current ||
        activeShape === "polygon"
      )
        return;

      const pointer = canvas.getPointer(options.e);

      switch (activeShape) {
        case "line":
          (shapeRef.current as fabric.Line).set({
            x2: pointer.x,
            y2: pointer.y,
          });
          break;
        case "rectangle":
          const width = pointer.x - startPointRef.current.x;
          const height = pointer.y - startPointRef.current.y;
          (shapeRef.current as fabric.Rect).set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startPointRef.current.x : pointer.x,
            top: height > 0 ? startPointRef.current.y : pointer.y,
          });
          break;
        case "circle":
          const radius = Math.sqrt(
            Math.pow(pointer.x - startPointRef.current.x, 2) +
              Math.pow(pointer.y - startPointRef.current.y, 2)
          );
          (shapeRef.current as fabric.Circle).set({
            radius,
          });
          break;
      }

      canvas.renderAll();
    };

    const mouseUpHandler = () => {
      if (
        !isDrawingRef.current ||
        !shapeRef.current ||
        activeShape === "polygon"
      )
        return;

      // Make shape selectable and set fill color
      shapeRef.current.set({
        selectable: true,
        fill: fillColor,
      });

      canvas.renderAll();
      isDrawingRef.current = false;

      // For anything other than polygon, reset shape reference after completion
      if (activeShape !== "polygon") {
        shapeRef.current = null;
      }
    };

    const dblClickHandler = () => {
      if (activeShape !== "polygon" || !shapeRef.current) return;

      // Finish polygon on double click
      isDrawingRef.current = false;
      (shapeRef.current as fabric.Polygon).set({
        selectable: true,
        fill: fillColor,
      });

      canvas.renderAll();
      polygonPointsRef.current = [];
      shapeRef.current = null;
    };

    canvas.on("mouse:down", mouseDownHandler);
    canvas.on("mouse:move", mouseMoveHandler);
    canvas.on("mouse:up", mouseUpHandler);
    canvas.on("mouse:dblclick", dblClickHandler);

    return () => {
      canvas.off("mouse:down", mouseDownHandler);
      canvas.off("mouse:move", mouseMoveHandler);
      canvas.off("mouse:up", mouseUpHandler);
      canvas.off("mouse:dblclick", dblClickHandler);
    };
  }, [activeShape, fillColor, strokeColor, strokeWidth]);

  // Add text on click when text tool is active
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // @ts-expect-error - Fabric.js type definitions are incomplete
    const addTextHandler = (options) => {
      if (activeShape !== "text" || !textInput.trim()) return;

      // Only add text if clicking on empty canvas area
      if (options.target) return;

      const pointer = canvas.getPointer(options.e);
      const text = new fabric.Textbox(textInput, {
        left: pointer.x,
        top: pointer.y,
        fill: strokeColor,
        fontSize: 20,
        fontFamily: "Arial",
        editable: true,
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    };

    if (activeShape === "text") {
      canvas.on("mouse:down", addTextHandler);
      return () => {
        canvas.off("mouse:down", addTextHandler);
      };
    }
  }, [activeShape, textInput, strokeColor]);

  // Handle move mode
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    if (activeShape === "move") {
      canvas.selection = true;
      canvas.forEachObject((obj: fabric.Object) => {
        obj.selectable = true;
        obj.evented = true;
      });
    } else {
      canvas.selection = false;
      canvas.forEachObject((obj: fabric.Object) => {
        obj.selectable = false;
        obj.evented = false;
      });
    }

    canvas.renderAll();
  }, [activeShape]);

  // Clear canvas and reset
  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.getObjects().forEach((obj: fabric.Object) => {
      if (obj !== backgroundImageRef.current) {
        canvas.remove(obj);
      }
    });

    canvas.renderAll();
  }, []);

  // Save canvas as image and provide to parent component
  const saveCanvasImage = useCallback(() => {
    if (!canvasRef.current || !imageDataUrl) return;

    const canvas = canvasRef.current;

    // Make all objects non-selectable for export
    canvas.discardActiveObject();
    const prevSelectable = canvas
      .getObjects()
      .map((obj: fabric.Object) => obj.selectable);
    canvas.getObjects().forEach((obj: fabric.Object) => {
      obj.selectable = false;
    });
    canvas.renderAll();

    // Get canvas data URL
    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    // Restore selectability
    canvas.getObjects().forEach((obj: fabric.Object, i: number) => {
      if (prevSelectable[i] !== undefined) {
        obj.selectable = prevSelectable[i];
      }
    });
    canvas.renderAll();

    onResult(dataUrl, imageDataUrl);
    return dataUrl;
  }, [imageDataUrl, onResult]);

  const saveAndClose = useCallback(() => {
    if (showCanvas) {
      saveCanvasImage();
      setShowCanvas(false);
      setActiveShape(null);
    }
  }, [showCanvas, saveCanvasImage]);

  // Handle click outside canvas
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (showCanvas && canvasWrapperRef.current) {
        if (!canvasWrapperRef.current.contains(event.target as Node)) {
          // Check if click is on tool controls
          const controlsArea = document.getElementById("drawing-controls");
          if (!controlsArea || !controlsArea.contains(event.target as Node)) {
            saveAndClose();
          }
        }
      }
    },
    [showCanvas, saveAndClose]
  );

  // Set up click outside detection
  useEffect(() => {
    if (showCanvas) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showCanvas, handleClickOutside]);

  // Tool button handlers
  const handleDrawingButtonClick = () => {
    setShowCanvas(true);
    setActiveShape("line"); // Default to line drawing when opened
  };

  const handleShapeSelect = (shape: string) => {
    setActiveShape(shape);
  };

  // Render the drawing tools UI
  const drawingControls = (
    <div
      id="drawing-controls"
      className="drawing-controls bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-3xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Drawing Tools
          </h3>
          <div className="space-x-2">
            <button
              onClick={clearCanvas}
              className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition"
              title="Clear all shapes"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={saveAndClose}
              className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition"
              title="Save and close"
            >
              Save
            </button>
          </div>
        </div>

        {/* Shape Tools */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleShapeSelect("line")}
            className={`p-2 rounded-md ${
              activeShape === "line"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Draw Line"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleShapeSelect("rectangle")}
            className={`p-2 rounded-md ${
              activeShape === "rectangle"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Draw Rectangle"
          >
            <Square className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleShapeSelect("circle")}
            className={`p-2 rounded-md ${
              activeShape === "circle"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Draw Circle"
          >
            <Circle className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleShapeSelect("polygon")}
            className={`p-2 rounded-md ${
              activeShape === "polygon"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Draw Polygon (Double-click to finish)"
          >
            {/* Using a basic polygon shape instead of Pentagon */}
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 19 7 19 17 12 22 5 17 5 7" />
            </svg>
          </button>
          <button
            onClick={() => handleShapeSelect("text")}
            className={`p-2 rounded-md ${
              activeShape === "text"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleShapeSelect("move")}
            className={`p-2 rounded-md ${
              activeShape === "move"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Select and Move Objects"
          >
            <Move className="w-5 h-5" />
          </button>
        </div>

        {/* Text Input (visible only when text tool is selected) */}
        {activeShape === "text" && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
          </div>
        )}

        {/* Color and Style Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Fill:
            </label>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-8 h-8 border-none rounded cursor-pointer"
              title="Fill Color"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Stroke:
            </label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 border-none rounded cursor-pointer"
              title="Stroke Color"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Width:
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-24"
              title="Stroke Width"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {strokeWidth}
            </span>
          </div>
        </div>

        {/* Instructions */}
        {activeShape === "polygon" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click to add polygon points. Double-click to finish.
          </p>
        )}
      </div>
    </div>
  );

  // Canvas UI for drawing
  const canvasUI = (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col w-full max-w-4xl h-[80vh] overflow-hidden">
        {/* Controls at top */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {drawingControls}
        </div>

        {/* Canvas */}
        <div
          className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900"
          ref={canvasWrapperRef}
        >
          <canvas id="drawing-canvas" className="absolute inset-0"></canvas>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50"
        onClick={handleDrawingButtonClick}
        disabled={disabled || !imageDataUrl}
      >
        <Pencil className="w-4 h-4" /> Draw
      </button>

      {/* Render canvas UI when showCanvas is true */}
      {showCanvas &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(canvasUI, document.body)}
    </>
  );
}
