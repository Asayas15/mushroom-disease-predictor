const API_URL = "https://mushroom-disease-predictor.onrender.com/predict";

const preview = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const predictBtn = document.getElementById("predictBtn");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
  }
});

async function predict() {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload an image.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  // Show loading spinner and disable button
  loading.style.display = "block";
  predictBtn.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    results.innerHTML = `<h3>Results:</h3>`;
    data.predictions.forEach(pred => {
      results.innerHTML += `
        <p>
          <strong>${pred.class}</strong>: ${(pred.confidence * 100).toFixed(2)}%<br/>
          ${getRecommendation(pred.class)}
        </p>
      `;
    });
  } catch (error) {
    console.error("Prediction error:", error);
    results.innerHTML = "Something went wrong. Try again.";
  }

  // Hide loading spinner and re-enable button
  loading.style.display = "none";
  predictBtn.disabled = false;
}

function getRecommendation(disease) {
  const treatments = {
    "Bacterial Blotch": "Improve ventilation and avoid overhead watering.",
    "Dry Bubble": "Remove infected mushrooms and apply fungicide if necessary.",
    "Healthy": "No action needed. Keep monitoring your crop.",
    "Trichoderma": "Reduce humidity and remove green mold colonies.",
    "Wilt": "Ensure proper watering and avoid over-fertilization.",
  };
  return treatments[disease] || "No recommendation available.";
}
