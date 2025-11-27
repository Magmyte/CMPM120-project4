export class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, sprite) {
        super(scene, x, y, sprite);
        scene.physics.add.existing(this);

        this.scene = scene;
    }

    preUpdate(time, dTime) {

    }

    targetPlayer(playerX, playerY) {

        // returns angle between enemy coordinates and player coordinates, in radians
        return Math.atan2(playerY - this.y, playerX - this.x);
    }
}