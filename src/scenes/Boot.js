// src/scenes/Boot.js
export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // ---- TILEMAPS ----
        this.load.tilemapTiledJSON('townMap', 'assets/Maps/town.tmj');
        this.load.tilemapTiledJSON('dungeon1Map', 'assets/Maps/dungeon1.tmj');
        // later: dungeon2Map, bossMap

        // ---- TILESETS ----
        this.load.image('townTiles', 'assets/kenney_tiny-town/Tilemap/tilemap_packed.png');
        this.load.image('dungeonTiles', 'assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png');

        // ---- PLAYER SPRITE ----
        // Use any character sprite you like
        this.load.image('player', 'assets/kenney_tiny-town/Characters/character_0000.png');
    }

    create() {
        // After everything's loaded, go to Town
        this.scene.start('Town', { spawn: 'default' });
    }
}
