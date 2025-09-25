from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api_grayscale import convert_to_grayscale

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_api_route("/grayscale/", convert_to_grayscale, methods=["POST"])

@app.get("/")
def read_root():
    return {"message": "Welcome to PixelPlus Backend!"}
