import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
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
        const titleText = "D O S S I E R :\nT E R R A   N U M E R I C A";
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
        const soloBtn = this.createFolderButton(width / 2, height * 0.60, "ENQUÊTE SOLO", 0xd2b48c, () => {
            this.transitionTo('SaveMenu');
        });

        const multiBtn = this.createFolderButton(width / 2, height * 0.75, "OPÉRATION CONJOINTE", 0x8d6e63, () => {
            this.scene.start('MultiplayerMenu');
        });
        
        const stamp = this.add.text(120, -15, "URGENT", {
            fontFamily: "Impact, Arial Black", fontSize: 24, color: "#a30000"
        }).setOrigin(0.5).setRotation(0.3).setAlpha(0.8);
        const stampBox = this.add.rectangle(120, -15, 100, 40).setStrokeStyle(3, 0xa30000).setRotation(0.3).setAlpha(0.8);
        multiBtn.add([stampBox, stamp]);

        // --- BOUTON RÈGLES (Bas Droite) ---
        const rulesBtn = this.add.text(width - 30, height - 30, "[ LIRE LE PROTOCOLE ]", {
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