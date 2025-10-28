/**
 * Threshold Service
 * Handles communication with the backend threshold API
 */

const API_BASE_URL = "http://localhost:8000";

/**
 * Apply binary thresholding to the image
 */
export const applyBinaryThreshold = async (
  imageBase64: string,
  thresholdValue: number,
  maxValue: number,
  thresholdType: "binary" | "binary_inv" | "trunc" | "tozero" | "tozero_inv"
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/threshold/binary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      threshold_value: thresholdValue,
      max_value: maxValue,
      threshold_type: thresholdType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply binary threshold: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply adaptive thresholding to the image
 */
export const applyAdaptiveThreshold = async (
  imageBase64: string,
  maxValue: number,
  adaptiveMethod: "mean" | "gaussian",
  thresholdType: "binary" | "binary_inv",
  blockSize: number,
  cConstant: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/threshold/adaptive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      max_value: maxValue,
      adaptive_method: adaptiveMethod,
      threshold_type: thresholdType,
      block_size: blockSize,
      c_constant: cConstant,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply adaptive threshold: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply Otsu's thresholding (automatic threshold calculation)
 */
export const applyOtsuThreshold = async (
  imageBase64: string,
  thresholdType: "binary" | "binary_inv"
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/threshold/otsu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      threshold_type: thresholdType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply Otsu threshold: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};