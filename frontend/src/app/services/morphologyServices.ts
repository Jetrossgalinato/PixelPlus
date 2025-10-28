/**
 * Morphology Service
 * Handles communication with the backend morphology API
 */

const API_BASE_URL = "http://localhost:8000";

/**
 * Apply dilation morphological operation
 */
export const applyDilation = async (
  imageBase64: string,
  kernelSize: number,
  kernelShape: "rect" | "ellipse" | "cross",
  iterations: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/morphology/dilation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      kernel_size: kernelSize,
      kernel_shape: kernelShape,
      iterations: iterations,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply dilation: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply erosion morphological operation
 */
export const applyErosion = async (
  imageBase64: string,
  kernelSize: number,
  kernelShape: "rect" | "ellipse" | "cross",
  iterations: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/morphology/erosion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      kernel_size: kernelSize,
      kernel_shape: kernelShape,
      iterations: iterations,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply erosion: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply opening morphological operation (erosion followed by dilation)
 */
export const applyOpening = async (
  imageBase64: string,
  kernelSize: number,
  kernelShape: "rect" | "ellipse" | "cross"
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/morphology/opening`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      kernel_size: kernelSize,
      kernel_shape: kernelShape,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply opening: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply closing morphological operation (dilation followed by erosion)
 */
export const applyClosing = async (
  imageBase64: string,
  kernelSize: number,
  kernelShape: "rect" | "ellipse" | "cross"
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/morphology/closing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      kernel_size: kernelSize,
      kernel_shape: kernelShape,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply closing: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply Canny edge detection
 */
export const applyCannyEdgeDetection = async (
  imageBase64: string,
  threshold1: number,
  threshold2: number,
  apertureSize: 3 | 5 | 7,
  l2Gradient: boolean
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/morphology/canny`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      threshold1: threshold1,
      threshold2: threshold2,
      aperture_size: apertureSize,
      l2_gradient: l2Gradient,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply Canny edge detection: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};