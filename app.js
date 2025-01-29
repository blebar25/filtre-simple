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

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleFilter');
    const filterStatus = document.getElementById('filterStatus');
    const nsfwCheckbox = document.getElementById('nsfw');

    // Charger les préférences sauvegardées
    loadSettings();

    toggleButton.addEventListener('click', () => {
        const isActive = toggleButton.classList.toggle('active');
        filterStatus.textContent = isActive ? 'Activé' : 'Désactivé';
        saveSettings();
    });

    nsfwCheckbox.addEventListener('change', saveSettings);
});

// Sauvegarder les paramètres
function saveSettings() {
    const settings = {
        filterActive: document.getElementById('toggleFilter').classList.contains('active'),
        nsfwBlocked: document.getElementById('nsfw').checked
    };
    localStorage.setItem('filterSettings', JSON.stringify(settings));
}

// Charger les paramètres
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('filterSettings')) || {
        filterActive: false,
        nsfwBlocked: true
    };

    const toggleButton = document.getElementById('toggleFilter');
    const filterStatus = document.getElementById('filterStatus');
    const nsfwCheckbox = document.getElementById('nsfw');

    if (settings.filterActive) {
        toggleButton.classList.add('active');
        filterStatus.textContent = 'Activé';
    }
    nsfwCheckbox.checked = settings.nsfwBlocked;
}
