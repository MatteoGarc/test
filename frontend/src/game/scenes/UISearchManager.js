import { GameData } from "../GameData";
import { GameState } from "../GameState";

export class UISearchManager {

    static create(sceneGame, sceneCard, mode = 0) {
        /*
        mode == 1 : instance Game
        mode == 0 : instance CardScene
         */
        sceneCard.createNotificationSystemCardScene();
        
        const oldDiv = document.getElementById("ui-search-container");
        if (oldDiv) oldDiv.remove();

        const div = document.createElement("div");
        div.id = "ui-search-container";
        div.style =
            "position:absolute; top:20px; left:50%; transform:translateX(-50%); z-index:50; background:rgba(0,0,0,0.8); padding:15px; border-radius:15px; display:flex; gap:10px;";
        div.innerHTML = `
            <input type="text" id="search-card" oninput="this.value = this.value.replace(/\\D/g, '')" placeholder="N°..." style="padding:10px; font-size:18px; width:100px; text-align:center; border-radius:5px; border:none;">
            <button id="btn-search" style="padding:10px 20px; font-size:18px; cursor:pointer; background:#00ff00; border:none; border-radius:5px; font-weight:bold;">PRENDRE</button>
        `;
        document.body.appendChild(div);

        const takeCard = () => {
            const val = document.getElementById("search-card").value.trim();

            // Vérifier si la carte existe
            if (!GameData.cardIds.includes(val)) {
                if (mode == 1) {
                    sceneGame.showNotification(`Numéro ${val} introuvable`, "error");
                } else {
                    sceneCard.showNotificationCardScene(`Numéro ${val} introuvable`, "error");
                }
                return;
            }

            const cardData = GameData.cards[val];

            // NOUVEAU : Vérifier si l'énigme parente a été résolue
            if (cardData && cardData.requires) {
                const hasRequirement = cardData.requires.some((reqId) =>
                    GameState.inventory.includes(reqId)
                );
                if (!hasRequirement) {
                    if (mode == 1) {
                        sceneGame.showNotification(`Carte ${val} verrouillée. Résolvez d'abord les énigmes !`, "error");
                    } else {
                        sceneCard.showNotificationCardScene(`Carte ${val} verrouillée. Résolvez d'abord les énigmes !`, "error");
                    }
                    return;
                }
            }
            
            
            const isPuzzleReward = Object.values(GameData.cards).some(card => {
                // Si cette carte est une récompense d'un puzzle
                if (card.rewards && card.rewards.includes(val)) {
                    // Et que le puzzle n'est PAS résolu (linkedIds non complétés)
                    if (card.linkedIds) {
                        const puzzleSolved = card.linkedIds.every(id =>
                            GameState.completedCards.includes(id)
                        );
                        return !puzzleSolved; // Retourne true si le puzzle N'EST PAS résolu
                    }
                }
                return false;
            });


            if (isPuzzleReward) {
                if (mode == 1) {
                    sceneGame.showNotification(`Cette carte est verrouillée ! Résolvez l'énigme d'abord.`, "error");
                } else {
                    sceneCard.showNotificationCardScene(`Cette carte est verrouillée ! Résolvez l'énigme d'abord.`, "error");
                }
                return;
            }

            // Vérifier si déjà possédée
            if (GameState.inventory.includes(val)) {
                if (mode == 1) {
                    sceneGame.showNotification(`Déjà possédé`, "info");
                } else {
                    sceneCard.showNotificationCardScene(`Déjà possédé`, "info");
                }
                return;
            }

            // Vérifier si c'est un piège
            if (GameData.penalties[val]) {
                GameState.inventory.push(val);
                sceneGame.applyPenalty(GameData.penalties[val]); // Convertir minutes en minutes (déjà en minutes)
                sceneGame.refreshInventory();
                if (mode == 1) {
                    sceneGame.showNotification(`PIÈGE ! -${GameData.penalties[val]} minutes !`, "error");
                } else {
                    sceneCard.showNotificationCardScene(`PIÈGE ! -${GameData.penalties[val]} minutes !`, "error");
                }
                document.getElementById("search-card").value = "";
                return;
            }

            // Ajouter la carte normalement
            GameState.inventory.push(val);
            if(val === "22") {

                const url = 'http://127.0.0.1:8000';

                // Name for the window (can be used to target it later)
                const name = 'Enigma';

                // Specific features: width, height, and coordinates
                const features = 'width=600,height=400,top=100,left=100,resizable=yes,scrollbars=yes';

                window.open(url, name, features);
            }

            sceneGame.refreshInventory();
            if (mode == 1) {
                sceneGame.showNotification(`Carte ${val} récupérée !`, "success");
            } else {
                sceneCard.showNotificationCardScene(`Carte ${val} récupérée !`, "success");
            }
            document.getElementById("search-card").value = "";
        };

        document.getElementById("btn-search").onclick = takeCard;
        document.getElementById("search-card")
            .addEventListener("keypress", e => e.key === "Enter" && takeCard());
    }

    static hide() {
        const el = document.getElementById("ui-search-container");
        if (el) el.style.display = "none";
    }

    static show() {
        const el = document.getElementById("ui-search-container");
        if (el) el.style.display = "flex";
    }

    static destroy() {
        const el = document.getElementById("ui-search-container");
        if (el) el.remove();
    }
}
