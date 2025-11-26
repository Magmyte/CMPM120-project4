export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, sprite) {
        super(scene, x, y, sprite);
        scene.physics.add.existing(this);

        this.scene = scene;

        // player variables
        this.velocityMaxX = 100;
        this.velocityMaxY = 100;

        this.accelerationX = 500;
        this.accelerationY = 500;

        this.decelerationX = 800;
        this.decelerationY = 800;

        // declare maximum velocity in x and y directions
        this.body.maxVelocity.set(this.velocityMaxX, this.velocityMaxY);
        this.body.setDrag(this.decelerationX, this.decelerationY);

        // constrols
        this.keyW = this.scene.input.keyboard.addKey("W", false, true);
        this.keyA = this.scene.input.keyboard.addKey("A", false, true);
        this.keyS = this.scene.input.keyboard.addKey("S", false, true);
        this.keyD = this.scene.input.keyboard.addKey("D", false, true);

        this.up = this.scene.input.keyboard.addKey("UP", false, true);
        this.left = this.scene.input.keyboard.addKey("LEFT", false, true);
        this.down = this.scene.input.keyboard.addKey("DOWN", false, true);
        this.right = this.scene.input.keyboard.addKey("RIGHT", false, true);

        this.space = this.scene.input.keyboard.addKey("SPACE", false, false);
    }

    preUpdate(time, dTime) {

        // check for horizontal movement
        let moveX = 0;
    
        if (this.keyA.isDown || this.left.isDown)
        {
            moveX--;
        }
        if (this.keyD.isDown || this.right.isDown)
        {
            moveX++;
        }

        if (moveX != 0)
        {
            this.body.setAccelerationX(moveX * this.accelerationX);
        }

        // check for vertical movement
        let moveY = 0;

        if (this.keyW.isDown || this.up.isDown)
        {
            moveY--;
        }
        if (this.keyS.isDown || this.down.isDown)
        {
            moveY++;
        }

        if (moveY != 0)
        {
            this.body.setAccelerationY(moveY * this.accelerationY);
        }
    }
}