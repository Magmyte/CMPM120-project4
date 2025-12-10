// src/scenes/GameOver.js
export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        const { width, height } = this.scale;

        console.log('[GameOver] Scene started');

        this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.8
        );

        this.add.text(
            width / 2,
            height / 2 - 40,
            'Game Over',
            {
                fontFamily: 'sans-serif',
                fontSize: 32,
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        this.add.text(
            width / 2,
            height / 2 + 10,
            'Press SPACE or click to play again',
            {
                fontFamily: 'sans-serif',
                fontSize: 18,
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        this.space = this.input.keyboard.addKey('SPACE');

        this.canRestart = false;
        this.time.delayedCall(300, () => {
            this.canRestart = true;
        });

        this.input.once('pointerdown', () => {
            if (this.canRestart) {
                this.restartGame();
            }
        });
    }

    update() {
        if (this.canRestart && Phaser.Input.Keyboard.JustDown(this.space)) {
            this.restartGame();
        }
    }

    restartGame() {
        console.log('[GameOver] restartGame → back to Menu');

        this.scene.stop('Town');
        this.scene.stop('Dungeon1');
        this.scene.stop('HUD');

        this.scene.start('Menu');
    }
}
