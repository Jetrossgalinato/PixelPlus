from fastapi import APIRouter, Body
import cv2
import numpy as np
import base64

router = APIRouter()

def base64_to_image(base64_string: str):
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',', 1)[1]
        image_bytes = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("Failed to decode image data")
        return img
    except Exception as e:
        raise ValueError(f"Error decoding image: {str(e)}")

def image_to_base64(image: np.ndarray) -> str:
    _, buffer = cv2.imencode('.png', image)
    image_bytes = buffer.tobytes()
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:image/png;base64,{base64_string}"

@router.post("/arithmetic/add")
def add_images(
    image1: str = Body(...),
    image2: str = Body(...),
    weight1: float = Body(0.5),
    weight2: float = Body(0.5)
):
    """Add two images with optional weights (blending)"""
    try:
        img1 = base64_to_image(image1)
        img2 = base64_to_image(image2)
        
        # Ensure same dimensions
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Weighted addition (cv2.addWeighted)
        result = cv2.addWeighted(img1, weight1, img2, weight2, 0)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error adding images: {str(e)}"}

@router.post("/arithmetic/subtract")
def subtract_images(
    image1: str = Body(...),
    image2: str = Body(...)
):
    """Subtract image2 from image1"""
    try:
        img1 = base64_to_image(image1)
        img2 = base64_to_image(image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.subtract(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error subtracting images: {str(e)}"}

@router.post("/arithmetic/multiply")
def multiply_images(
    image1: str = Body(...),
    image2: str = Body(...),
    scale: float = Body(1.0)
):
    """Multiply two images element-wise"""
    try:
        img1 = base64_to_image(image1)
        img2 = base64_to_image(image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Normalize to 0-1, multiply, then scale back
        result = cv2.multiply(img1.astype(float) / 255.0, 
                             img2.astype(float) / 255.0)
        result = (result * 255.0 * scale).clip(0, 255).astype(np.uint8)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error multiplying images: {str(e)}"}

@router.post("/arithmetic/divide")
def divide_images(
    image1: str = Body(...),
    image2: str = Body(...),
    scale: float = Body(1.0)
):
    """Divide image1 by image2 element-wise"""
    try:
        img1 = base64_to_image(image1)
        img2 = base64_to_image(image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Avoid division by zero
        img2_safe = np.where(img2 == 0, 1, img2)
        result = cv2.divide(img1.astype(float), img2_safe.astype(float))
        result = (result * scale).clip(0, 255).astype(np.uint8)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error dividing images: {str(e)}"}

# Bitwise Operations
@router.post("/bitwise/and")
def bitwise_and(
    image1: str = Body(...),
    image2: str = Body(...)
):
    """Bitwise AND operation"""
    try:
        img1 = base64_to_image(image1)
        img2 = base64_to_image(image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.bitwise_and(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise AND: {str(e)}"}

@router.post("/bitwise/or")
def bitwise_or(
    image1: str = Body(...),
    image2: str = Body(...)
):
    """Bitwise OR operation"""
    try:
        img1 = base64_to_image(image1)
        img2 = base64_to_image(image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.bitwise_or(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise OR: {str(e)}"}

@router.post("/bitwise/xor")
def bitwise_xor(
    image1: str = Body(...),
    image2: str = Body(...)
):
    """Bitwise XOR operation"""
    try:
        img1 = base64_to_image(image1)
        img2 = base64_to_image(image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.bitwise_xor(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise XOR: {str(e)}"}

@router.post("/bitwise/not")
def bitwise_not(
    image: str = Body(...)
):
    """Bitwise NOT operation (invert)"""
    try:
        img = base64_to_image(image)
        result = cv2.bitwise_not(img)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise NOT: {str(e)}"}