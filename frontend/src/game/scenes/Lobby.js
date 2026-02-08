import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Network } from "../Network"; // Import nécessaire pour lancer la game

export class Lobby extends Scene {
    constructor() {
        super("Lobby");
    }

    init(data) {
        this.roomCode = data.roomCode;
        this.isHost = data.isHost;
    }

    create() {
        const { width, height } = this.scale;

        //  TABLEAU DE LIÈGE 
        this.add.rectangle(0, 0, width, height, 0x8d6e63).setOrigin(0);
        
        // Texture de bruit pour imiter le liège
        const graphics = this.add.graphics();
        graphics.fillStyle(0x5d4037, 0.3);
        for(let i=0; i<3000; i++) {
            graphics.fillPoint(Math.random() * width, Math.random() * height, 2);
        }

        // Ombre interne (Vignette)
        const shadow = this.add.image(width/2, height/2, 'background'); 
        if(shadow) { shadow.setAlpha(0); }
        
        // Cadre en bois
        const frameThick = 20;
        this.add.rectangle(width/2, frameThick/2, width, frameThick, 0x3e2723); 
        this.add.rectangle(width/2, height-frameThick/2, width, frameThick, 0x3e2723); 
        this.add.rectangle(frameThick/2, height/2, frameThick, height, 0x3e2723); 
        this.add.rectangle(width-frameThick/2, height/2, frameThick, height, 0x3e2723); 


        //  TITRE DU TABLEAU 
        const titleBg = this.add.rectangle(width/2, 60, 400, 60, 0xf5f5dc).setStrokeStyle(1, 0x000000);
        this.add.text(width / 2, 60, "SALLE DE REUNION", {
            fontFamily: "Courier New", fontSize: "32px", color: "#000000", fontStyle: "bold"
        }).setOrigin(0.5);
        this.add.circle(width/2, 35, 8, 0xff0000).setStrokeStyle(1, 0x000000);

        //  BOUTON QUITTER (Haut Droit) 
        this.createExitButton(width, frameThick);


        //  AFFICHAGE DU CODE (Style POLAROID) 
        const polaroidGroup = this.add.container(width / 2, 220);
        
        const photoPaper = this.add.rectangle(0, 0, 220, 260, 0xffffff)
            .setStrokeStyle(1, 0xcccccc)
            .setRotation(-0.05); 
        
        const photoBlack = this.add.rectangle(0, -20, 180, 180, 0x111111)
            .setRotation(-0.05);

        const codeText = this.add.text(0, 90, this.roomCode, {
            fontFamily: "Arial", fontSize: "42px", color: "#cc0000", fontStyle: "bold"
        }).setOrigin(0.5).setRotation(-0.05);

        const labelKey = this.add.text(0, -20, "PREUVE #1", {
            fontFamily: "Courier New", fontSize: "14px", color: "#555555"
        }).setOrigin(0.5).setRotation(-0.05);

        const pin = this.add.circle(0, -110, 8, 0xffd700).setStrokeStyle(1, 0x000000); 

        polaroidGroup.add([photoPaper, photoBlack, codeText, labelKey, pin]);

        this.tweens.add({
            targets: polaroidGroup,
            angle: 2,
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });


        // (Liste Joueurs) 
        const listX = 150; 
        const listY = 300;
        
        // Feuille blanche lignée
        const sheet = this.add.rectangle(listX, listY, 240, 300, 0xffffff).setStrokeStyle(1, 0x999999);
        // Lignes bleues
        for(let i=0; i<8; i++) {
            this.add.line(0, 0, listX-110, listY-120 + (i*35), listX+110, listY-120 + (i*35), 0xaaccff).setLineWidth(2);
        }
        // Titre feuille
        this.add.text(listX, listY - 130, "AGENTS PRÉSENTS", { fontFamily: "Courier New", fontSize: "18px", color: "#000", fontStyle:"bold" }).setOrigin(0.5);
        // Punaise
        this.add.circle(listX, listY - 140, 6, 0x0000ff).setStrokeStyle(1, 0x000);

        // Conteneur pour les noms (on va le vider et le remplir dynamiquement)
        this.namesContainer = this.add.container(listX, listY - 95);

        // COMPTEUR JOUEURS 
        this.countText = this.add.text(width - 150, height - 100, "EFFECTIF: 1/5", {
            fontFamily: "Courier New", fontSize: "28px", color: "#fff", backgroundColor: "#00000088", padding: 10
        }).setOrigin(0.5);


        //  STATUT 
        const noteContainer = this.add.container(width/2, 450);
        const paperScrap = this.add.rectangle(0, 0, 500, 80, 0xfdf5e6).setStrokeStyle(1, 0xaaaaaa);
        this.statusText = this.add.text(0, 0, "En attente des autres détectives...", {
            fontFamily: "Courier New", fontSize: "20px", color: "#333333", fontStyle: "italic"
        }).setOrigin(0.5);
        noteContainer.add([paperScrap, this.statusText]);


        // BOUTON ACTION (Hôte) 
        if (this.isHost) {
            const btnContainer = this.add.container(width / 2, 600);
            
            const btnBg = this.add.rectangle(0, 0, 300, 70, 0x2e7d32, 0.9)
                .setStrokeStyle(2, 0x1b5e20)
                .setInteractive({ useHandCursor: true });
            
            const btnLabel = this.add.text(0, 0, "LANCER L'ENQUÊTE", {
                fontFamily: "Courier New", fontSize: "24px", color: "#ffffff", fontStyle: "bold"
            }).setOrigin(0.5);

            btnContainer.add([btnBg, btnLabel]);

            btnBg.on('pointerover', () => {
                btnContainer.setScale(1.05);
                btnBg.setFillStyle(0x388e3c); 
            });
            btnBg.on('pointerout', () => {
                btnContainer.setScale(1);
                btnBg.setFillStyle(0x2e7d32);
            });
            
            // --- ACTION LANCEMENT ---
            btnBg.on('pointerdown', () => {
                btnLabel.setText("INITIALISATION...");
                btnBg.disableInteractive();
                // On envoie le signal au serveur
                Network.sendStartGame();
            });

        } else {
            this.add.text(width / 2, 600, "( Le chef d'enquête va lancer le briefing )", {
                fontFamily: "Courier New", fontSize: "18px", color: "#ffffff",
                backgroundColor: "#00000088", padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
        }

        // EVENTS 
        
        // Joueur rejoint (Juste pour l'anim de la note)
        EventBus.on('player-joined', () => {
            this.statusText.setText("Un détective a rejoint l'équipe !");
            this.statusText.setColor("#2e7d32");
            this.tweens.add({
                targets: noteContainer,
                x: width/2 + 5,
                duration: 50,
                yoyo: true,
                repeat: 5
            });
        });

        // Joueur quitte
        EventBus.on('player-left', () => {
            this.statusText.setText("Un détective a quitté l'équipe...");
            this.statusText.setColor("#d32f2f"); 
            
            this.tweens.add({
                targets: this.statusText,
                alpha: { from: 0.5, to: 1 },
                duration: 200,
                yoyo: true,
                repeat: 1
            });
        });

        // Mise à jour de la liste des joueurs (Nom + Compteur)
        EventBus.on('update-room-players', (playersList) => {
            this.updatePlayerList(playersList);
        });

        // (Hôte et Client) écoute le signal de départ
        EventBus.on('game-started', () => {
            this.cleanEvents();
            this.scene.start('Briefing', { mode_solo: false });
        });

        // Écouteur fermeture de salle (Si l'hôte part)
        EventBus.on('room-closed', (reason) => {
            this.cleanEvents();
            alert(reason || "La mission a été annulée.");
            this.scene.start('MainMenu');
        });

        // --- CORRECTION SYNCHRO ---
        // Si la liste est déjà arrivée avant que la scène soit créée, on l'affiche tout de suite
        if (Network.players && Network.players.length > 0) {
            this.updatePlayerList(Network.players);
        }
    }

    // Fonction de mise à jour de l'affichage des noms
    updatePlayerList(players) {
        this.countText.setText(`EFFECTIF: ${players.length}/5`);
        this.namesContainer.removeAll(true);

        players.forEach((p, index) => {
            const nameText = this.add.text(-100, index * 35, `• ${p.name}`, {
                fontFamily: "Courier New", fontSize: "20px", color: "#333333", fontStyle: "bold"
            }).setOrigin(0, 0.5);

            this.namesContainer.add(nameText);
        });
    }

    cleanEvents() {
        EventBus.off('player-joined');
        EventBus.off('player-left');
        EventBus.off('update-room-players'); 
        EventBus.off('game-started');
        EventBus.off('room-closed');
    }

    createExitButton(width, margin) {
        const x = width - 60;
        const y = 60;

        const btnContainer = this.add.container(x, y);

        // Fond rouge style "Tampon urgent"
        const bg = this.add.circle(0, 0, 30, 0xb71c1c)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true });

        // Icône "Porte" dessinée
        const icon = this.add.graphics();
        icon.lineStyle(3, 0xffffff);
        // Cadre porte
        icon.strokeRect(-10, -12, 14, 24);
        // Flèche sortante
        icon.lineStyle(3, 0xffd700);
        icon.beginPath();
        icon.moveTo(4, 0); icon.lineTo(14, 0); 
        icon.moveTo(10, -4); icon.lineTo(14, 0); icon.lineTo(10, 4); 
        icon.strokePath();

        btnContainer.add([bg, icon]);

        bg.on('pointerdown', () => {
            this.showExitConfirmation();
        });

        bg.on('pointerover', () => this.tweens.add({ targets: btnContainer, scale: 1.1, duration: 100 }));
        bg.on('pointerout', () => this.tweens.add({ targets: btnContainer, scale: 1, duration: 100 }));
    }

    showExitConfirmation() {
        const { width, height } = this.scale;

        
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7)
            .setInteractive(); // Bloque les clics derrière

        const paper = this.add.rectangle(width/2, height/2, 500, 300, 0xf5f5f5)
            .setStrokeStyle(4, 0x333);
        
        const title = this.add.text(width/2, height/2 - 80, "ABANDON DE MISSION ?", {
            fontFamily: "Courier New", fontSize: "32px", color: "#b71c1c", fontStyle: "bold"
        }).setOrigin(0.5);

        const sub = this.add.text(width/2, height/2 - 20, 
            this.isHost ? "Attention Chef :\nSi vous partez, l'équipe sera dissoute." : "Voulez-vous vraiment retourner\nà l'accueil ?", 
            {
                fontFamily: "Arial", fontSize: "20px", color: "#333", align: "center"
            }
        ).setOrigin(0.5);
        
        // Bouton NON (Annuler)
        const btnNo = this.add.text(width/2 - 100, height/2 + 80, "NON, JE RESTE", {
            fontFamily: "Arial", fontSize: "20px", color: "#fff", backgroundColor: "#2e7d32", padding: 15
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Bouton OUI (Quitter)
        const btnYes = this.add.text(width/2 + 100, height/2 + 80, "OUI, QUITTER", {
            fontFamily: "Arial", fontSize: "20px", color: "#fff", backgroundColor: "#b71c1c", padding: 15
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Groupe pour tout supprimer facilement
        const popupGroup = this.add.group([overlay, paper, title, sub, btnNo, btnYes]);

        // Actions
        btnNo.on('pointerdown', () => {
            popupGroup.destroy(true); 
        });

        btnYes.on('pointerdown', () => {
            // Action de quitter
            Network.leaveRoom();
            this.cleanEvents(); 
            this.scene.start('MainMenu');
        });
    }
}