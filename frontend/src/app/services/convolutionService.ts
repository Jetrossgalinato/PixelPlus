/**
 * Convolution Service
 * Handles communication with the backend convolution API
 */

const API_BASE_URL = "http://localhost:8000";

/**
 * Apply a custom convolution kernel to the image
 */
export const applyCustomConvolution = async (
  imageBase64: string,
  kernel: number[][],
  normalize: boolean = true
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/convolution/custom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      kernel: kernel,
      normalize: normalize,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply convolution: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply blur filter to the image
 */
export const applyBlur = async (
  imageBase64: string,
  kernelSize: number,
  blurType: "average" | "gaussian" | "median" | "bilateral"
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/convolution/blur`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      kernel_size: kernelSize,
      blur_type: blurType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply blur: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply sharpening filter to the image
 */
export const applySharpen = async (
  imageBase64: string,
  intensity: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/convolution/sharpen`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      intensity: intensity,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply sharpen: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply edge detection to the image
 */
export const applyEdgeDetection = async (
  imageBase64: string,
  method: "sobel" | "laplacian" | "canny"
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/convolution/edge-detection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      method: method,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply edge detection: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply emboss effect to the image
 */
export const applyEmboss = async (imageBase64: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/convolution/emboss`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply emboss: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};

/**
 * Apply unsharp mask for professional sharpening
 */
export const applyUnsharpMask = async (
  imageBase64: string,
  amount: number,
  radius: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/convolution/unsharp-mask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      amount: amount,
      radius: radius,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply unsharp mask: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.image;
};