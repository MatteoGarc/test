import { Scene } from "phaser";
import { GameData } from "../GameData";
import { GameState } from "../GameState";
import {Game} from "./Game.js";
import CryptoJS from "crypto-js";
import { UISearchManager } from "./UISearchManager";
import { EventBus } from "../EventBus"; 
import { Network } from "../Network"; 

export class CardScene extends Scene {
    constructor() {
        super("CardScene");
        this.currentId = null;
        this.isFlipped = false;
        
        // Gestion erreurs
        this.errorCount = 0;
    }

    init(data) {
        this.currentId = data.cardId;
        // RESET des erreurs à chaque ouverture de carte
        this.errorCount = 0; 
    }

    create() {

        const gameScene = this.scene.get("Game");
        UISearchManager.create(gameScene, this);
        
        // Fond sombre
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.95,
        ).setInteractive();

        // --- AJOUT CHRONO VISIBLE SUR LA CARTE ---
        const timerBg = this.add.rectangle(this.scale.width - 400, 40, 150, 50, 0x000000, 0.7);
        this.timerText = this.add.text(this.scale.width - 400, 40, "--:--", {
            font: "bold 32px Arial", color: "#ff0000",
        }).setOrigin(0.5);

        // Ecoute du timer global
        EventBus.on('timer-tick', (timeString) => {
            console.log("timer activé");
            if(this.timerText && this.timerText.active) {
                this.timerText.setText(timeString);
            }
        });

        const cardData = GameData.cards[this.currentId] || { name: "Carte inconnue" };

        this.cardSprite = this.add.sprite(
            this.scale.width / 2,
            this.scale.height / 2,
            "",
        );

        // Si déjà révélée, on commence face visible
        if (GameState.revealedCards.includes(this.currentId)) {
            this.isFlipped = true;
            this.cardSprite.setTexture(`devant_${this.currentId}`);
        } else {
            this.isFlipped = false;
            this.cardSprite.setTexture(`dos_${this.currentId}`);
        }

        // Textes et Boutons
        const closeBtnText = this.add
            .text(this.scale.width - 80, 50, "FERMER X", {
                font: "bold 20px Arial",
                color: "#ffffff",
                backgroundColor: "#cc0000",
                padding: 15,
            })
            .setOrigin(0.5)
            .setInteractive()
            .on("pointerdown", () => this.closeScene());

        this.descText = this.add
            .text(this.scale.width / 2, this.scale.height - 120, 
                "", 
                {
                font: "24px Arial",
                color: "#fff",
                align: "center",
                backgroundColor: "#000000aa",
                padding: 5,
            })
            .setOrigin(0.5);

        // Mise à jour du texte initial (avec indice si dispo)
        this.updateCardText();

        this.actionBtn = this.add
            .text(
                this.scale.width / 2,
                this.scale.height - 180,
                "ENTRER CODE",
                {
                    font: "bold 28px Arial",
                    color: "#ffffff",
                    backgroundColor: "#ff0000",
                    padding: 10,
                },
            )
            .setOrigin(0.5)
            .setInteractive()
            .setVisible(false);

        // Init
        this.adjustZoomScale();

        // Système de notification locale (pour cette scène)
        this.createLocalNotificationSystem();
        
        //On flip que si elle est face caché
        if (!this.isFlipped) {
            this.flipCard();
        }

        // Puzzle T9 (Téléphone)
        if (cardData.puzzleType === "t9") {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: "Power2",
            });
            this.renderPhonePuzzle();
        }

        // Puzzle Cadenas (Padlock)
        if (cardData.puzzleType === "padlock") {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: "Power2",
            });
            this.renderPadlockPuzzle();
        }

        // Puzzle Clavier Numérique (Unité Centrale)
        if (cardData.puzzleType === "numpad") {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: "Power2",
            });
            this.renderNumpadPuzzle();
        }

        if(cardData.puzzleType === "endcode") {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: "Power2",
            });
            this.renderEndCodePuzzle();
        }

        // Puzzle César
        if(cardData.puzzleType === "cesar") {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: "Power2",
            });
            this.renderCaesarPuzzle();
        }

        // Puzzle pictogramme
        if(cardData.puzzleType === "pictogram") {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: 'Power2'
            });
            this.renderBookPagePuzzle();
        }
        
        // Puzzle Vigenere
        if(cardData.puzzleType === "Vigenere"){
            
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: 'Power2'
            });
            this.renderVigenerePuzzle();            
            
        }
        
        // Puzzle XOR
        if(cardData.puzzleType === "cadenasXOR"){

            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: 'Power2'
            });
            this.renderXORPuzzle();

        }

        // Puzzle SHA256
        if(cardData.puzzleType === "tablette"){

            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: 'Power2'
            });
            this.renderSHA256Puzzle();

        }
        
        if(cardData.puzzleType === "superpo"){
            this.superposition();
        }

        // Puzzle password (clavier numérique 2)
        if(cardData.puzzleType === "password") {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: 'Power2'
            });
            this.renderNumpadPuzzle();
        }
    }

    closeScene() {
        // Nettoyage HTML
        const inputDiv = document.getElementById("game-input-div");
        if (inputDiv) inputDiv.style.display = "none";
        
        // On supprime tous les puzzles HTML potentiels
        const puzzleDiv = document.getElementById("puzzle-container");
        if (puzzleDiv) puzzleDiv.remove();

        UISearchManager.destroy();
        // On reprend le jeu
        const gameScene = this.scene.get("Game");
        gameScene.Onresume();

        // On arrête d'écouter le timer pour cette instance
        EventBus.off('timer-tick');

        // On signale au Game de se rafraichir (et de cacher l'indice si résolu)
        EventBus.emit('request-refresh');

        this.scene.stop();
    }

    // --- MISE A JOUR TEXTE + INDICE ---
    updateCardText() {
        const data = GameData.cards[this.currentId];
        let content = this.isFlipped ? (data.text || "") : data.name;

        // Si l'indice est connu, on l'affiche en jaune
        if (data.hint && GameState.unlockedHints.includes(data.hint)) {
            content += `\n\n💡 INDICE : ${data.hint}`;
            this.descText.setColor('#ffff00');
        } else {
            this.descText.setColor('#ffffff');
        }
        this.descText.setText(content);
    }

    // --- NOTIFICATIONS LOCALES ---
    createLocalNotificationSystem() {
        this.localNotifContainer = this.add.container(this.scale.width / 2, -100).setDepth(3000);
        this.localNotifBg = this.add.rectangle(0, 0, 500, 70, 0x000000, 0.9).setStrokeStyle(4, 0xff0000);
        this.localNotifText = this.add.text(0, 0, "", { font: "bold 20px Arial", color: "#fff" }).setOrigin(0.5);
        this.localNotifContainer.add([this.localNotifBg, this.localNotifText]);
    }

    showLocalNotification(text, type = 'error') {
        let color = 0xc62828; // Rouge par défaut
        if (type === 'success') color = 0x2e7d32;
        if (type === 'warning') color = 0xff8f00;

        this.localNotifBg.setStrokeStyle(4, type === 'success' ? 0x00ff00 : (type === 'warning' ? 0xffff00 : 0xff0000));
        this.localNotifText.setText(text);

        this.tweens.killTweensOf(this.localNotifContainer);
        this.localNotifContainer.y = -100;
        this.tweens.chain({
            targets: this.localNotifContainer,
            tweens: [
                { y: 80, duration: 300, ease: "Back.out" },
                { delay: 2000, duration: 0 },
                { y: -100, duration: 300, ease: "Back.in" }
            ]
        });
    }

    flipCard() {
        this.tweens.add({
            targets: this.cardSprite,
            scaleX: 0,
            duration: 300,
            onComplete: () => {
                this.isFlipped = !this.isFlipped;
                this.cardSprite.setTexture(this.isFlipped ? `devant_${this.currentId}` : `dos_${this.currentId}`);

                if (this.isFlipped && !GameState.revealedCards.includes(this.currentId)) {
                    GameState.revealedCards.push(this.currentId);
                }

                this.updateCardText(); // Mise à jour texte + indice

                this.adjustZoomScale();
                this.tweens.add({
                    targets: this.cardSprite,
                    scaleX: this.cardSprite.scaleY,
                    duration: 300,
                });
            },
        });
    }

    adjustZoomScale() {
        // Demi-écran si puzzle, sinon plein écran
        const isPuzzle = (['t9', 'padlock', 'numpad', 'cesar', 'pictogram', 'endcode', 'password'].includes(GameData.cards[this.currentId].puzzleType));
        
        const availableWidth = isPuzzle
            ? this.scale.width / 2 - 50
            : this.scale.width - 100;

        const availableHeight = this.scale.height - 250;
        const scale = Math.min(
            availableWidth / this.cardSprite.width,
            availableHeight / this.cardSprite.height,
            1.2,
        );
        this.cardSprite.setScale(scale);
    }

    triggerMachine() {
        const data = GameData.cards[this.currentId];
        const inputDiv = document.getElementById("game-input-div");
        const field = document.getElementById("game-input-field");

        if (inputDiv) {
            document.getElementById("game-input-prompt").innerText = data.prompt;
            field.value = "";
            inputDiv.style.display = "block";
            field.focus();

            window.validateCode = () => {
                const val = field.value.toUpperCase().trim();

                if (val === data.code) {
                    if (GameState.inventory.includes(data.rewards[0])) {
                        this.showLocalNotification("Déjà ouvert !", "warning");
                        inputDiv.style.display = "none";
                        return;
                    }

                    inputDiv.style.display = "none";
                    
                    data.rewards.forEach((r) => {
                        if (!GameState.inventory.includes(r)) {
                            GameState.inventory.push(r);
                        }
                    });

                    if (data.linkedIds) {
                        GameState.completedCards.push(...data.linkedIds);
                    } else {
                        GameState.completedCards.push(this.currentId);
                    }

                    // --- ENVOI PROGRESSION (Machine) ---
                    if (data.milestone) {
                        const gameScene = this.scene.get("Game"); 
                        Network.sendAction('progress', { 
                            player: Network.playerName, 
                            message: data.milestone,
                            time: gameScene ? gameScene.initialTime : 0 
                        });
                    }
                    // -----------------------------------

                    // Notification succès globale
                    EventBus.emit('show-notification', { text: "CODE VALIDE !", type: "success" });
                    this.closeScene();
                }
                else if (GameData.penalties[val]) {
                    // Pénalité via EventBus
                    EventBus.emit('apply-penalty', 5);
                    this.showLocalNotification("PIÈGE ! -5 minutes !", "error");
                }
                else {
                    // Pénalité via EventBus
                    EventBus.emit('apply-penalty', 5);
                    this.showLocalNotification("Code Incorrect (-5 min)", "error");
                }
            };
        }
    }

    // Gestion centralisée de la validation
    handlePuzzleSubmission(codeEntered) {
        const targetData = GameData.cards[this.currentId];

        if (codeEntered === targetData.solution) {
            if (GameState.inventory.includes(targetData.rewards[0])) {
                this.showLocalNotification("Déjà déverrouillé !", "warning");
                return;
            }

            targetData.rewards.forEach((r) => {
                if (!GameState.inventory.includes(r)) GameState.inventory.push(r);
            });

            if (targetData.linkedIds) {
                GameState.completedCards.push(...targetData.linkedIds);
            }

            // SUPPRESSION DE L'INDICE SI LA CARTE EST RESOLUE
            if (targetData.hint) {
                GameState.unlockedHints = GameState.unlockedHints.filter(h => h !== targetData.hint);
            }

            // --- ENVOI PROGRESSION (Puzzle) ---
            if (targetData.milestone) {
                const gameScene = this.scene.get("Game");
                Network.sendAction('progress', { 
                    player: Network.playerName, 
                    message: targetData.milestone,
                    time: gameScene ? gameScene.initialTime : 0 
                });
            }
            // ----------------------------------

            // Notification succès globale
            EventBus.emit('show-notification', { text: targetData.successMessage, type: "success" });
            this.closeScene();
        } else {
            this.errorCount++;
            
            // 1. APPLIQUER PÉNALITÉ VIA EVENTBUS
            EventBus.emit('apply-penalty', 5);

            // Effet visuel d'erreur T9
            if (document.getElementById('phone-display')) {
                const d = document.getElementById('phone-display');
                d.innerText = "ERR";
                setTimeout(() => d.innerText = "", 1000);
            }

            // Effet visuel Cadenas
            const digits = document.querySelectorAll('.digit-display');
            if (digits.length > 0) {
                digits.forEach(d => d.style.color = 'red');
                setTimeout(() => digits.forEach(d => d.style.color = 'black'), 1000);
            }

            // Effet visuel d'erreur César
            const cesarLetter = document.querySelectorAll('.caesar-letter');
            if (cesarLetter.length > 0) {
                cesarLetter.forEach(d => d.style.color = 'red');
                setTimeout(() => cesarLetter.forEach(d => d.style.color = 'black'), 1000);
            }

            // Effet visuel Numpad
            if (document.getElementById('numpad-display')) {
                const d = document.getElementById('numpad-display');
                d.style.color = 'red';
                setTimeout(() => { d.innerText = ""; d.style.color = '#00e676'; }, 1000);
            }

            // 2. GESTION DES INDICES
            if (this.errorCount >= 3) {
                const isNew = GameState.addHint(targetData.hint);
                
                if (targetData.hint) {
                    this.showLocalNotification("NOUVEL INDICE DÉBLOQUÉ !", "warning");
                    this.updateCardText(); // Affiche l'indice immédiatement
                } else {
                    this.showLocalNotification("Pas d'indice...", "warning");
                }
            } else {
                this.showLocalNotification(`Faux... (-5 min) ${this.errorCount}/3`, "error");
            }
        }
    }

    renderPhonePuzzle() {
        const div = document.createElement("div");
        div.id = "puzzle-container";
        div.style.display = "block";

        div.innerHTML = `
            <div class="phone-interface">
                <div id="phone-display" class="phone-screen"></div>
                <div class="phone-grid">
                    <button class="phone-btn" data-k="1">1<span>&nbsp;</span></button>
                    <button class="phone-btn" data-k="2">2<span>ABC</span></button>
                    <button class="phone-btn" data-k="3">3<span>DEF</span></button>
                    <button class="phone-btn" data-k="4">4<span>GHI</span></button>
                    <button class="phone-btn" data-k="5">5<span>JKL</span></button>
                    <button class="phone-btn" data-k="6">6<span>MNO</span></button>
                    <button class="phone-btn" data-k="7">7<span>PQRS</span></button>
                    <button class="phone-btn" data-k="8">8<span>TUV</span></button>
                    <button class="phone-btn" data-k="9">9<span>WXYZ</span></button>
                    <button class="phone-btn" data-k="*">*<span></span></button>
                    <button class="phone-btn" data-k="0">0<span>+</span></button>
                    <button class="phone-btn" data-k="#">#<span></span></button>
                    
                    <button id="btn-validate-phone" class="phone-btn phone-validate">APPELER 📞</button>
                    <button id="btn-clear-phone" class="phone-btn" style="background:#800; grid-column:span 3; margin-top:5px;">EFFACER</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        this.setupKeypadLogic("phone-display", "phone-btn", "btn-clear-phone", "btn-validate-phone");
    }

    renderPadlockPuzzle() {
        const div = document.createElement("div");
        div.id = "puzzle-container";
        div.style.display = "block";

        // On génère 4 colonnes (0818 = 4 chiffres)
        div.innerHTML = `
            <div class="padlock-interface">
                <div class="padlock-row">
                    <div class="digit-column">
                        <button class="arrow-btn up" data-idx="0">▲</button>
                        <div class="digit-display" id="digit-0">0</div>
                        <button class="arrow-btn down" data-idx="0">▼</button>
                    </div>
                    <div class="digit-column">
                        <button class="arrow-btn up" data-idx="1">▲</button>
                        <div class="digit-display" id="digit-1">0</div>
                        <button class="arrow-btn down" data-idx="1">▼</button>
                    </div>
                    <div class="digit-column">
                        <button class="arrow-btn up" data-idx="2">▲</button>
                        <div class="digit-display" id="digit-2">0</div>
                        <button class="arrow-btn down" data-idx="2">▼</button>
                    </div>
                    <div class="digit-column">
                        <button class="arrow-btn up" data-idx="3">▲</button>
                        <div class="digit-display" id="digit-3">0</div>
                        <button class="arrow-btn down" data-idx="3">▼</button>
                    </div>
                </div>
                <button id="btn-validate-padlock" class="padlock-validate">OUVRIR 🔓</button>
            </div>
        `;
        document.body.appendChild(div);

        // État interne du cadenas
        const currentCode = [0, 0, 0, 0];

        // Gestion des clics sur les flèches
        document.querySelectorAll('.arrow-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                const isUp = btn.classList.contains('up');
                
                if (isUp) {
                    currentCode[idx] = (currentCode[idx] + 1) % 10;
                } else {
                    currentCode[idx] = (currentCode[idx] - 1 + 10) % 10;
                }
                
                // Update affichage
                document.getElementById(`digit-${idx}`).innerText = currentCode[idx];
            };
        });

        // Validation
        document.getElementById('btn-validate-padlock').onclick = () => {
            const codeEntered = currentCode.join('');
            this.handlePuzzleSubmission(codeEntered);
        };
    }

    // Clavier numérique (Carte 50)
    renderNumpadPuzzle() {
        const div = document.createElement("div");
        div.id = "puzzle-container";
        div.style.display = "block";

        div.innerHTML = `
            <div class="numpad-interface">
                <div id="numpad-display" class="numpad-screen"></div>
                <div class="numpad-grid">
                    <button class="numpad-btn" data-k="1">1</button>
                    <button class="numpad-btn" data-k="2">2</button>
                    <button class="numpad-btn" data-k="3">3</button>
                    <button class="numpad-btn" data-k="4">4</button>
                    <button class="numpad-btn" data-k="5">5</button>
                    <button class="numpad-btn" data-k="6">6</button>
                    <button class="numpad-btn" data-k="7">7</button>
                    <button class="numpad-btn" data-k="8">8</button>
                    <button class="numpad-btn" data-k="9">9</button>
                    <button class="numpad-btn" id="btn-clear-numpad" data-k="C" style="background:#c62828;">DEL</button>
                    <button class="numpad-btn" data-k="0">0</button>
                    <button class="numpad-btn" id="btn-validate-numpad" data-k="OK" style="background:#2e7d32;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        this.setupKeypadLogic("numpad-display", "numpad-btn", "btn-clear-numpad", "btn-validate-numpad");
    }

    renderEndCodePuzzle() {
        const div = document.createElement("div");
        div.id = "puzzle-container";
        // Z-Index élevé pour passer au-dessus du Canvas
        div.style = `
            position: absolute;
            top: 50%;
            left: 70%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            gap: 15px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 10px;
            text-align: center;
            z-index: 10000; 
            font-family: 'Courier New', monospace;
        `;

        div.innerHTML = `
            <label style="color: #fff; font-weight: bold; font-size: 20px; margin-bottom: 10px;">
                > CODE D'ACCÈS REQUIS
            </label>
            <input type="text" id="final-code-input" 
                style="padding: 10px; font-size: 24px; text-transform: uppercase; text-align: center; width: 250px; font-weight: bold; background-color: #111; color: #00ff00; border: 1px solid #fff; outline: none;" 
                placeholder="_ _ _ _ _ _ _ _"
            >
            <button id="final-validate-btn" 
                style="padding: 12px; font-size: 18px; cursor: pointer; background: #28a745; color: white; border: none; font-weight: bold; border-radius: 5px; margin-top: 10px;">
                VALIDER L'INFILTRATION
            </button>
        `;

        document.body.appendChild(div);

        const input = document.getElementById("final-code-input");
        const btn = document.getElementById("final-validate-btn");
        setTimeout(() => input.focus(), 100);

        const validate = () => {
            const val = input.value.toUpperCase().trim();
            const correctCode = GameData.cards['83'].code; 
            const cardData = GameData.cards['83']; 

            if (val === correctCode) {
                if (cardData.milestone) {
                    const gameScene = this.scene.get("Game");
                    Network.sendAction('progress', { 
                        player: Network.playerName, 
                        message: cardData.milestone,
                        time: gameScene ? gameScene.initialTime : 0 
                    });
                }

                EventBus.emit('show-notification', { text: "CODE CORRECT ! ENVOI EN COURS...", type: "success" });
                if (!GameState.inventory.includes('WIN')) GameState.inventory.push('WIN');
                this.closeScene();
            } else {
                EventBus.emit('apply-penalty', 5);
                this.showLocalNotification("CODE INCORRECT (-5 min)", "error");
                input.style.borderColor = "red";
                input.value = "";
                setTimeout(() => input.style.borderColor = "#fff", 500);
            }
        };

        btn.onclick = validate;
        input.addEventListener("keypress", (e) => { if (e.key === "Enter") validate(); });
    }

    setupKeypadLogic(displayId, btnClass, clearId, validateId) {
        const display = document.getElementById(displayId);
        const keys = document.querySelectorAll(`.${btnClass}[data-k]`);

        keys.forEach((btn) => {
            btn.onclick = () => {
                const k = btn.getAttribute("data-k");
                if(k === 'C' || k === 'OK') return; 
                if (display.innerText.length < 12) display.innerText += k;
            };
        });

        document.getElementById(clearId).onclick = () => { display.innerText = ""; };

        document.getElementById(validateId).onclick = () => {
            this.handlePuzzleSubmission(display.innerText);
        };
    }

    renderCaesarPuzzle() {
        const div = document.createElement('div');
        div.id = 'puzzle-container';
        div.style.display = 'block';

        const card = GameData.cards[this.currentId];
        const letters = card.caesarLetters;
        const userShifts = card.userShifts;
        
        let html = `
            <div class="caesar-puzzle">
                <div class="caesar-letters">
        `;
        
        letters.forEach((letter, index) => {
            const shiftedLetter = this.shiftLetter(letter, userShifts[index]);
            html += `
                <div class="caesar-letter-container">
                    <button class="caesar-btn caesar-up" data-index="${index}">▲</button>
                    <div class="caesar-letter">${shiftedLetter}</div>
                    <button class="caesar-btn caesar-down" data-index="${index}">▼</button>
                </div>
            `;
        });
        
        html += `
                </div>
                <button id="verify-caesar-btn">Vérifier</button>
            </div>
        `;
        div.innerHTML = html;
        document.body.appendChild(div);

        // Event listeners pour le puzzle César
        document.querySelectorAll('.caesar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const isDown = e.target.classList.contains('caesar-down');
                this.handleCaesarShift(index, isDown ? 1 : -1);
            });
        });

        document.getElementById('verify-caesar-btn').onclick = () => {            
            const letters = card.caesarLetters;
            const userShifts = card.userShifts;
            
            const decodedWord = letters.map((letter, index) => 
                this.shiftLetter(letter, userShifts[index])
            ).join('');

            this.handlePuzzleSubmission(decodedWord);
        }
    }

    shiftLetter(letter, shift) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const index = alphabet.indexOf(letter.toUpperCase());
        if (index === -1) return letter;
        const newIndex = (index + shift + 26) % 26;
        return alphabet[newIndex];
    }

    updateCaesarLetter(index) {
        const card = GameData.cards[this.currentId];
        if (!card) return;
        
        const letters = card.caesarLetters;
        const userShifts = card.userShifts;
        
        // Calculer la lettre décalée
        const shiftedLetter = this.shiftLetter(letters[index], userShifts[index]);
        
        // Mettre à jour l'affichage
        const letterContainers = document.querySelectorAll('.caesar-letter');
        if (letterContainers[index]) {
            letterContainers[index].textContent = shiftedLetter;
        }
    }

    handleCaesarShift(index, direction) {
        const card = GameData.cards[this.currentId];
        if (!card) return;
        
        card.userShifts[index] = (card.userShifts[index] + direction + 26) % 26;

        this.updateCaesarLetter(index);
    }

    renderBookPagePuzzle() {
        const div = document.createElement('div');
        div.id = 'puzzle-container';
        div.style.display = 'block';

        const card = GameData.cards[this.currentId];
        const userAnswer = card.userPageAnswer || '';
        
        let html = `
            <div class="book-puzzle">
                <div class="book-container">
                    <div class="book-spine"></div>
                    <div class="book-cover">
                        <div class="book-decoration"></div>
                    </div>
                    <div class="book-pages">
                        <div class="book-page-input-container">
                            <label for="page-input">Page n°</label>
                            <input 
                                type="number" 
                                id="page-input" 
                                class="book-page-input" 
                                value="${userAnswer}"
                                placeholder="?"
                                min="1"
                                max="999"
                            >
                        </div>
                        <button id="verify-book-btn">Aller à la page</button>
                        <div class="book-page-number">— ❋ —</div>
                    </div>
                </div>
            </div>
        `;
        div.innerHTML = html;
        document.body.appendChild(div);

        document.getElementById('verify-book-btn').onclick = () => {
            const pageInput = document.getElementById('page-input');
            this.handlePuzzleSubmission(pageInput.value);
        };
    }

    superposition() {
        // Vérifier si le joueur possède la carte 91 (le calque à superposer)
        if (GameState.inventory.includes('91')) {
            this.tweens.add({
                targets: this.cardSprite,
                x: this.scale.width * 0.35,
                duration: 500,
                ease: 'Power2'
            });
            if (this.superpositionBtn) {
                this.superpositionBtn.destroy();
            }
            // Créer le bouton de superposition s'il n'existe pas déjà
            this.superpositionBtn = this.add.text(
                this.scale.width - (this.scale.width/4),
                this.scale.height/2,
                "SUPERPOSER",
                {
                    font: "bold 16px Arial",
                    color: "#ffffff",
                    backgroundColor: "#ff8f00",
                    padding: { x: 10, y: 8 }
                }
            )
                .setOrigin(0.5)
                .setInteractive()
                .on("pointerdown", () => this.applySuperposition());

            // Effet hover
            this.superpositionBtn.on("pointerover", () => {
                this.superpositionBtn.setBackgroundColor("#ff8f00");
                this.superpositionBtn.setScale(1.05);
            });

            this.superpositionBtn.on("pointerout", () => {
                this.superpositionBtn.setBackgroundColor("#ff6f00");
                this.superpositionBtn.setScale(1);
            });
        }
    }

    applySuperposition() {
        if (!this.superposedSprite) {
            // Créer le sprite de la carte 91 en superposition
            this.superposedSprite = this.add.sprite(
                this.cardSprite.x,
                this.cardSprite.y,
                `devant_91`
            );

            // Appliquer la même échelle que la carte principale
            this.superposedSprite.setScale(this.cardSprite.scaleX, this.cardSprite.scaleY);

            // Rendre semi-transparent pour voir la carte en dessous
            this.superposedSprite.setAlpha(0.99);

            // Placer au-dessus de la carte principale
            this.superposedSprite.setDepth(this.cardSprite.depth + 1);

            // Changer le texte du bouton
            this.superpositionBtn.setText("RETIRER");
            this.superpositionBtn.setBackgroundColor("#c62828");
        } else {
            // Retirer la superposition
            this.superposedSprite.destroy();
            this.superposedSprite = null;

            // Restaurer le bouton
            this.superpositionBtn.setText("SUPERPOSER");
            this.superpositionBtn.setBackgroundColor("#ff6f00");
        }
    }
    
    // Puzzle Vigenere
    renderVigenerePuzzle() {
        console.log("render vigenere")
        const div = document.createElement("div");
        div.id = "puzzle-container";
        div.style.display = "block";

        const cardData = GameData.cards[this.currentId];
        const encryptedText = "RHNLSHZCQ"; // Le texte de la carte 51
        const length = encryptedText.length;

        // Structure HTML du puzzle
        let html = `
        <div class="vigenere-interface">
            <h2 style="color: #fff; margin-bottom: 20px; font-family: Arial;">DÉCODEUR VIGENÈRE</h2>
            <div class="vigenere-grid" style="display: flex; gap: 5px; justify-content: center; margin-bottom: 20px;">
    `;

        // Création des 9 colonnes (Lettre chiffrée -> Input -> Clé trouvée)
        for (let i = 0; i < length; i++) {
            html += `
            <div class="vigenere-column" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <div class="cipher-char" style="color: #aaa; font-weight: bold; font-size: 20px;">${encryptedText[i]}</div>
                <input type="text" class="vigenere-input" data-index="${i}" maxlength="1" 
                    style="width: 40px; height: 40px; text-align: center; font-size: 24px; text-transform: uppercase; border-radius: 5px; border: 2px solid #555;">
                <div class="key-char" id="key-char-${i}" style="color: #00ff00; font-weight: bold; font-size: 18px; min-height: 20px;">?</div>
            </div>
        `;
        }

        html += `
            </div>
            <div id="full-key-display" style="color: #ffd700; margin-bottom: 20px; font-style: italic;">Clé suggérée : ...</div>
            <button id="btn-validate-vigenere" class="phone-btn phone-validate" style="width: 200px; margin: 0 auto;">VÉRIFIER</button>
        </div>
    `;

        div.innerHTML = html;
        document.body.appendChild(div);

        const inputs = document.querySelectorAll('.vigenere-input');
        const keyChars = [];

        // Logique de calcul de la clé en temps réel
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const val = e.target.value.toUpperCase();
                e.target.value = val;

                if (val && /^[A-Z]$/.test(val)) {
                    // Formule Vigenère : Clé = (TexteChiffré - TexteClair + 26) % 26
                    const cipherCode = encryptedText.charCodeAt(index) - 65;
                    const plainCode = val.charCodeAt(0) - 65;
                    const keyCode = (cipherCode - plainCode + 26) % 26;
                    const keyLetter = String.fromCharCode(keyCode + 65);

                    document.getElementById(`key-char-${index}`).innerText = keyLetter;

                    // Focus automatique vers le champ suivant
                    if (inputs[index + 1]) inputs[index + 1].focus();
                } else {
                    document.getElementById(`key-char-${index}`).innerText = "?";
                }

                // Mise à jour de la clé complète
                const fullKey = Array.from(document.querySelectorAll('.key-char'))
                    .map(el => el.innerText).join('');
                document.getElementById('full-key-display').innerText = `Clé suggérée : ${fullKey}`;
            });
        });

        // Validation finale
        document.getElementById('btn-validate-vigenere').onclick = () => {
            const result = Array.from(document.querySelectorAll('.key-char'))
                .map(el => el.innerText).join('');
            this.handlePuzzleSubmission(result);
        };
    }
    
    // Puzzle XOR
    renderXORPuzzle() {
        const div = document.createElement("div");
        div.id = "puzzle-container";
        div.style.display = "block";

        const encryptedData = [
            "01010011", "01001001",
            "01000001", "01001101",
            "01001111", "01001001",
            "01010011"
        ]; // Valeurs binaires de la carte 19

        const length = 7; // SIAMOIS fait 7 lettres

        let html = `
        <div class="xor-interface" style="color: white; font-family: 'Courier New', monospace; width: 500px;">
            <h2 style="text-align: center; color: #00ff00;">DÉCODEUR BINAIRE XOR</h2>
            
            <div class="xor-grid" style="display: flex; flex-direction: column; gap: 15px;">
    `;

        for (let i = 0; i < length; i++) {
            html += `
            <div class="xor-row" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 5px;">
                <div style="font-size: 12px; color: #ffd700;">#${i+1}</div>
                <div style="font-size: 16px; letter-spacing: 2px;">${encryptedData[i]}</div>
                <div style="font-weight: bold; color: #00ff00;">⊕</div>
                <input type="text" class="xor-input" data-index="${i}" maxlength="1" 
                    style="width: 45px; height: 45px; text-align: center; font-size: 24px; text-transform: uppercase; background: #222; color: #fff; border: 1px solid #555;">
            </div>
        `;
        }

        html += `
            </div>
            

            <button id="btn-validate-xor" class="phone-btn phone-validate" style="width: 100%; margin-top: 20px;">
                DÉVERROUILLER 🔓
            </button>
        </div>
    `;

        div.innerHTML = html;
        document.body.appendChild(div);

        const inputs = document.querySelectorAll('.xor-input');

        // Focus automatique
        inputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                if (input.value.length === 1 && inputs[index + 1]) {
                    inputs[index + 1].focus();
                }
            });
        });

        document.getElementById('btn-validate-xor').onclick = () => {
            const finalWord = Array.from(inputs).map(i => i.value.toUpperCase()).join('');
            this.handlePuzzleSubmission(finalWord);
        };
    }
    
    // Puzzle SHA256
    renderSHA256Puzzle() {
        const div = document.createElement("div");
        div.id = "puzzle-container";
        div.style.display = "block";

        const targetHash = "3992afa8b955ba299f489f87929d81add01366473274b8e09f97f69ba8a45bde";

        div.innerHTML = `
        <div class="sha-interface" style="color: white; font-family: 'Courier New', monospace; width: 500px; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; border: 2px solid #444;">
            <h2 style="text-align: center; color: #00e676;">DÉCRYPTEUR SHA-256</h2>
            <input type="text" id="sha-input" placeholder="Entrez un mot..." style="width: 100%; padding: 10px; background: #333; color: white;">
            <div id="sha-output" style="font-size: 11px; margin-top: 10px; color: #00e676; word-break: break-all;"></div>
            <button id="btn-validate-sha" class="phone-btn phone-validate" style="width: 100%; margin-top: 20px;">VALIDER</button>
        </div>
    `;
        document.body.appendChild(div);

        const input = document.getElementById('sha-input');
        const output = document.getElementById('sha-output');

        input.addEventListener('input', () => {
            // Utilisation de CryptoJS (Synchrone)
            const hash = CryptoJS.SHA256(input.value).toString();
            output.innerText = hash;
        });

        document.getElementById('btn-validate-sha').onclick = () => {
            this.handlePuzzleSubmission(input.value);
        };
    }
    
    // Gestion des notifications (Popups in-game)
    createNotificationSystemCardScene() {
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

    showNotificationCardScene(message, type = "info") {
        let color = 0x333333;
        let stroke = 0xffffff;

        // Choix couleur selon type
        if (type === "success") {
            color = 0x2e7d32;
            stroke = 0x00ff00;
        } else if (type === "error") {
            color = 0xc62828;
            stroke = 0xff0000;
        }

        this.notifBg.setFillStyle(color, 0.95).setStrokeStyle(4, stroke);
        this.notifText.setText(message);     

        // Animation d'apparition
        this.tweens.killTweensOf(this.notificationContainer);
        this.notificationContainer.y = -100;

        this.tweens.chain({
            targets: this.notificationContainer,
            tweens: [
                { y: 100, duration: 500, ease: "Back.out" }, // Descend
                { delay: 4000, duration: 0 }, // Reste
                { y: -100, duration: 500, ease: "Back.in" }, // Remonte
            ],
        });
    }
}