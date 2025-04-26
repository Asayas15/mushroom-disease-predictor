const API_URL = "https://mushroom-disease-predictor.onrender.com/predict";

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

// Open camera
// Open camera
// Open camera
openCameraBtn.addEventListener("click", () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                cameraWrapper.style.display = "block";
                previewWrapper.style.display = "none";
                camera.srcObject = stream;
                camera.play();

                // Force update capture button language again here
                const currentLang = localStorage.getItem("lang") || "en";
                capturePhotoBtn.textContent = translations[currentLang].capturePhoto;
            })
            .catch((err) => {
                console.log("Error accessing camera: ", err);
            });
    } else {
        alert("Camera not supported");
    }
});


// Capture photo from camera
// Capture photo from camera
capturePhotoBtn.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
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
            imageInput.files = dataTransfer.files; // <-- Set captured photo as file input!

            preview.src = URL.createObjectURL(blob);
            previewWrapper.style.display = "block";
            cameraWrapper.style.display = "none";

            // Stop the camera
            const tracks = camera.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }, "image/png");
});


// Handle file upload
imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
        preview.src = URL.createObjectURL(file);
        previewWrapper.style.display = "block";
    }
});

// Predict button
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

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        results.innerHTML = `<h3>${translations[localStorage.getItem("lang") || "en"].results}</h3>`;
        data.predictions.forEach(pred => {
            const assessment = generateAssessment(pred.class, pred.confidence);
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
}

// Generate Assessment
function generateAssessment(disease, confidence) {
    let severity;
    if (confidence > 0.85) {
        severity = translations[savedLang].severityStrong;
    } else if (confidence > 0.6) {
        severity = translations[savedLang].severityModerate;
    } else {
        severity = translations[savedLang].severityWeak;
    }

    let advice;
    switch (disease) {
        case "Bacterial Blotch":
            advice = translations[savedLang].adviceBacterialBlotch;
            break;
        case "Dry Bubble":
            advice = translations[savedLang].adviceDryBubble;
            break;
        case "Healthy":
            advice = translations[savedLang].adviceHealthy;
            break;
        case "Trichoderma":
            advice = translations[savedLang].adviceTrichoderma;
            break;
        case "Wilt":
            advice = translations[savedLang].adviceWilt;
            break;
        default:
            advice = "Consult agricultural experts for specific guidance.";
    }

    return `${severity} ${translations[savedLang].basedOnAnalysis} <strong>${disease}</strong> ${translations[savedLang].wasDetected} ${advice}`;
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
        disclaimerContent: "Ang Oyster Mushroom Disease Classifier na ito ay kasalukuyang nasa ilalim ng pag-unlad...",
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
        disclaimerContent: "Ti Oyster Mushroom Disease Classifier ket agtultuloy pay ti panagsardengna...",
        buttonUnderstand: "Maawatan Ko",
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

    // Update capture button text here
    document.querySelector('#capturePhotoBtn').textContent = t.capturePhoto;
}



