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

@router.post("/scaling")
def scale_image(
    image: str = Body(...),
    scale_x: float = Body(1.0),
    scale_y: float = Body(1.0),
    interpolation: str = Body("linear")
):
    try:
        img = base64_to_image(image)
        if img is None or img.size == 0:
            return {"error": "Failed to decode input image"}

        fx = float(scale_x) if scale_x is not None else 1.0
        fy = float(scale_y) if scale_y is not None else 1.0
        if fx <= 0 or fy <= 0:
            return {"error": "scale_x and scale_y must be positive"}

        interp = _interp_from_name(interpolation)
        out = cv2.resize(img, dsize=None, fx=fx, fy=fy, interpolation=interp)
        return {"image": image_to_base64(out)}
    except Exception as e:
        return {"error": f"Error scaling image: {str(e)}"}
