// Variable globale pour le modèle NSFW.js
let nsfwModel = null;
let blockedCount = 0;

// Charger le modèle NSFW.js
async function loadModel() {
    try {
        nsfwModel = await nsfwjs.load();
        console.log('Modèle IA chargé avec succès');
        processExistingImages();
    } catch (error) {
        console.error('Erreur lors du chargement du modèle:', error);
    }
}

// Fonction pour analyser une image avec NSFW.js
async function analyzeImage(img) {
    if (!nsfwModel) return false;
    
    try {
        const predictions = await nsfwModel.classify(img);
        // Vérifier les catégories NSFW (Porn et Sexy)
        const nsfwScore = predictions.reduce((score, pred) => {
            if (pred.className === 'Porn' || pred.className === 'Sexy') {
                return score + pred.probability;
            }
            return score;
        }, 0);

        return nsfwScore > 0.5; // Seuil de détection
    } catch (error) {
        console.error('Erreur lors de l\'analyse de l\'image:', error);
        return false;
    }
}

// Fonction pour traiter une image
async function processImage(img) {
    if (img.dataset.processed) return;
    img.dataset.processed = 'true';

    // Vérifier si l'URL de l'image contient des mots-clés suspects
    const suspiciousWords = ['adult', 'porn', 'xxx', 'nude', 'naked'];
    const urlLower = img.src.toLowerCase();
    if (suspiciousWords.some(word => urlLower.includes(word))) {
        blurImage(img);
        return;
    }

    // Analyser l'image avec NSFW.js
    try {
        const isInappropriate = await analyzeImage(img);
        if (isInappropriate) {
            blurImage(img);
            updateBlockedCount();
        }
    } catch (error) {
        console.error('Erreur lors du traitement de l\'image:', error);
    }
}

// Fonction pour flouter une image
function blurImage(img) {
    img.classList.add('filtered-image');
    
    // Créer l'overlay d'avertissement
    const overlay = document.createElement('div');
    overlay.className = 'filtered-overlay';
    overlay.innerHTML = '<div class="filtered-warning">Contenu filtré</div>';
    
    // Ajouter l'overlay comme frère de l'image
    if (img.parentNode) {
        img.parentNode.style.position = 'relative';
        img.parentNode.insertBefore(overlay, img.nextSibling);
    }
}

// Mettre à jour le compteur d'images bloquées
function updateBlockedCount() {
    blockedCount++;
    chrome.runtime.sendMessage({
        action: 'updateStats',
        count: blockedCount
    });
}

// Observer les nouvelles images qui apparaissent sur la page
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'IMG') {
                processImage(node);
            } else if (node.getElementsByTagName) {
                const images = node.getElementsByTagName('img');
                Array.from(images).forEach(processImage);
            }
        });
    });
});

// Traiter les images existantes
function processExistingImages() {
    const images = document.getElementsByTagName('img');
    Array.from(images).forEach(processImage);
}

// Configuration de l'observateur
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Charger le modèle au démarrage
loadModel();

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleBlur') {
        const filteredImages = document.querySelectorAll('.filtered-image');
        filteredImages.forEach(img => {
            img.style.filter = img.style.filter === 'blur(30px)' ? 'none' : 'blur(30px)';
        });
    }
});

// Cache pour éviter de retraiter les mêmes images
const processedImages = new WeakSet();
const urlCache = new Map();
const textCache = new Map();

// Mots-clés simplifiés pour une recherche plus rapide
const quickKeywords = new Set([
    'femme', 'fille', 'sexy', 'nude', 'bikini', 'maillot',
    'woman', 'girl', 'naked', 'lingerie', 'swimsuit'
]);

// Fonction rapide pour vérifier le texte
function quickCheck(text) {
    if (!text) return false;
    text = text.toLowerCase();
    return Array.from(quickKeywords).some(keyword => text.includes(keyword));
}

// Fonction pour normaliser le texte
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Fonction pour vérifier si le texte contient des mots-clés féminins
function containsFemaleContent(text) {
    if (!text) return false;
    const normalizedText = normalizeText(text);
    
    // Vérifier les expressions complètes
    for (const expression of sensitiveExpressions) {
        if (normalizedText.includes(normalizeText(expression))) {
            return true;
        }
    }
    
    // Compter les mots-clés féminins trouvés
    let femaleKeywordCount = 0;
    const words = normalizedText.split(' ');
    
    for (const word of words) {
        if (femaleKeywords.some(keyword => {
            const normalizedKeyword = normalizeText(keyword);
            return word.includes(normalizedKeyword) || normalizedKeyword.includes(word);
        })) {
            femaleKeywordCount++;
            if (femaleKeywordCount >= 2) {
                return true;
            }
        }
    }
    
    return false;
}

// Fonction pour vérifier si le texte contient du contenu sensible
function containsSensitiveContent(text) {
    const normalizedText = normalizeText(text);
    
    // Vérifier les expressions complètes
    for (const expression of sensitiveExpressions) {
        if (normalizedText.includes(normalizeText(expression))) {
            return true;
        }
    }
    
    // Vérifier les mots-clés individuels
    for (const keyword of sensitiveKeywords) {
        if (normalizedText.includes(normalizeText(keyword))) {
            return true;
        }
    }
    
    return false;
}

// Fonction pour détecter la couleur de peau
function isSkinColor(r, g, b) {
    // Valeurs RGB typiques pour la peau
    return (
        // Tons clairs à moyens
        (r > 160 && g > 110 && g < 180 && b > 80 && b < 140) ||
        // Tons plus foncés
        (r > 120 && g > 80 && g < 150 && b > 60 && b < 120) ||
        // Tons très clairs
        (r + g + b > 400 && Math.abs(r - g) < 15 && Math.abs(r - b) > 15)
    );
}

// Mots-clés liés aux femmes
const femaleKeywords = [
    // Termes généraux
    'femme', 'fille', 'dame', 'woman', 'girl', 'lady',
    'female', 'féminine', 'feminine', 'women', 'girls', 'ladies',
    'madame', 'mademoiselle', 'miss', 'mrs', 'ms',
    
    // Rôles/Professions au féminin
    'modèle', 'model', 'mannequin', 'actrice', 'actress',
    'danseuse', 'dancer', 'influenceuse', 'influencer',
    
    // Parties du corps féminines
    'poitrine', 'sein', 'seins', 'breast', 'breasts', 'boobs',
    'décolleté', 'decollete', 'cleavage',
    
    // Vêtements féminins
    'robe', 'dress', 'jupe', 'skirt', 'bikini', 'maillot',
    'lingerie', 'bra', 'soutien-gorge', 'culotte', 'panties',
    'string', 'thong', 'collant', 'legging',
    
    // Descriptifs féminins
    'sexy', 'hot', 'sensuelle', 'sensual', 'séduisante',
    'belle', 'beautiful', 'jolie', 'pretty', 'cute',
    'glamour', 'charmante', 'charming'
];

// Mots-clés à bloquer
const sensitiveKeywords = [
    // Mots liés aux femmes
    'femme', 'fille', 'dame', 'woman', 'girl', 'lady',
    'female', 'féminine', 'feminine', 'women', 'girls', 'ladies',
    'madame', 'mademoiselle', 'miss', 'mrs', 'ms',
    
    // Contenu sensible
    'sexy', 'hot', 'sensuelle', 'sensual', 'séduisante',
    'nue', 'nu', 'nude', 'naked', 'topless',
    'déshabillée', 'deshabillee', 'undressed',
    
    // Vêtements
    'bikini', 'maillot', 'lingerie', 'sous-vêtement',
    'string', 'thong', 'soutien-gorge', 'bra',
    
    // Sites et contenus adultes
    'porn', 'porno', 'pornographie', 'xxx',
    'adult', 'adulte', 'mature', 'escort',
    'dating', 'rencontre', 'sex', 'sexe'
];

// Expressions complètes à bloquer
const sensitiveExpressions = [
    'maillot de bain', 'swimsuit', 'swim wear',
    'sous vetement', 'sous-vetement', 'underwear',
    'tenue légère', 'petite tenue',
    'peu habillée', 'à moitié nue',
    'photo sexy', 'sexy pic', 'hot pic',
    'photo bikini', 'bikini pic',
    'photo plage', 'beach pic',
    'photo piscine', 'pool pic',
    'site pour adulte', 'adult site',
    'contenu adulte', 'adult content'
];
