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
    
# Helper function to parse color string to BGR
def parse_color(color_str):
    """Parse color string (hex or rgba) to BGR tuple for OpenCV"""
    if not color_str:
        return (0, 0, 0)  # Default to black
        
    try:
        if color_str.startswith('rgba'):
            # Parse RGBA format: rgba(r,g,b,a)
            rgba = color_str.replace('rgba(', '').replace(')', '').split(',')
            r = int(rgba[0].strip())
            g = int(rgba[1].strip())
            b = int(rgba[2].strip())
            return (b, g, r)  # Convert to BGR
        else:
            # Parse hex format: #RRGGBB
            hex_color = color_str.lstrip('#')
            rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            return (rgb[2], rgb[1], rgb[0])  # Convert to BGR
    except Exception as e:
        print(f"Error parsing color: {color_str}, error: {str(e)}")
        return (0, 0, 0)  # Default to black

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
    
    # Parse color using helper function
    bgr_color = parse_color(color)
    
    # Draw line on the image
    thicker = max(2, thickness * 3)
    cv2.line(img, (start_x, start_y), (end_x, end_y), bgr_color, thicker)
    
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
    
    # Parse colors using helper function
    bgr_color = parse_color(color)
    
    # Draw rectangle with thicker border
    thicker = max(2, thickness * 3)
    if fill_color:
        # Parse fill color using helper function
        bgr_fill = parse_color(fill_color)
        # Draw filled rectangle
        cv2.rectangle(img, (x, y), (x + width, y + height), bgr_fill, -1)  # Filled
        # Draw border
        cv2.rectangle(img, (x, y), (x + width, y + height), bgr_color, thicker)
    else:
        # Draw outline only
        cv2.rectangle(img, (x, y), (x + width, y + height), bgr_color, thicker)
    
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
    
    # Parse colors using helper function
    bgr_color = parse_color(color)
    
    thicker = max(2, thickness * 3)
    if fill_color:
        # Parse fill color using helper function
        bgr_fill = parse_color(fill_color)
        # Draw filled circle
        cv2.circle(img, (center_x, center_y), radius, bgr_fill, -1)  # Filled
        # Draw border
        cv2.circle(img, (center_x, center_y), radius, bgr_color, thicker)
    else:
        # Draw outline only
        cv2.circle(img, (center_x, center_y), radius, bgr_color, thicker)
    
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
    try:
        # Convert base64 string to image
        img = base64_to_image(image)
        
        # Parse color using helper function
        bgr_color = parse_color(color)
        
        # Validate points format
        if not points or not all(isinstance(p, list) and len(p) == 2 for p in points):
            error_msg = f"Invalid polygon points format. Expected list of [x,y] coordinates, got: {points}"
            print(error_msg)
            return {"image": image_to_base64(img), "error": error_msg}
        
        # Convert points list to numpy array for OpenCV
        points_array = np.array(points, np.int32)
        
        # Ensure we have at least 3 points for a valid polygon
        if len(points_array) < 3:
            error_msg = f"Insufficient points for polygon: {len(points_array)}, need at least 3"
            print(error_msg)
            return {"image": image_to_base64(img), "error": error_msg}
        
        # Log points for debugging
        print(f"Drawing polygon with {len(points_array)} points: {points}")
        
        # Ensure points are within image boundaries
        h, w = img.shape[:2]
        valid_points = True
        for p in points_array:
            if p[0] < 0 or p[0] >= w or p[1] < 0 or p[1] >= h:
                print(f"Warning: Point {p} is outside image boundaries [{w}x{h}]")
                valid_points = False
        
        if not valid_points:
            # Clip points to image boundaries to prevent errors
            points_array = np.array([[
                min(max(p[0], 0), w-1), 
                min(max(p[1], 0), h-1)
            ] for p in points_array], np.int32)
            print("Points have been clipped to image boundaries")
        
        # Reshape the array as required by OpenCV's polygon functions
        points_array = points_array.reshape((-1, 1, 2))
        
        # Create a copy of the image for drawing
        img_copy = img.copy()
        
        # Draw polygon
        if fill_color:
            # Parse fill color using helper function
            bgr_fill = parse_color(fill_color)
            print(f"Fill color: {fill_color}, BGR: {bgr_fill}")
            
            # Draw filled polygon
            cv2.fillPoly(img_copy, [points_array], bgr_fill)
            # Draw border
            cv2.polylines(img_copy, [points_array], True, bgr_color, thickness)
        else:
            # Draw outline only
            cv2.polylines(img_copy, [points_array], True, bgr_color, thickness)
        
        # Check if anything was drawn by comparing the images
        diff = cv2.subtract(img_copy, img)
        has_diff = np.any(diff)
        if not has_diff:
            print("Warning: No visible changes after drawing polygon")
        
        # Return the modified image
        return {"image": image_to_base64(img_copy), "success": True}
    except Exception as e:
        error_message = f"Error drawing polygon: {str(e)}"
        print(error_message)
        # Return original image if drawing fails
        return {"image": image, "error": error_message}

@router.post("/drawing/text")
def add_text(
    image: str = Body(...), 
    text: str = Body(...),
    x: int = Body(...),
    y: int = Body(...),
    font_size: int = Body(20),
    color: str = Body("#000000"),
    thickness: int = Body(2),
    font_face: int = Body(cv2.FONT_HERSHEY_SIMPLEX)
):
    # Convert base64 string to image
    img = base64_to_image(image)
    
    # Parse color using helper function
    bgr_color = parse_color(color)
    
    # Adjust font scale based on font size for better accuracy
    font_scale = font_size / 10.0  # Adjust this ratio as needed
    
    # Adjust thickness based on font size for better visibility
    adjusted_thickness = max(1, thickness * (font_size // 5))

    # Get text size to adjust position
    (text_width, text_height), baseline = cv2.getTextSize(text, font_face, font_scale, adjusted_thickness)
    
    # Adjust y-coordinate to be the bottom-left corner
    adjusted_y = y + text_height
    
    # Add text to the image
    cv2.putText(img, text, (x, adjusted_y), font_face, font_scale, bgr_color, adjusted_thickness)
    
    # Return the modified image
    return {"image": image_to_base64(img)}