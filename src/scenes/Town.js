// src/scenes/Town.js
import { Player } from '../gameobjects/player.js';

export class Town extends Phaser.Scene {
    constructor() {
        super('Town');
    }

    preload() {
        // --- MAP ---
        this.load.tilemapTiledJSON('townMap', 'assets/Maps/town.tmj');

        // --- TILESETS ---
        this.load.image('townTiles', 'assets/kenney_tiny-town/Tilemap/tilemap_packed.png');
        this.load.image('dungeonTiles', 'assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png');

        // --- SPRITES ---
        this.load.image('player', 'assets/kenney_tiny-dungeon/Tiles/tile_0098.png');
        this.load.image('sword', 'assets/kenney_tiny-dungeon/Tiles/tile_0107.png');

        // === NPC SPRITES (EXACT spriteKey MATCH) ===
        this.load.image('blacksmith', 'assets/kenney_tiny-dungeon/Tiles/tile_0087.png');
        this.load.image('townman',    'assets/kenney_tiny-dungeon/Tiles/tile_0085.png');
        this.load.image('townlady',   'assets/kenney_tiny-dungeon/Tiles/tile_0099.png');
        this.load.image('trainer',    'assets/kenney_tiny-dungeon/Tiles/tile_0088.png');
        this.load.image('ranger',     'assets/kenney_tiny-dungeon/Tiles/tile_0112.png');
        this.load.image('rat',        'assets/kenney_tiny-dungeon/Tiles/tile_0124.png');
        this.load.image('grocer',     'assets/kenney_tiny-dungeon/Tiles/tile_0086.png');
        this.load.image('oldlady',    'assets/kenney_tiny-dungeon/Tiles/tile_0100.png');
        this.load.image('guard1',     'assets/kenney_tiny-dungeon/Tiles/tile_0096.png');
        this.load.image('guard2',     'assets/kenney_tiny-dungeon/Tiles/tile_0097.png');

        // Fallback NPC
        this.load.image('npc_default', 'assets/kenney_tiny-town/Tiles/tile_0001.png');

        // Sign placeholder
        this.load.image('sign', 'assets/kenney_tiny-town/Tiles/tile_0083.png');

        // Optional: enemy / projectile
        this.load.image('enemy', 'assets/kenney_tiny-dungeon/Tiles/tile_0000.png');
        this.load.image('projectile', 'assets/kenney_tiny-dungeon/Tiles/tile_0032.png');
    }

    create() {
        // Interact key
        this.interactKey = this.input.keyboard.addKey('E');

        // --- TILEMAP SETUP ---
        const map = this.make.tilemap({ key: 'townMap' });

        const townTileset = map.addTilesetImage('Town', 'townTiles');
        const dungeonTileset = map.addTilesetImage('Dungeon', 'dungeonTiles');
        const tilesets = [townTileset, dungeonTileset];

        const groundLayer    = map.createLayer('Ground', tilesets, 0, 0);
        const decoLayer      = map.createLayer('Ground Decoration', tilesets, 0, 0);
        const buildingLayer  = map.createLayer('Decorations/Buildings', tilesets, 0, 0);

        buildingLayer.setCollisionByExclusion([-1]);

        // --- PLAYER SPAWN ---
        const spawnLayer = map.getObjectLayer('PlayerSpawn');
        let spawnX = 100;
        let spawnY = 100;

        if (spawnLayer && spawnLayer.objects.length > 0) {
            const spawnObj = spawnLayer.objects[0];
            spawnX = spawnObj.x;
            spawnY = spawnObj.y;
        }

        this.player = new Player(this, spawnX, spawnY, 'player');
        this.add.existing(this.player);

        // --- HUD ---
        if (!this.scene.isActive('HUD')) {
            this.scene.launch('HUD');
        }
        this.scene.bringToTop('HUD');
        this.game.events.emit('player-created', this.player);
        
        // --- NPCs & SIGNS ---
        this.npcs = this.physics.add.staticGroup();
        this.signs = this.physics.add.staticGroup();

        this.spawnNPCsFromMap(map);
        this.spawnSignsFromMap(map);

        this.activeTalkTarget = null;

        this.physics.add.overlap(this.player, this.npcs, (player, npc) => {
            this.activeTalkTarget = npc;
        });

        this.physics.add.overlap(this.player, this.signs, (player, sign) => {
            this.activeTalkTarget = sign;
        });

        // --- PHYSICS & CAMERA ---
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.player.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, buildingLayer);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(2);

        // --- PORTALS ---
        this.setupPortals(map);

        // --- DIALOGUE UI ---
        this.isInDialogue = false;

        const { width, height } = this.scale;

        this.dialoguePanel = this.add.rectangle(
            width / 2,
            height / 2,
            500,
            150
        )
        .setFillStyle(0x000000, 0.8)
        .setStrokeStyle(2, 0xffffff)
        .setScrollFactor(0)
        .setVisible(false);

        this.dialogueText = this.add.text(
            width / 2,
            height / 2,
            '',
            {
                fontFamily: 'sans-serif',
                fontSize: 18,
                color: '#ffffff',
                wordWrap: { width: 460 },
                align: 'center'
            }
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setVisible(false);
    }

    showDialogue(target) {
        if (!target) return;

        let text = '';
        if (typeof target.dialogue === 'string' && target.dialogue.trim().length > 0) {
            text = target.dialogue;
        } else {
            text = '[no dialogue set for ' + (target.texture && target.texture.key) + ']';
        }

        this.isInDialogue = true;
        this.dialoguePanel.setVisible(true);
        this.dialogueText.setText(text);
        this.dialogueText.setVisible(true);
    }

    hideDialogue() {
        this.isInDialogue = false;
        this.dialoguePanel.setVisible(false);
        this.dialogueText.setVisible(false);
        this.activeTalkTarget = null;
    }

    spawnNPCsFromMap(map) {
        const npcLayer = map.getObjectLayer('NPCs');
        if (!npcLayer) {
            console.warn('No NPCs object layer found in town map');
            return;
        }

        npcLayer.objects.forEach(obj => {
            const props = obj.properties || [];

            const spriteKeyProp = props.find(p => p.name === 'spriteKey');
            const spriteKey = spriteKeyProp ? spriteKeyProp.value : 'npc_default';

            let dialogueProp = props.find(p =>
                p.name === 'dialogue' ||
                p.name === 'text'
            );

            if (!dialogueProp && props.length > 0) {
                dialogueProp = props.find(p =>
                    typeof p.name === 'string' &&
                    p.name.toLowerCase().includes('dialog')
                );
            }

            const dialogue = dialogueProp ? dialogueProp.value : null;

            const npc = this.npcs.create(obj.x, obj.y, spriteKey);
            npc.setOrigin(0.5, 1);
            npc.dialogue = dialogue;
        });
    }

    spawnSignsFromMap(map) {
        const signsLayer = map.getObjectLayer('Signs');
        if (!signsLayer) {
            console.warn('No Signs object layer found in town map');
            return;
        }

        signsLayer.objects.forEach(obj => {
            const props = obj.properties || [];

            let dialogueProp = props.find(p =>
                p.name === 'dialogue' ||
                p.name === 'text'
            );

            if (!dialogueProp && props.length > 0) {
                dialogueProp = props.find(p =>
                    typeof p.name === 'string' &&
                    p.name.toLowerCase().includes('dialog')
                );
            }

            const dialogue = dialogueProp ? dialogueProp.value : null;

            const sign = this.signs.create(obj.x, obj.y, 'sign');
            sign.setOrigin(0.5, 1);
            sign.dialogue = dialogue;
        });
    }

    setupPortals(map) {
        const portalLayer = map.getObjectLayer('Portals');
        if (!portalLayer) return;

        portalLayer.objects.forEach(obj => {
            const width = obj.width || 16;
            const height = obj.height || 16;

            const zone = this.add.zone(
                obj.x + width / 2,
                obj.y + height / 2,
                width,
                height
            );
            this.physics.add.existing(zone, true);

            const props = obj.properties || [];
            const getProp = (name) => {
                const p = props.find(pp => pp.name === name);
                return p ? p.value : null;
            };

            const targetScene = getProp('targetScene');
            const targetSpawn = getProp('targetSpawn');

            this.physics.add.overlap(this.player, zone, () => {
                if (this.isInDialogue) return;
                if (!targetScene) return;
                if (this.interactKey.isDown) {
                    this.scene.start(targetScene, { spawn: targetSpawn || null });
                }
            });
        });
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            if (this.isInDialogue) {
                this.hideDialogue();
            } else if (this.activeTalkTarget) {
                this.showDialogue(this.activeTalkTarget);
            }
        }
    }
}
