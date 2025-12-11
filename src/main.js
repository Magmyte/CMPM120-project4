// src/main.js
import { Menu } from './scenes/Menu.js';
import { Town } from './scenes/Town.js';
import { HUD } from './scenes/HUD.js';
import { GameOver } from './scenes/GameOver.js';
import { Dungeon1 } from './scenes/Dungeon1.js';
import { Dungeon2 } from './scenes/Dungeon2.js';
import { BossArena } from './scenes/BossArena.js';
import { Victory } from './scenes/Victory.js';

const config = {
    type: Phaser.AUTO,
    title: 'CMPM 120 - Project 4: Grunkle\'s Adventure',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    pixelArt: true,
    scene: [
        Menu,      // start here
        Town,
        HUD,
        GameOver,
        Dungeon1,
        Dungeon2,
        BossArena,
        Victory
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
