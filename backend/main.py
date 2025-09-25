from fastapi import FastAPI
from api_grayscale import convert_to_grayscale

app = FastAPI()

app.add_api_route("/grayscale/", convert_to_grayscale, methods=["POST"])

@app.get("/")
def read_root():
    return {"message": "Welcome to PixelPlus Backend!"}
