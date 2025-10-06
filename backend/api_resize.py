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

def _interp_from_name(name: str) -> int:
    name = (name or "linear").lower()
    return {
        "nearest": cv2.INTER_NEAREST,
        "linear": cv2.INTER_LINEAR,
        "bilinear": cv2.INTER_LINEAR,
        "cubic": cv2.INTER_CUBIC,
        "area": cv2.INTER_AREA,
        "lanczos": cv2.INTER_LANCZOS4,
    }.get(name, cv2.INTER_LINEAR)

@router.post("/resize")
def resize_image(
    image: str = Body(...),
    width: int = Body(...),
    height: int = Body(...),
    interpolation: str = Body("linear")
):
    try:
        # Input validation
        if not image:
            return {"error": "No image data provided"}
        
        if width <= 0 or height <= 0:
            return {"error": "Width and height must be positive integers"}

        # Process image
        img = base64_to_image(image)
        interp = _interp_from_name(interpolation)
        out = cv2.resize(img, (int(width), int(height)), interpolation=interp)
        
        # Convert back to base64
        result = image_to_base64(out)
        return {"image": result}
    except Exception as e:
        return {"error": f"Error processing image: {str(e)}"}
