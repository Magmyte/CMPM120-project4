export class NonPlayer extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, sprite) {
        super(scene, x, y, sprite);
        scene.physics.add.existing(this);

        this.scene = scene;
    }

    preUpdate(time, dTime) {
        
    }
}