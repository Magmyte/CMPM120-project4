// src/scenes/BossArena.js
import { Player }    from '../gameobjects/Player.js';
import { Boss }      from '../gameobjects/Boss.js';
import { Projectile } from '../gameobjects/projectile.js';

export class BossArena extends Phaser.Scene {
    constructor() {
        super('BossArena');
    }

    preload() {
        // --- MAP ---
        this.load.tilemapTiledJSON('bossArenaMap', 'assets/Maps/BossArena.tmj');

        // --- TILESETS ---
        this.load.image('townTiles',    'assets/kenney_tiny-town/Tilemap/tilemap_packed.png');
        this.load.image('dungeonTiles', 'assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png');

        // --- PLAYER & SWORD (reuse) ---
        this.load.image('player', 'assets/kenney_tiny-town/Characters/character_0000.png');
        this.load.image('sword',  'assets/kenney_tiny-dungeon/Tiles/tile_0107.png');

        // --- BOSS ---
        this.load.image('boss', 'assets/kenney_tiny-dungeon/Tiles/tile_0111.png');

        // --- BOSS POTION PROJECTILE ---
        this.load.image('boss_potion', 'assets/kenney_tiny-dungeon/Tiles/tile_0114.png');
    }

    init(data) {
        this.spawnName = data && data.spawn ? data.spawn : 'default';
    }

    create() {
        // Interact key (door + portals)
        this.interactKey = this.input.keyboard.addKey('E');

        // --- TILEMAP + LAYERS ---
        const map = this.make.tilemap({ key: 'bossArenaMap' });

        const townTileset    = map.addTilesetImage('Town',    'townTiles');
        const dungeonTileset = map.addTilesetImage('Dungeon', 'dungeonTiles');
        const tilesets = [townTileset, dungeonTileset];

        const groundLayer   = map.createLayer('Ground',            tilesets, 0, 0);
        const groundDeco    = map.createLayer('Ground Decoration', tilesets, 0, 0);
        const buildingLayer = map.createLayer('Building',          tilesets, 0, 0);
        const hazardsLayer  = map.createLayer('Hazards',           tilesets, 0, 0);

        // Door tile layers
        const doorOpenLayer   = map.createLayer('Doors (Open)', tilesets, 0, 0);
        const doorClosedLayer = map.createLayer('Doors',        tilesets, 0, 0);

        this.map = map;
        this.doorClosedLayer = doorClosedLayer;
        this.doorOpenLayer   = doorOpenLayer;

        // Solid: buildings
        if (buildingLayer) {
            buildingLayer.setCollisionByExclusion([-1]);
        }

        // Hazards: collide + damage
        if (hazardsLayer) {
            hazardsLayer.setCollisionByExclusion([-1]);
        }

        // Closed doors: solid
        if (doorClosedLayer) {
            doorClosedLayer.setCollisionByExclusion([-1]);
        }

        // Open doors: no collision
        if (doorOpenLayer) {
            doorOpenLayer.setCollisionByExclusion([-1], false, false);
        }

        if (doorOpenLayer)   doorOpenLayer.setDepth(2);
        if (doorClosedLayer) doorClosedLayer.setDepth(3);

        // --- PLAYER SPAWN ---
        const spawnLayer = map.getObjectLayer('PlayerSpawn');
        let spawnX = 100;
        let spawnY = 100;

        if (spawnLayer && spawnLayer.objects.length > 0) {
            let spawnObj = spawnLayer.objects[0];

            if (this.spawnName) {
                const named = spawnLayer.objects.find(o => o.name === this.spawnName);
                if (named) spawnObj = named;
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

        // --- BOSS ---
        this.boss = null;
        const bossLayer = map.getObjectLayer('Boss');
        if (bossLayer && bossLayer.objects.length > 0) {
            const bossObj = bossLayer.objects[0];
            this.boss = new Boss(this, bossObj.x, bossObj.y, 'boss');
        }

        // --- PROJECTILES GROUP ---
        this.projectiles = this.physics.add.group();

        // --- WORLD & CAMERA ---
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.player.body.setCollideWorldBounds(true);

        if (buildingLayer) {
            this.physics.add.collider(this.player, buildingLayer);
        }
        if (doorClosedLayer) {
            this.physics.add.collider(this.player, doorClosedLayer);
        }

        if (hazardsLayer) {
            this.physics.add.collider(
                this.player,
                hazardsLayer,
                () => {
                    if (this.player && this.player.takeDamage) {
                        this.player.takeDamage(1, 'hazard');
                    }
                },
                null,
                this
            );
        }

        // Boss vs world (optional; keeps him in arena)
        if (this.boss && buildingLayer) {
            this.physics.add.collider(this.boss, buildingLayer);
        }
        if (this.boss && doorClosedLayer) {
            this.physics.add.collider(this.boss, doorClosedLayer);
        }

        // Boss hurts player on contact AND then backs off a bit
        if (this.boss) {
            this.physics.add.overlap(
                this.player,
                this.boss,
                (playerSprite, boss) => {
                    if (this.player && this.player.takeDamage) {
                        this.player.takeDamage(1, boss);
                    }

                    // Make the boss retreat briefly after a close-range hit
                    if (boss && typeof boss.applyKnockbackFromPlayer === 'function') {
                        boss.applyKnockbackFromPlayer(this.player);
                    }
                },
                null,
                this
            );
        }

        // Player sword hurts boss
        if (this.boss && this.player.sword) {
            this.physics.add.overlap(
                this.player.sword,
                this.boss,
                (sword, boss) => {
                    if (boss && boss.takeDamage) {
                        boss.takeDamage(1);
                    }
                },
                null,
                this
            );
        }

        // Player hit by boss potions
        this.physics.add.overlap(
            this.player,
            this.projectiles,
            (playerSprite, projectile) => {
                if (this.player && this.player.takeDamage) {
                    this.player.takeDamage(1, 'boss_potion');
                }
                projectile.destroy();
            },
            null,
            this
        );

        // Camera follow
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(2);

        // Doors start closed
        this.doorsOpened = false;
        if (this.doorOpenLayer)   this.doorOpenLayer.setVisible(true);
        if (this.doorClosedLayer) this.doorClosedLayer.setVisible(true);

        // Auto-open doors if player already has key
        const hasKeyAlready = this.registry.get('hasKey') === true;
        console.log('[BossArena] create() – hasKeyAlready =', hasKeyAlready);
        if (hasKeyAlready) {
            this.openBossDoors();
        }

        // Portals back to Town
        this.setupPortalsFromSpawn(map);
    }

    // Helper: boss calls this to spawn a potion projectile
    bossShootPotion(boss, angleRad) {
        const angleDeg = Phaser.Math.RadToDeg(angleRad);
        const SPEED = 120;
        const LIFETIME = 1500; // ms

        const proj = new Projectile(
            this,
            boss.x,
            boss.y,
            'boss_potion',
            angleDeg,
            SPEED,
            LIFETIME
        );
        this.projectiles.add(proj);
    }

    setupPortalsFromSpawn(map) {
        const spawnLayer = map.getObjectLayer('PlayerSpawn');
        if (!spawnLayer) return;

        spawnLayer.objects.forEach(obj => {
            const props = obj.properties || [];
            const sceneProp = props.find(p => p.name === 'targetScene');
            if (!sceneProp) return;

            const targetScene = sceneProp.value;
            const spawnProp   = props.find(p => p.name === 'targetSpawn');
            const targetSpawn = spawnProp ? spawnProp.value : null;

            const width  = obj.width  || 16;
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

    openBossDoors() {
        if (this.doorsOpened) return;
        this.doorsOpened = true;

        if (this.doorClosedLayer) {
            this.doorClosedLayer.setCollisionByExclusion([-1], false, false);
            this.doorClosedLayer.visible = false;
            this.doorClosedLayer.active = false;
        }

        if (this.doorOpenLayer) {
            this.doorOpenLayer.visible = true;
        }

        console.log('Boss doors opened!');
    }

    update(time, delta) {
        // Door interaction
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            const hasKey = this.registry.get('hasKey') === true;
            console.log('E pressed in BossArena, hasKey =', hasKey);

            if (hasKey) {
                this.openBossDoors();
            } else {
                console.log('Doors are locked. You need the key from the dungeon.');
            }
        }
    }
}