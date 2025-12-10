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

        this.body.maxVelocity.set(this.velocityMaxX, this.velocityMaxY);
        this.body.setDrag(this.decelerationX, this.decelerationY);

        // controls
        this.keyW = this.scene.input.keyboard.addKey("W", false, true);
        this.keyA = this.scene.input.keyboard.addKey("A", false, true);
        this.keyS = this.scene.input.keyboard.addKey("S", false, true);
        this.keyD = this.scene.input.keyboard.addKey("D", false, true);

        this.up    = this.scene.input.keyboard.addKey("UP", false, true);
        this.left  = this.scene.input.keyboard.addKey("LEFT", false, true);
        this.down  = this.scene.input.keyboard.addKey("DOWN", false, true);
        this.right = this.scene.input.keyboard.addKey("RIGHT", false, true);

        this.space = this.scene.input.keyboard.addKey("SPACE", false, false);
        this.spaceWasDown = false;

        // --- HEALTH ---
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.invulnerableUntil = 0;

        // --- GOD MODE ---
        this.godMode = false;
        this.keyG = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.G
        );
        // let HUD know initial state
        this.scene.registry.set('godMode', this.godMode);

        // --- ATTACK / SWORD SETUP ---

        // track last facing direction (degrees)
        this.lastFacingAngle = 0;

        // sword as a physics sprite (hitbox)
        this.sword = this.scene.physics.add.sprite(this.x, this.y, 'sword');
        this.sword.setOrigin(0.5, 0.5);
        this.sword.body.setAllowGravity(false);
        this.sword.body.setCircle(6);   // small circular hitbox
        this.sword.body.enable = false; // off by default
        this.sword.setVisible(false);

        this.setDepth(5);
        this.sword.setDepth(6);

        // attack state
        this.isAttacking = false;
        this.attackElapsed = 0;
        this.attackDuration = 200;
        this.attackStartAngle = 0;
        this.attackEndAngle = 0;
        this.swordRadius = 18;
        this.attackType = null; // 'slash' or 'spin'
    }

    preUpdate(time, dTime) {
        super.preUpdate(time, dTime);

        // --- MOVEMENT ---
        let moveX = 0;
        if (this.keyA.isDown || this.left.isDown) moveX--;
        if (this.keyD.isDown || this.right.isDown) moveX++;

        if (moveX !== 0) {
            this.body.setAccelerationX(moveX * this.accelerationX);
        } else {
            this.body.setAccelerationX(0);
        }

        let moveY = 0;
        if (this.keyW.isDown || this.up.isDown) moveY--;
        if (this.keyS.isDown || this.down.isDown) moveY++;

        if (moveY !== 0) {
            this.body.setAccelerationY(moveY * this.accelerationY);
        } else {
            this.body.setAccelerationY(0);
        }

        // update facing direction if moving
        if (moveX !== 0 || moveY !== 0) {
            this.lastFacingAngle = Math.atan2(moveY, moveX) * (180 / Math.PI);
        }

        // --- ATTACK INPUT ---
        const spaceJustPressed = this.space.isDown && !this.spaceWasDown;
        this.spaceWasDown = this.space.isDown;

        if (spaceJustPressed && !this.isAttacking) {
            if (moveX !== 0 || moveY !== 0) {
                this.startSlashAttack();
            } else {
                this.startSpinAttack();
            }
        }

        // --- GOD MODE TOGGLE (G key) ---
        if (Phaser.Input.Keyboard.JustDown(this.keyG)) {
            this.godMode = !this.godMode;
            this.scene.registry.set('godMode', this.godMode);

            console.log(this.godMode ? 'GOD MODE ENABLED' : 'GOD MODE DISABLED');

            if (this.godMode) {
                this.setTint(0x00ffff);   // cyan tint to show it's on
            } else {
                this.clearTint();
            }
        }

        // --- UPDATE ACTIVE ATTACK ---
        if (this.isAttacking) {
            this.updateAttack(dTime);
        } else {
            this.sword.setVisible(false);
            this.sword.body.enable = false;
        }
    }

    startSlashAttack() {
        this.isAttacking = true;
        this.attackElapsed = 0;
        this.attackType = 'slash';

        const arc = 120;
        this.attackStartAngle = this.lastFacingAngle - arc / 2;
        this.attackEndAngle   = this.lastFacingAngle + arc / 2;
        this.attackDuration   = 200;

        this.sword.setVisible(true);
        this.sword.body.enable = true;
    }

    startSpinAttack() {
        this.isAttacking = true;
        this.attackElapsed = 0;
        this.attackType = 'spin';

        this.attackStartAngle = 0;
        this.attackEndAngle   = 360;
        this.attackDuration   = 400;

        this.sword.setVisible(true);
        this.sword.body.enable = true;
    }

    updateAttack(dTime) {
        this.attackElapsed += dTime;
        let t = this.attackElapsed / this.attackDuration;
        if (t > 1) t = 1;

        let currentAngle = this.attackStartAngle +
            (this.attackEndAngle - this.attackStartAngle) * t;

        const rad = currentAngle * (Math.PI / 180);

        // position sword hitbox around player
        const sx = this.x + Math.cos(rad) * this.swordRadius;
        const sy = this.y + Math.sin(rad) * this.swordRadius;

        this.sword.x = sx;
        this.sword.y = sy;
        this.sword.angle = currentAngle;

        if (this.attackElapsed >= this.attackDuration) {
            this.isAttacking = false;
            this.sword.setVisible(false);
            this.sword.body.enable = false;
        }
    }

    takeDamage(amount = 1, source = null) {
        const now = this.scene.time.now || 0;

        // ✅ GOD MODE: ignore all damage
        if (this.godMode) {
            console.log('God Mode active — no damage taken');
            return;
        }

        // brief invulnerability window
        if (now < this.invulnerableUntil) return;

        this.health = Math.max(0, this.health - amount);
        this.invulnerableUntil = now + 1000; // 1 second

        // simple feedback
        this.setTintFill(0xff4444);
        this.scene.time.delayedCall(150, () => this.clearTint());

        console.log(`Player hit! Health = ${this.health}`);

        if (this.health <= 0) {
            console.log('Player died → going to GameOver scene');
            this.scene.scene.start('GameOver');
        }
    }
}
