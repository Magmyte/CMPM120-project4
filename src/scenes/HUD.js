// src/scenes/HUD.js
export class HUD extends Phaser.Scene {
    constructor() {
        super('HUD');
    }

    create() {
        const { width } = this.scale;

        // The player the HUD is currently tracking
        this.currentPlayer = null;
        this.currentHealth = null;
        this.currentMax = null;

        // --- PLAYER HEALTH TEXT ---
        this.healthText = this.add.text(
            16,
            16,
            'HP: --/--',
            {
                fontFamily: 'sans-serif',
                fontSize: 18,
                color: '#ffffff'
            }
        ).setScrollFactor(0);

        // --- GOD MODE INDICATOR (for testers) ---
        this.godModeText = this.add.text(
            width - 16,
            16,
            '',
            {
                fontFamily: 'sans-serif',
                fontSize: 16,
                color: '#ffff00'
            }
        )
        .setOrigin(1, 0)
        .setScrollFactor(0);

        // 🔔 Listen for any scene announcing its player
        this.game.events.on('player-created', (player) => {
            this.currentPlayer = player;
            this.currentHealth = player.health;
            this.currentMax = player.maxHealth;
            this.healthText.setText(`HP: ${player.health}/${player.maxHealth}`);
        });
    }

    update() {
        const player = this.currentPlayer;

        if (player) {
            const hp  = player.health;
            const max = player.maxHealth;

            if (hp !== this.currentHealth || max !== this.currentMax) {
                this.currentHealth = hp;
                this.currentMax = max;
                this.healthText.setText(`HP: ${hp}/${max}`);
            }

            // God mode indicator
            this.godModeText.setText(player.godMode ? 'GOD MODE (TESTING)' : '');
        } else {
            this.godModeText.setText('');
        }
    }
}