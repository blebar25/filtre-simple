document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const blockedCountElement = document.getElementById('blockedCount');
    const toggleFilterButton = document.getElementById('toggleFilter');
    const toggleBlurButton = document.getElementById('toggleBlur');
    const thresholdSlider = document.getElementById('threshold');
    const thresholdValue = document.getElementById('thresholdValue');

    // Charger les paramètres sauvegardés
    chrome.storage.sync.get(['filterEnabled', 'threshold', 'blockedCount'], function(data) {
        const filterEnabled = data.filterEnabled !== undefined ? data.filterEnabled : true;
        const threshold = data.threshold || 50;
        const blockedCount = data.blockedCount || 0;

        statusElement.textContent = filterEnabled ? 'Actif' : 'Inactif';
        thresholdSlider.value = threshold;
        thresholdValue.textContent = `${threshold}%`;
        blockedCountElement.textContent = blockedCount;
        toggleFilterButton.textContent = filterEnabled ? 'Désactiver temporairement' : 'Activer';
    });

    // Gérer le bouton de toggle du filtre
    toggleFilterButton.addEventListener('click', function() {
        chrome.storage.sync.get(['filterEnabled'], function(data) {
            const newState = !data.filterEnabled;
            chrome.storage.sync.set({ filterEnabled: newState });
            statusElement.textContent = newState ? 'Actif' : 'Inactif';
            toggleFilterButton.textContent = newState ? 'Désactiver temporairement' : 'Activer';

            // Envoyer le message à content.js
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleFilter',
                    enabled: newState
                });
            });
        });
    });

    // Gérer le bouton de toggle du flou
    toggleBlurButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleBlur'
            });
        });
    });

    // Gérer le slider de sensibilité
    thresholdSlider.addEventListener('input', function() {
        const value = this.value;
        thresholdValue.textContent = `${value}%`;
        chrome.storage.sync.set({ threshold: value });

        // Envoyer le nouveau seuil à content.js
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateThreshold',
                threshold: value / 100
            });
        });
    });

    // Écouter les mises à jour du compteur d'images bloquées
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updateBlockedCount') {
            blockedCountElement.textContent = request.count;
            chrome.storage.sync.set({ blockedCount: request.count });
        }
    });
});
