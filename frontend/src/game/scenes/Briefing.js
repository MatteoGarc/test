import { Scene } from 'phaser';
import { Network } from '../Network'; 
import { EventBus } from '../EventBus';

export class Briefing extends Scene {
    constructor() {
        super('Briefing');
        this.isWaiting = false;
        this.mode_solo = true;
    }
    
    init(data){
        if (data && data.mode_solo === false) {
            this.mode_solo = data.mode_solo;
        }
        console.log('mode_solo de briefing : ', this.mode_solo);
    }

    create() {
        // MUSIQUE 
        if (!this.sound.get('theme_briefing')) {
            this.sound.play('theme_briefing', {
                loop: true,
                volume: 0.5
            });
        }
        if (!this.sound.get('theme_typewriter')) {
            this.sound.play('theme_typewriter', {
                loop: true,
                volume: 0.5,
                speed: 3.8
            });
        }

        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
        
        const lines = [
            "MISSION : OPÉRATION GÉOGRAPHIE",
            "CIBLE : BUREAU DU PROFESSEUR",
            "--------------------------------",
            "",
            "ÉCOUTEZ BIEN,",
            "",
            "VOUS AVEZ UN EXAMEN DE GÉO DEMAIN.",
            "LES RUMEURS DISENT QU'IL EST IMPOSSIBLE",
            "À RÉUSSIR SANS UN COUP DE POUCE.",
            "",
            "LA LÉGENDE EST CLAIRE :",
            "LE SEUL MOYEN DE GAGNER EST DE",
            "RÉCUPÉRER LE SUJET CACHÉ DANS SON BUREAU.",
            "",
            "MAIS ATTENTION...",
            "CE PROF N'EST PAS ORDINAIRE.",
            "IL A TRANSFORMÉ SON BUREAU EN FORTERESSE",
            "REMPLIE D'ÉNIGMES ET DE CODES.",
            "",
            "VOUS AVEZ : 1 HEURE.",
            "PENDANT SA RÉUNION.",
            "PAS UNE SECONDE DE PLUS.",
            "",
            "NE PERDEZ PAS DE TEMPS,",
            "LE TEMPS JOUE CONTRE VOUS.",
            "",
            "--------------------------------",
            "[ CLIQUEZ POUR COMMENCER ]"
        ];

        const textStyle = {
            fontFamily: 'Courier New',
            fontSize: '26px',
            color: '#f3e5dc', 
            fontStyle: 'bold',
            align: 'left',
            lineSpacing: 8
        };

        const briefingText = this.add.text(width / 2, height / 2, '', textStyle).setOrigin(0.5);
        const fullText = lines.join('\n');
        
        // MACHINE À ÉCRIRE 
        let index = 0;
        const typingEvent = this.time.addEvent({
            delay: 30,
            repeat: fullText.length - 1,
            callback: () => {
                briefingText.text += fullText[index];
                index++;
                if (index === fullText.length) {
                    this.enableStartGame();
                }
            }
        });

        // GESTION DU CLIC 
        this.input.once('pointerdown', () => {
            if (index < fullText.length) {
                // Skip l'animation
                this.time.removeEvent(typingEvent);
                briefingText.text = fullText;
                index = fullText.length;
                this.enableStartGame();
            } else {
                // Si l'animation était déjà finie, on lance la logique de départ
                this.handlePlayerReady();
            }
        });

        // ÉCOUTEURS RÉSEAU (Synchro) 
        this.statusText = this.add.text(width * 0.8, height - 100, "", { 
            fontFamily: 'Courier New', fontSize: '20px', color: '#ff0000' 
        }).setOrigin(0.5);

        EventBus.on('update-ready-count', (data) => {
            if (this.isWaiting) {
                this.statusText.setText(`EN ATTENTE DES AUTRES JOUEURS : ${data.ready}/${data.total}`);
            }
        });

        EventBus.on('all-players-ready', () => {
            this.triggerGameStart();
        });
    }
    
    enableStartGame() {
        const music = this.sound.get('theme_typewriter');
        if (music) {
            this.tweens.add({
                targets: music,
                volume: 0,
                duration: 100,
                onComplete: () => { music.stop(); }
            });
        }
        
        this.tapToStart = this.add.text(this.scale.width / 2, this.scale.height - 50, ">>> ACCEPTER LA MISSION <<<", {
            fontFamily: 'Courier New', fontSize: '24px', color: '#00ff00'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: this.tapToStart,
            alpha: 1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // On réactive le clic pour lancer la suite
        this.input.once('pointerdown', () => {
            this.handlePlayerReady();
        });
    }

    // Nouvelle fonction qui gère : Solo (Direct) ou Multi (Attente)
    handlePlayerReady() {
        if (this.isWaiting) return; // Déjà cliqué

        if (Network.roomCode) {
            // --- MODE MULTIJOUEUR ---
            this.isWaiting = true;
            this.tapToStart.setVisible(false); // Cache le "Accepter mission"
            this.statusText.setText("EN ATTENTE DU SERVEUR...");
            
            // On prévient le serveur qu'on est prêt
            Network.sendPlayerReady();
        } else {
            // --- MODE SOLO ---
            this.triggerGameStart();
        }
    }

    // Le vrai départ (Transition + Scène suivante)
    triggerGameStart() {
        // Nettoyage écouteurs
        EventBus.off('update-ready-count');
        EventBus.off('all-players-ready');

        const music = this.sound.get('theme_briefing');
        if (music) {
            this.tweens.add({
                targets: music,
                volume: 0,
                duration: 1000,
                onComplete: () => { music.stop(); }
            });
        }

        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (music && music.isPlaying) music.stop();
            this.scene.start('Game', { mode_solo: this.mode_solo });
        });
    }
}