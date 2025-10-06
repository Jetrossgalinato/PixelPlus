from fastapi import APIRouter
from pydantic import BaseModel
import cv2
import numpy as np
import base64

router = APIRouter()

# Pydantic Models
class TwoImageRequest(BaseModel):
    image1: str
    image2: str

class AddImagesRequest(BaseModel):
    image1: str
    image2: str
    weight1: float = 0.5
    weight2: float = 0.5

class ScaledTwoImageRequest(BaseModel):
    image1: str
    image2: str
    scale: float = 1.0

class SingleImageRequest(BaseModel):
    image: str

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
def add_images(request: AddImagesRequest):
    """Add two images with optional weights (blending)"""
    try:
        img1 = base64_to_image(request.image1)
        img2 = base64_to_image(request.image2)
        
        # Ensure same dimensions
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Weighted addition (cv2.addWeighted)
        result = cv2.addWeighted(img1, request.weight1, img2, request.weight2, 0)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error adding images: {str(e)}"}

@router.post("/arithmetic/subtract")
def subtract_images(request: TwoImageRequest):
    """Subtract image2 from image1"""
    try:
        img1 = base64_to_image(request.image1)
        img2 = base64_to_image(request.image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.subtract(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error subtracting images: {str(e)}"}

@router.post("/arithmetic/multiply")
def multiply_images(request: ScaledTwoImageRequest):
    """Multiply two images element-wise"""
    try:
        img1 = base64_to_image(request.image1)
        img2 = base64_to_image(request.image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Normalize to 0-1, multiply, then scale back
        result = cv2.multiply(img1.astype(float) / 255.0, 
                             img2.astype(float) / 255.0)
        result = (result * 255.0 * request.scale).clip(0, 255).astype(np.uint8)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error multiplying images: {str(e)}"}

@router.post("/arithmetic/divide")
def divide_images(request: ScaledTwoImageRequest):
    """Divide image1 by image2 element-wise"""
    try:
        img1 = base64_to_image(request.image1)
        img2 = base64_to_image(request.image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Avoid division by zero
        img2_safe = np.where(img2 == 0, 1, img2)
        result = cv2.divide(img1.astype(float), img2_safe.astype(float))
        result = (result * request.scale).clip(0, 255).astype(np.uint8)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error dividing images: {str(e)}"}

# Bitwise Operations
@router.post("/bitwise/and")
def bitwise_and(request: TwoImageRequest):
    """Bitwise AND operation"""
    try:
        img1 = base64_to_image(request.image1)
        img2 = base64_to_image(request.image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.bitwise_and(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise AND: {str(e)}"}

@router.post("/bitwise/or")
def bitwise_or(request: TwoImageRequest):
    """Bitwise OR operation"""
    try:
        img1 = base64_to_image(request.image1)
        img2 = base64_to_image(request.image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.bitwise_or(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise OR: {str(e)}"}

@router.post("/bitwise/xor")
def bitwise_xor(request: TwoImageRequest):
    """Bitwise XOR operation"""
    try:
        img1 = base64_to_image(request.image1)
        img2 = base64_to_image(request.image2)
        
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        result = cv2.bitwise_xor(img1, img2)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise XOR: {str(e)}"}

@router.post("/bitwise/not")
def bitwise_not(request: SingleImageRequest):
    """Bitwise NOT operation (invert)"""
    try:
        img = base64_to_image(request.image)
        result = cv2.bitwise_not(img)
        
        return {"image": image_to_base64(result)}
    except Exception as e:
        return {"error": f"Error in bitwise NOT: {str(e)}"}