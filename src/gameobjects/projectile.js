export class Projectile extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, sprite, direction, velocity) {
        super(scene, x, y, sprite);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.direction = direction; // angle in degrees, clockwise starting from East = 0 degrees
        this.velocity = velocity;

        this.body.setVelocity(this.velocity * Math.cos(Phaser.Math.DegToRad(this.direction)), this.velocity * Math.sin(Phaser.Math.DegToRad(this.direction)));
    }

    preUpdate(time, dTime) {

    }
}