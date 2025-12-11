// src/scenes/Dungeon1.js
import { Player } from '../gameobjects/Player.js';
import { Enemy } from '../gameobjects/Enemy.js';

export class Dungeon1 extends Phaser.Scene {
    constructor() {
        super('Dungeon1');
    }

    preload() {
        this.load.tilemapTiledJSON('dungeon1Map', 'assets/Maps/Dungeon 1.tmj');
        this.load.image('dungeonTiles', 'assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png');

        this.load.image('player', 'assets/kenney_tiny-town/Characters/character_0000.png');
        this.load.image('sword', 'assets/kenney_tiny-dungeon/Tiles/tile_0107.png');
        this.load.image('ghost', 'assets/kenney_tiny-dungeon/Tiles/tile_0108.png');
        this.load.image('potion', 'assets/kenney_tiny-dungeon/Tiles/tile_0115.png');
        this.load.image('chest_closed', 'assets/kenney_tiny-dungeon/Tiles/tile_0089.png');
        this.load.image('chest_open',   'assets/kenney_tiny-dungeon/Tiles/tile_0091.png');
        this.load.image('key_icon',     'assets/kenney_tiny-town/Tiles/tile_0117.png');
    }

    init(data) {
        this.spawnName = data && data.spawn ? data.spawn : 'default';
    }

    create() {
        this.interactKey = this.input.keyboard.addKey('E');

        const map = this.make.tilemap({ key: 'dungeon1Map' });
        const dungeonTileset = map.addTilesetImage('Dungeon', 'dungeonTiles');

        const groundLayer    = map.createLayer('Ground', dungeonTileset, 0, 0);
        const decoLayer      = map.createLayer('Ground Decoration', dungeonTileset, 0, 0);
        const decoration     = map.createLayer('Decoration', dungeonTileset, 0, 0);
        const buildingLayer  = map.createLayer('Building', dungeonTileset, 0, 0);
        const hazardLayer    = map.createLayer('Hazards', dungeonTileset, 0, 0);
        const platformsLayer = map.createLayer('Platforms', dungeonTileset, 0, 0);

        if (buildingLayer)  buildingLayer.setCollisionByExclusion([-1]);
        if (hazardLayer)    hazardLayer.setCollisionByExclusion([-1]);
        if (platformsLayer) platformsLayer.setCollisionByExclusion([-1]);

        // --- PLAYER SPAWN ---
        const spawnLayer = map.getObjectLayer('PlayerSpawn');
        let spawnX = 100, spawnY = 100;

        if (spawnLayer && spawnLayer.objects.length > 0) {
            let spawnObj = spawnLayer.objects[0];

            if (this.spawnName) {
                const named = spawnLayer.objects.find(o => o.name === this.spawnName);
                if (named) {
                    spawnObj = named;
                }
            }

            spawnX = spawnObj.x;
            spawnY = spawnObj.y;
        }

        this.player = new Player(this, spawnX, spawnY, 'player');
        this.add.existing(this.player);

        // HUD
        if (!this.scene.isActive('HUD')) {
            this.scene.launch('HUD');
        }
        this.scene.bringToTop('HUD');
        this.game.events.emit('player-created', this.player);

        //KEY / CHEST STATE
        this.hasKey = this.registry.get('hasKey') === true;  // persistent across scenes
        this.chestOpened = this.hasKey;                      // if  already have key, chest starts open

        // REWARD CHEST (from Tiled)
        this.chest = null;
        this.spawnRewardChestFromMap(map);

        // --- POTIONS ---
        this.potions = this.physics.add.staticGroup();
        this.spawnPotionsFromMap(map);

        // --- ENEMIES / GHOSTS ---
        this.enemies = this.physics.add.group();
        this.spawnInitialEnemiesFromMap(map);
        this.setupEnemySpawnersFromMap(map);

        // --- PHYSICS BOUNDS ---
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.player.body.setCollideWorldBounds(true);

        // PLAYER collides with world geometry
        if (buildingLayer) {
            this.physics.add.collider(this.player, buildingLayer);
        }

        // HAZARD tiles: collide *and* damage player
        if (hazardLayer) {
            this.physics.add.collider(
                this.player,
                hazardLayer,
                () => {
                    if (this.player && this.player.takeDamage) {
                        this.player.takeDamage(1, 'hazard');
                    }
                },
                null,
                this
            );
        }

        // --- DAMAGE OVERLAPS ---

        // Ghosts → player
        this.physics.add.overlap(
            this.player,
            this.enemies,
            (playerSprite, enemy) => {
                console.log('[Dungeon1] player & ghost overlap');
                if (this.player && typeof this.player.takeDamage === 'function') {
                    this.player.takeDamage(1, enemy);
                }
            },
            null,
            this
        );

        // Sword → ghosts
        if (this.player.sword) {
            this.physics.add.overlap(
                this.player.sword,
                this.enemies,
                (sword, enemy) => {
                    if (enemy && typeof enemy.takeDamage === 'function') {
                        if (this.registry.get('hasAxe') === true) enemy.takeDamage(2);
                        else enemy.takeDamage(1);
                    }
                },
                null,
                this
            );
        }

        // 🧪 player → potions
        this.physics.add.overlap(
            this.player,
            this.potions,
            this.onPotionPickup,
            null,
            this
        );


        // --- CAMERA ---
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(2);

        // --- PORTALS ---
        this.setupPortals(map);
        this.setupPortalsFromSpawn(map);

        // --- REWARD MESSAGE UI (for key text) ---
        const { width, height } = this.scale;

        this.rewardPanel = this.add.rectangle(
            width / 2,
            height / 2,
            520,
            160,
            0x000000,
            0.8
        )
        .setStrokeStyle(2, 0xffffff)
        .setScrollFactor(0)
        .setVisible(false);

        this.rewardText = this.add.text(
            width / 2,
            height / 2,
            '',
            {
                fontFamily: 'sans-serif',
                fontSize: 18,
                color: '#ffffff',
                wordWrap: { width: 480 },
                align: 'center'
            }
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setVisible(false);

    }

    // Spawn the reward chest from object layer "Reward Chest"
    spawnRewardChestFromMap(map) {
        // Object layer name is exactly: Reward Chest
        const chestLayer = map.getObjectLayer('Reward Chest');
        if (!chestLayer || chestLayer.objects.length === 0) {
            console.warn('No objects found in "Reward Chest" layer');
            return;
        }

        // We only expect ONE chest; use the first object
        const chestObj = chestLayer.objects[0];

        // Use open or closed texture based on whether key was already collected
        const texKey = this.chestOpened ? 'chest_open' : 'chest_closed';

        this.chest = this.physics.add.staticSprite(chestObj.x, chestObj.y, texKey);
        this.chest.setOrigin(0.5, 1);
    }

    spawnGhost(x, y) {
        const ghost = new Enemy(this, x, y, 'ghost');
        ghost.setOrigin(0.5, 1);
        this.enemies.add(ghost);
        return ghost;
    }

    spawnInitialEnemiesFromMap(map) {
        const enemyLayer = map.getObjectLayer('Enemies');
        if (!enemyLayer) {
            console.warn('No "Enemies" object layer found in Dungeon 1 map.');
            return;
        }

        enemyLayer.objects.forEach(obj => {
            this.spawnGhost(obj.x, obj.y);
        });
    }

    setupEnemySpawnersFromMap(map) {
        const spawnLayer = map.getObjectLayer('EnemySpawn');
        if (!spawnLayer) {
            console.warn('No "EnemySpawn" object layer found in Dungeon 1 map.');
            return;
        }

        spawnLayer.objects.forEach(obj => {
            const props = obj.properties || [];

            const getProp = (name, fallback) => {
                const p = props.find(pp => pp.name === name);
                return p ? p.value : fallback;
            };

            const baseDelay = 15000; // 15 seconds minimum
            const jitter    = 5000;  // +0 to +5 seconds random
            const maxAlive  = getProp('maxAlive', 10);

            const initialDelay = baseDelay + Phaser.Math.Between(0, jitter);

            this.time.addEvent({
                delay: baseDelay,
                loop: true,
                startAt: initialDelay,
                callback: () => {
                    const current = this.enemies.countActive(true);
                    if (current >= maxAlive) return;
                    this.spawnGhost(obj.x, obj.y);
                }
            });
        });
    }

    // Potions from "Potions" object layer
    spawnPotionsFromMap(map) {
        const potionLayer = map.getObjectLayer('Potions');   // <- layer name in Tiled
        if (!potionLayer) {
            console.warn('No "Potions" object layer found in Dungeon 1 map.');
            return;
        }

        potionLayer.objects.forEach(obj => {
            // Tiled uses top-left origin, we want the feet on the ground
            const potion = this.potions.create(obj.x, obj.y, 'potion');
            potion.setOrigin(0.5, 1);
            potion.setDepth(3); // draw above floor, tweak as you like
        });
    }

    onPotionPickup(playerSprite, potion) {
        // Make sure we have the scene's player object
        const player = this.player;
        if (!player) return;

        // Reset health to full
        player.health = player.maxHealth;
        console.log('[Dungeon1] Potion picked up — HP restored to', player.health);

        // Remove potion from the world
        potion.destroy();
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
                if (!targetScene) return;
                if (this.interactKey.isDown) {
                    this.scene.start(targetScene, { spawn: targetSpawn || null });
                }
            });
        });
    }

    setupPortalsFromSpawn(map) {
        const spawnLayer = map.getObjectLayer('PlayerSpawn');
        if (!spawnLayer) return;

        spawnLayer.objects.forEach(obj => {
            const props = obj.properties || [];
            const sceneProp = props.find(p => p.name === 'targetScene');
            if (!sceneProp) return;

            const targetScene = sceneProp.value;
            const spawnProp = props.find(p => p.name === 'targetSpawn');
            const targetSpawn = spawnProp ? spawnProp.value : null;

            const width = obj.width || 16;
            const height = obj.height || 16;

            const zone = this.add.zone(
                obj.x + width / 2,
                obj.y + height / 2,
                width,
                height
            );
            this.physics.add.existing(zone, true);

            this.physics.add.overlap(this.player, zone, () => {
                if (!targetScene) return;
                if (this.interactKey.isDown) {
                    this.scene.start(targetScene, { spawn: targetSpawn });
                }
            });
        });
    }

    openRewardChest() {
        if (!this.chest || this.chestOpened) return;

        this.chestOpened = true;
        this.hasKey = true;

        // Store key in registry so other scenes (boss door later) can see it
        this.registry.set('hasKey', true);

        // Change sprite to open chest
        this.chest.setTexture('chest_open');

        // Floating key above chest
        const keySprite = this.add.sprite(this.chest.x, this.chest.y - 24, 'key_icon');
        keySprite.setDepth(10);

        this.tweens.add({
            targets: keySprite,
            y: keySprite.y - 24,
            alpha: 0,
            duration: 900,
            ease: 'Sine.easeOut',
            onComplete: () => keySprite.destroy()
        });

        // Show reward text
        this.showRewardText(
            "You have received a key! Use it to open the door to the Evil Wizard's lair."
        );
    }

    showRewardText(message) {
        this.rewardPanel.setVisible(true);
        this.rewardText.setText(message);
        this.rewardText.setVisible(true);

        // Auto-hide after a short time
        this.time.delayedCall(2500, () => {
            this.hideRewardText();
        });
    }

    hideRewardText() {
        this.rewardPanel.setVisible(false);
        this.rewardText.setVisible(false);
    }


    update(time, delta) {
        // Player & Enemy preUpdate handle logic; HUD reads health

         // Chest interaction: press E when close enough
        if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.chest && !this.chestOpened) {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.chest.x,  this.chest.y
            );

            // Adjust distance threshold if needed
            if (dist < 40) {
                this.openRewardChest();
            }
        }
    }
}    
