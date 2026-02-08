class SaveManager {
    constructor() {
        this.prefix = 'phaser_game_'; // Préfixe pour éviter les conflits
    }

    addSave(save, numslot) {
        try {
            // Convertir en JSON si c'est un objet
            const saveData = typeof save === 'object' ? JSON.stringify(save) : save;

            localStorage.setItem(`${this.prefix}slot${numslot}`, saveData);
            return true;
        } catch (erreur) {
            console.error('Erreur lors de la sauvegarde :', erreur.message);
            return false;
        }
    }

    restoreSave(numslot) {
        try {
            const contenu = localStorage.getItem(`${this.prefix}slot${numslot}`);

            if (contenu === null) {
                console.warn(`La sauvegarde slot${numslot} n'existe pas`);
                return null;
            }

            // Essayer de parser en JSON, sinon retourner tel quel
            try {
                return JSON.parse(contenu);
            } catch {
                return contenu;
            }
        } catch (erreur) {
            console.error('Erreur lors du chargement :', erreur.message);
            return null;
        }
    }

    listSaves() {
        const saves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix + 'slot')) {
                const slotNum = key.replace(this.prefix + 'slot', '');
                saves.push({ slot: parseInt(slotNum), key: key });
            }
        }
        return saves.sort((a, b) => a.slot - b.slot);
    }

    saveExists(numslot) {
        return localStorage.getItem(`${this.prefix}slot${numslot}`) !== null;
    }

    deleteSave(numslot) {
        try {
            localStorage.removeItem(`${this.prefix}slot${numslot}`);
            return true;
        } catch (erreur) {
            console.error('Erreur lors de la suppression :', erreur.message);
            return false;
        }
    }

    // Bonus : effacer toutes les sauvegardes
    clearAllSaves() {
        const saves = this.listSaves();
        saves.forEach(save => {
            localStorage.removeItem(save.key);
        });
    }
}

// Export pour utilisation dans Phaser
export default SaveManager;