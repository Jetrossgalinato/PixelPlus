from fastapi import APIRouter, UploadFile, File, Body
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import io
import base64

router = APIRouter()

# Helper function to convert base64 to image
def base64_to_image(base64_string):
    # Remove the prefix if present (e.g., 'data:image/png;base64,')
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    
    # Decode base64 string to bytes
    image_bytes = base64.b64decode(base64_string)
    
    # Convert bytes to numpy array
    npimg = np.frombuffer(image_bytes, np.uint8)
    
    # Decode the numpy array to an image
    return cv2.imdecode(npimg, cv2.IMREAD_COLOR)

# Helper function to convert image to base64
def image_to_base64(image):
    # Encode image to bytes
    _, buffer = cv2.imencode('.png', image)
    image_bytes = buffer.tobytes()
    
    # Encode bytes to base64
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    
    # Add prefix
    return f"data:image/png;base64,{base64_string}"

@router.post("/drawing/line")
def draw_line(
    image: str = Body(...), 
    start_x: int = Body(...), 
    start_y: int = Body(...), 
    end_x: int = Body(...), 
    end_y: int = Body(...),
    color: str = Body("#000000"),  # RGB hex string
    thickness: int = Body(2)
):
    # Convert base64 string to image
    img = base64_to_image(image)
    
    # Parse color (hex to BGR)
    hex_color = color.lstrip('#')
    rgb_color = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    bgr_color = (rgb_color[2], rgb_color[1], rgb_color[0])  # Convert RGB to BGR
    
    # Draw line on the image
    cv2.line(img, (start_x, start_y), (end_x, end_y), bgr_color, thickness)
    
    # Return the modified image
    return {"image": image_to_base64(img)}

@router.post("/drawing/rectangle")
def draw_rectangle(
    image: str = Body(...), 
    x: int = Body(...), 
    y: int = Body(...), 
    width: int = Body(...), 
    height: int = Body(...),
    color: str = Body("#000000"),
    fill_color: str = Body(None),
    thickness: int = Body(2)
):
    # Convert base64 string to image
    img = base64_to_image(image)
    
    # Parse color (hex to BGR)
    hex_color = color.lstrip('#')
    rgb_color = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    bgr_color = (rgb_color[2], rgb_color[1], rgb_color[0])
    
    # Draw rectangle
    if fill_color:
        # Parse fill color
        hex_fill = fill_color.lstrip('#')
        rgb_fill = tuple(int(hex_fill[i:i+2], 16) for i in (0, 2, 4))
        bgr_fill = (rgb_fill[2], rgb_fill[1], rgb_fill[0])
        
        # Draw filled rectangle
        cv2.rectangle(img, (x, y), (x + width, y + height), bgr_fill, -1)  # Filled
        # Draw border
        cv2.rectangle(img, (x, y), (x + width, y + height), bgr_color, thickness)
    else:
        # Draw outline only
        cv2.rectangle(img, (x, y), (x + width, y + height), bgr_color, thickness)
    
    # Return the modified image
    return {"image": image_to_base64(img)}

@router.post("/drawing/circle")
def draw_circle(
    image: str = Body(...), 
    center_x: int = Body(...), 
    center_y: int = Body(...), 
    radius: int = Body(...),
    color: str = Body("#000000"),
    fill_color: str = Body(None),
    thickness: int = Body(2)
):
    # Convert base64 string to image
    img = base64_to_image(image)
    
    # Parse color (hex to BGR)
    hex_color = color.lstrip('#')
    rgb_color = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    bgr_color = (rgb_color[2], rgb_color[1], rgb_color[0])
    
    # Draw circle
    if fill_color:
        # Parse fill color
        hex_fill = fill_color.lstrip('#')
        rgb_fill = tuple(int(hex_fill[i:i+2], 16) for i in (0, 2, 4))
        bgr_fill = (rgb_fill[2], rgb_fill[1], rgb_fill[0])
        
        # Draw filled circle
        cv2.circle(img, (center_x, center_y), radius, bgr_fill, -1)  # Filled
        # Draw border
        cv2.circle(img, (center_x, center_y), radius, bgr_color, thickness)
    else:
        # Draw outline only
        cv2.circle(img, (center_x, center_y), radius, bgr_color, thickness)
    
    # Return the modified image
    return {"image": image_to_base64(img)}

@router.post("/drawing/polygon")
def draw_polygon(
    image: str = Body(...), 
    points: list = Body(...),  # List of [x, y] coordinates
    color: str = Body("#000000"),
    fill_color: str = Body(None),
    thickness: int = Body(2)
):
    # Convert base64 string to image
    img = base64_to_image(image)
    
    # Parse color (hex to BGR)
    hex_color = color.lstrip('#')
    rgb_color = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    bgr_color = (rgb_color[2], rgb_color[1], rgb_color[0])
    
    # Convert points list to numpy array
    points_array = np.array(points, np.int32)
    points_array = points_array.reshape((-1, 1, 2))
    
    # Draw polygon
    if fill_color:
        # Parse fill color
        hex_fill = fill_color.lstrip('#')
        rgb_fill = tuple(int(hex_fill[i:i+2], 16) for i in (0, 2, 4))
        bgr_fill = (rgb_fill[2], rgb_fill[1], rgb_fill[0])
        
        # Draw filled polygon
        cv2.fillPoly(img, [points_array], bgr_fill)
        # Draw border
        cv2.polylines(img, [points_array], True, bgr_color, thickness)
    else:
        # Draw outline only
        cv2.polylines(img, [points_array], True, bgr_color, thickness)
    
    # Return the modified image
    return {"image": image_to_base64(img)}

@router.post("/drawing/text")
def add_text(
    image: str = Body(...), 
    text: str = Body(...),
    x: int = Body(...),
    y: int = Body(...),
    font_scale: float = Body(1.0),
    color: str = Body("#000000"),
    thickness: int = Body(2),
    font_face: int = Body(cv2.FONT_HERSHEY_SIMPLEX)
):
    # Convert base64 string to image
    img = base64_to_image(image)
    
    # Parse color (hex to BGR)
    hex_color = color.lstrip('#')
    rgb_color = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    bgr_color = (rgb_color[2], rgb_color[1], rgb_color[0])
    
    # Add text to the image
    cv2.putText(img, text, (x, y), font_face, font_scale, bgr_color, thickness)
    
    # Return the modified image
    return {"image": image_to_base64(img)}