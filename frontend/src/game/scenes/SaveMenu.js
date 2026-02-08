import { Scene } from 'phaser';
import SaveManager from '../SaveManager.js'; // Import de la classe
import { EventBus } from '../EventBus';
import { GameState } from "../GameState.js";

export class SaveMenu extends Scene {
    constructor() {
        super('SaveMenu');
        this.saveManager = new SaveManager(); // Créer une instance
    }

    create() {
        // --- MUSIQUE D'AMBIANCE ---
        if (!this.sound.get('theme_accueil')) {
            this.sound.play('theme_accueil', { loop: true, volume: 0.5 });
        }

        const { width, height } = this.scale;

        // --- FOND : BUREAU EN BOIS SOMBRE ---
        this.add.rectangle(0, 0, width, height, 0x1a1a1a).setOrigin(0);

        if (this.textures.exists('background')) {
            const bg = this.add.image(width / 2, height / 2, 'background');
            const scale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(scale).setAlpha(0.2).setTint(0x5d4037);
        }

        // --- EFFETS ---
        const lampLight = this.add.circle(width * 0.8, height * 0.2, 400, 0xffaa55, 0.15);
        this.tweens.add({
            targets: lampLight,
            alpha: 0.12,
            scale: 1.05,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- TITRE ---
        const titleText = "P A R T I E S";
        const titleObj = this.add.text(width / 2, height / 3 - 40, '', {
            fontFamily: 'Courier New',
            fontSize: 60,
            color: '#e0e0e0',
            align: 'center',
            fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true }
        }).setOrigin(0.5);

        let i = 0;
        this.time.addEvent({
            delay: 80,
            callback: () => {
                if (i < titleText.length) {
                    titleObj.text += titleText[i];
                    i++;
                }
            },
            repeat: titleText.length
        });

        // --- BOUTONS PRINCIPAUX ---
        const slot1Btn = this.createFolderButton(
            width * 0.25,
            height * 0.45,
            this.getSlotLabel(1),
            0xd2b48c,
            () => this.loadSlot(1)
        );

        const slot2Btn = this.createFolderButton(
            width * 0.50,
            height * 0.45,
            this.getSlotLabel(2),
            0xd2b48c,
            () => this.loadSlot(2)
        );

        const slot3Btn = this.createFolderButton(
            width * 0.75,
            height * 0.45,
            this.getSlotLabel(3),
            0xd2b48c,
            () => this.loadSlot(3)
        );

        const slot4Btn = this.createFolderButton(
            width * 0.25,
            height * 0.55,
            this.getSlotLabel(4),
            0xd2b48c,
            () => this.loadSlot(4)
        );

        const slot5Btn = this.createFolderButton(
            width * 0.50,
            height * 0.55,
            this.getSlotLabel(5),
            0xd2b48c,
            () => this.loadSlot(5)
        );

        const slot6Btn = this.createFolderButton(
            width * 0.75,
            height * 0.55,
            this.getSlotLabel(6),
            0xd2b48c,
            () => this.loadSlot(6)
        );

        const supAllBtn = this.createFolderButton(width * 0.30, height * 0.65, "Sup. tt sauvegardes", 0xd2b48c, () => {
            this.clearAllSlot();
            this.scene.restart();
        });

        this.createSelectorToDelete();

        const returnToMenu = this.createFolderButton(width / 2, height * 0.75, "Retour", 0xd2b48c, () => {
            this.transitionTo('MainMenu');
        });

        // --- BOUTON RÈGLES (Bas Droite) ---
        const rulesBtn = this.add.text(width * 0.99, height * 0.95, "[ LIRE LE PROTOCOLE ]", {
            fontFamily: 'Courier New',
            fontSize: 18,
            color: '#888888',
            fontStyle: 'bold'
        }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

        rulesBtn.on('pointerover', () => {
            rulesBtn.setColor('#ffffff');
            rulesBtn.setText("> LIRE LE PROTOCOLE <");
        });
        rulesBtn.on('pointerout', () => {
            rulesBtn.setColor('#888888');
            rulesBtn.setText("[ LIRE LE PROTOCOLE ]");
        });
        rulesBtn.on('pointerdown', () => {
            this.toggleRules(true);
        });

        // --- CREATION POPUP REGLES ---
        this.createRulesPopup(width, height);

        EventBus.emit('current-scene-ready', this);
    }


    getSlotLabel(slotNum) {
        if (this.saveManager.saveExists(slotNum)) {
            const save = this.saveManager.restoreSave(slotNum);
            // Afficher des infos sur la sauvegarde (timestamp, niveau, etc.)
            const date = save.timestamp ? new Date(save.timestamp).toLocaleDateString() : 'N/A';
            return `Slot ${slotNum} : ${date}`;
        }
        return `Slot ${slotNum} : [ VIDE ]`;
    }


    loadSlot(slotNum) {
        if (this.saveManager.saveExists(slotNum)) {
            // CHARGER la sauvegarde existante
            const saveslot = this.saveManager.restoreSave(slotNum);


            GameState.loadFromSave(saveslot);
        } else {
            GameState.reset();
        }
        
        GameState.currentSlot = slotNum;

        this.transitionTo('Briefing');
    }
    
    clearAllSlot(){
        this.saveManager.clearAllSaves();
    }

    createFolderButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);
        const tab = this.add.rectangle(-80, -35, 100, 20, color).setOrigin(0.5);
        const folder = this.add.rectangle(0, 0, 350, 70, color).setStrokeStyle(2, 0x3e2723);
        const line = this.add.rectangle(0, 15, 300, 1, 0x3e2723, 0.2);
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Courier New', fontSize: 28, color: '#2d1b0e', fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([tab, folder, line, label]);

        folder.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                this.tweens.add({ targets: container, scale: 1.05, duration: 100, ease: 'Sine.easeOut' });
                folder.setStrokeStyle(3, 0xffffff);
            })
            .on('pointerout', () => {
                this.tweens.add({ targets: container, scale: 1, duration: 100, ease: 'Sine.easeOut' });
                folder.setStrokeStyle(2, 0x3e2723);
            })
            .on('pointerdown', () => {
                this.tweens.add({
                    targets: container, scale: 0.95, duration: 50, yoyo: true,
                    onComplete: callback
                });
            });

        return container;
    }

    createSelectorToDelete() {
        const deleteY = this.scale.height * 0.65;
        const supBtn = this.createFolderButton(this.scale.width * 0.70, deleteY, "SUPPRIMER", 0xd2b48c, () => {
            this.deleteSelectedSlot();
        });
        supBtn.setScale(0.8);
        const selectorContainer = this.add.container(this.scale.width * 0.78, deleteY);
        const selectorBg = this.add.rectangle(0, 0, 80, 50, 0xfdf5e6)
            .setStrokeStyle(2, 0x8b4513);
        this.selectedSlotNum = 1;
        this.slotNumText = this.add.text(0, 0, this.selectedSlotNum.toString(), {
            fontFamily: 'Courier New',
            fontSize: 32,
            color: '#2d1b0e',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const btnMinus = this.add.text(-50, 0, "◀", {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#8b4513',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({useHandCursor: true});
        btnMinus.on('pointerover', () => {
            btnMinus.setScale(1.2);
            btnMinus.setColor('#d2691e');
        });
        btnMinus.on('pointerout', () => {
            btnMinus.setScale(1);
            btnMinus.setColor('#8b4513');
        });
        btnMinus.on('pointerdown', () => {
            this.selectedSlotNum--;
            if (this.selectedSlotNum < 1) this.selectedSlotNum = 6; // Boucle vers 6
            this.slotNumText.setText(this.selectedSlotNum.toString());
        });
        const btnPlus = this.add.text(50, 0, "▶", {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#8b4513',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        btnPlus.on('pointerover', () => {
            btnPlus.setScale(1.2);
            btnPlus.setColor('#d2691e');
        });
        btnPlus.on('pointerout', () => {
            btnPlus.setScale(1);
            btnPlus.setColor('#8b4513');
        });
        btnPlus.on('pointerdown', () => {
            this.selectedSlotNum++;
            if (this.selectedSlotNum > 6) this.selectedSlotNum = 1; // Boucle vers 1
            this.slotNumText.setText(this.selectedSlotNum.toString());
        });
        selectorContainer.add([selectorBg, this.slotNumText, btnMinus, btnPlus]);
    }

    deleteSelectedSlot() {
        const slotNum = this.selectedSlotNum;

        // Vérifier si la sauvegarde existe
        if (!this.saveManager.saveExists(slotNum)) {
            // Animation de secousse pour indiquer qu'il n'y a rien à supprimer
            this.tweens.add({
                targets: this.slotNumText,
                x: [0, -5, 5, -5, 5, 0],
                duration: 300,
                ease: 'Power2'
            });
            return;
        }
        this.saveManager.deleteSave(slotNum);
        this.scene.restart();
    }

    // --- POPUP DES RÈGLES ---
    createRulesPopup(width, height) {
        this.rulesContainer = this.add.container(0, 0).setDepth(100).setVisible(false);

        const bgDim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive()
            .on('pointerdown', () => this.toggleRules(false));

        const paperWidth = 900;
        const paperHeight = 850;
        const paper = this.add.rectangle(width / 2, height / 2, paperWidth, paperHeight, 0xfdf5e6)
            .setStrokeStyle(1, 0xaaaaaa);

        const title = this.add.text(width / 2, height * 0.2, "PROCÉDURE D'ENQUÊTE", {
            fontFamily: 'Courier New', fontSize: 28, color: '#000000', fontStyle: 'bold', underline: true
        }).setOrigin(0.5);

        const rulesText =
            "1. LE PLATEAU :\n" +
            "   Vos cartes découvertes sont au centre.\n   Cliquez dessus pour les examiner (Zoom).\n\n" +
            "2. OUTILS D'INVESTIGATION :\n" +
            "   [HAUT-GAUCHE] : Carnet de NOTES pour écrire vos pistes.\n" +
            "   [HAUT-CENTRE] : Champ de recherche. Entrez le NUMÉRO d'une\n   carte (visible sur l'image) pour la récupérer.\n\n" +
            "3. AIDE & TEMPS :\n" +
            "   [HAUT-DROITE] : Chronomètre. Vous avez 60 minutes.\n" +
            "   Juste à côté : Zone des INDICES. Ils se débloquent\n   automatiquement après plusieurs erreurs sur une énigme.\n" +
            "   Pour le mode multijoueur : A droite, zone 'ACTIVITÉ RÉCENTE' qui déroule la progression des autres joueurs en temps réel.\n"+
            "   [BAS-DROITE] : Pour le multijoueur, un bouton 'quitter' pour quitter la partie. Et en solo, un bouton menu mettant en pause et permattant de sauvegarder la partie en couors.\n\n"+
            "4. ATTENTION :\n   Chaque erreur vous coûte de précieuses minutes !";

        const body = this.add.text(width / 2, height / 2, rulesText, {
            fontFamily: 'Courier New', fontSize: 18, color: '#333333',
            lineSpacing: 8, wordWrap: { width: paperWidth - 80 }
        }).setOrigin(0.5);

        const closeBtn = this.add.text(width / 2, height / 2 + 370, "[ J'AI COMPRIS ]", {
            fontFamily: 'Impact', fontSize: 24, color: '#2e7d32',
            backgroundColor: null
        }).setOrigin(0.5).setRotation(-0.05).setInteractive({ useHandCursor: true });

        const stampBorder = this.add.rectangle(width / 2, height / 2 + 370, 180, 50)
            .setStrokeStyle(3, 0x2e7d32).setRotation(-0.05).setAlpha(0.8);

        closeBtn.on('pointerdown', () => this.toggleRules(false));

        this.rulesContainer.add([bgDim, paper, title, body, stampBorder, closeBtn]);
    }

    toggleRules(show) {
        if (show) {
            this.rulesContainer.setVisible(true);
            this.rulesContainer.setAlpha(0);
            this.tweens.add({
                targets: this.rulesContainer,
                alpha: 1,
                duration: 200
            });
        } else {
            this.tweens.add({
                targets: this.rulesContainer,
                alpha: 0,
                duration: 200,
                onComplete: () => this.rulesContainer.setVisible(false)
            });
        }
    }

    transitionTo(scene) {
        const music = this.sound.get('theme_accueil');
        if (music) {
            this.tweens.add({ targets: music, volume: 0, duration: 1000, onComplete: () => music.stop() });
        }
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.time.delayedCall(800, () => this.scene.start(scene));
    }
}