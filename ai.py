from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Load your local Huggingface model (gpt2)
generator = pipeline('text-generation', model='gpt2')

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files['file']
    # ⚡ For now, let's simulate prediction
    # TODO: Replace with real model prediction code
    predictions = [
        {"class": "Bacterial Blotch", "confidence": 0.92},
        {"class": "Trichoderma", "confidence": 0.4},
    ]
    return jsonify({'predictions': predictions})

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()

    disease = data.get('disease')
    confidence = data.get('confidence')

    if not disease or not confidence:
        return jsonify({'error': 'Missing disease or confidence'}), 400

    prompt = f"""
    You are an expert agricultural scientist.
    Given the following prediction:
    Disease: {disease}
    Confidence: {confidence}%

    Write a short, 3-5 sentence analysis explaining the meaning of the result and suggest actions for the mushroom grower.
    Keep it simple, clear, and reassuring.
    """

    output = generator(prompt, max_length=200, do_sample=True)[0]['generated_text']

    return jsonify({'assessment': output})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
