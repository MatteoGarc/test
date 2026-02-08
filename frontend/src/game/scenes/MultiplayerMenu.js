import { Scene } from "phaser";
import { Network } from "../Network";

export class MultiplayerMenu extends Scene {
    constructor() {
        super("MultiplayerMenu");
    }

    create() {
        const { width, height } = this.scale;

        // FOND : BUREAU SOMBRE 
        this.add.rectangle(0, 0, width, height, 0x1a1a1a).setOrigin(0);
        
        // Zone centrale : Une feuille de papier "Rapport"
        const paper = this.add.rectangle(width / 2, height / 2, 600, 500, 0xf5f5dc) // Beige papier
            .setStrokeStyle(1, 0xaaaaaa);
        
        // Ombre du papier
        this.add.rectangle(width / 2 + 10, height / 2 + 10, 600, 500, 0x000000, 0.3).setDepth(-1);

        // En-tête du rapport
        this.add.text(width / 2, height / 2 - 200, "ACCÈS AUX ARCHIVES", {
            fontFamily: "Courier New", fontSize: 32, color: "#000000",
            fontStyle: "bold",
            align: "center"
        }).setOrigin(0.5);

        // Ligne de séparation
        this.add.rectangle(width / 2, height / 2 - 160, 500, 2, 0x000000);


        // --- NOUVEAU : TITRE SECTION IDENTITÉ ---
        this.add.text(width / 2, height / 2 - 120, "IDENTIFICATION REQUISE :", {
            fontFamily: "Courier New", fontSize: 18, color: "#555555", fontStyle: "italic"
        }).setOrigin(0.5);

        // Interface HTML (Pseudo + Boutons + Code)
        this.createInputInterface();


        // --- RETOUR ---
        const btnBack = this.add.text(width / 2, height / 2 + 220, "RETOURNER AU BUREAU", {
            fontFamily: "Courier New", fontSize: 18, color: "#8d6e63", fontStyle: "underline"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnBack.on('pointerover', () => btnBack.setColor("#5d4037"));
        btnBack.on('pointerout', () => btnBack.setColor("#8d6e63"));
        btnBack.on('pointerdown', () => {
            this.clearInputInterface();
            this.scene.start('MainMenu');
        });
    }

    createInputInterface() {
        if (document.getElementById('multi-input-container')) return;

        const div = document.createElement('div');
        div.id = 'multi-input-container';
        // Style "Machine à écrire"
        div.style = `
            position: absolute; 
            top: 55%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            display: flex; 
            flex-direction: column;
            gap: 20px; 
            align-items: center;
            z-index: 100;
            font-family: 'Courier New', monospace;
        `;

        // Input : Fond papier, texte noir machine à écrire
        const inputStyle = `
            padding: 10px; 
            font-size: 20px; 
            text-align: center; 
            background: #fafafa; 
            color: #000000; 
            border: 2px dashed #555; 
            outline: none;
            letter-spacing: 2px;
            font-weight: bold;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
        `;

        // Bouton : Style tampon
        const btnStyle = `
            padding: 10px 20px; 
            font-size: 18px; 
            cursor: pointer; 
            background: #2c3e50; 
            color: #f5f5dc; 
            border: none; 
            border-radius: 2px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-transform: uppercase;
            box-shadow: 3px 3px 0px #1a252f;
            transition: transform 0.1s;
        `;

        div.innerHTML = `
            <input type="text" id="player-name-input" placeholder="NOM DE CODE" maxlength="12" style="${inputStyle} width: 250px; text-transform: none;">
            
            <div style="width: 100%; height: 1px; background: #aaa; margin: 5px 0;"></div>

            <button id="btn-create-room" style="${btnStyle} width: 100%; background: #27ae60; box-shadow: 3px 3px 0px #1e8449;">
                [ OUVRIR NOUVELLE ENQUÊTE ]
            </button>

            <div style="color: #555; font-size: 14px;">- OU REJOINDRE -</div>

            <div style="display: flex; gap: 10px;">
                <input type="text" id="room-code-input" placeholder="REF #" maxlength="4" style="${inputStyle} width: 100px; text-transform: uppercase;">
                <button id="btn-join-room" style="${btnStyle}">CONSULTER</button>
            </div>
        `;

        document.body.appendChild(div);

        // Effets boutons
        const addBtnEffect = (id) => {
            const btn = document.getElementById(id);
            btn.onmousedown = () => { btn.style.transform = "translate(2px, 2px)"; btn.style.boxShadow = "1px 1px 0px #000"; };
            btn.onmouseup = () => { btn.style.transform = "translate(0, 0)"; btn.style.boxShadow = "3px 3px 0px #000"; };
        };
        addBtnEffect('btn-create-room');
        addBtnEffect('btn-join-room');

        // Actions
        document.getElementById('btn-create-room').onclick = () => this.handleCreate();
        document.getElementById('btn-join-room').onclick = () => this.handleJoin();
    }

    clearInputInterface() {
        const el = document.getElementById('multi-input-container');
        if (el) el.remove();
    }

    async handleCreate() {
        const pseudoInput = document.getElementById('player-name-input');
        const pseudo = pseudoInput.value.trim();

        if (!pseudo) {
            this.shakeInput(pseudoInput);
            return;
        }

        try {
            this.clearInputInterface();
            // On envoie le pseudo lors de la création
            const code = await Network.createRoom(pseudo);
            this.scene.start('Lobby', { roomCode: code, isHost: true });
        } catch (e) {
            console.error(e);
            alert("Erreur connexion : " + e);
        }
    }

    handleJoin() {
        const pseudoInput = document.getElementById('player-name-input');
        const codeInput = document.getElementById('room-code-input');
        
        const pseudo = pseudoInput.value.trim();
        const code = codeInput.value.trim().toUpperCase();

        if (!pseudo) {
            this.shakeInput(pseudoInput);
            return;
        }

        if (code.length < 4) {
            this.shakeInput(codeInput);
            return;
        }

        // On envoie Code + Pseudo
        Network.joinRoom(code, pseudo)
            .then(() => {
                this.clearInputInterface();
                this.scene.start('Lobby', { roomCode: code, isHost: false });
            })
            .catch(err => {
                alert("Erreur Dossier : " + err);
                codeInput.value = "";
                codeInput.focus();
            });
    }

    shakeInput(element) {
        element.style.borderColor = "red";
        element.classList.add('shake'); // Si tu as une classe CSS shake, sinon juste rouge
        setTimeout(() => element.style.borderColor = "#555", 500);
    }
}