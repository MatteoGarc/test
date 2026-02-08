class GameStateManager {
    constructor() {
        this.inventory = [];
        this.completedCards = []; // Cartes terminées (grisées)
        this.revealedCards = [];  // Cartes retournées (face visible)
        this.unlockedHints = [];  // Liste des indices débloqués
        this.currentSlot = null;  // Slot de sauvegarde actuel
        this.savedTime = 3600;    // 🆕 Temps sauvegardé (1 heure par défaut)
        this.savedPage = 0;       // 🆕 Page d'inventaire sauvegardée
    }

    // Ajoute un indice s'il n'est pas déjà présent
    addHint(hintText) {
        if (hintText && !this.unlockedHints.includes(hintText)) {
            this.unlockedHints.push(hintText);
            return true; // Indique que c'est un nouvel indice
        }
        return false;
    }

    // Charge une sauvegarde complète
    loadFromSave(saveData) {
        this.inventory = saveData.inventory || [];
        this.completedCards = saveData.completedCards || [];
        this.revealedCards = saveData.revealedCards || [];
        this.unlockedHints = saveData.unlockedHints || [];
        this.savedTime = saveData.timeRemaining || 3600;
        this.savedPage = saveData.currentPage || 0;
    }

    // Exporte l'état actuel pour sauvegarde
    toSaveData(currentTime, currentPage) {
        return {
            inventory: [...this.inventory],
            completedCards: [...this.completedCards],
            revealedCards: [...this.revealedCards],
            unlockedHints: [...this.unlockedHints],
            timeRemaining: currentTime,
            currentPage: currentPage,
            timestamp: Date.now()
        };
    }

    // Réinitialise le state (nouvelle partie)
    reset() {
        this.inventory = [];
        this.completedCards = [];
        this.revealedCards = [];
        this.unlockedHints = [];
        this.savedTime = 3600;
        this.savedPage = 0;
    }

    // Vérifie si le state a des données (partie en cours)
    hasData() {
        return this.inventory.length > 0 ||
            this.completedCards.length > 0 ||
            this.revealedCards.length > 0;
    }
}

export const GameState = new GameStateManager();