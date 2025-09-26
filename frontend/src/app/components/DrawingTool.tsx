"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeShape, setActiveShape] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const backgroundImageRef = useRef<fabric.Image | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const isDrawingRef = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const polygonPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Initialize canvas when component mounts or imageDataUrl changes
  useEffect(() => {
    if (imageDataUrl && !canvasRef.current && canvasWrapperRef.current) {
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
  }, [imageDataUrl]);

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
    saveCanvasImage();
    setActiveShape(null);
  }, [saveCanvasImage]);

  // Handle click outside toolbar
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        // If clicked outside toolbar but not on canvas, don't do anything
        if (
          canvasWrapperRef.current &&
          canvasWrapperRef.current.contains(event.target as Node)
        ) {
          return;
        }

        // If we have an active shape and clicked elsewhere, save changes
        if (activeShape) {
          saveCanvasImage();
          setActiveShape(null);
        }
      }
    },
    [activeShape, saveCanvasImage]
  );

  // Set up click outside detection
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Tool button handlers
  const handleDrawingButtonClick = () => {
    setShowToolbar((prevState) => !prevState);
    if (!activeShape) {
      setActiveShape("line"); // Default to line drawing when opened
    }
  };

  const handleShapeSelect = (shape: string) => {
    setActiveShape(shape);
  }; // Render the vertical toolbar similar to Photoshop
  const verticalToolbar = (
    <div
      id="drawing-tools"
      ref={toolbarRef}
      className={`drawing-tools bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-700 
                 flex flex-col gap-2 absolute left-full ml-2 top-0 z-40 
                 transition-opacity duration-200 ${
                   showToolbar ? "opacity-100" : "opacity-0 pointer-events-none"
                 }`}
      style={{ width: "50px" }}
    >
      {/* Tool buttons */}
      <button
        onClick={() => handleShapeSelect("line")}
        className={`p-2 rounded-md ${
          activeShape === "line"
            ? "bg-blue-500 text-white"
            : "bg-gray-700 text-gray-200 hover:bg-gray-600"
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
            : "bg-gray-700 text-gray-200 hover:bg-gray-600"
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
            : "bg-gray-700 text-gray-200 hover:bg-gray-600"
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
            : "bg-gray-700 text-gray-200 hover:bg-gray-600"
        }`}
        title="Draw Polygon (Double-click to finish)"
      >
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
            : "bg-gray-700 text-gray-200 hover:bg-gray-600"
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
            : "bg-gray-700 text-gray-200 hover:bg-gray-600"
        }`}
        title="Select and Move Objects"
      >
        <Move className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="border-t border-gray-600 my-1"></div>

      {/* Color selectors */}
      <button
        onClick={() => setShowColorPicker((prev) => !prev)}
        className="p-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 relative"
        title="Color Settings"
      >
        <div className="flex flex-col items-center">
          <div
            className="w-5 h-2.5 border border-white"
            style={{ backgroundColor: strokeColor }}
          ></div>
          <div
            className="w-5 h-2.5 border border-white"
            style={{ backgroundColor: fillColor }}
          ></div>
        </div>
      </button>

      {/* Width selector */}
      <button
        onClick={() => setShowSettings((prev) => !prev)}
        className="p-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600"
        title={`Line Width: ${strokeWidth}`}
      >
        <div className="flex justify-center items-center">
          <div
            className="rounded-full bg-white"
            style={{
              width: `${Math.min(20, strokeWidth + 3)}px`,
              height: `${Math.min(20, strokeWidth + 3)}px`,
            }}
          ></div>
        </div>
      </button>

      {/* Clear button */}
      <button
        onClick={clearCanvas}
        className="p-2 bg-red-900 text-red-300 rounded-md hover:bg-red-800 transition mt-auto"
        title="Clear all shapes"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Save button */}
      <button
        onClick={saveAndClose}
        className="p-2 bg-green-900 text-green-300 rounded-md hover:bg-green-800 transition"
        title="Save changes"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      </button>

      {/* Popovers for colors and settings */}
      {showColorPicker && (
        <div className="absolute left-full ml-2 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <div className="flex flex-col gap-3 min-w-[150px]">
            <div>
              <label className="text-sm text-gray-300 block mb-1">Fill:</label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-full h-8 border-none rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 block mb-1">
                Stroke:
              </label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full h-8 border-none rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="absolute left-full ml-2 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <div className="min-w-[150px]">
            <label className="text-sm text-gray-300 block mb-1">
              Width: {strokeWidth}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Text input (when text tool is active) */}
      {activeShape === "text" && (
        <div className="absolute left-full ml-2 top-0 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text..."
            className="w-[150px] p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-200"
            autoFocus
          />
        </div>
      )}

      {/* Help text for polygon */}
      {activeShape === "polygon" && (
        <div className="absolute left-full ml-2 bottom-0 bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-700">
          <p className="text-xs text-gray-400 whitespace-nowrap">
            Click to add points.
            <br />
            Double-click to finish.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      {/* Drawing button with the toolbar */}
      <div className="relative">
        <button
          className={`flex items-center gap-2 px-4 py-2 ${
            activeShape ? "bg-blue-600" : "bg-green-600"
          } text-white rounded-lg shadow hover:bg-opacity-90 transition disabled:opacity-50`}
          onClick={handleDrawingButtonClick}
          disabled={disabled || !imageDataUrl}
          title={activeShape ? "Drawing mode active" : "Enable drawing mode"}
        >
          <Pencil className="w-4 h-4" />
          {activeShape ? "Drawing" : "Draw"}
        </button>

        {/* Vertical toolbar positioned to the right of the button */}
        {verticalToolbar}
      </div>

      {/* Canvas container always present but only visible when needed */}
      <div
        className="w-full relative overflow-hidden"
        ref={canvasWrapperRef}
        style={{
          minHeight: "300px",
          display: canvasRef.current ? "block" : "none",
        }}
      >
        <canvas id="drawing-canvas" className="absolute inset-0"></canvas>
      </div>

      {/* Text input for when it's needed outside the toolbar */}
      {activeShape === "text" && showSettings && (
        <div className="fixed bottom-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 z-50">
          <p className="text-xs text-gray-400 mb-1">
            Click on the canvas to place text:
          </p>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text here..."
            className="w-[250px] p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-200"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
