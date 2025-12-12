// src/scenes/Victory.js
export class Victory extends Phaser.Scene {
    constructor() {
        super('Victory');
    }
    preload() {
        // any images/backgrounds you use...

        this.load.audio('music_victory', 'assets/audio/The Final of The Fantasy.wav');
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#101830');

        // Big congratulatory text
        this.add.text(
            width / 2,
            height * 0.3,
            "Congratulations!",
            {
                fontFamily: 'sans-serif',
                fontSize: 48,
                color: '#ffffff'
            }
        ).setOrigin(0.5, 0.5);

        this.add.text(
            width / 2,
            height * 0.45,
            "The Evil Wizard has been defeated,\n" +
            "and the land is saved!\n\n" +
            "You're our hero, Grunkle! Huzzah!",
            {
                fontFamily: 'sans-serif',
                fontSize: 22,
                color: '#ddddff',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5);

        // --- BUTTON TO RETURN TO MENU ---
        const buttonWidth  = 260;
        const buttonHeight = 60;
        const buttonX = width / 2;
        const buttonY = height * 0.7;

        const buttonBg = this.add.rectangle(
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight,
            0x3c9975
        );
        buttonBg.setStrokeStyle(2, 0xffffff);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonLabel = this.add.text(
            buttonX,
            buttonY,
            'Return to Menu',
            {
                fontFamily: 'sans-serif',
                fontSize: 24,
                color: '#ffffff'
            }
        ).setOrigin(0.5, 0.5);

        // Hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x53c092);
        });
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x3c9975);
        });

        buttonBg.on('pointerup', () => {
            this.returnToMenu();
        });

        // Also allow ENTER / SPACE to return
        this.enterKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.ENTER
        );
        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Tiny hint
        this.add.text(
            width / 2,
            buttonY + 50,
            'Click the button or press ENTER / SPACE to return',
            {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#bbbbbb'
            }
        ).setOrigin(0.5, 0.5);

        this.music = this.sound.add('music_victory', { loop: true, volume: 0.4 });
        this.music.play();

        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.music) this.music.stop();
        });
        this.events.on(Phaser.Scenes.Events.DESTROY, () => {
            if (this.music) this.music.stop();
        });
    }

    update() {
        if (
            Phaser.Input.Keyboard.JustDown(this.enterKey) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey)
        ) {
            this.returnToMenu();
        }
    }

    returnToMenu() {
        // Reset any global boss / key state so a new run starts fresh
        this.registry.set('bossActive', false);
        this.registry.set('bossHealth', null);
        this.registry.set('bossMaxHealth', null);
        this.registry.set('hasKey', false);

        // Make sure gameplay scenes are stopped
        this.scene.stop('BossArena');
        this.scene.stop('Dungeon1');
        this.scene.stop('Town');
        this.scene.stop('HUD');

        // Back to main menu
        this.scene.start('Menu');
    }
}