from transformers import pipeline

# Load the model
generator = pipeline('text-generation', model='gpt2')


def generate_assessment(disease, confidence):
    prompt = f"""
    You are an expert agricultural scientist.
    Given the following prediction:
    Disease: {disease}
    Confidence: {confidence}%

    Write a short, 3-5 sentence analysis explaining the meaning of the result and suggest actions for the mushroom grower.
    Keep it simple, clear, and reassuring.
    """

    # Generate the response
    response = generator(prompt, max_length=200)
    return response[0]['generated_text']


# Example usage
assessment = generate_assessment("Bacterial Blotch", 90)
print(assessment)
