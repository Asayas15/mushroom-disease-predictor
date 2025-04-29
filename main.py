import os
import requests

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import cv2
from ultralytics import YOLO

MODEL_PATH = "models/best.pt"
MODEL_URL = "https://drive.google.com/uc?export=download&id=1EwE0CgNwB7ujz0VfPOUdK1lCiQ9f-DnH"

# Create folder and download model if missing
if not os.path.exists(MODEL_PATH):
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    print("Downloading model...")
    r = requests.get(MODEL_URL)
    with open(MODEL_PATH, "wb") as f:
        f.write(r.content)
    print("Model downloaded successfully.")

# Check file size to verify download
if os.path.getsize(MODEL_PATH) < 1_000_000:
    raise Exception("Model file is too small. Download likely failed.")

# ✅ Load YOLOv8 model once
MODEL = YOLO(MODEL_PATH)

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get class names
CLASS_NAMES = MODEL.names  # e.g., {0: 'Bacterial Blotch', ...}

@app.get("/ping")
async def ping():
    return {"message": "Hello, I am alive"}

def read_file_as_image(data) -> np.ndarray:
    img = Image.open(BytesIO(data)).convert("RGB")
    return np.array(img)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_data = await file.read()
    image = read_file_as_image(image_data)
    img_cv2 = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    results = MODEL(img_cv2, verbose=False)

    prediction_list = []

    if results and results[0].boxes is not None:
        detections = results[0].boxes
        for detection in detections:
            xyxy = detection.xyxy.cpu().numpy().squeeze()
            xmin, ymin, xmax, ymax = xyxy.astype(int)

            class_id = int(detection.cls.item())
            class_name = CLASS_NAMES[class_id]
            confidence = float(detection.conf.item())

            prediction_list.append({
                "class": class_name,
                "confidence": confidence,
                "box": [xmin, ymin, xmax, ymax]
            })

    return {"detections": prediction_list}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=10000)
