from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all routers
from api_grayscale import router as grayscale_router
from api_rgb import router as rgb_router
from api_hsv import router as hsv_router
from api_drawing import router as drawing_router
from api_translation import router as translation_router
from api_rotation import router as rotation_router
from api_resize import router as resize_router
from api_interpolation import router as interpolation_router
from api_crop import router as crop_router
from api_arithmetic import router as arithmetic_router
from api_convolution import router as convolution_router
    
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(rgb_router)
app.include_router(grayscale_router)
app.include_router(hsv_router)
app.include_router(drawing_router)
app.include_router(translation_router)
app.include_router(rotation_router)
app.include_router(resize_router)
app.include_router(interpolation_router)
app.include_router(crop_router)
app.include_router(arithmetic_router)
app.include_router(convolution_router)  


@app.get("/")
def read_root():
    return {"message": "Welcome to PixelPlus Backend!"}

