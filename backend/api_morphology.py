from fastapi import APIRouter, Body
import cv2
import numpy as np
import base64

router = APIRouter()

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

@router.get("/morphology/test")
def test_morphology():
    """Test endpoint to verify morphology router is registered"""
    return {
        "status": "Morphology router is working!",
        "endpoints": [
            "/morphology/test",
            "/morphology/dilation",
            "/morphology/erosion",
            "/morphology/opening",
            "/morphology/closing",
            "/morphology/canny"
        ]
    }

@router.post("/morphology/dilation")
def apply_dilation(
    image: str = Body(...),
    kernel_size: int = Body(5),
    kernel_shape: str = Body("rect"),  # rect, ellipse, cross
    iterations: int = Body(1)
):
    """
    Apply dilation morphological operation
    
    Args:
        image: Base64 encoded image
        kernel_size: Size of the structuring element (must be odd)
        kernel_shape: Shape of kernel - rect, ellipse, cross
        iterations: Number of times dilation is applied
    """
    try:
        img = base64_to_image(image)
        
        # Ensure kernel_size is odd and within reasonable bounds
        kernel_size = max(3, min(kernel_size, 31))
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        # Clamp iterations
        iterations = max(1, min(iterations, 10))
        
        # Create kernel based on shape
        kernel_shapes = {
            "rect": cv2.MORPH_RECT,
            "ellipse": cv2.MORPH_ELLIPSE,
            "cross": cv2.MORPH_CROSS
        }
        
        if kernel_shape not in kernel_shapes:
            return {"error": f"Unknown kernel shape: {kernel_shape}", "image": image}
        
        kernel = cv2.getStructuringElement(
            kernel_shapes[kernel_shape],
            (kernel_size, kernel_size)
        )
        
        # Apply dilation
        result = cv2.dilate(img, kernel, iterations=iterations)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in dilation: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/morphology/erosion")
def apply_erosion(
    image: str = Body(...),
    kernel_size: int = Body(5),
    kernel_shape: str = Body("rect"),  # rect, ellipse, cross
    iterations: int = Body(1)
):
    """
    Apply erosion morphological operation
    
    Args:
        image: Base64 encoded image
        kernel_size: Size of the structuring element (must be odd)
        kernel_shape: Shape of kernel - rect, ellipse, cross
        iterations: Number of times erosion is applied
    """
    try:
        img = base64_to_image(image)
        
        # Ensure kernel_size is odd and within reasonable bounds
        kernel_size = max(3, min(kernel_size, 31))
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        # Clamp iterations
        iterations = max(1, min(iterations, 10))
        
        # Create kernel based on shape
        kernel_shapes = {
            "rect": cv2.MORPH_RECT,
            "ellipse": cv2.MORPH_ELLIPSE,
            "cross": cv2.MORPH_CROSS
        }
        
        if kernel_shape not in kernel_shapes:
            return {"error": f"Unknown kernel shape: {kernel_shape}", "image": image}
        
        kernel = cv2.getStructuringElement(
            kernel_shapes[kernel_shape],
            (kernel_size, kernel_size)
        )
        
        # Apply erosion
        result = cv2.erode(img, kernel, iterations=iterations)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in erosion: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/morphology/opening")
def apply_opening(
    image: str = Body(...),
    kernel_size: int = Body(5),
    kernel_shape: str = Body("rect")  # rect, ellipse, cross
):
    """
    Apply opening morphological operation (erosion followed by dilation)
    Useful for removing noise
    
    Args:
        image: Base64 encoded image
        kernel_size: Size of the structuring element (must be odd)
        kernel_shape: Shape of kernel - rect, ellipse, cross
    """
    try:
        img = base64_to_image(image)
        
        # Ensure kernel_size is odd and within reasonable bounds
        kernel_size = max(3, min(kernel_size, 31))
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        # Create kernel based on shape
        kernel_shapes = {
            "rect": cv2.MORPH_RECT,
            "ellipse": cv2.MORPH_ELLIPSE,
            "cross": cv2.MORPH_CROSS
        }
        
        if kernel_shape not in kernel_shapes:
            return {"error": f"Unknown kernel shape: {kernel_shape}", "image": image}
        
        kernel = cv2.getStructuringElement(
            kernel_shapes[kernel_shape],
            (kernel_size, kernel_size)
        )
        
        # Apply opening
        result = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in opening: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/morphology/closing")
def apply_closing(
    image: str = Body(...),
    kernel_size: int = Body(5),
    kernel_shape: str = Body("rect")  # rect, ellipse, cross
):
    """
    Apply closing morphological operation (dilation followed by erosion)
    Useful for closing small holes in foreground objects
    
    Args:
        image: Base64 encoded image
        kernel_size: Size of the structuring element (must be odd)
        kernel_shape: Shape of kernel - rect, ellipse, cross
    """
    try:
        img = base64_to_image(image)
        
        # Ensure kernel_size is odd and within reasonable bounds
        kernel_size = max(3, min(kernel_size, 31))
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        # Create kernel based on shape
        kernel_shapes = {
            "rect": cv2.MORPH_RECT,
            "ellipse": cv2.MORPH_ELLIPSE,
            "cross": cv2.MORPH_CROSS
        }
        
        if kernel_shape not in kernel_shapes:
            return {"error": f"Unknown kernel shape: {kernel_shape}", "image": image}
        
        kernel = cv2.getStructuringElement(
            kernel_shapes[kernel_shape],
            (kernel_size, kernel_size)
        )
        
        # Apply closing
        result = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in closing: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/morphology/canny")
def apply_canny_edge_detection(
    image: str = Body(...),
    threshold1: int = Body(100),
    threshold2: int = Body(200),
    aperture_size: int = Body(3),
    l2_gradient: bool = Body(False)
):
    """
    Apply Canny edge detection
    
    Args:
        image: Base64 encoded image
        threshold1: First threshold for the hysteresis procedure (0-255)
        threshold2: Second threshold for the hysteresis procedure (0-255)
        aperture_size: Aperture size for Sobel operator (3, 5, or 7)
        l2_gradient: Use L2 norm for gradient calculation (more accurate but slower)
    """
    try:
        img = base64_to_image(image)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Clamp threshold values
        threshold1 = max(0, min(threshold1, 255))
        threshold2 = max(0, min(threshold2, 255))
        
        # Ensure aperture_size is valid (3, 5, or 7)
        if aperture_size not in [3, 5, 7]:
            aperture_size = 3
        
        # Apply Canny edge detection
        edges = cv2.Canny(
            gray,
            threshold1,
            threshold2,
            apertureSize=aperture_size,
            L2gradient=l2_gradient
        )
        
        # Convert back to BGR for consistency
        result = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in Canny edge detection: {str(e)}")
        return {"error": str(e), "image": image}