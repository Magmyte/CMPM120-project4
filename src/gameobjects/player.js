// src/gameobjects/Player.js
export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, sprite) {
        super(scene, x, y, sprite);
        this.setScale(0.95);
        scene.physics.add.existing(this);

        this.scene = scene;


        // Player movement variables

        this.velocityMaxX = 100;
        this.velocityMaxY = 100;

        this.accelerationX = 500;
        this.accelerationY = 500;

        this.decelerationX = 800;
        this.decelerationY = 800;

        this.body.maxVelocity.set(this.velocityMaxX, this.velocityMaxY);
        this.body.setDrag(this.decelerationX, this.decelerationY);


        // Movement keys

        this.keyW = this.scene.input.keyboard.addKey("W");
        this.keyA = this.scene.input.keyboard.addKey("A");
        this.keyS = this.scene.input.keyboard.addKey("S");
        this.keyD = this.scene.input.keyboard.addKey("D");

        this.up    = this.scene.input.keyboard.addKey("UP");
        this.left  = this.scene.input.keyboard.addKey("LEFT");
        this.down  = this.scene.input.keyboard.addKey("DOWN");
        this.right = this.scene.input.keyboard.addKey("RIGHT");

        this.space = this.scene.input.keyboard.addKey("SPACE");
        this.spaceWasDown = false;

        this.facingRight = true;

        
        // Health
        
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.invulnerableUntil = 0;

        
        // GOD MODE
        this.godMode = false;
        this.keyG = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
        this.scene.registry.set('godMode', this.godMode);

        
        // ATTACK SYSTEM
        
        this.lastFacingAngle = 0;

        this.sword = this.scene.physics.add.sprite(this.x, this.y, 'sword');

        if (this.scene.registry.get('hasAxe') === true) {
            this.sword.setTexture('axe');
        }

        this.sword.setOrigin(0.5);
        this.sword.body.setAllowGravity(false);
        this.sword.body.setCircle(6);
        this.sword.body.enable = false;
        this.sword.setVisible(false);

        this.setDepth(5);
        this.sword.setDepth(6);

        // Sound effects
        this.sfxSlash = this.scene.sound.get('sfx_slash') || this.scene.sound.add('sfx_slash');
        this.sfxSpin  = this.scene.sound.get('sfx_spin')  || this.scene.sound.add('sfx_spin');

        this.isAttacking = false;
        this.attackElapsed = 0;
        this.attackDuration = 200;
        this.attackStartAngle = 0;
        this.attackEndAngle = 0;
        this.swordRadius = 18;
        this.attackType = null;

        
        // STEP DUST PARTICLES
        
        this.stepEmitter = scene.add.particles(0, 0, 'step_dust', {
            speed: { min: 10, max: 25 },
            lifespan: { min: 180, max: 260 },
            scale: { start: 0.03, end: 0 },
            alpha: { start: 0.6, end: 0 },
            quantity: 1,
            emitting: false,
            rotate: { min: 0, max: 360 },
            gravityY: 0
        });
        this.stepEmitter.setDepth(1);
    }

    // Emit small dust puff behind player
    emitStepDust(moveX, moveY) {
        if (!this.stepEmitter) return;
        const len = Math.hypot(moveX, moveY) || 1;
        const dirX = moveX / len;
        const dirY = moveY / len;

        const offsetDist = 6;
        const px = this.x - dirX * offsetDist;
        const py = this.y - dirY * offsetDist;

        this.stepEmitter.emitParticleAt(px, py, 1);
    }

    preUpdate(time, dTime) {
        super.preUpdate(time, dTime);

        
        // MOVEMENT LOGIC
        
        let moveX = 0;
        if (this.keyA.isDown || this.left.isDown) moveX--;
        if (this.keyD.isDown || this.right.isDown) moveX++;

        let moveY = 0;
        if (this.keyW.isDown || this.up.isDown) moveY--;
        if (this.keyS.isDown || this.down.isDown) moveY++;

        if (moveX !== 0) this.body.setAccelerationX(moveX * this.accelerationX);
        else this.body.setAccelerationX(0);

        if (moveY !== 0) this.body.setAccelerationY(moveY * this.accelerationY);
        else this.body.setAccelerationY(0);

        // Damp diagonal movement
        const diag = Math.hypot(this.body.velocity.x, this.body.velocity.y);
        if (diag > this.velocityMaxX) {
            this.body.setVelocityX(this.body.velocity.x * this.velocityMaxX / diag);
            this.body.setVelocityY(this.body.velocity.y * this.velocityMaxX / diag);
        }

        // Face correct direction
        if (this.facingRight && this.body.velocity.x < 0) {
            this.facingRight = false;
            this.setTexture('player2');
        } else if (!this.facingRight && this.body.velocity.x > 0) {
            this.facingRight = true;
            this.setTexture('player');
        }

        // Update facing direction
        if (moveX !== 0 || moveY !== 0) {
            this.lastFacingAngle = Math.atan2(moveY, moveX) * (180 / Math.PI);
            this.emitStepDust(moveX, moveY);
        }

        // ATTACK INPUT      
        const spaceJustPressed = this.space.isDown && !this.spaceWasDown;
        this.spaceWasDown = this.space.isDown;

        if (spaceJustPressed && !this.isAttacking) {
            if (moveX !== 0 || moveY !== 0) this.startSlashAttack();
            else this.startSpinAttack();
        }

        // GOD MODE TOGGLE
        if (Phaser.Input.Keyboard.JustDown(this.keyG)) {
            this.godMode = !this.godMode;
            this.scene.registry.set('godMode', this.godMode);

            console.log(this.godMode ? 'GOD MODE ENABLED' : 'GOD MODE DISABLED');

            if (this.godMode) this.setTint(0x00ffff);
            else this.clearTint();
        }

        // UPDATE ACTIVE ATTACK

        if (this.isAttacking) this.updateAttack(dTime);
        else {
            this.sword.setVisible(false);
            this.sword.body.enable = false;
        }
    }


    // SLASH ATTACK (moving)

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

        if (this.sfxSlash) this.sfxSlash.play({ volume: 0.7 });
    }


    // SPIN ATTACK (standing)

    startSpinAttack() {
        this.isAttacking = true;
        this.attackElapsed = 0;
        this.attackType = 'spin';

        this.attackStartAngle = 0;
        this.attackEndAngle   = 360;
        this.attackDuration   = 400;

        this.sword.setVisible(true);
        this.sword.body.enable = true;

        if (this.sfxSpin) this.sfxSpin.play({ volume: 0.8 });
    }

    updateAttack(dTime) {
        this.attackElapsed += dTime;
        let t = Math.min(this.attackElapsed / this.attackDuration, 1);

        const currentAngle =
            this.attackStartAngle +
            (this.attackEndAngle - this.attackStartAngle) * t;

        const rad = currentAngle * (Math.PI / 180);

        const sx = this.x + Math.cos(rad) * this.swordRadius;
        const sy = this.y + Math.sin(rad) * this.swordRadius;

        this.sword.x = sx;
        this.sword.y = sy;
        this.sword.angle = currentAngle + 90;

        if (t >= 1) {
            this.isAttacking = false;
            this.sword.setVisible(false);
            this.sword.body.enable = false;
        }
    }


    // DAMAGE HANDLING
 
    takeDamage(amount = 1) {
        const now = this.scene.time.now;

        if (this.godMode) return;
        if (now < this.invulnerableUntil) return;

        this.health = Math.max(0, this.health - amount);
        this.invulnerableUntil = now + 1000;

        this.setTintFill(0xff4444);
        this.scene.time.delayedCall(150, () => this.clearTint());

        if (this.health <= 0) {
            this.scene.scene.start('GameOver');
        }
    }
}
