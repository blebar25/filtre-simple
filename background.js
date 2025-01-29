// Liste de blocage
let blockedWords = [];

// Fonction pour normaliser le texte
function normalizeText(text) {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Fonction pour vérifier si l'URL contient des mots bloqués
function shouldBlock(url) {
    if (!url) return false;
    
    try {
        // Normaliser l'URL pour la recherche
        const normalizedUrl = normalizeText(decodeURIComponent(url));
        
        // Vérifier chaque mot bloqué
        for (const word of blockedWords) {
            const normalizedWord = normalizeText(word);
            
            // Créer un motif qui correspond au mot, même s'il est partiel
            const pattern = new RegExp(normalizedWord, 'i');
            
            if (pattern.test(normalizedUrl)) {
                console.log('Mot bloqué trouvé:', word, 'dans URL:', url);
                return true;
            }
        }
        
        return false;
    } catch (e) {
        console.error('Erreur lors de la vérification de l\'URL:', e);
        return false;
    }
}

// Fonction pour mettre à jour la liste des mots bloqués
async function updateBlockList() {
    try {
        const response = await fetch(chrome.runtime.getURL('database.json'));
        const data = await response.json();
        
        console.log('Chargement de database.json...');
        
        // Créer une liste unique de tous les mots à bloquer
        const allWords = [
            ...(data.blockedDomains || []),
            ...(data.blockedKeywords || []),
            ...(data.blockedPhrases || [])
        ];
        
        // Supprimer les doublons et les entrées vides
        blockedWords = [...new Set(allWords)].filter(word => word && word.trim());
        
        // Trier les mots du plus long au plus court pour éviter les faux positifs
        blockedWords.sort((a, b) => b.length - a.length);
        
        console.log('Liste de blocage mise à jour:', {
            totalWords: blockedWords.length,
            examples: blockedWords.slice(0, 5)
        });
        
        // Sauvegarder dans le stockage local
        await chrome.storage.local.set({
            'blockedWords': blockedWords,
            'lastUpdated': new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la liste:', error);
    }
}

// Mettre à jour la liste au démarrage
updateBlockList();

// URL de la page de blocage
const blockPageUrl = chrome.runtime.getURL('blocked.html');

// Bloquer les requêtes
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.log('Vérification de l\'URL:', details.url);
        
        // S'assurer que la liste est chargée
        if (blockedWords.length === 0) {
            console.log('Liste de blocage vide, rechargement...');
            updateBlockList();
        }
        
        // Vérifier si l'URL doit être bloquée
        if (shouldBlock(details.url)) {
            console.log('URL bloquée:', details.url);
            return { redirectUrl: blockPageUrl };
        }
        
        console.log('URL autorisée:', details.url);
        return { cancel: false };
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"]
    },
    ["blocking"]
);

// Écouter les messages du popup
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getBlockedWords") {
            sendResponse({
                blockedWords: blockedWords,
                count: blockedWords.length
            });
        }
    }
);
