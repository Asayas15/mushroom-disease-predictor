
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL = tf.keras.models.load_model("../models/model.h5")

CLASS_NAMES = ["Bacterial Blotch", "Dry Bubble", "Healthy", "Trichoderma", "Wilt"]

@app.get("/ping")
async def ping():
    return "Hello, I am alive"

def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)

    predictions = MODEL.predict(img_batch)[0]  # Get the prediction array for one sample

    # Get indices of top 2 predictions
    top_indices = predictions.argsort()[-2:][::-1]  # descending order

    top_classes = [
        {
            'class': CLASS_NAMES[i],
            'confidence': float(predictions[i])
        }
        for i in top_indices
    ]

    return {
        'predictions': top_classes
    }


if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port=8000)
