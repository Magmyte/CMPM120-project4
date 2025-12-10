// src/scenes/HUD.js
export class HUD extends Phaser.Scene {
    constructor() {
        super('HUD');
    }

    create() {
        const { width, height } = this.scale;

        this.currentHealth = null;
        this.currentMax = null;

        // --- HEALTH TEXT (top-left) ---
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

        // --- GOD MODE TEXT (top-right) ---
        this.godMode = this.registry.get('godMode') ?? false;

        this.godText = this.add.text(
            width - 16,
            16,
            'GOD MODE',
            {
                fontFamily: 'sans-serif',
                fontSize: 18,
                color: '#00ffff'
            }
        )
        .setOrigin(1, 0)      // anchor top-right
        .setScrollFactor(0)
        .setVisible(this.godMode);

        // Listen for godMode changes from Player
        this.registry.events.on('changedata-godMode', (parent, value) => {
            this.godMode = value;
            this.godText.setVisible(value);
        });
    }

    // Try to find the current player in active gameplay scenes
    getActivePlayer() {
        const town = this.scene.get('Town');
        if (town && town.scene.isActive() && town.player) {
            return town.player;
        }

        const d1 = this.scene.get('Dungeon1');
        if (d1 && d1.scene.isActive() && d1.player) {
            return d1.player;
        }

        return null;
    }

    update() {
        const player = this.getActivePlayer();
        if (!player) return;

        const hp  = player.health;
        const max = player.maxHealth;

        if (hp !== this.currentHealth || max !== this.currentMax) {
            this.currentHealth = hp;
            this.currentMax = max;
            this.healthText.setText(`HP: ${hp}/${max}`);
        }
    }
}
