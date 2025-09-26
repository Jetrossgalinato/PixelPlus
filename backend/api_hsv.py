from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import Response
import cv2
import numpy as np
from io import BytesIO

router = APIRouter()

@router.post("/hsv/")
def hsv_adjust(
    file: UploadFile = File(...),
    h: int = Query(0, description="Hue shift (-180 to 180)"),
    s: float = Query(1.0, description="Saturation scale (0-2)"),
    v: float = Query(1.0, description="Value scale (0-2)")
):
    # Read image
    contents = file.file.read()
    npimg = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if img is None:
        return Response(content="Invalid image", status_code=400)

    # Convert to HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    # Adjust Hue
    hsv[..., 0] = (hsv[..., 0] + h) % 180
    # Adjust Saturation
    hsv[..., 1] = np.clip(hsv[..., 1] * s, 0, 255)
    # Adjust Value
    hsv[..., 2] = np.clip(hsv[..., 2] * v, 0, 255)
    # Convert back to uint8
    hsv = np.clip(hsv, 0, 255).astype(np.uint8)
    # Convert back to BGR
    out_img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    # Encode to PNG
    _, buf = cv2.imencode('.png', out_img)
    return Response(content=buf.tobytes(), media_type="image/png")
