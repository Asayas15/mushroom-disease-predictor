from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import cv2
from ultralytics import YOLO

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model
MODEL = YOLO("models/best.pt")

# Load class names from model
CLASS_NAMES = MODEL.names  # {0: 'Bacterial Blotch', 1: 'Dry Bubble', etc.}

@app.get("/ping")
async def ping():
    return "Hello, I am alive"

def read_file_as_image(data) -> np.ndarray:
    img = Image.open(BytesIO(data)).convert("RGB")
    return np.array(img)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_data = await file.read()
    image = read_file_as_image(image_data)

    # Convert image to OpenCV format
    img_cv2 = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    # Run detection
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
                "box": [int(xmin), int(ymin), int(xmax), int(ymax)]
            })

    return {
        "detections": prediction_list
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=10000)
