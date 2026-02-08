import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { CardScene } from './scenes/CardScene';
import { Briefing } from './scenes/Briefing';
import { SaveMenu } from './scenes/SaveMenu.js';
import { MultiplayerMenu } from './scenes/MultiplayerMenu';
import { Lobby } from './scenes/Lobby';
import { Victory } from './scenes/Victory';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: 1920,
        height: 1080
    },
    dom: {
        createContainer: true
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MultiplayerMenu,
        Lobby,
        Briefing,
        SaveMenu,
        Game,
        CardScene,
        GameOver,
        Victory
    ]
};

const StartGame = (parent) => {
    return new Phaser.Game({ ...config, parent });
}

export default StartGame;