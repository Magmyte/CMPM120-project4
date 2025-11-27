import { Start } from './scenes/Start.js';

const config = {
    type: Phaser.AUTO,
    title: 'CMPM 120 - Project 4: Grunkle\'s Adventure',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        debug: true
    },
    pixelArt: true,
    scene: [
        Start
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            