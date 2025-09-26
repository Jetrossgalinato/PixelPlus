from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api_grayscale import router as grayscale_router
from api_rgb import router as rgb_router
from api_hsv import router as hsv_router
from api_drawing import router as drawing_router
    
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





app.include_router(rgb_router)
app.include_router(grayscale_router)
app.include_router(hsv_router)
app.include_router(drawing_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PixelPlus Backend!"}
