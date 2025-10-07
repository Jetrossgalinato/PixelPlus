from fastapi import APIRouter, Body
import cv2
import numpy as np
import base64

router = APIRouter()

# Test endpoint to verify router is working
@router.get("/convolution/test")
def test_convolution():
    """Test endpoint to verify convolution router is registered"""
    return {"status": "Convolution router is working!", "endpoints": [
        "/convolution/test",
        "/convolution/custom",
        "/convolution/blur",
        "/convolution/sharpen",
        "/convolution/edge-detection",
        "/convolution/emboss",
        "/convolution/unsharp-mask"
    ]}

# Helper function to convert base64 to image
def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    
    image_bytes = base64.b64decode(base64_string)
    npimg = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(npimg, cv2.IMREAD_COLOR)

# Helper function to convert image to base64
def image_to_base64(image):
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.png', image)
    image_bytes = buffer.tobytes()
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:image/png;base64,{base64_string}"

@router.post("/convolution/custom")
def apply_custom_convolution(
    image: str = Body(...),
    kernel: list = Body(...),  # 2D array as list of lists
    normalize: bool = Body(True)
):
    """
    Apply a custom convolution kernel to the image
    
    Args:
        image: Base64 encoded image
        kernel: 2D kernel as list of lists (e.g., [[1,1,1],[1,1,1],[1,1,1]])
        normalize: Whether to normalize the kernel values
    """
    try:
        img = base64_to_image(image)
        
        # Convert kernel list to numpy array
        kernel_array = np.array(kernel, dtype=np.float32)
        
        # Validate kernel dimensions
        if len(kernel_array.shape) != 2:
            return {"error": "Kernel must be 2-dimensional"}
        
        if kernel_array.shape[0] != kernel_array.shape[1]:
            return {"error": "Kernel must be square"}
        
        if kernel_array.shape[0] % 2 == 0:
            return {"error": "Kernel dimensions must be odd"}
        
        # Normalize kernel if requested
        if normalize:
            kernel_sum = np.sum(kernel_array)
            if kernel_sum != 0:
                kernel_array = kernel_array / kernel_sum
        
        # Apply convolution using filter2D
        result = cv2.filter2D(img, -1, kernel_array)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in custom convolution: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/convolution/blur")
def apply_blur(
    image: str = Body(...),
    kernel_size: int = Body(5),
    blur_type: str = Body("average")  # average, gaussian, median, bilateral
):
    """
    Apply various blur filters to the image
    
    Args:
        image: Base64 encoded image
        kernel_size: Size of the blur kernel (must be odd)
        blur_type: Type of blur - average, gaussian, median, bilateral
    """
    try:
        img = base64_to_image(image)
        
        # Ensure kernel size is odd and positive
        if kernel_size < 1:
            kernel_size = 1
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        # Limit kernel size to prevent performance issues
        kernel_size = min(kernel_size, 31)
        
        if blur_type == "average":
            # Simple averaging blur
            result = cv2.blur(img, (kernel_size, kernel_size))
        
        elif blur_type == "gaussian":
            # Gaussian blur - smoother than average
            result = cv2.GaussianBlur(img, (kernel_size, kernel_size), 0)
        
        elif blur_type == "median":
            # Median blur - good for salt-and-pepper noise
            result = cv2.medianBlur(img, kernel_size)
        
        elif blur_type == "bilateral":
            # Bilateral filter - preserves edges while blurring
            # Uses fixed parameters for d, sigmaColor, sigmaSpace
            d = kernel_size
            sigma_color = 75
            sigma_space = 75
            result = cv2.bilateralFilter(img, d, sigma_color, sigma_space)
        
        else:
            return {"error": f"Unknown blur type: {blur_type}", "image": image}
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in blur: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/convolution/sharpen")
def apply_sharpen(
    image: str = Body(...),
    intensity: float = Body(1.0)  # Sharpening intensity (0.5 to 3.0)
):
    """
    Apply sharpening filter to the image
    
    Args:
        image: Base64 encoded image
        intensity: Sharpening intensity (0.5 = subtle, 1.0 = normal, 2.0+ = strong)
    """
    try:
        img = base64_to_image(image)
        
        # Clamp intensity to reasonable range
        intensity = max(0.1, min(intensity, 5.0))
        
        # Standard sharpening kernel
        # Center value increases with intensity
        center_value = 1 + (4 * intensity)
        edge_value = -intensity
        
        kernel = np.array([
            [0, edge_value, 0],
            [edge_value, center_value, edge_value],
            [0, edge_value, 0]
        ], dtype=np.float32)
        
        # Apply sharpening kernel
        result = cv2.filter2D(img, -1, kernel)
        
        # Clip values to valid range
        result = np.clip(result, 0, 255).astype(np.uint8)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in sharpen: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/convolution/edge-detection")
def apply_edge_detection(
    image: str = Body(...),
    method: str = Body("sobel")  # sobel, laplacian, canny
):
    """
    Apply edge detection filters to the image
    
    Args:
        image: Base64 encoded image
        method: Edge detection method - sobel, laplacian, canny
    """
    try:
        img = base64_to_image(image)
        
        # Convert to grayscale for edge detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        if method == "sobel":
            # Sobel edge detection
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            
            # Combine gradients
            magnitude = np.sqrt(sobelx**2 + sobely**2)
            magnitude = np.uint8(np.clip(magnitude, 0, 255))
            
            # Convert back to BGR for consistency
            result = cv2.cvtColor(magnitude, cv2.COLOR_GRAY2BGR)
        
        elif method == "laplacian":
            # Laplacian edge detection
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            laplacian = np.uint8(np.abs(laplacian))
            
            # Convert back to BGR
            result = cv2.cvtColor(laplacian, cv2.COLOR_GRAY2BGR)
        
        elif method == "canny":
            # Canny edge detection
            edges = cv2.Canny(gray, 100, 200)
            
            # Convert back to BGR
            result = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        
        else:
            return {"error": f"Unknown edge detection method: {method}", "image": image}
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in edge detection: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/convolution/emboss")
def apply_emboss(
    image: str = Body(..., embed=True)
):
    """
    Apply emboss effect to the image
    
    Args:
        image: Base64 encoded image
    """
    try:
        img = base64_to_image(image)
        
        # Emboss kernel
        kernel = np.array([
            [-2, -1, 0],
            [-1, 1, 1],
            [0, 1, 2]
        ], dtype=np.float32)
        
        # Apply emboss
        result = cv2.filter2D(img, -1, kernel)
        
        # Add 128 to shift values to visible range
        result = cv2.add(result, np.array([128.0]))
        result = np.clip(result, 0, 255).astype(np.uint8)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in emboss: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/convolution/unsharp-mask")
def apply_unsharp_mask(
    image: str = Body(...),
    amount: float = Body(1.5),  # Sharpening amount (0.5 to 3.0)
    radius: int = Body(5)  # Gaussian blur radius
):
    """
    Apply unsharp masking for professional sharpening
    
    Args:
        image: Base64 encoded image
        amount: Sharpening amount/strength
        radius: Radius for Gaussian blur (larger = sharpen larger features)
    """
    try:
        img = base64_to_image(image)
        
        # Ensure radius is odd
        if radius % 2 == 0:
            radius += 1
        
        # Clamp values
        amount = max(0.1, min(amount, 5.0))
        radius = max(1, min(radius, 31))
        
        # Create blurred version
        blurred = cv2.GaussianBlur(img, (radius, radius), 0)
        
        # Calculate the difference (mask)
        mask = cv2.subtract(img, blurred)
        
        # Add the weighted mask back to original
        result = cv2.addWeighted(img, 1.0, mask, amount, 0)
        
        # Clip to valid range
        result = np.clip(result, 0, 255).astype(np.uint8)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in unsharp mask: {str(e)}")
        return {"error": str(e), "image": image}