export class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, sprite) {
        super(scene, x, y, sprite);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.body.setAllowGravity(false);
        this.body.setCollideWorldBounds(true);

        // Basic health
        this.maxHealth = 1;
        this.health = this.maxHealth;

        // Ghosty movement
        this.speed = 40;
        this.wiggleAngleAmplitude = Phaser.Math.DegToRad(25);
        this.wiggleFrequency = 0.005;
        this.wigglePhase = Math.random() * Math.PI * 2;

        this.enemyType = sprite; // 'ghost' for now
    }

    preUpdate(time, dTime) {
        super.preUpdate(time, dTime);

        if (!this.scene.player) return;

        // base angle toward player
        const angleToPlayer = this.targetPlayer(this.scene.player.x, this.scene.player.y);

        // add wiggle
        const wiggle = Math.sin(time * this.wiggleFrequency + this.wigglePhase) * this.wiggleAngleAmplitude;
        const finalAngle = angleToPlayer + wiggle;

        const vx = Math.cos(finalAngle) * this.speed;
        const vy = Math.sin(finalAngle) * this.speed;

        this.body.setVelocity(vx, vy);
    }

    targetPlayer(playerX, playerY) {
        return Math.atan2(playerY - this.y, playerX - this.x);
    }

    takeDamage(amount = 1) {
        this.health -= amount;

        if (this.health <= 0) {
            const scene = this.scene;
            const x = this.x;
            const y = this.y;

            // --- PARTICLE EFFECT (ghost poof on death) ---
            if (scene.textures.exists('ghost_poof')) {
                const emitter = scene.add.particles(x, y, 'ghost_poof', {
                    speed: { min: -10, max: 10 },        // much slower, stays tight
                    scale: { start: 0.05, end: 0 },        // VERY small particles (ghost is ~16x16)
                    alpha: { start: 1, end: 0 },
                    lifespan: 300,
                    quantity: 3,                          // half the particles
                    angle: { min: 0, max: 360 },
                    rotate: { min: 0, max: 180 },
                    blendMode: 'ADD'
                });

                // Destroy the emitter after a short time so it doesn't hang around
                scene.time.delayedCall(500, () => {
                    emitter.destroy();
                });
            } else {
                console.warn('ghost_poof texture is not loaded; skipping ghost poof particles.');
            }

            // --- SOUND EFFECT ---
            if (scene.sound) {
                scene.sound.play('ghost_flee', {
                    volume: 0.6
                });
            }

            // Remove the ghost sprite
            this.destroy();
        }
    }
}