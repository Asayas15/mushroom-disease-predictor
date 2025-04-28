const API_URL = "https://mushroom-disease-predictor.onrender.com/predict";

// DOM Elements
const preview = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const results = document.getElementById("results");
const loading = document.getElementById("loading");
const predictBtn = document.getElementById("predictBtn");
const cameraWrapper = document.getElementById("cameraWrapper");
const previewWrapper = document.getElementById("previewWrapper");
const camera = document.getElementById("camera");
const openCameraBtn = document.getElementById("openCameraBtn");
const capturePhotoBtn = document.getElementById("capturePhotoBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");

// Camera state variables
let currentStream = null;
let usingFrontCamera = false;

// Helper function to stop media tracks
function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

// Function to switch between front and back cameras
function switchCamera() {
  if (!currentStream) return;
  
  // Stop the current stream
  stopMediaTracks(currentStream);
  
  // Toggle camera facing mode
  usingFrontCamera = !usingFrontCamera;
  
  const constraints = {
    video: {
      facingMode: usingFrontCamera ? "user" : "environment"
    }
  };
  
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      camera.srcObject = stream;
    })
    .catch(error => {
      console.error("Error switching camera:", error);
      alert("Error switching camera. Please try again.");
    });
}

// Open camera when button is clicked
openCameraBtn.addEventListener("click", () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const constraints = {
      video: {
        facingMode: "environment" // Start with rear camera by default
      }
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        currentStream = stream;
        cameraWrapper.style.display = "block";
        previewWrapper.style.display = "none";
        camera.srcObject = stream;
        usingFrontCamera = false;
      })
      .catch((err) => {
        console.log("Error accessing rear camera: ", err);
        // If rear camera fails, try front camera
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            currentStream = stream;
            cameraWrapper.style.display = "block";
            previewWrapper.style.display = "none";
            camera.srcObject = stream;
            usingFrontCamera = true;
          })
          .catch(error => {
            console.log("Error accessing any camera: ", error);
            alert("Camera not accessible");
          });
      });
  } else {
    alert("Camera not supported");
  }
});

// Capture photo from camera
capturePhotoBtn.addEventListener("click", () => {
  if (!currentStream) return;
  
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // Check if video is ready
  if (!camera.videoWidth || !camera.videoHeight) {
    alert("Camera is not ready yet. Please try again.");
    return;
  }

  const width = camera.videoWidth;
  const height = camera.videoHeight;

  canvas.width = width;
  canvas.height = height;
  context.drawImage(camera, 0, 0, width, height);

  // Convert canvas to Blob
  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], "captured.png", { type: "image/png" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageInput.files = dataTransfer.files;

      preview.src = URL.createObjectURL(blob);
      previewWrapper.style.display = "block";
      cameraWrapper.style.display = "none";

      // Stop the camera
      stopMediaTracks(currentStream);
      currentStream = null;
    }
  }, "image/png");
});

// Switch camera button event listener
switchCameraBtn.addEventListener("click", switchCamera);

// Handle file upload
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    previewWrapper.style.display = "block";
  }
});

// Predict button functionality
async function predict() {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload or capture an image.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  loading.style.display = "block";
  predictBtn.disabled = true;

  const scanner = document.getElementById("scanner");
  scanner.style.display = "block";

  const currentLang = localStorage.getItem("lang") || "en";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    results.innerHTML = `<h3>${translations[currentLang].results}</h3>`;
    data.predictions.forEach(pred => {
      const assessment = generateAssessment(pred.class, pred.confidence, currentLang);
      results.innerHTML += `
        <div class="result-card">
          <strong>${pred.class}</strong> - Confidence: ${(pred.confidence * 100).toFixed(2)}%<br/>
          <p>${assessment}</p>
        </div>
      `;
    });

  } catch (error) {
    console.error("Prediction error:", error);
    results.innerHTML = "Something went wrong. Try again.";
  }

  loading.style.display = "none";
  predictBtn.disabled = false;
  scanner.style.display = "none";
}

// Generate Assessment
function generateAssessment(disease, confidence, lang) {
  let severity;
  if (confidence > 0.85) {
    severity = translations[lang].severityStrong;
  } else if (confidence > 0.6) {
    severity = translations[lang].severityModerate;
  } else {
    severity = translations[lang].severityWeak;
  }

  let advice;
  switch (disease) {
    case "Bacterial Blotch":
      advice = translations[lang].adviceBacterialBlotch;
      break;
    case "Dry Bubble":
      advice = translations[lang].adviceDryBubble;
      break;
    case "Healthy":
      advice = translations[lang].adviceHealthy;
      break;
    case "Trichoderma":
      advice = translations[lang].adviceTrichoderma;
      break;
    case "Wilt":
      advice = translations[lang].adviceWilt;
      break;
    default:
      advice = "Consult agricultural experts for specific guidance.";
  }

  return `${severity} ${translations[lang].basedOnAnalysis} <strong>${disease}</strong> ${translations[lang].wasDetected} ${advice}`;
}

// Close disclaimer modal
function closeDisclaimer() {
  document.getElementById("disclaimerModal").style.display = "none";
}

// Language Handling
const translations = {
  en: {
    disclaimerTitle: "Disclaimer",
    disclaimerContent: "This Oyster Mushroom Disease Classifier is currently under development. Predictions may not always be accurate and should be used for informational purposes only. Always consult agricultural experts for critical decisions.",
    buttonUnderstand: "I Understand",
    chooseImage: "Choose a Mushroom Image",
    predictButton: "Predict Disease",
    loading: "Loading...",
    results: "Results:",
    severityStrong: "This is a strong match, indicating a high probability.",
    severityModerate: "This is a moderate match. Some caution is advised.",
    severityWeak: "This is a weak match. Re-evaluation may be necessary.",
    adviceBacterialBlotch: "Ensure good air circulation and avoid overhead watering to prevent spread.",
    adviceDryBubble: "Remove infected mushrooms immediately and sanitize the environment.",
    adviceHealthy: "Maintain optimal growing conditions to continue healthy development.",
    adviceTrichoderma: "Lower humidity levels and remove infected substrates immediately.",
    adviceWilt: "Adjust watering schedules and monitor nutrient supply carefully.",
    basedOnAnalysis: "Based on the analysis, signs of",
    wasDetected: "were detected.",
    capturePhoto: "Capture Photo",
  },
  fil: {
    disclaimerTitle: "Paunawa",
    disclaimerContent: "Ang Oyster Mushroom Disease Classifier na ito ay kasalukuyang nasa ilalim ng pag-develop. Maaaring hindi laging tama ang mga prediksyon at ito ay para sa layuning pampagbigay-impormasyon lamang. Laging kumonsulta sa mga eksperto sa agrikultura para sa mahahalagang desisyon.",
    buttonUnderstand: "Nauunawaan Ko",
    chooseImage: "Pumili ng Larawan ng Kabute",
    predictButton: "Hulaan ang Sakit",
    loading: "Naglo-load...",
    results: "Mga Resulta:",
    severityStrong: "Ito ay isang malakas na tugma, nagpapakita ng mataas na posibilidad.",
    severityModerate: "Ito ay isang katamtamang tugma. Mag-ingat.",
    severityWeak: "Ito ay isang mahina na tugma. Maaaring kailanganin ang muling pagsusuri.",
    adviceBacterialBlotch: "Siguraduhing may maayos na daloy ng hangin at iwasan ang pagdidilig sa itaas upang maiwasan ang pagkalat.",
    adviceDryBubble: "Agad alisin ang mga apektadong kabute at linisin ang kapaligiran.",
    adviceHealthy: "Panatilihin ang mga optimal na kondisyon para magpatuloy ang malusog na pag-unlad.",
    adviceTrichoderma: "Bawasan ang mga antas ng halumigmig at agad na alisin ang mga apektadong substrato.",
    adviceWilt: "Ayusin ang iskedyul ng pagdidilig at obserbahan ang suplay ng sustansya.",
    basedOnAnalysis: "Batay sa pagsusuri, mga senyales ng",
    wasDetected: "ay natukoy.",
    capturePhoto: "Kuhanan ng Larawan",
  },
  ilo: {
    disclaimerTitle: "Pakaammo",
    disclaimerContent: "Daytoy nga Oyster Mushroom Disease Classifier ket agtultuloy pay ti panagaramidna. Saan a masiguro nga amin a prediksion ket eksakto, ket para laeng iti pampanunot a pakaammo. Itultuloy a kumonsulta kadagiti eksperto ti agrikultura para kadagiti napateg a desision.",
    buttonUnderstand: "Maawatak",
    chooseImage: "Agpili ti Ladawan ti Kabute",
    predictButton: "Ipredict ti Sakit",
    loading: "Agkarkar-load...",
    results: "Dagiti Resulta:",
    severityStrong: "Nakasagrap a kasla agtultuloy a gundaway, nagpakita ti dakkel a posibilidad.",
    severityModerate: "Nakasagrap a kasla agtultuloy a gundaway. Agin-inut.",
    severityWeak: "Nakasagrap a kasla awan ti kabusor. Kasapulan ti panangsurat.",
    adviceBacterialBlotch: "Siguradwen a nalawag ti aglawlaw ket iwasan ti agtultuloy a pang-dilig tapno malapdaan.",
    adviceDryBubble: "Ial-alay dagiti nadadael a kabute ken limpan ti lugar.",
    adviceHealthy: "Ipatpatuloy ti optimal nga pag-uneg tapno agtultuloy ti nalusluso nga progreso.",
    adviceTrichoderma: "Aglawlaw ti nadumaduma a klima ken alisin dagiti nadadael a substrates kasla uneg.",
    adviceWilt: "Aglaksid ti oras ti panangdilig ken ikabina ti nutrisyon nga itedna.",
    basedOnAnalysis: "Base ti analisis, senyales ti",
    wasDetected: "ket naipakita.",
    capturePhoto: "Mangala ti Ladawan",
  }
};

// Load previously selected language
const savedLang = localStorage.getItem("lang") || "en";
document.querySelector(`input[name="language"][value="${savedLang}"]`).checked = true;
changeLanguage(savedLang);

// Language selector change event
document.querySelectorAll('input[name="language"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });
});

// Function to update texts according to selected language
function changeLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  localStorage.setItem("lang", lang);

  // Update disclaimer modal
  document.querySelector('#disclaimerModal h2').textContent = t.disclaimerTitle;
  document.querySelector('#disclaimerModal p').textContent = t.disclaimerContent;
  document.querySelector('#disclaimerModal button').textContent = t.buttonUnderstand;

  // Update image upload and prediction
  document.querySelector('.custom-file-upload').textContent = t.chooseImage;
  document.querySelector('#predictBtn').textContent = t.predictButton;
  document.querySelector('#loading').textContent = t.loading;
  document.querySelector('#results').innerHTML = `<h3>${t.results}</h3>`;
}