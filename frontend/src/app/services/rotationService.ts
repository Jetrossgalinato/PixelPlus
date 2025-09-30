/**
 * Rotation Service
 * Handles communication with the backend rotation API
 */

const API_BASE_URL = "http://localhost:8000";

/**
 * Rotate an image by a specific angle
 * @param imageBase64 Base64 encoded image data
 * @param angle Rotation angle in degrees (positive = clockwise, negative = counter-clockwise)
 * @param scale Scale factor for the image (1.0 = original size)
 * @param keepDimensions Whether to keep the original image dimensions or adjust them to fit the rotated content
 * @returns Rotated image as base64 string
 */
export const rotateImage = async (
  imageBase64: string,
  angle: number,
  scale: number = 1.0,
  keepDimensions: boolean = true
): Promise<string> => {
  try {
    console.log(
      `Rotating image by ${angle} degrees, scale: ${scale}, keepDimensions: ${keepDimensions}`
    );

    const response = await fetch(`${API_BASE_URL}/rotation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageBase64,
        angle: angle,
        scale: scale,
        keep_dimensions: keepDimensions,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to rotate image: ${response.statusText}`);
      throw new Error(`Failed to rotate image: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for error in the response
    if (data.error) {
      console.error(`Backend error rotating image: ${data.error}`);
      throw new Error(`Backend error: ${data.error}`);
    }

    return data.image;
  } catch (error) {
    console.error("Error rotating image:", error);
    return imageBase64; // Return original image on error
  }
};

/**
 * Apply a fast transform (transpose/flip/90deg) using OpenCV ops on backend
 */
export const transformRotate = async (
  imageBase64: string,
  operation:
    | "transpose"
    | "flip0"
    | "flip1"
    | "flip-1"
    | "cw90"
    | "ccw90"
    | "rotate180"
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rotation/transform`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageBase64, operation }),
    });

    if (!response.ok) {
      throw new Error(`Failed to transform image: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.image;
  } catch (err) {
    console.error("Error applying transform:", err);
    return imageBase64;
  }
};
