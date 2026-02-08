import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameState } from '../GameState';

export class Victory extends Scene {
    constructor() {
        super('Victory');
    }

    init(data) {
        this.remainingTime = data.remainingTime || 0;
        this.timeSpentSeconds = 3600 - this.remainingTime;
    }

    create() {
        const { width, height } = this.scale;
        this.cleanUpInterface();
        this.sound.stopAll();
        if (this.textures.exists('theme_win')) {
            this.sound.play('theme_win', { volume: 0.6, loop: false });
        }
        this.cameras.main.setBackgroundColor(0x2d1b0e); 
        if (this.textures.exists('background')) {
            const bg = this.add.image(width / 2, height / 2, 'background');
            const scale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(scale).setAlpha(0.3).setTint(0xffd700);
        }

        const light = this.add.circle(width / 2, height / 2, 600, 0xffd700, 0.1);
        this.tweens.add({
            targets: light, alpha: 0.15, scale: 1.1, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        const titleText = this.add.text(width / 2, 80, "SUJET RÉCUPÉRÉ", {
            fontFamily: 'Courier New', fontSize: '64px', color: '#ffd700',
            fontStyle: 'bold', align: 'center',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5);
        this.add.text(width / 2, 130, "L'examen de Géographie est dans la poche !", {
            fontFamily: 'Courier New', fontSize: '24px', color: '#ffffff', fontStyle: 'italic'
        }).setOrigin(0.5);

        const fiche1 = this.createReportSlip(width / 2 - 250, height / 2 + 20, "RAPPORT D'INFILTRATION", [
            `DURÉE OPÉRATION : ${this.formatTime(this.timeSpentSeconds)}`,
            `MARGE SÉCURITÉ : ${this.formatTime(this.remainingTime)}`,
            "----------------",
            `NOTE FINALE : ${this.getGrade()}`
        ], -0.05);

        const totalHints = GameState.unlockedHints.length;
        const totalRevealed = GameState.revealedCards.length;
        
        const fiche2 = this.createReportSlip(width / 2 + 250, height / 2 + 40, "DÉTAILS DU VOL", [
            `INDICES TROUVÉS : ${totalRevealed}`,
            `AIDES EXTERNES : ${totalHints}`,
            "----------------",
            "STATUT : SUCCÈS TOTAL"
        ], 0.08); 

        this.tweens.add({
            targets: [fiche1, fiche2],
            y: '-=50', alpha: { from: 0, to: 1 }, duration: 800, ease: 'Back.out', stagger: 200
        });

        this.time.delayedCall(1500, () => {
            const stamp = this.add.text(width / 2, height / 2 + 50, "MISSION\nRÉUSSIE", {
                fontFamily: 'Impact, Arial Black', fontSize: '100px', color: '#2e7d32', // Vert succès
                align: 'center', stroke: '#1b5e20', strokeThickness: 4
            }).setOrigin(0.5).setRotation(-0.2).setAlpha(0).setScale(3);

            this.tweens.add({
                targets: stamp, scale: 1, alpha: 0.9, duration: 300, ease: 'Bounce.out',
                onComplete: () => {
                    this.cameras.main.shake(100, 0.01);
                }
            });
        });

        this.time.delayedCall(3000, () => {
            const btn = this.createFolderButton(width / 2, height - 100, "S'ÉCLIPSER DISCRÈTEMENT", 0xd2b48c, () => {
                 GameState.inventory = [];
                 GameState.revealedCards = [];
                 GameState.completedCards = [];
                 GameState.unlockedHints = [];

                this.cameras.main.fadeOut(500);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    window.location.reload(); 
                });
            });
            btn.setAlpha(0);
            this.tweens.add({ targets: btn, alpha: 1, duration: 500 });
        });

        EventBus.emit('current-scene-ready', this);
    }

    // --- FONCTIONS UTILITAIRES ---

    createReportSlip(x, y, titleText, contentArray, rotation) {
        const container = this.add.container(x, y).setRotation(rotation).setAlpha(0);
        const slipWidth = 350;
        const slipHeight = 250;

        const shadow = this.add.rectangle(5, 5, slipWidth, slipHeight, 0x000000, 0.3);
        const paper = this.add.rectangle(0, 0, slipWidth, slipHeight, 0xfdf5e6).setStrokeStyle(2, 0xbcaaa4);
        
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xbcaaa4, 0.3);
        for(let i = 60; i < slipHeight - 20; i+=30) {
            graphics.lineBetween(-slipWidth/2 + 20, i - slipHeight/2, slipWidth/2 - 20, i - slipHeight/2);
        }

        const title = this.add.text(0, -90, titleText, {
            fontFamily: 'Courier New', fontSize: '22px', color: '#3e2723', fontStyle:'bold', underline: true
        }).setOrigin(0.5);

        const contentStr = contentArray.join('\n\n');
        const body = this.add.text(-slipWidth/2 + 30, -40, contentStr, {
            fontFamily: 'Courier New', fontSize: '18px', color: '#212121', lineSpacing: 5
        }).setOrigin(0);

        const clip = this.add.rectangle(-slipWidth/2 + 20, -slipHeight/2 - 10, 15, 40, 0x9e9e9e).setStrokeStyle(1, 0x616161);

        container.add([shadow, paper, graphics, clip, title, body]);
        return container;
    }

    createFolderButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);
        const tab = this.add.rectangle(-80, -35, 100, 20, color).setOrigin(0.5);
        const folder = this.add.rectangle(0, 0, 350, 70, color).setStrokeStyle(2, 0x3e2723); 
        const line = this.add.rectangle(0, 15, 300, 1, 0x3e2723, 0.2);
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Courier New', fontSize: 24, color: '#2d1b0e', fontStyle: 'bold'
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

    cleanUpInterface() {
        const ids = ['ui-search-container', 'notebook-container', 'notebook-btn', 'graph-btn', 'game-input-div', 'puzzle-container', 'multi-input-container'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m} min ${s.toString().padStart(2, "0")} s`;
    }

    getGrade() {
        if (this.remainingTime > 2400) return "20/20 (LÉGENDE)";
        if (this.remainingTime > 1800) return "18/20 (EXCELLENT)";
        if (this.remainingTime > 900) return "14/20 (BIEN)";
        return "10/20 (JUSTE...)";
    }
}