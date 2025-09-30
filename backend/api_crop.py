from fastapi import APIRouter, Body
import cv2
import numpy as np
import base64

router = APIRouter()

def base64_to_image(base64_string: str):
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    image_bytes = base64.b64decode(base64_string)
    npimg = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(npimg, cv2.IMREAD_COLOR)

def image_to_base64(image: np.ndarray) -> str:
    _, buffer = cv2.imencode('.png', image)
    image_bytes = buffer.tobytes()
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:image/png;base64,{base64_string}"

@router.post("/crop")
def crop_image(
    image: str = Body(...),
    x: int = Body(...),
    y: int = Body(...),
    width: int = Body(...),
    height: int = Body(...),
    clamp: bool = Body(True)
):
    try:
        img = base64_to_image(image)
        if img is None or img.size == 0:
            return {"error": "Failed to decode input image"}

        h, w = img.shape[:2]
        if clamp:
            # Clamp region to image bounds
            x0 = max(0, min(int(x), w - 1))
            y0 = max(0, min(int(y), h - 1))
            x1 = max(0, min(x0 + int(width), w))
            y1 = max(0, min(y0 + int(height), h))
        else:
            x0, y0 = int(x), int(y)
            x1, y1 = x0 + int(width), y0 + int(height)
            # Adjust for out-of-bounds by padding with black
            pad_left = max(0, -x0)
            pad_top = max(0, -y0)
            pad_right = max(0, x1 - w)
            pad_bottom = max(0, y1 - h)
            if any(v > 0 for v in (pad_left, pad_top, pad_right, pad_bottom)):
                img = cv2.copyMakeBorder(
                    img,
                    pad_top,
                    pad_bottom,
                    pad_left,
                    pad_right,
                    cv2.BORDER_CONSTANT,
                    value=(0, 0, 0),
                )
                y0 += pad_top
                x0 += pad_left
                y1 += pad_top
                x1 += pad_left

        if x1 <= x0 or y1 <= y0:
            return {"error": "Invalid crop rectangle"}

        out = img[y0:y1, x0:x1]
        return {"image": image_to_base64(out)}
    except Exception as e:
        return {"error": f"Error cropping image: {str(e)}"}
