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

@router.post("/rotation")
def rotate_image(
    image: str = Body(...),
    angle: float = Body(...),
    scale: float = Body(1.0),
    keep_dimensions: bool = Body(True)
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
        
        # Calculate the center of the image
        center = (width // 2, height // 2)
        
        # Get the rotation matrix
        M = cv2.getRotationMatrix2D(center, angle, scale)
        
        if keep_dimensions:
            # Apply rotation transformation (keeping original dimensions)
            rotated_image = cv2.warpAffine(img_copy, M, (width, height))
        else:
            # Calculate new dimensions to avoid cropping
            # The angle needs to be in radians for cos and sin
            angle_rad = np.deg2rad(angle)
            new_width = int(abs(width * np.cos(angle_rad)) + abs(height * np.sin(angle_rad)))
            new_height = int(abs(width * np.sin(angle_rad)) + abs(height * np.cos(angle_rad)))
            
            # Adjust the translation part of the rotation matrix to account for new dimensions
            M[0, 2] += (new_width - width) / 2
            M[1, 2] += (new_height - height) / 2
            
            # Apply rotation with new dimensions
            rotated_image = cv2.warpAffine(img_copy, M, (new_width, new_height))
        
        # Return the rotated image
        return {"image": image_to_base64(rotated_image)}
        
    except Exception as e:
        error_message = f"Error rotating image: {str(e)}"
        print(error_message)
        return {"error": error_message}


@router.post("/rotation/transform")
def rotate_transform(
    image: str = Body(...),
    operation: str = Body(..., embed=True),
):
    """
    Apply fast orientation transforms using cv2.transpose and cv2.flip.

    Supported operations:
    - "transpose": cv2.transpose (swap axes)
    - "flip0": flip vertically (flipCode=0)
    - "flip1": flip horizontally (flipCode=1)
    - "flip-1": flip both axes (flipCode=-1)
    - "cw90": rotate 90 degrees clockwise using transpose + horizontal flip
    - "ccw90": rotate 90 degrees counter-clockwise using transpose + vertical flip
    - "rotate180": rotate 180 degrees (flip both axes)
    """
    try:
        img = base64_to_image(image)
        if img is None or img.size == 0:
            return {"error": "Failed to decode input image"}

        if operation == "transpose":
            out = cv2.transpose(img)
        elif operation == "flip0":
            out = cv2.flip(img, 0)
        elif operation == "flip1":
            out = cv2.flip(img, 1)
        elif operation == "flip-1":
            out = cv2.flip(img, -1)
        elif operation == "cw90":
            out = cv2.flip(cv2.transpose(img), 1)
        elif operation == "ccw90":
            out = cv2.flip(cv2.transpose(img), 0)
        elif operation == "rotate180":
            out = cv2.flip(img, -1)
        else:
            return {"error": f"Unsupported operation: {operation}"}

        return {"image": image_to_base64(out)}
    except Exception as e:
        error_message = f"Error applying transform: {str(e)}"
        print(error_message)
        return {"error": error_message}