/**
 * Translation Service
 * Handles communication with the backend translation API
 */

const API_BASE_URL = "http://localhost:8000";

/**
 * Translate an image by shifting it along X and Y axes
 * @param imageBase64 Base64 encoded image data
 * @param shiftX Horizontal shift in pixels (positive = right, negative = left)
 * @param shiftY Vertical shift in pixels (positive = down, negative = up)
 * @returns Translated image as base64 string
 */
export const translateImage = async (
  imageBase64: string,
  shiftX?: number,
  shiftY?: number
): Promise<string> => {
  try {
    console.log(`Translating image by X: ${shiftX}, Y: ${shiftY}`);

    const response = await fetch(`${API_BASE_URL}/translation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageBase64,
        shift_x: shiftX,
        shift_y: shiftY,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to translate image: ${response.statusText}`);
      throw new Error(`Failed to translate image: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for error in the response
    if (data.error) {
      console.error(`Backend error translating image: ${data.error}`);
      throw new Error(`Backend error: ${data.error}`);
    }

    return data.image;
  } catch (error) {
    console.error("Error translating image:", error);
    return imageBase64; // Return original image on error
  }
};
