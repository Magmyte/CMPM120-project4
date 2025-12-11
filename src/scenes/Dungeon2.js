import { Player } from '../gameobjects/Player.js';
import { Enemy } from '../gameobjects/Enemy.js';

export class Dungeon2 extends Phaser.Scene {

    constructor() {
        super('Dungeon2');
    }

    preload() {

        // map asset
        this.load.tilemapTiledJSON('dungeon2Map', 'assets/maps/Dungeon 2.tmj');

        // tileset asset
        this.load.image('tinyDungeonTilesPacked', 'assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png');

        // objects assets
        this.load.image('barrel1', 'assets/kenney_tiny-dungeon/Tiles/tile_0082.png');
        this.load.image('barrel2', 'assets/kenney_tiny-dungeon/Tiles/tile_0082.png');

        this.load.image('button1', 'assets/kenney_tiny-dungeon/Tiles/tile_0066.png');
        this.load.image('button2', 'assets/kenney_tiny-dungeon/Tiles/tile_0066.png');
        this.load.image('button3', 'assets/kenney_tiny-dungeon/Tiles/tile_0066.png');
        this.load.image('button4', 'assets/kenney_tiny-dungeon/Tiles/tile_0066.png');

        this.load.image('gate1', 'assets/kenney_tiny-dungeon/Tiles/tile_0077.png');
        this.load.image('gate2', 'assets/kenney_tiny-dungeon/Tiles/tile_0077.png');

        this.load.image('reset1', 'assets/kenney_tiny-dungeon/Tiles/tile_0074.png');
        this.load.image('reset2', 'assets/kenney_tiny-dungeon/Tiles/tile_0074.png');

        this.load.image('axe', 'assets/kenney_tiny-dungeon/Tiles/tile_0118.png');
        // this.load.image('', 'assets/kenney_tiny-dungeon/Tiles/tile_0000.png');
    }

    create() {

        // draw map
        this.map = this.add.tilemap('dungeon2Map');
        var tileset = this.map.addTilesetImage('tilemap_packed_tiny_dungeon', 'tinyDungeonTilesPacked');

        this.background = this.map.createLayer('Ground', tileset, 0, 0);
        this.walls = this.map.createLayer('Walls', tileset, 0, 0);
        
        if (this.walls) this.walls.setCollisionByExclusion([-1]);

        // add groups
        this.interactiveGroup = this.add.group("interactives");

        this.pushables = this.add.group("pushables");
        this.buttons = this.add.group("buttons");
        this.gates = this.add.group("gates");
        this.resets = this.add.group("resets");

        this.barrelDrag = 400;

        // AXE STATE
        this.hasAxe = this.registry.get('hasAxe') === true;  // persistent across scenes - false means player does not have axe

        // PUZZlE STATES
        this.puzzle1Solved = this.registry.get('puzzle1Solved') === true;
        this.puzzle2Solved = this.registry.get('puzzle2Solved') === true;

        // draw interactive objects
        this.interactives = this.map.getObjectLayer("Interactives");
        if (this.interactives)
        {
            for (var obj of this.interactives.objects)
            {
                if (obj.properties)
                {
                    if (obj.properties[0].name == "operation" && obj.properties[0].value)
                    {
                        let interactiveObject = this.physics.add.sprite(obj.x + 8, obj.y - 8, obj.properties[0].value);
                        interactiveObject.effect = obj.properties[0].value;
                        interactiveObject.setPushable(false);
                        this.interactiveGroup.add(interactiveObject);

                        // add barrels to pushables group
                        if (obj.properties[0].value == 'barrel1' || obj.properties[0].value == 'barrel2')
                        {
                            interactiveObject.depth = 3;
                            interactiveObject.setPushable(true);
                            interactiveObject.body.setDrag(this.barrelDrag);
                            interactiveObject.body.setBounce(0);
                            this.pushables.add(interactiveObject);
                        }

                        // add buttons to buttons group
                        else if (obj.properties[0].value == 'button1' || obj.properties[0].value == 'button2' || obj.properties[0].value == 'button3' || obj.properties[0].value == 'button4')
                        {
                            interactiveObject.depth = 2;
                            this.buttons.add(interactiveObject);
                        }

                        // add gates to gates group
                        else if (obj.properties[0].value == 'gate1' || obj.properties[0].value == 'gate2')
                        {
                            this.gates.add(interactiveObject);

                            if (this.puzzle1Solved && interactiveObject.effect == 'gate1') interactiveObject.destroy(true);
                            if (this.puzzle2Solved && interactiveObject.effect == 'gate2') interactiveObject.destroy(true);
                        }

                        // add resets to resets group
                        else if (obj.properties[0].value == 'reset1' || obj.properties[0].value == 'reset2')
                        {
                            this.resets.add(interactiveObject);
                        }

                        // define axe property
                        else if (obj.properties[0].value == 'axe')
                        {
                            this.axe = interactiveObject;
                            if (this.hasAxe)
                            {
                                interactiveObject.destroy(true);
                            }
                        }
                    }
                }
            }
        }

        // interact key
        this.interactKey = this.input.keyboard.addKey('E');

        // --- PLAYER SPAWN ---
        const spawnLayer = this.map.getObjectLayer('PlayerSpawn');
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

        // initialize variables
        this.puzzleResetDelay = 2000;
        this.puzzleReset = false;

        this.button1Press = false;
        this.button2Press = false;
        this.button3Press = false;
        this.button4Press = false;

        // --- PHYSICS BOUNDS ---
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.player.body.setCollideWorldBounds(true);

        // set collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.pushables);
        this.physics.add.collider(this.player, this.gates);
        this.physics.add.collider(this.player, this.resets);

        this.physics.add.collider(this.walls, this.pushables);
        this.physics.add.collider(this.pushables, this.pushables);

        // puzzle resetter
        if (this.player.sword)
        {
            this.physics.add.overlap(this.resets, this.player.sword, (resets, sword) =>
            {
                if (!this.puzzleReset)
                {
                    switch (resets.effect) {
                        case 'reset1':
                            this.resetPuzzle(1);
                            break;
                        case 'reset2':
                            this.resetPuzzle(2);
                            break;
                        default:
                            console.log('Something with the puzzle resetter broke.');
                    }
                }
            });
        }

        // axe upgrade overlap check
        this.physics.add.overlap(this.player, this.axe, (player, axe) =>
        {
            this.axePickUp(player, axe);
        });

        // initialize camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(2);

        // --- PORTALS ---
        this.setupPortals(this.map);
        this.setupPortalsFromSpawn(this.map);

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

    update(time, dTime) {

        // open gates
        if (this.button1Press && this.button2Press)
        {
            this.registry.set('puzzle1Solved', true);

            this.gates.children.each( function(obj) {
                if (obj.effect == 'gate1')
                {
                obj.destroy(true);
                }
            }, this);
        }

        if (this.button3Press && this.button4Press)
        {
            this.registry.set('puzzle2Solved', true);

            this.gates.children.each( function(obj) {
                if (obj.effect == 'gate2')
                {
                obj.destroy(true);
                }
            }, this);
        }

        // check for overlap with buttons
        this.physics.world.overlap(this.pushables, this.buttons, (pushable, button) =>
        {
            if (button.effect == 'button1' && !this.button1Press)
            {
                this.button1Press = true;
            }
            else if (button.effect == 'button2' && !this.button2Press)
            {
                this.button2Press = true;
            }
            else if (button.effect == 'button3' && !this.button3Press)
            {
                this.button3Press = true;
            }
            else if (button.effect == 'button4' && !this.button4Press)
            {
                this.button4Press = true;
            }
        });
    }

    // increase player's damage
    axePickUp(player, axe) {

        // Store axe in registry
        this.registry.set('hasAxe', true);
        this.player.sword.setTexture('axe');

        // display reward text
        this.showRewardText(
            "You have found an axe! Your damage has increased."
        );

        // animation
        this.tweens.add({
            targets: axe,
            y: axe.y - 24,
            alpha: 0,
            duration: 900,
            ease: 'Sine.easeOut',
            onComplete: () => axe.destroy()
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

    showRewardText(message) {
        this.rewardPanel.depth = 7;
        this.rewardPanel.setVisible(true);
        this.rewardText.setText(message);
        this.rewardText.depth = 8;
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

    // resetting puzzle function
    resetPuzzle(num) {

        // change flag for puzzle resetting
        this.puzzleReset = true;

        this.time.delayedCall(this.puzzleResetDelay, () =>
        {
            this.puzzleReset = false;
        });

        var checker = 'barrel' + num;

        // destroy barrels
        this.pushables.children.each( function(obj) {
            if (obj.effect == checker)
            {
                obj.destroy(true);
            }
        }, this);

        // re-add barrels
        for (var obj of this.interactives.objects)
        {
            if (obj.properties)
            {
                if (obj.properties[0].name == "operation" && obj.properties[0].value == checker)
                {
                    let interactiveObject = this.physics.add.sprite(obj.x + 8, obj.y - 8, obj.properties[0].value);
                    interactiveObject.effect = obj.properties[0].value;
                    this.interactiveGroup.add(interactiveObject);

                    interactiveObject.depth = 3;
                    interactiveObject.setPushable(true);
                    interactiveObject.body.setDrag(this.barrelDrag);
                    interactiveObject.body.setBounce(0);
                    this.pushables.add(interactiveObject);
                }
            }
        }

        // change flags for buttons
        if (num == 1)
        {
            this.button1Press = false;
            this.button2Press = false;
        }
        else if (num == 2)
        {
            this.button3Press = false;
            this.button4Press = false;
        }
    }
}