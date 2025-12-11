// src/scenes/Menu.js
export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    preload() {
        // If you want a logo or background image, load it here.
        // For now we just use solid-color background + text.
    }

    create() {
        const { width, height } = this.scale;

        // Background color (just make sure it differs from main game if you like)
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // --- TITLE ---
        const title = this.add.text(width / 2, height * 0.2, "Grunkle's Adventure", {
            fontFamily: 'sans-serif',
            fontSize: 48,
            color: '#ffffff'
        });
        title.setOrigin(0.5, 0.5);

        // --- CONTROL SCHEME ---
        const controlsText = [
            'Controls:',
            '',
            'Movement:   W / A / S / D   or   Arrow Keys',
            'Interact:   E (talk, use portals, read signs)',
            // Add more when you hook them up:
            // 'Attack:    Space',
            '',
        '--- Tester Tools ---',
        'God Mode Toggle:   G',
        ].join('\n');

        const controls = this.add.text(width / 2, height * 0.4, controlsText, {
            fontFamily: 'monospace',
            fontSize: 20,
            color: '#dddddd',
            align: 'center'
        });
        controls.setOrigin(0.5, 0);

        // --- START BUTTON ---
        const buttonWidth = 260;
        const buttonHeight = 60;

        const buttonX = width / 2;
        const buttonY = height * 0.7;

        // Use a Graphics-generated rectangle as a simple button background
        const buttonBg = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x3c6997);
        buttonBg.setStrokeStyle(2, 0xffffff);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonLabel = this.add.text(buttonX, buttonY, 'Start Adventure', {
            fontFamily: 'sans-serif',
            fontSize: 24,
            color: '#ffffff'
        });
        buttonLabel.setOrigin(0.5, 0.5);

        // Hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x5790c6);
        });
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x3c6997);
        });

        // Click → start Town scene
        buttonBg.on('pointerup', () => {
            this.startGame();
        });

        // Also allow ENTER / SPACE to start
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Small hint
        const hint = this.add.text(width / 2, buttonY + 60, 'Click the button or press ENTER / SPACE to begin', {
            fontFamily: 'sans-serif',
            fontSize: 16,
            color: '#bbbbbb'
        });
        hint.setOrigin(0.5, 0.5);
    }

    startGame() {
        // Go to Town scene; you can pass a spawn if you want:
        this.scene.start('Town', { spawn: 'default' });
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.startGame();
        }
    }
}
