from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import io

router = APIRouter()

@router.post("/grayscale/")
def convert_to_grayscale(file: UploadFile = File(...)):
    # Read image file as bytes
    image_bytes = file.file.read()
    npimg = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, buffer = cv2.imencode('.png', gray)
    return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/png")
