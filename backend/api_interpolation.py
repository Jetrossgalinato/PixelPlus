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

@router.post("/interpolation")
def apply_interpolation(
    image: str = Body(...),
    method: str = Body("linear"),
    width: int | None = Body(None),
    height: int | None = Body(None),
    scale_x: float | None = Body(None),
    scale_y: float | None = Body(None),
):
    """
    Apply a resize with a specific interpolation method, either by giving
    target width/height or scale factors.
    """
    try:
        img = base64_to_image(image)
        if img is None or img.size == 0:
            return {"error": "Failed to decode input image"}

        interp = _interp_from_name(method)

        if width and height:
            out = cv2.resize(img, (int(width), int(height)), interpolation=interp)
        elif scale_x and scale_y:
            out = cv2.resize(img, dsize=None, fx=float(scale_x), fy=float(scale_y), interpolation=interp)
        else:
            return {"error": "Provide width/height or scale_x/scale_y"}

        return {"image": image_to_base64(out)}
    except Exception as e:
        return {"error": f"Error applying interpolation: {str(e)}"}
