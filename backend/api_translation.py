from fastapi import APIRouter, Body
import cv2
import numpy as np
import base64

router = APIRouter()

def base64_to_image(base64_string):
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    image_bytes = base64.b64decode(base64_string)
    npimg = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(npimg, cv2.IMREAD_COLOR)

def image_to_base64(image):
    _, buffer = cv2.imencode('.png', image)
    image_bytes = buffer.tobytes()
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:image/png;base64,{base64_string}"

@router.post("/translation")
def translate_image(
    image: str = Body(...),
    shift_x: float = Body(None),
    shift_y: float = Body(None)
):
    try:
        # Convert base64 string to image
        img = base64_to_image(image)
        
        # Ensure the image was loaded correctly
        if img is None or img.size == 0:
            print("Error: Failed to decode input image")
            return {"error": "Failed to decode input image"}
            
        # Make a copy of the image to avoid modifying the original in case of errors
        img_copy = img.copy()
        
        # Store height and width of the image
        height, width = img_copy.shape[:2]
        
        # Default to quarter of the image dimensions if shift values aren't provided
        tx = shift_x if shift_x is not None else width / 4
        ty = shift_y if shift_y is not None else height / 4
        
        # Create translation matrix
        T = np.float32([[1, 0, tx], [0, 1, ty]])
        
        # Apply translation transformation
        img_translation = cv2.warpAffine(img_copy, T, (width, height))
        
        # Return the translated image
        return {"image": image_to_base64(img_translation)}
        
    except Exception as e:
        error_message = f"Error translating image: {str(e)}"
        print(error_message)
        return {"error": error_message}