"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, Square, Circle, Type, Trash2 } from "lucide-react";
import * as fabric from "fabric";
import * as drawingService from "../services/drawingService";

// Define a type that augments Fabric.js objects with missing types in their definitions
declare module "fabric" {
  interface Object {
    bringToFront(): fabric.Object;
  }

  interface Polygon {
    bringToFront(): fabric.Polygon;
  }

  interface Line {
    bringToFront(): fabric.Line;
  }
}

type DrawingToolProps = {
  imageDataUrl: string | null;
  onResult: (url: string, originalForUndo?: string) => void;
  disabled?: boolean;
  className?: string;
  onDrawingChange?: (isDrawing: boolean) => void;
};

export default function DrawingTool({
  imageDataUrl,
  onResult,
  disabled = false,
  onDrawingChange,
}: DrawingToolProps) {
  // === State definitions ===
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeShape, setActiveShape] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // === Refs ===
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const isDrawingRef = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const polygonPointsRef = useRef<{ x: number; y: number }[]>([]);

  // === Helper Functions (define all utility functions first) ===

  // Function to convert RGBA to hex format for backend processing
  const rgbaToHex = useCallback((rgba: string): string => {
    if (!rgba.startsWith("rgba")) return rgba;

    try {
      // Extract RGB values from rgba
      const rgbaValues = rgba.replace("rgba(", "").replace(")", "").split(",");

      const r = parseInt(rgbaValues[0].trim());
      const g = parseInt(rgbaValues[1].trim());
      const b = parseInt(rgbaValues[2].trim());

      // Convert to hex
      const toHex = (c: number): string => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (e) {
      console.error("Error converting RGBA to hex:", e);
      return "#000000"; // Default fallback color
    }
  }, []);

  // Function to get image preview element boundaries
  const getImageBoundaries = useCallback(() => {
    // Find the image element in the edit preview
    const imageElements = document.querySelectorAll(
      'img[alt="Edited"], img[alt="Preview"]'
    );
    const imageElement = imageElements[0] as HTMLImageElement;

    if (!imageElement) return null;

    const rect = imageElement.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Function to check if a point is within the image boundaries
  const isPointInImage = useCallback(
    (clientX: number, clientY: number) => {
      const boundaries = getImageBoundaries();
      if (!boundaries) return false;

      return (
        clientX >= boundaries.left &&
        clientX <= boundaries.right &&
        clientY >= boundaries.top &&
        clientY <= boundaries.bottom
      );
    },
    [getImageBoundaries]
  );

  // Save canvas as image and provide to parent component
  const saveCanvasImage = useCallback(async () => {
    if (!canvasRef.current || !imageDataUrl) {
      console.log("Cannot save - canvas or image is missing");
      return;
    }

    const canvas = canvasRef.current;

    // Check if there are any drawings on the canvas
    if (canvas.getObjects().length === 0) {
      // No drawings, just return the original image
      onResult(imageDataUrl, imageDataUrl);
      return imageDataUrl;
    }

    try {
      // Get the image preview element boundaries to ensure proper positioning
      const imageBoundaries = getImageBoundaries();
      if (!imageBoundaries) {
        console.error("Could not get image boundaries");
        return;
      }

      // Create new image from original data to get dimensions
      const originalImage = new Image();

      await new Promise<void>((resolve) => {
        originalImage.onload = () => resolve();
        originalImage.src = imageDataUrl;
      });

      // Calculate scale ratio between display size and actual image size
      const scaleRatioX = originalImage.width / imageBoundaries.width;
      const scaleRatioY = originalImage.height / imageBoundaries.height;

      // Start with the original image
      let processedImage = imageDataUrl;

      console.log(`Processing ${canvas.getObjects().length} objects on canvas`);

      // Process each object on the canvas and send to backend
      for (const obj of canvas.getObjects()) {
        // Skip point markers (small circles used for polygon points)
        if (
          obj instanceof fabric.Circle &&
          obj.radius === 4 &&
          !obj.selectable
        ) {
          continue;
        }

        const objType = obj.type;
        console.log(`Processing object type: ${objType}`);

        const left = obj.left || 0;
        const top = obj.top || 0;

        // Calculate the actual coordinates on the image
        const imageLeft = imageBoundaries.left;
        const imageTop = imageBoundaries.top;

        // Adjust coordinates relative to the image
        const relativeLeft = left - imageLeft;
        const relativeTop = top - imageTop;

        // Scale to actual image size
        const scaledLeft = Math.round(relativeLeft * scaleRatioX);
        const scaledTop = Math.round(relativeTop * scaleRatioY);

        // Get object color properties
        const strokeColor = obj.stroke || "#000000";
        const fillColor =
          obj.fill && obj.fill !== "rgba(0,0,0,0)"
            ? (obj.fill as string)
            : null;
        const strokeWidth = obj.strokeWidth || 2;

        switch (objType) {
          case "line":
            if ("x1" in obj && "y1" in obj && "x2" in obj && "y2" in obj) {
              // Type cast to fabric.Line
              const lineObj = obj as fabric.Line;

              // For lines, we need to calculate the start and end points
              // Get line coordinates
              const x1 = Math.round(
                ((lineObj.x1 as number) - imageLeft) * scaleRatioX
              );
              const y1 = Math.round(
                ((lineObj.y1 as number) - imageTop) * scaleRatioY
              );
              const x2 = Math.round(
                ((lineObj.x2 as number) - imageLeft) * scaleRatioX
              );
              const y2 = Math.round(
                ((lineObj.y2 as number) - imageTop) * scaleRatioY
              );

              processedImage = await drawingService.drawLine(
                processedImage,
                x1,
                y1,
                x2,
                y2,
                strokeColor as string,
                strokeWidth as number
              );
            }
            break;

          case "rect":
            // Type cast to fabric.Rect
            const rectObj = obj as fabric.Rect;
            const rectWidth = Math.round(
              ((rectObj.width || 0) as number) * scaleRatioX
            );
            const rectHeight = Math.round(
              ((rectObj.height || 0) as number) * scaleRatioY
            );

            processedImage = await drawingService.drawRectangle(
              processedImage,
              scaledLeft,
              scaledTop,
              rectWidth,
              rectHeight,
              strokeColor as string,
              fillColor ? rgbaToHex(fillColor) : null,
              strokeWidth as number
            );
            break;

          case "circle":
            // Type cast to fabric.Circle to access radius property
            const circleObj = obj as fabric.Circle;
            const radius = Math.round((circleObj.radius || 0) * scaleRatioX);

            processedImage = await drawingService.drawCircle(
              processedImage,
              scaledLeft,
              scaledTop,
              radius,
              strokeColor as string,
              fillColor ? rgbaToHex(fillColor) : null,
              strokeWidth as number
            );
            break;

          case "polygon":
            if ("points" in obj && obj.points) {
              // Type cast to fabric.Polygon
              const polygonObj = obj as fabric.Polygon;

              console.log(
                `Processing polygon with ${polygonObj.points.length} points`
              );

              // Convert points to backend format
              const points = (
                polygonObj.points as { x: number; y: number }[]
              ).map((p) => {
                // Calculate absolute position of each point
                const absoluteX = p.x + (obj.left || 0);
                const absoluteY = p.y + (obj.top || 0);

                // Calculate position relative to image
                const relX = absoluteX - imageLeft;
                const relY = absoluteY - imageTop;

                // Scale to actual image size
                const x = Math.round(relX * scaleRatioX);
                const y = Math.round(relY * scaleRatioY);

                return [x, y];
              });

              console.log(`Sending polygon with points:`, points);

              // Process fill color for backend
              const processedFillColor = fillColor
                ? rgbaToHex(fillColor)
                : null;

              console.log(
                `Polygon colors - stroke: ${strokeColor}, fill: ${processedFillColor}`
              );

              processedImage = await drawingService.drawPolygon(
                processedImage,
                points,
                strokeColor as string,
                processedFillColor,
                strokeWidth as number
              );
            }
            break;

          case "textbox":
          case "i-text":
            if ("text" in obj) {
              // Type cast to fabric.Textbox or fabric.IText
              const textObj = obj as fabric.Textbox | fabric.IText;
              const text = (textObj.text as string) || "";
              const fontSize = (textObj.fontSize || 20) as number;

              processedImage = await drawingService.addText(
                processedImage,
                text,
                scaledLeft,
                scaledTop,
                fontSize,
                fillColor || (strokeColor as string),
                strokeWidth as number
              );
            }
            break;
        }
      }

      console.log("Drawing saved using backend API");
      onResult(processedImage, imageDataUrl);
      return processedImage;
    } catch (error) {
      console.error("Error saving canvas image:", error);
    }
  }, [imageDataUrl, onResult, getImageBoundaries, rgbaToHex]);

  // Simple wrapper for the canvas saving logic (used in multiple places)
  const processCanvasAndSave = useCallback(async () => {
    if (canvasRef.current && imageDataUrl) {
      const dataUrl = canvasRef.current.toDataURL();
      onResult(dataUrl, imageDataUrl);
    }
  }, [imageDataUrl, onResult]);

  // Handler for finishing a polygon drawing
  const finishPolygon = useCallback(
    (canvas: fabric.Canvas) => {
      if (polygonPointsRef.current.length < 3) {
        console.log("Not enough points to create polygon, need at least 3");
        // Remove point markers and temporary lines
        canvas.getObjects().forEach((obj) => {
          if (
            (obj instanceof fabric.Circle &&
              obj.radius === 4 &&
              !obj.selectable) ||
            (obj instanceof fabric.Line &&
              obj.strokeDashArray &&
              obj.strokeDashArray[0] === 5)
          ) {
            canvas.remove(obj);
          }
        });
        polygonPointsRef.current = [];
        return;
      }

      console.log(
        `Creating polygon with ${polygonPointsRef.current.length} points`
      );

      // Remove all point markers and temporary lines
      canvas.getObjects().forEach((obj) => {
        if (
          (obj instanceof fabric.Circle &&
            obj.radius === 4 &&
            !obj.selectable) ||
          (obj instanceof fabric.Line &&
            obj.strokeDashArray &&
            obj.strokeDashArray[0] === 5)
        ) {
          canvas.remove(obj);
        }
      });

      // Create the final polygon with all the collected points
      const finalPolygon = new fabric.Polygon([...polygonPointsRef.current], {
        fill: fabric.Color.fromHex(fillColor).setAlpha(0.5).toRgba(),
        stroke: strokeColor,
        strokeWidth,
        selectable: true,
        perPixelTargetFind: true, // Improve selection behavior
        objectCaching: false, // Disable object caching for better rendering
        evented: true, // Make sure it responds to events
      });

      // Add the polygon to the canvas
      canvas.add(finalPolygon);

      // Bring polygon to front to ensure visibility
      canvas.bringObjectToFront(finalPolygon);

      // Close the polygon by connecting the first and last points if needed
      if (polygonPointsRef.current.length > 2) {
        const first = polygonPointsRef.current[0];
        const last =
          polygonPointsRef.current[polygonPointsRef.current.length - 1];

        // Only add closing line if the first and last points aren't the same
        if (first.x !== last.x || first.y !== last.y) {
          const closingLine = new fabric.Line(
            [last.x, last.y, first.x, first.y],
            {
              stroke: strokeColor,
              strokeWidth,
              selectable: false,
            }
          );

          // Bring to front to ensure visibility and then remove after rendering
          canvas.add(closingLine);
          canvas.bringObjectToFront(closingLine);
          canvas.remove(closingLine);
        }
      }

      canvas.renderAll();

      // Log the polygon's properties for debugging
      console.log("Polygon created:", {
        points: finalPolygon.points,
        fill: finalPolygon.fill,
        stroke: finalPolygon.stroke,
        visible: finalPolygon.visible,
        selectable: finalPolygon.selectable,
        evented: finalPolygon.evented,
      });

      // Reset for next polygon
      const pointsCopy = [...polygonPointsRef.current]; // Store a copy for the direct API call
      polygonPointsRef.current = [];
      shapeRef.current = null;

      // Get boundaries for direct API call
      const imageBoundaries = getImageBoundaries();
      if (imageBoundaries && imageDataUrl) {
        // Create a new image to get real dimensions
        const img = new Image();
        img.onload = async () => {
          // Calculate scale factors
          const scaleX = img.width / imageBoundaries.width;
          const scaleY = img.height / imageBoundaries.height;

          // Convert points for direct API call
          const apiPoints = pointsCopy.map((p) => {
            const relX = p.x - imageBoundaries.left;
            const relY = p.y - imageBoundaries.top;
            return [Math.round(relX * scaleX), Math.round(relY * scaleY)];
          });

          console.log("Processing polygon points for API call:", apiPoints);

          try {
            // Direct API call to draw polygon to ensure it's processed
            const processedFillColor = fabric.Color.fromHex(fillColor)
              .setAlpha(0.5)
              .toRgba();
            const hexFillColor = rgbaToHex(processedFillColor);

            const result = await drawingService.drawPolygon(
              imageDataUrl,
              apiPoints,
              strokeColor,
              hexFillColor,
              strokeWidth
            );

            // Update the image with result
            onResult(result, imageDataUrl);
            setActiveShape("move");
          } catch (error) {
            console.error("Failed to draw polygon via API:", error);
            // Fallback to regular canvas saving
            processCanvasAndSave();
            setActiveShape("move");
          }
        };
        img.src = imageDataUrl;
      } else {
        // Fallback to regular canvas saving
        processCanvasAndSave();
        setActiveShape("move");
      }
    },
    [
      fillColor,
      strokeColor,
      strokeWidth,
      imageDataUrl,
      onResult,
      getImageBoundaries,
      rgbaToHex,
      processCanvasAndSave,
    ]
  );

  // Function to clean up unfinished polygons
  const cleanupUnfinishedPolygon = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Remove all point markers
    const markersToRemove: fabric.Circle[] = [];
    canvas.getObjects().forEach((obj) => {
      if (obj instanceof fabric.Circle && obj.radius === 4 && !obj.selectable) {
        markersToRemove.push(obj);
      }
    });

    // Remove all markers in a batch
    if (markersToRemove.length > 0) {
      markersToRemove.forEach((marker) => canvas.remove(marker));
      canvas.renderAll();
    }

    // Reset points array
    polygonPointsRef.current = [];
  }, []);

  // Clear canvas and reset
  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.clear(); // Clear all objects since we don't have a background to preserve

    canvas.renderAll();
  }, []);

  const saveAndClose = useCallback(() => {
    saveCanvasImage();
    setActiveShape(null);
  }, [saveCanvasImage]);

  // Handle click outside toolbar and image
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking on toolbar
      if (toolbarRef.current && toolbarRef.current.contains(target)) {
        return;
      }

      // Close color picker and settings if open
      setShowColorPicker(false);
      setShowSettings(false);

      // Check if clicked within the image preview area
      const clientX = event.clientX;
      const clientY = event.clientY;
      const isInImage = isPointInImage(clientX, clientY);

      // If clicked outside the image preview area, close the drawing tools
      if (!isInImage) {
        // If we have an active shape and clicked outside image, save changes
        if (activeShape) {
          // Cleanup polygon points if we're drawing a polygon
          if (activeShape === "polygon") {
            cleanupUnfinishedPolygon();
          }
          saveCanvasImage();
          setActiveShape(null);
        }
        // Close toolbar when clicking outside image
        setShowToolbar(false);
      }
      // If clicked inside image, keep drawing tools open
    },
    [activeShape, saveCanvasImage, isPointInImage, cleanupUnfinishedPolygon]
  );

  // Tool button handlers
  const handleDrawingButtonClick = useCallback(() => {
    const newShowToolbar = !showToolbar;
    setShowToolbar(newShowToolbar);
    if (onDrawingChange) {
      onDrawingChange(newShowToolbar);
    }

    // When opening toolbar, set default tool if none selected
    if (newShowToolbar && !activeShape) {
      setActiveShape("line"); // Default to line drawing when opened
    }

    // When closing toolbar, make sure to close related popovers too
    if (!newShowToolbar) {
      setShowColorPicker(false);
      setShowSettings(false);
    }
  }, [showToolbar, activeShape, onDrawingChange]);

  const handleShapeSelect = useCallback(
    (shape: string) => {
      // If switching from polygon to another tool, clean up unfinished polygon
      if (activeShape === "polygon" && shape !== "polygon") {
        cleanupUnfinishedPolygon();
      }
      setActiveShape(shape);
    },
    [activeShape, cleanupUnfinishedPolygon]
  );

  // Initialize canvas when toolbar is shown or image changes
  useEffect(() => {
    // Only create canvas when toolbar is shown or shape is active
    if (imageDataUrl && showToolbar && canvasWrapperRef.current) {
      // If canvas already exists, don't recreate it
      if (canvasRef.current) return;

      // Use viewport dimensions for full-screen overlay
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;

      // Create canvas with transparent background for overlay drawing
      const canvas = new fabric.Canvas("drawing-canvas", {
        width: canvasWidth,
        height: canvasHeight,
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: "transparent", // Make canvas background transparent
      });

      canvasRef.current = canvas;

      // No need to load background image since we're overlaying on existing image
      // The canvas will be transparent and drawing will appear on top

      // Setup window resize handler
      const handleResize = () => {
        if (canvasRef.current) {
          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;
          canvasRef.current.setDimensions({
            width: newWidth,
            height: newHeight,
          });
          canvasRef.current.renderAll();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        canvas.dispose();
        canvasRef.current = null;
      };
    }
  }, [imageDataUrl, showToolbar]);

  // Set up mouse event handlers for drawing shapes
  useEffect(() => {
    if (!canvasRef.current || !activeShape) return;

    const canvas = canvasRef.current;

    // @ts-expect-error - Fabric.js type definitions are incomplete
    const mouseDownHandler = (options) => {
      if (!activeShape || !canvas || options.target) return;

      // Check if the click is within the image boundaries
      const clientX = options.e.clientX;
      const clientY = options.e.clientY;
      if (!isPointInImage(clientX, clientY)) {
        return; // Don't allow drawing outside the image
      }

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
            fill: fabric.Color.fromHex(fillColor).setAlpha(0.3).toRgba(), // Semi-transparent fill preview
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
            fill: fabric.Color.fromHex(fillColor).setAlpha(0.3).toRgba(), // Semi-transparent fill preview
            stroke: strokeColor,
            strokeWidth,
            selectable: false,
            originX: "center",
            originY: "center", // Set origin to center for consistent positioning
          });
          break;
        case "polygon":
          // Store the point coordinates for the polygon
          polygonPointsRef.current.push({ x: pointer.x, y: pointer.y });

          // Create a visual marker for the point
          const pointMarker = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 4,
            fill: strokeColor,
            stroke: "#ffffff",
            strokeWidth: 1,
            selectable: false,
            originX: "center",
            originY: "center",
          });

          // Add the marker to the canvas
          canvas.add(pointMarker);

          // If we have at least 2 points, draw a line between the last two points
          if (polygonPointsRef.current.length > 1) {
            const lastIdx = polygonPointsRef.current.length - 1;
            const lastPoint = polygonPointsRef.current[lastIdx];
            const prevPoint = polygonPointsRef.current[lastIdx - 1];

            const line = new fabric.Line(
              [prevPoint.x, prevPoint.y, lastPoint.x, lastPoint.y],
              {
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                selectable: false,
                strokeDashArray: [5, 5], // Make line dashed for better visibility
              }
            );

            canvas.add(line);
          }

          canvas.renderAll();

          // We're not using shapeRef for the polygon during drawing
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
          // Calculate radius from center (startPoint) to current mouse position
          const radius = Math.sqrt(
            Math.pow(pointer.x - startPointRef.current.x, 2) +
              Math.pow(pointer.y - startPointRef.current.y, 2)
          );
          // Since we're using center origin, we only need to update the radius
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
      if (activeShape !== "polygon") return;

      // Finish polygon on double click
      isDrawingRef.current = false;

      // Call the polygon finishing function
      finishPolygon(canvas);
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
  }, [
    activeShape,
    fillColor,
    strokeColor,
    strokeWidth,
    isPointInImage,
    finishPolygon,
  ]);

  // Add text on click when text tool is active
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // @ts-expect-error - Fabric.js type definitions are incomplete
    const addTextHandler = (options) => {
      if (activeShape !== "text" || !textInput.trim()) return;

      // Only add text if clicking on empty canvas area
      if (options.target) return;

      // Check if the click is within the image boundaries
      const clientX = options.e.clientX;
      const clientY = options.e.clientY;
      if (!isPointInImage(clientX, clientY)) {
        return; // Don't allow text placement outside the image
      }

      const pointer = canvas.getPointer(options.e);
      const text = new fabric.Textbox(textInput, {
        left: pointer.x,
        top: pointer.y,
        fill: fillColor, // Use fillColor for text color instead of strokeColor
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
  }, [activeShape, textInput, strokeColor, fillColor, isPointInImage]);

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
        // Make sure temporary drawing markers aren't selectable
        if (
          obj instanceof fabric.Circle &&
          obj.radius === 4 &&
          !obj.selectable
        ) {
          // These are polygon point markers - keep them as is
          return;
        }
        obj.selectable = false;
        obj.evented = false;
      });
    }

    canvas.renderAll();
  }, [activeShape]);

  // Set up click outside detection
  useEffect(() => {
    // Add a slight delay to the click handler to ensure it runs after other click events
    const handleClickOutsideWithDelay = (event: MouseEvent) => {
      setTimeout(() => {
        handleClickOutside(event);
      }, 10);
    };

    document.addEventListener("mousedown", handleClickOutsideWithDelay);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideWithDelay);
    };
  }, [handleClickOutside]);

  // Render the vertical toolbar similar to Photoshop
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

      {/* Divider */}
      <div className="border-t border-gray-600 my-1"></div>

      {/* Color selectors */}
      <button
        onClick={() => setShowColorPicker((prev) => !prev)}
        className="p-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 relative"
        title="Color Settings (Stroke & Fill)"
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
        <div
          className="absolute left-full ml-2 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <div className="flex flex-col gap-3 min-w-[180px]">
            <p className="text-xs text-gray-400 mb-1">
              Select colors for your shapes:
            </p>

            <div>
              <label className="text-sm text-gray-300 block mb-1">
                Fill Color: <span className="text-xs">(Shapes & Text)</span>
              </label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-full h-8 border-none rounded cursor-pointer"
              />
              <div className="text-xs text-gray-400 mt-1">
                Used for shape interiors and text color
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-1">
                Stroke Color: <span className="text-xs">(Outlines)</span>
              </label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full h-8 border-none rounded cursor-pointer"
              />
              <div className="text-xs text-gray-400 mt-1">
                Used for shape outlines and lines
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="absolute left-full ml-2 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
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

      {/* Help text for polygon */}
      {activeShape === "polygon" && (
        <div
          className="absolute left-full ml-2 bottom-0 bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-700"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
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
    <>
      {/* Drawing button with the toolbar */}
      <div className="relative inline-block">
        <button
          className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${
            activeShape ? "bg-gray-700" : "bg-gray-600"
          } text-white rounded-lg shadow hover:bg-gray-800 transition disabled:opacity-50`}
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

      {/* Text input fixed at the bottom of the screen */}
      {activeShape === "text" && (
        <div
          className="fixed bottom-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 z-50"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
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

      {/* Canvas for drawing - positioned as needed */}
      {showToolbar && (
        <div
          id="drawing-canvas-container"
          ref={canvasWrapperRef}
          className="fixed inset-0 pointer-events-none z-30"
        >
          <canvas
            id="drawing-canvas"
            className="absolute inset-0"
            style={{ pointerEvents: activeShape ? "auto" : "none" }}
          ></canvas>
        </div>
      )}
    </>
  );
}
