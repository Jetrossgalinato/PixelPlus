from fastapi import APIRouter, UploadFile, File, Query, Response
import numpy as np
import cv2
from io import BytesIO

router = APIRouter()

@router.post("/rgb/")
def rgb_adjust(
    file: UploadFile = File(...),
    r: float = Query(1.0, ge=0.0, le=2.0),
    g: float = Query(1.0, ge=0.0, le=2.0),
    b: float = Query(1.0, ge=0.0, le=2.0),
):
    contents = file.file.read()
    arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        return Response(content="Invalid image", status_code=400)
    # Ensure 3 channels
    if img.shape[-1] == 4:
        bgr = img[..., :3]
        alpha = img[..., 3:4]
    else:
        bgr = img
        alpha = None
    # OpenCV uses BGR order
    bgr = bgr.astype(np.float32)
    bgr[..., 0] *= b  # Blue
    bgr[..., 1] *= g  # Green
    bgr[..., 2] *= r  # Red
    bgr = np.clip(bgr, 0, 255).astype(np.uint8)
    if alpha is not None:
        out = np.concatenate([bgr, alpha], axis=-1)
    else:
        out = bgr
    _, buf = cv2.imencode(".png", out)
    return Response(content=buf.tobytes(), media_type="image/png")
