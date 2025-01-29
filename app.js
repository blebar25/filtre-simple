// Enregistrement du service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('ServiceWorker enregistré avec succès:', registration.scope);
            })
            .catch((error) => {
                console.log('Échec de l\'enregistrement du ServiceWorker:', error);
            });
    });
}

// Configuration
let model = null;
let isFilterActive = false;
const threshold = 0.7; // Seuil de détection NSFW

// Chargement du modèle NSFW
async function loadModel() {
    try {
        model = await nsfwjs.load();
        console.log('Modèle NSFW chargé avec succès');
    } catch (error) {
        console.error('Erreur lors du chargement du modèle:', error);
    }
}

// Fonction pour analyser une image
async function analyzeImage(imgElement) {
    if (!model) return null;
    try {
        const predictions = await model.classify(imgElement);
        return predictions;
    } catch (error) {
        console.error('Erreur lors de l\'analyse de l\'image:', error);
        return null;
    }
}

// Fonction pour vérifier si une image est inappropriée
async function isInappropriate(predictions) {
    if (!predictions) return false;
    
    const nsfwCategories = ['Porn', 'Hentai', 'Sexy'];
    for (const prediction of predictions) {
        if (nsfwCategories.includes(prediction.className) && prediction.probability > threshold) {
            return true;
        }
    }
    return false;
}

// Fonction pour flouter une image
function blurImage(img) {
    img.style.filter = 'blur(30px)';
    img.setAttribute('data-blurred', 'true');
}

// Fonction pour scanner et filtrer les images de la page
async function scanAndFilterImages() {
    if (!isFilterActive) return;

    const images = document.querySelectorAll('img:not([data-processed])');
    for (const img of images) {
        img.setAttribute('data-processed', 'true');
        
        // Attendre que l'image soit chargée
        if (!img.complete) {
            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }

        try {
            const predictions = await analyzeImage(img);
            if (await isInappropriate(predictions)) {
                blurImage(img);
            }
        } catch (error) {
            console.error('Erreur lors du traitement de l\'image:', error);
        }
    }
}

// Observer pour détecter les nouvelles images
const observer = new MutationObserver((mutations) => {
    if (isFilterActive) {
        scanAndFilterImages();
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const toggleButton = document.getElementById('toggleFilter');
    const filterStatus = document.getElementById('filterStatus');
    const nsfwCheckbox = document.getElementById('nsfw');

    // Charger le modèle au démarrage
    await loadModel();

    // Charger les paramètres sauvegardés
    const savedSettings = JSON.parse(localStorage.getItem('filterSettings')) || {
        filterActive: false,
        nsfwBlocked: true
    };

    isFilterActive = savedSettings.filterActive;
    nsfwCheckbox.checked = savedSettings.nsfwBlocked;

    if (isFilterActive) {
        toggleButton.classList.add('active');
        filterStatus.textContent = 'Activé';
        scanAndFilterImages();
    }

    // Configuration de l'observer
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Gestionnaire d'événements pour le bouton
    toggleButton.addEventListener('click', () => {
        isFilterActive = !isFilterActive;
        filterStatus.textContent = isFilterActive ? 'Activé' : 'Désactivé';
        toggleButton.classList.toggle('active');
        
        if (isFilterActive) {
            scanAndFilterImages();
        }
        
        // Sauvegarder les paramètres
        localStorage.setItem('filterSettings', JSON.stringify({
            filterActive: isFilterActive,
            nsfwBlocked: nsfwCheckbox.checked
        }));
    });

    nsfwCheckbox.addEventListener('change', () => {
        localStorage.setItem('filterSettings', JSON.stringify({
            filterActive: isFilterActive,
            nsfwBlocked: nsfwCheckbox.checked
        }));
    });
});
