
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

@router.get("/threshold/test")
def test_threshold():
    """Test endpoint to verify threshold router is registered"""
    return {
        "status": "Threshold router is working!",
        "endpoints": [
            "/threshold/test",
            "/threshold/binary",
            "/threshold/adaptive",
            "/threshold/otsu"
        ]
    }

@router.post("/threshold/binary")
def apply_binary_threshold(
    image: str = Body(...),
    threshold_value: int = Body(127),
    max_value: int = Body(255),
    threshold_type: str = Body("binary")
):
    """
    Apply binary thresholding to the image
    
    Args:
        image: Base64 encoded image
        threshold_value: Threshold value (0-255)
        max_value: Maximum value to use with THRESH_BINARY and THRESH_BINARY_INV (0-255)
        threshold_type: Type of thresholding - binary, binary_inv, trunc, tozero, tozero_inv
    """
    try:
        img = base64_to_image(image)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Clamp values
        threshold_value = max(0, min(threshold_value, 255))
        max_value = max(0, min(max_value, 255))
        
        # Map threshold type to OpenCV constant
        threshold_types = {
            "binary": cv2.THRESH_BINARY,
            "binary_inv": cv2.THRESH_BINARY_INV,
            "trunc": cv2.THRESH_TRUNC,
            "tozero": cv2.THRESH_TOZERO,
            "tozero_inv": cv2.THRESH_TOZERO_INV
        }
        
        if threshold_type not in threshold_types:
            return {"error": f"Unknown threshold type: {threshold_type}", "image": image}
        
        thresh_type = threshold_types[threshold_type]
        
        # Apply threshold
        _, result = cv2.threshold(gray, threshold_value, max_value, thresh_type)
        
        # Convert back to BGR for consistency
        result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in binary threshold: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/threshold/adaptive")
def apply_adaptive_threshold(
    image: str = Body(..., embed=True),
    max_value: int = Body(255),
    adaptive_method: str = Body("mean"),  # mean, gaussian
    threshold_type: str = Body("binary"),  # binary, binary_inv
    block_size: int = Body(11),
    c_constant: int = Body(2)
):
    """
    Apply adaptive thresholding to the image
    
    Args:
        image: Base64 encoded image
        max_value: Maximum value (0-255)
        adaptive_method: Adaptive method - mean, gaussian
        threshold_type: Type of thresholding - binary, binary_inv
        block_size: Size of pixel neighborhood (must be odd, >= 3)
        c_constant: Constant subtracted from mean or weighted mean
    """
    try:
        img = base64_to_image(image)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Clamp values
        max_value = max(0, min(max_value, 255))
        block_size = max(3, block_size)
        
        # Ensure block_size is odd
        if block_size % 2 == 0:
            block_size += 1
        
        # Limit block_size to prevent performance issues
        block_size = min(block_size, 99)
        
        # Map adaptive method to OpenCV constant
        adaptive_methods = {
            "mean": cv2.ADAPTIVE_THRESH_MEAN_C,
            "gaussian": cv2.ADAPTIVE_THRESH_GAUSSIAN_C
        }
        
        if adaptive_method not in adaptive_methods:
            return {"error": f"Unknown adaptive method: {adaptive_method}", "image": image}
        
        method = adaptive_methods[adaptive_method]
        
        # Map threshold type to OpenCV constant
        threshold_types = {
            "binary": cv2.THRESH_BINARY,
            "binary_inv": cv2.THRESH_BINARY_INV
        }
        
        if threshold_type not in threshold_types:
            return {"error": f"Unknown threshold type: {threshold_type}", "image": image}
        
        thresh_type = threshold_types[threshold_type]
        
        # Apply adaptive threshold
        result = cv2.adaptiveThreshold(
            gray,
            max_value,
            method,
            thresh_type,
            block_size,
            c_constant
        )
        
        # Convert back to BGR for consistency
        result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in adaptive threshold: {str(e)}")
        return {"error": str(e), "image": image}

@router.post("/threshold/otsu")
def apply_otsu_threshold(
    image: str = Body(..., embed=True),
    threshold_type: str = Body("binary")  # binary, binary_inv
):
    """
    Apply Otsu's thresholding (automatic threshold calculation)
    
    Args:
        image: Base64 encoded image
        threshold_type: Type of thresholding - binary, binary_inv
    """
    try:
        img = base64_to_image(image)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Map threshold type to OpenCV constant
        threshold_types = {
            "binary": cv2.THRESH_BINARY,
            "binary_inv": cv2.THRESH_BINARY_INV
        }
        
        if threshold_type not in threshold_types:
            return {"error": f"Unknown threshold type: {threshold_type}", "image": image}
        
        thresh_type = threshold_types[threshold_type]
        
        # Apply Otsu's thresholding
        # Otsu's method automatically calculates the optimal threshold value
        _, result = cv2.threshold(
            gray,
            0,  # Threshold value (ignored with OTSU)
            255,  # Max value
            thresh_type | cv2.THRESH_OTSU
        )
        
        # Convert back to BGR for consistency
        result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
        
        return {"image": image_to_base64(result)}
    
    except Exception as e:
        print(f"Error in Otsu threshold: {str(e)}")
        return {"error": str(e), "image": image}