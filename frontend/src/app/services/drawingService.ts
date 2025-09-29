/**
 * Drawing Service
 * Handles communication with the backend drawing API
 */

/**
 * Base API URL - adjust if your backend is running on a different port/host
 */
const API_BASE_URL = "http://localhost:8000";

/**
 * Draw a line on the image via the backend API
 */
export const drawLine = async (
  imageBase64: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string,
  thickness: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/drawing/line`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      start_x: startX,
      start_y: startY,
      end_x: endX,
      end_y: endY,
      color: color,
      thickness: thickness,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to draw line: ${response.statusText}`);
  }

  const data = await response.json();
  return data.image;
};

/**
 * Draw a rectangle on the image via the backend API
 */
export const drawRectangle = async (
  imageBase64: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  fillColor: string | null,
  thickness: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/drawing/rectangle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      x: x,
      y: y,
      width: width,
      height: height,
      color: color,
      fill_color: fillColor,
      thickness: thickness,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to draw rectangle: ${response.statusText}`);
  }

  const data = await response.json();
  return data.image;
};

/**
 * Draw a circle on the image via the backend API
 */
export const drawCircle = async (
  imageBase64: string,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  fillColor: string | null,
  thickness: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/drawing/circle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      center_x: centerX,
      center_y: centerY,
      radius: radius,
      color: color,
      fill_color: fillColor,
      thickness: thickness,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to draw circle: ${response.statusText}`);
  }

  const data = await response.json();
  return data.image;
};

/**
 * Draw a polygon on the image via the backend API
 */
export const drawPolygon = async (
  imageBase64: string,
  points: number[][],
  color: string,
  fillColor: string | null,
  thickness: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/drawing/polygon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      points: points,
      color: color,
      fill_color: fillColor,
      thickness: thickness,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to draw polygon: ${response.statusText}`);
  }

  const data = await response.json();
  return data.image;
};

/**
 * Add text to the image via the backend API
 */
export const addText = async (
  imageBase64: string,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  thickness: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/drawing/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      text: text,
      x: x,
      y: y,
      font_scale: fontSize / 10, // Convert font size to scale (approximate)
      color: color,
      thickness: thickness,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add text: ${response.statusText}`);
  }

  const data = await response.json();
  return data.image;
};
