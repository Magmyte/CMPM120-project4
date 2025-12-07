import { Projectile } from "./projectile.js";

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

        // player flags
        this.facingRight = true;
        this.facingDown = true;

        this.lastFace = "up";

        // declare maximum velocity in x and y directions
        this.body.maxVelocity.set(this.velocityMaxX, this.velocityMaxY);
        this.body.setDrag(this.decelerationX, this.decelerationY);

        // controls
        this.keyW = this.scene.input.keyboard.addKey("W", false, true);
        this.keyA = this.scene.input.keyboard.addKey("A", false, true);
        this.keyS = this.scene.input.keyboard.addKey("S", false, true);
        this.keyD = this.scene.input.keyboard.addKey("D", false, true);

        this.up = this.scene.input.keyboard.addKey("UP", false, true);
        this.left = this.scene.input.keyboard.addKey("LEFT", false, true);
        this.down = this.scene.input.keyboard.addKey("DOWN", false, true);
        this.right = this.scene.input.keyboard.addKey("RIGHT", false, true);

        this.space = this.scene.input.keyboard.addKey("SPACE", false, false);

        // check for last faced direction
        this.keyW.on("down", () =>
        {
            this.lastFace = "up";
        });

        this.up.on("down", () =>
        {
            this.lastFace = "up";
        });

        this.keyA.on("down", () =>
        {
            this.lastFace = "left";
        });

        this.left.on("down", () =>
        {
            this.lastFace = "left";
        });

        this.keyS.on("down", () =>
        {
            this.lastFace = "down";
        });

        this.down.on("down", () =>
        {
            this.lastFace = "down";
        });

        this.keyD.on("down", () =>
        {
            this.lastFace = "right";
        });

        this.right.on("down", () =>
        {
            this.lastFace = "right";
        });
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
        else
        {
            this.body.setAccelerationX(0);
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
        else
        {
            this.body.setAccelerationY(0);
        }

        // adjust facing flags
        if ((moveX < 0 && this.facingRight) || (moveX > 0 && !this.facingRight))
        {
            this.facingRight = !this.facingRight;
        }

        if ((moveY < 0 && this.facingDown) || (moveY > 0 && !this.facingDown))
        {
            this.facingDown = !this.facingDown;
        }
    }

    // fire bow function
    bow(check) {

        if (check)
        {
            // do a thing - TODO
            var direction = 0;

            switch (this.lastFace)
            {
                case "right":
                    direction = 0;
                    break;
                case "down":
                    direction = 90;
                    break;
                case "left":
                    direction = 180;
                    break;
                case "up":
                    direction = 270;
                    break;
            }

            fire = new Projectile(this.scene, this.x, this.y, 'sprite', direction, 200, 10000);
            this.scene.physics.add(fire);
            // add to group
        }
    }

    // swing sword function
    sword(check) {

        if (check)
        {
            // do a thing - TODO
            var direction = 0;
            var xOffset = 0;
            var yOffset = 0;

            switch (this.lastFace)
            {
                case "right":
                    direction = 0;
                    xOffset = 20;
                    break;
                case "down":
                    direction = 90;
                    yOffset = 20;
                    break;
                case "left":
                    direction = 180;
                    xOffset = -20;
                    break;
                case "up":
                    direction = 270;
                    yOffset = 20;
                    break;
            }

            swing = new Projectile(this.scene, this.x + xOffset, this.y + yOffset, 'sprite', direction, 0, 300);
            this.scene.physics.add(swing);
            // add to group
        }
    }
}