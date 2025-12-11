// src/gameobjects/projectile.js
export class Projectile extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, sprite, directionDeg, velocity, duration = 1200) {
        super(scene, x, y, sprite);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.direction = directionDeg; // degrees, 0 = east
        this.rotation = Phaser.Math.DegToRad(this.direction);

        this.body.setAllowGravity(false);

        this.velocity = velocity;
        const rad = Phaser.Math.DegToRad(this.direction);
        this.body.setVelocity(
            this.velocity * Math.cos(rad),
            this.velocity * Math.sin(rad)
        );

        // How long this projectile lives (ms)
        this.lifespan = duration;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
        }
    }
}