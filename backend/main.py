from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api_grayscale import app as grayscale_app
from api_rgb import router as rgb_router
from api_hsv import router as hsv_router
    
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




app.include_router(rgb_router)
app.mount("/grayscale", grayscale_app)
app.include_router(hsv_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PixelPlus Backend!"}
