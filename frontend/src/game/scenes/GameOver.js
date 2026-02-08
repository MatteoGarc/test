import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        const idsToRemove = [
            'ui-search-container', 
            'notebook-container', 
            'notebook-btn', 
            'graph-btn',
            'game-input-div', 
            'puzzle-container',
            'multi-input-container'
        ];

        idsToRemove.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        this.sound.stopAll();
        if((!this.sound.get('theme_perdre'))) {
            this.sound.play('theme_perdre', { volume: 0.6, loop: false });
        }
        const width = this.scale.width;
        const height = this.scale.height;
        this.cameras.main.setBackgroundColor(0x330000);
        if(this.textures.exists('background')) {
            const bg = this.add.image(width / 2, height / 2, 'background');
            const scale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(scale).setAlpha(0.2).setTint(0xff0000);
        }
        const noiseGraphics = this.add.graphics();
        this.time.addEvent({
            delay: 50,
            loop: true,
            callback: () => {
                noiseGraphics.clear();
                noiseGraphics.lineStyle(2, 0xff0000, Math.random() * 0.5);
                for(let i=0; i<15; i++) {
                    const y = Math.random() * height;
                    noiseGraphics.lineBetween(0, y, width, y);
                }
            }
        });

        const titleText = this.add.text(width / 2, height / 2 - 120, "MISSION ÉCHOUÉE", {
            fontFamily: 'Courier New', 
            fontSize: '80px', 
            color: '#ff0000', 
            fontStyle: 'bold',
            align: 'center',
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 20, stroke: true, fill: true }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: titleText,
            alpha: 0.1,
            duration: 80,
            yoyo: true,
            repeat: -1,
            ease: 'Stepped'
        });

        const message = 
            "> ALERTE : FIN DE LA RÉUNION.\n" +
            "> LE PROFESSEUR EST DE RETOUR.\n" +
            "> VOUS AVEZ ÉTÉ SURPRIS DANS LE BUREAU.\n" +
            "> \n" +
            "> LE SUJET D'EXAMEN EST PERDU.\n" +
            "> PRÉPAREZ-VOUS AU ZÉRO DEMAIN...";

        const msgObj = this.add.text(width / 2, height / 2 + 80, "", {
            fontFamily: 'Courier New', 
            fontSize: '24px', 
            color: '#ffffff',
            align: 'left',
            lineSpacing: 10, 
            backgroundColor: '#000000aa', 
            padding: { x: 20, y: 20 }
        }).setOrigin(0.5);

        let i = 0;
        this.time.addEvent({
            delay: 60,
            repeat: message.length - 1,
            callback: () => {
                msgObj.text += message[i];
                i++;
                if (Math.random() > 0.8) {
                    this.cameras.main.shake(50, 0.005);
                }
            }
        });

        this.time.delayedCall(5000, () => {
            const btn = this.add.text(width / 2, height - 100, "[ TENTER UNE NOUVELLE INFILTRATION ]", {
                fontFamily: 'Impact', fontSize: '32px', color: '#ff0000'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setColor('#ffffff'));
            btn.on('pointerout', () => btn.setColor('#ff0000'));
            
            btn.on('pointerdown', () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    window.location.reload(); 
                });
            });

            this.tweens.add({
                targets: btn, 
                alpha: 0.3, 
                duration: 800, 
                yoyo: true, 
                repeat: -1
            });
        });
        EventBus.emit('current-scene-ready', this);
    }
}