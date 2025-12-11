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
            // TODO: add death animation / particles later
            this.destroy();
        }
    }
}