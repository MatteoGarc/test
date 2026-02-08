import { Scene } from "phaser";
import { GameData } from "../GameData";
import { EventBus } from "../EventBus";
import { GameState } from "../GameState"; // Import du State
import { UISearchManager } from "./UISearchManager.js";
import SaveManager from "../SaveManager.js";

export class Game extends Scene {
    constructor() {
        super("Game");

        this.saveManager = new SaveManager();
        this.mode_solo = true;
        
        // Pagination inventaire
        this.currentPage = 0;
        this.itemsPerLine = 5;
        this.itemsPerPage = 10;

        // Timer 
        // 1 heure = 3600 secondes
        this.initialTime = 3600;
        this.timerEvent = null;

        // Theme Graphique
        this.theme = {
            gold: 0xc5a059,
            dark: 0x12100e,
            red: 0x8a0303
        };

        // Gestion du Feed (Historique Multi)
        this.feedLines = []; // Stocke les objets Textes affichés
        this.maxFeedLines = 6; // Nombre max de messages visibles
    }
    
    init(data){
        if (data && data.mode_solo === false) {
            this.mode_solo = data.mode_solo;
        }
        console.log('mode_solo de game : ', this.mode_solo);
    }

    create() {

        UISearchManager.destroy();
        UISearchManager.create(this, this.scene.get("CardScene"), 1);
        
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
        if (this.textures.exists('background')) {
            const bg = this.add.image(width / 2, height / 2, 'background');
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale).setScrollFactor(0);
            bg.setAlpha(0.1);
            bg.setTint(0xabcaaa);
        }

        this.initialTime = GameState.savedTime;
        this.currentPage = GameState.savedPage;

        // On init l'inventaire sans doublons dans le GameState
        if (GameState.inventory.length === 0) {
            GameState.inventory = [...new Set(GameData.initialInventory)];
        }

        this.cardsContainer = this.add.container(0, 0);

        // On lance tous les systèmes
        this.createNotebook(); // Notes
        this.createTimer();
        this.refreshInventory();
        this.createPauseMenu(this.mode_solo);
        this.createNotificationSystem(); // Popups
        
        // Affichage des indices persistants (Haut Droite)
        this.createHintContainer();
        this.updateHintDisplay();

        // --- NOUVEAU : Création du Feed d'actualité (Sous les indices) ---
        if(!this.mode_solo){
            this.createFeedContainer();
        }

        this.showNotification(`Premier pas : Cliquer sur la carte`);
        
        // Écouteur pour le retour de la CardScene
        this.events.on('resume', (sys, data) => {
            // On rafraichit tout au retour
            this.refreshInventory();
            this.updateHintDisplay(); // Met à jour les indices si un nouveau a été débloqué
            
            // Gestion pénalité venant de la carte
            if (data && data.penalty) {
                this.applyPenalty(data.penalty);
            }
            
            // Notification venant de la carte
            if (data && data.notification) {
                this.showNotification(data.notification.text, data.notification.type);
            }

            // Réafficher l'UI de recherche
            const searchUI = document.getElementById("ui-search-container");
            if (searchUI) searchUI.style.display = "flex";
        });

        EventBus.emit("current-scene-ready", this);
        // --- ECOUTEURS EVENTBUS (Modifié pour communication temps réel) ---
        
        // 1. Réception des pénalités venant des puzzles (CardScene)
        EventBus.on('apply-penalty', (minutes) => {
            this.applyPenalty(minutes);
        });

        // 2. Demande de rafraîchissement (quand on ferme une carte)
        EventBus.on('request-refresh', () => {
            this.refreshInventory();
            this.updateHintDisplay();
            if (GameState.inventory.includes('WIN')) {
                this.handleVictory();
                return;
            }
            // Réafficher l'UI de recherche
            const searchUI = document.getElementById("ui-search-container");
            if (searchUI) searchUI.style.display = "flex";
        });

        // 3. Notification globale venant d'ailleurs
        EventBus.on('show-notification', (data) => {
            this.showNotification(data.text, data.type);
        });

        // 4. CHECKPOINTS / PROGRESSION MULTI (Modifié pour le Feed)
        EventBus.on('network-action', (data) => {
            // Si c'est une info de progression envoyée par un autre joueur
            if (data.action === 'progress') {
                const { player, message, time } = data.payload; 
                // On le passe à la fonction d'affichage
                this.addToFeed(player, message, time);
            }
        });

        // Nettoyage au shutdown pour éviter les doublons d'écouteurs
        this.events.on('shutdown', () => {
            EventBus.off('apply-penalty');
            EventBus.off('request-refresh');
            EventBus.off('show-notification');
            EventBus.off('network-action'); // <--- AJOUT NETTOYAGE
        });

        EventBus.emit("current-scene-ready", this);
        
        if (GameState.savedTime) {
            this.initialTime = GameState.savedTime;
        }
        if (GameState.savedPage !== undefined) {
            this.currentPage = GameState.savedPage;
        }
    }

    // --- MENU PAUSE ---
    createPauseMenu(mode_solo) {
        if(mode_solo) {
            if (document.getElementById("pause-btn")) return;

            // Bouton pour ouvrir le menu pause
            const pauseBtn = document.createElement("button");
            pauseBtn.id = "pause-btn";
            pauseBtn.innerHTML = "MENU";
            pauseBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 20px;
                background: linear-gradient(135deg, #424242, #616161);
                color: #fff;
                border: 2px solid #757575;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.2s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            pauseBtn.onmouseenter = () => {
                pauseBtn.style.background = "linear-gradient(135deg, #616161, #757575)";
                pauseBtn.style.transform = "scale(1.05)";
            };

            pauseBtn.onmouseleave = () => {
                pauseBtn.style.background = "linear-gradient(135deg, #424242, #616161)";
                pauseBtn.style.transform = "scale(1)";
            };

            pauseBtn.onclick = () => {
                this.togglePauseMenu(true);
            };

            document.body.appendChild(pauseBtn);

            // Container du menu pause
            const menuContainer = document.createElement("div");
            menuContainer.id = "pause-menu-container";
            menuContainer.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 2000;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
            `;

            // Panneau du menu
            const menuPanel = document.createElement("div");
            menuPanel.style.cssText = `
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                border: 3px solid #c5a059;
                border-radius: 15px;
                padding: 40px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                text-align: center;
                min-width: 400px;
            `;

            // Titre du menu
            const title = document.createElement("h2");
            title.innerHTML = "MENU PAUSE";
            title.style.cssText = `
                margin: 0 0 30px 0;
                color: #c5a059;
                font-family: 'Courier New', monospace;
                font-size: 32px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                border-bottom: 2px solid #c5a059;
                padding-bottom: 15px;
            `;

            // Bouton Sauvegarder
            const saveBtn = document.createElement("button");
            saveBtn.innerHTML = "SAUVEGARDER LA PARTIE";
            saveBtn.style.cssText = `
                width: 100%;
                padding: 15px 30px;
                margin: 10px 0;
                background: linear-gradient(135deg, #1e3a1e, #2e5a2e);
                color: #fff;
                border: 2px solid #4caf50;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            saveBtn.onmouseenter = () => {
                saveBtn.style.background = "linear-gradient(135deg, #2e5a2e, #3e7a3e)";
                saveBtn.style.transform = "scale(1.05)";
                saveBtn.style.boxShadow = "0 6px 12px rgba(76, 175, 80, 0.4)";
            };

            saveBtn.onmouseleave = () => {
                saveBtn.style.background = "linear-gradient(135deg, #1e3a1e, #2e5a2e)";
                saveBtn.style.transform = "scale(1)";
                saveBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
            };

            saveBtn.onclick = () => {
                this.saveGame();
                saveBtn.innerHTML = "SAUVEGARDÉ !";
                setTimeout(() => {
                    saveBtn.innerHTML = "SAUVEGARDER LA PARTIE";
                }, 2000);
            };

            // Bouton Retour au menu principal
            const mainMenuBtn = document.createElement("button");
            mainMenuBtn.innerHTML = "RETOUR AU MENU PRINCIPAL";
            mainMenuBtn.style.cssText = `
                width: 100%;
                padding: 15px 30px;
                margin: 10px 0;
                background: linear-gradient(135deg, #8a0303, #c62828);
                color: #fff;
                border: 2px solid #ff5252;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            mainMenuBtn.onmouseenter = () => {
                mainMenuBtn.style.background = "linear-gradient(135deg, #c62828, #e53935)";
                mainMenuBtn.style.transform = "scale(1.05)";
                mainMenuBtn.style.boxShadow = "0 6px 12px rgba(255, 82, 82, 0.4)";
            };

            mainMenuBtn.onmouseleave = () => {
                mainMenuBtn.style.background = "linear-gradient(135deg, #8a0303, #c62828)";
                mainMenuBtn.style.transform = "scale(1)";
                mainMenuBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
            };

            mainMenuBtn.onclick = () => {
                this.returnToMainMenu();
            };

            // Bouton Reprendre
            const resumeBtn = document.createElement("button");
            resumeBtn.innerHTML = "REPRENDRE";
            resumeBtn.style.cssText = `
                width: 100%;
                padding: 15px 30px;
                margin: 10px 0;
                background: linear-gradient(135deg, #424242, #616161);
                color: #fff;
                border: 2px solid #9e9e9e;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            resumeBtn.onmouseenter = () => {
                resumeBtn.style.background = "linear-gradient(135deg, #616161, #757575)";
                resumeBtn.style.transform = "scale(1.05)";
                resumeBtn.style.boxShadow = "0 6px 12px rgba(158, 158, 158, 0.4)";
            };

            resumeBtn.onmouseleave = () => {
                resumeBtn.style.background = "linear-gradient(135deg, #424242, #616161)";
                resumeBtn.style.transform = "scale(1)";
                resumeBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
            };

            resumeBtn.onclick = () => {
                this.togglePauseMenu(false);
            };

            // Assemblage
            menuPanel.appendChild(title);
            menuPanel.appendChild(saveBtn);
            menuPanel.appendChild(mainMenuBtn);
            menuPanel.appendChild(resumeBtn);
            menuContainer.appendChild(menuPanel);
            document.body.appendChild(menuContainer);

            // Fermer en cliquant sur le fond
            menuContainer.onclick = (e) => {
                if (e.target === menuContainer) {
                    this.togglePauseMenu(false);
                }
            };
        } else {
            // Bouton pour ouvrir le menu pause
            const pauseBtn = document.createElement("button");
            pauseBtn.id = "pause-btn";
            pauseBtn.innerHTML = "Quitter";
            pauseBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 20px;
                background: linear-gradient(135deg, #424242, #616161);
                color: #fff;
                border: 2px solid #757575;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.2s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            pauseBtn.onmouseenter = () => {
                pauseBtn.style.background = "linear-gradient(135deg, #616161, #757575)";
                pauseBtn.style.transform = "scale(1.05)";
            };

            pauseBtn.onmouseleave = () => {
                pauseBtn.style.background = "linear-gradient(135deg, #424242, #616161)";
                pauseBtn.style.transform = "scale(1)";
            };

            pauseBtn.onclick = () => {
                this.togglePauseMenu(true);
            };

            document.body.appendChild(pauseBtn);

            const menuContainer = document.createElement("div");
            menuContainer.id = "pause-menu-container";
            menuContainer.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 2000;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
            `;

            // Panneau du menu
            const menuPanel = document.createElement("div");
            menuPanel.style.cssText = `
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                border: 3px solid #c5a059;
                border-radius: 15px;
                padding: 40px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                text-align: center;
                min-width: 400px;
            `;

            // Titre du menu
            const title = document.createElement("h2");
            title.innerHTML = "Êtes-vous sûr de vouloir quitter ?";
            title.style.cssText = `
                margin: 0 0 30px 0;
                color: #c5a059;
                font-family: 'Courier New', monospace;
                font-size: 32px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                border-bottom: 2px solid #c5a059;
                padding-bottom: 15px;
            `;

            const yesBtn = document.createElement("button");
            yesBtn.innerHTML = "OUI";
            yesBtn.style.cssText = `
                width: 100%;
                padding: 15px 30px;
                margin: 10px 0;
                background: linear-gradient(135deg, #1e3a1e, #2e5a2e);
                color: #fff;
                border: 2px solid #4caf50;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            yesBtn.onmouseenter = () => {
                yesBtn.style.background = "linear-gradient(135deg, #2e5a2e, #3e7a3e)";
                yesBtn.style.transform = "scale(1.05)";
                yesBtn.style.boxShadow = "0 6px 12px rgba(76, 175, 80, 0.4)";
            };

            yesBtn.onmouseleave = () => {
                yesBtn.style.background = "linear-gradient(135deg, #1e3a1e, #2e5a2e)";
                yesBtn.style.transform = "scale(1)";
                yesBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
            };

            yesBtn.onclick = () => {
                this.returnToMainMenu();
            };

            // Bouton Retour au menu principal
            const noBtn = document.createElement("button");
            noBtn.innerHTML = "NON";
            noBtn.style.cssText = `
                width: 100%;
                padding: 15px 30px;
                margin: 10px 0;
                background: linear-gradient(135deg, #8a0303, #c62828);
                color: #fff;
                border: 2px solid #ff5252;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            `;

            noBtn.onmouseenter = () => {
                noBtn.style.background = "linear-gradient(135deg, #c62828, #e53935)";
                noBtn.style.transform = "scale(1.05)";
                noBtn.style.boxShadow = "0 6px 12px rgba(255, 82, 82, 0.4)";
            };

            noBtn.onmouseleave = () => {
                noBtn.style.background = "linear-gradient(135deg, #8a0303, #c62828)";
                noBtn.style.transform = "scale(1)";
                noBtn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
            };

            noBtn.onclick = () => {
                this.togglePauseMenu(false);
            };

            // Assemblage
            menuPanel.appendChild(title);
            menuPanel.appendChild(yesBtn);
            menuPanel.appendChild(noBtn);
            menuContainer.appendChild(menuPanel);
            document.body.appendChild(menuContainer);

            // Fermer en cliquant sur le fond
            menuContainer.onclick = (e) => {
                if (e.target === menuContainer) {
                    this.togglePauseMenu(false);
                }
            };
        }
    }

    //Basculer l'affichage du menu pause
    togglePauseMenu(show) {
        const menu = document.getElementById("pause-menu-container");
        if (!menu) return;

        if (show) {
            menu.style.display = "flex";
            if (this.mode_solo) {
                // Mettre le jeu en pause
                this.scene.pause();
                // Pause du timer
                if (this.timerEvent) {
                    this.timerEvent.paused = true;
                }
            }
        } else {
            menu.style.display = "none";
            if(this.mode_solo){
                // Reprendre le jeu
                this.scene.resume();
                // Reprendre le timer
                if (this.timerEvent) {
                    this.timerEvent.paused = false;
                }   
            }
        }
    }

    //Fonction de sauvegarde (simplifiée)
    saveGame() {
        // Vérifier qu'un slot est sélectionné
        if (!GameState.currentSlot) {
            this.showNotification("Aucun slot sélectionné !", "error");
            return;
        }

        // Utiliser la méthode toSaveData
        const saveData = GameState.toSaveData(this.initialTime, this.currentPage);

        // Sauvegarder dans le slot actuel
        const success = this.saveManager.addSave(saveData, GameState.currentSlot);

        if (success) {
            this.showNotification(`Partie sauvegardée (Slot ${GameState.currentSlot})`, "success");
            return true;
        } else {
            this.showNotification("Erreur lors de la sauvegarde", "error");
            return false;
        }
    }

    //Retour au menu principal
    returnToMainMenu() {
        window.location.reload();
    }

    handleVictory() {
        this.time.removeEvent(this.timerEvent);
        this.sound.stopAll();
        UISearchManager.destroy();
        const ids = ['notebook-container', 'notebook-btn', 'game-input-div', 'puzzle-container', 'multi-input-container'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });

        this.scene.stop('CardScene');
        this.scene.start('Victory', { remainingTime: this.initialTime });
    }
    // --- SYSTEME DE FEED (Historique à droite) ---
    createFeedContainer() {
        // Positionné sous la boite d'indices (qui finit vers y=170)
        // x = largeur - 260 (aligné avec indices), y = 220
        this.feedContainer = this.add.container(this.scale.width - 260, 220);
        
        // Titre discret
        const title = this.add.text(0, 0, "ACTIVITÉ RÉCENTE", {
            font: "bold 14px Arial", 
            color: "#888888",
            backgroundColor: "#00000088",
            padding: { x: 5, y: 2 }
        });
        
        this.feedContainer.add(title);
    }

    addToFeed(player, message, remoteTime = null) {
        // Créer le texte
        const timeValue = (remoteTime !== null && remoteTime !== undefined) ? remoteTime : this.initialTime;
        const time = this.formatTime(timeValue);
        
        // Style "Terminal/Hacker"
        const textObj = this.add.text(0, 0, `[${time}] ${player}\n${message}`, {
            font: "14px Courier New", 
            color: "#00ff00", 
            wordWrap: { width: 250 },
            stroke: "#000000",
            strokeThickness: 3,
            shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0, stroke: true, fill: true }
        });

        // Ajouter au conteneur (invisible pour l'instant)
        this.feedContainer.add(textObj);
        this.feedLines.unshift(textObj); // Ajouter au début du tableau (le plus récent)

        // Réorganiser l'affichage 
        let currentY = 30; 

        this.feedLines.forEach((line, index) => {
            if (index < this.maxFeedLines) {
                // Animation pour le nouvel élément (celui à l'index 0)
                if (index === 0) {
                    line.setY(currentY - 20); // Part d'un peu plus haut
                    line.setAlpha(0);
                    this.tweens.add({
                        targets: line,
                        y: currentY,
                        alpha: 1,
                        duration: 400,
                        ease: "Back.out"
                    });
                } else {
                    // Les autres descendent
                    this.tweens.add({
                        targets: line,
                        y: currentY,
                        duration: 300,
                        ease: "Power2"
                    });
                }
                
                // On rend les anciens un peu plus transparents / grisés
                const alpha = 1 - (index * 0.15); 
                line.setAlpha(index === 0 ? 0 : alpha); // L'anim gère le 0 du premier
                if (index > 0) line.setColor("#aaaaaa"); // Griser les anciens messages

                // On calcule la hauteur pour le prochain
                currentY += line.height + 15; 
            } else {
                // Trop vieux, on supprime
                line.destroy();
            }
        });

        // Nettoyage du tableau
        if (this.feedLines.length > this.maxFeedLines) {
            this.feedLines.splice(this.maxFeedLines).forEach(l => l.destroy());
        }
    }

    // --- SYSTEME D'INDICES (Haut Droite) ---
    createHintContainer() {
        this.hintContainer = this.add.container(this.scale.width - 260, 20);
        
        // Fond
        const bg = this.add.rectangle(0, 0, 250, 150, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xffd700);
            
        // Titre
        const title = this.add.text(10, 10, "INDICES DÉBLOQUÉS", {
            font: "bold 16px Arial", color: "#ffd700", underline: true
        });

        // Texte des indices (vide au début)
        this.hintTextObj = this.add.text(10, 40, "Aucun indice...", {
            font: "14px Arial", color: "#ffffff", wordWrap: { width: 230 }
        });

        this.hintContainer.add([bg, title, this.hintTextObj]);
    }

    updateHintDisplay() {
        if (GameState.unlockedHints.length > 0) {
            // Affiche le dernier indice ou la liste
            const text = GameState.unlockedHints.map(h => "- " + h).join("\n\n");
            this.hintTextObj.setText(text);
            
            // Petit flash pour dire "Hey regarde ici"
            this.tweens.add({
                targets: this.hintContainer,
                alpha: 0.5,
                yoyo: true,
                duration: 200,
                repeat: 2
            });
        } else {
            this.hintTextObj.setText("Aucun indice...");
        }
    }

    // Gestion des notifications (Popups in-game)
    createNotificationSystem() {
        this.notificationContainer = this.add
            .container(this.scale.width / 2, -100)
            .setDepth(2000);

        // Fond et texte
        this.notifBg = this.add
            .rectangle(0, 0, 600, 80, 0x000000, 0.9)
            .setStrokeStyle(4, 0xffffff);
        this.notifText = this.add
            .text(0, 0, "", {
                font: "bold 24px Arial",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        this.notificationContainer.add([this.notifBg, this.notifText]);
    }

    showNotification(message, type = "info") {
        let color = 0x333333;
        let stroke = 0xffffff;

        // Choix couleur selon type
        if (type === "success") {
            color = 0x2e7d32;
            stroke = 0x00ff00;
        } else if (type === "error") {
            color = 0xc62828;
            stroke = 0xff0000;
        } else if (type === "warning") {
            color = 0xff8f00;
            stroke = 0xffff00;
        }

        this.notifBg.setFillStyle(color, 0.95).setStrokeStyle(4, stroke);
        this.notifText.setText(message);

        // Animation d'apparition
        this.tweens.killTweensOf(this.notificationContainer);
        this.notificationContainer.y = -100;

        this.tweens.chain({
            targets: this.notificationContainer,
            tweens: [
                { y: 100, duration: 3000, ease: "Back.out" }, // Descend
                { delay: 4000, duration: 0 }, // Reste
                { y: -100, duration: 3000, ease: "Back.in" }, // Remonte
            ],
        });
    }

    // Timer et Pénalités
    createTimer() {
        // Décalé à gauche pour laisser place aux indices
        const bg = this.add.rectangle(
            this.scale.width - 400, // Décalé un peu plus pour les indices
            40,
            150,
            50,
            0x000000,
            0.7,
        );
        this.timerText = this.add
            .text(
                this.scale.width - 400,
                40,
                this.formatTime(this.initialTime),
                {
                    font: "bold 32px Arial",
                    color: "#ff0000",
                },
            )
            .setOrigin(0.5);

        // Tick chaque seconde
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.onTimerTick,
            callbackScope: this,
            loop: true,
        });
    }

    onTimerTick() {
        this.initialTime--;
        if (this.initialTime < 0) this.initialTime = 0;
        
        const timeString = this.formatTime(this.initialTime);
        this.timerText.setText(timeString);

        // ENVOI DU TEMPS AUX AUTRES SCENES (Pour que le chrono s'affiche sur la carte)
        EventBus.emit('timer-tick', timeString);

        // Fin du jeu
        if (this.initialTime <= 0) {
            this.time.removeEvent(this.timerEvent);
            this.scene.stop('CardScene');
            this.scene.start("GameOver");
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const partInSeconds = seconds % 60;
        return `${minutes}:${partInSeconds.toString().padStart(2, "0")}`;
    }

    // Retire du temps et flash rouge
    applyPenalty(minutes) {
        const pen = parseInt(minutes);
        if(!isNaN(pen)) {
            this.initialTime -= pen * 60;
        }
        
        if (this.initialTime < 0) this.initialTime = 0;
        
        // Mise à jour immédiate
        const timeString = this.formatTime(this.initialTime);
        this.timerText.setText(timeString);
        EventBus.emit('timer-tick', timeString); // Force update pour CardScene
        
        this.cameras.main.flash(500, 255, 0, 0);
    }

    // Affichage Inventaire
    refreshInventory() {

        if (this.cardsContainer) {
            this.cardsContainer.each((child) => {
                // Récupérer et détruire les badges stockés
                const badge = child.getData('badge');
                const badgeText = child.getData('badgeText');
                if (badge) badge.destroy();
                if (badgeText) badgeText.destroy();
            });
        }
        
        this.cardsContainer.removeAll(true);

        const inventory = GameState.inventory;

        // Pagination
        const totalPages = Math.ceil(inventory.length / this.itemsPerPage);
        if (this.currentPage >= totalPages && totalPages > 0)
            this.currentPage = totalPages - 1;

        const startIndex = this.currentPage * this.itemsPerPage;
        const cardsOnPage = inventory.slice(
            startIndex,
            startIndex + this.itemsPerPage,
        );

        const gap = 250;
        const itemsPerLine = this.itemsPerLine; // = 5

        const gridWidth = (itemsPerLine - 1) * gap;
        const gridHeight = gap; // 2 lignes max → 1 gap entre les lignes

        const startX = (this.scale.width / 2) - gridWidth / 2;
        const startY = (this.scale.height / 2) - gridHeight / 2;

        cardsOnPage.forEach((id, index) => {
            const col = index % itemsPerLine;                 // 0 → 4
            const row = Math.floor(index / itemsPerLine);     // change tous les 5

            const x = startX + col * gap;
            const y = startY + row * gap;

            // On vérifie l'état de la carte via GameState
            const isRevealed = GameState.revealedCards.includes(id);
            const isCompleted = GameState.completedCards.includes(id);

            // Si révélée, on affiche directement le devant, sinon le dos
            const initialTexture = isRevealed ? `devant_${id}` : `dos_${id}`;

            const sprite = this.add
                .sprite(x, y, initialTexture)
                .setInteractive();
            const scale = 210 / sprite.height;
            sprite.setScale(scale);
            

            // Si la carte est finie (ex: énigme résolue)
            if (isCompleted) {
                sprite.setTint(0x555555); // On grise
                sprite.disableInteractive(); // On empêche le clic
            } else {
                // Gestion du survol (Hover)
                sprite.on("pointerover", () => {
                    this.tweens.add({
                        targets: sprite,
                        scale: scale * 1.1,
                        y: y - 10,
                        duration: 100,
                    });
                    sprite.setTint(0xdddddd);
                    // Si elle n'est pas déjà révélée définitivement, on montre le devant au survol
                    if (!isRevealed) {
                        sprite.setTexture(`devant_${id}`);
                    }
                    // Création du badge numéroté
                    const badgeSize = 30;
                    const badge = this.add.graphics();
                    badge.fillStyle(0x000000, 0.8);
                    badge.fillRoundedRect(
                        sprite.x + sprite.displayWidth / 2 - badgeSize / 2,
                        sprite.y - sprite.displayHeight / 2 - badgeSize / 2,
                        badgeSize,
                        badgeSize,
                        5
                    );
                    const badgeText = this.add.text(
                        sprite.x + sprite.displayWidth / 2,
                        sprite.y - sprite.displayHeight / 2,
                        id.toString(), // ou le numéro que vous souhaitez afficher
                        {
                            fontSize: '16px',
                            color: '#ffffff',
                            fontStyle: 'bold'
                        }
                    ).setOrigin(0.5);
                    // Stockage pour suppression ultérieure
                    sprite.setData('badge', badge);
                    sprite.setData('badgeText', badgeText);
                });

                sprite.on("pointerout", () => {
                    this.tweens.add({
                        targets: sprite,
                        scale: scale,
                        y: y,
                        duration: 100,
                    });
                    sprite.clearTint();
                    // Si elle n'est pas révélée définitivement, on remet le dos quand la souris part
                    if (!isRevealed) {
                        sprite.setTexture(`dos_${id}`);
                    }
                    // Suppression du badge
                    const badge = sprite.getData('badge');
                    const badgeText = sprite.getData('badgeText');
                    if (badge) badge.destroy();
                    if (badgeText) badgeText.destroy();
                });

                // CLIC : On ouvre la scène Carte
                sprite.on("pointerdown", () => this.openCardScene(id));
            }

            this.cardsContainer.add(sprite);
        });

        this.createPaginationControls(totalPages);
    }

    createPaginationControls(totalPages) {
        const yPos = this.scale.height / 2;
        // Bouton Précédent
        if (this.currentPage > 0) {
            const prevBtn = this.add
                .text(50, yPos, "<", {
                    font: "bold 60px Arial",
                    color: "#00ff00",
                    backgroundColor: "#00000088",
                    padding: 10,
                })
                .setInteractive()
                .setOrigin(0.5)
                .on("pointerdown", () => {
                    this.currentPage--;
                    this.refreshInventory();
                });
            this.cardsContainer.add(prevBtn);
        }
        // Bouton Suivant
        if (this.currentPage < totalPages - 1) {
            const nextBtn = this.add
                .text(this.scale.width - 50, yPos, ">", {
                    font: "bold 60px Arial",
                    color: "#00ff00",
                    backgroundColor: "#00000088",
                    padding: 10,
                })
                .setInteractive()
                .setOrigin(0.5)
                .on("pointerdown", () => {
                    this.currentPage++;
                    this.refreshInventory();
                });
            this.cardsContainer.add(nextBtn);
        }
    }

    // Notes
    createNotebook() {
        if (document.getElementById("notebook-btn")) return;

        // Bouton HTML
        const btn = document.createElement("button");
        btn.id = "notebook-btn";
        btn.innerHTML = "📒 NOTES";
        document.body.appendChild(btn);

        // Container HTML
        const container = document.createElement("div");
        container.id = "notebook-container";
        container.innerHTML = `
            <h3 style="margin:0 0 10px 0; text-align:center; color:#5d4037; border-bottom:1px solid #5d4037;">Enquête</h3>
            <textarea id="notebook-area" placeholder="- Code porte ?"></textarea>
            <div style="text-align:right; margin-top:5px;">
                <button onclick="document.getElementById('notebook-container').style.display='none'" style="cursor:pointer; padding:5px;">Fermer</button>
            </div>
        `;
        document.body.appendChild(container);

        // Toggle
        btn.onclick = () => {
            const el = document.getElementById("notebook-container");
            el.style.display = el.style.display === "block" ? "none" : "block";
        };
    }

    // OUVERTURE SCENE CARTE
    openCardScene(id) {
        UISearchManager.destroy();
        this.scene.launch("CardScene", { cardId: id });
    }
    
    Onresume(){
        UISearchManager.destroy();
        UISearchManager.create(this, this.scene.get("CardScene"), 1);
        // Cache UI
        const searchUI = document.getElementById("ui-search-container");
        if (searchUI) searchUI.style.display = "none";
    }
}