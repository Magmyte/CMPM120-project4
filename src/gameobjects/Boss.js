// src/gameobjects/Boss.js
export class Boss extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, textureKey = 'boss') {
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;

        // Make him larger than everyone else (assumes 16x16 base)
        this.setScale(2);
        this.body.setAllowGravity(false);
        this.body.setCollideWorldBounds(true);

        // --- STATS ---
        this.maxHealth = 300;
        this.health = this.maxHealth;

        // Movement speeds
        this.chaseSpeed   = 60;   // normal “walk” chase
        this.rushSpeed    = 110;  // fast rush in phase 2
        this.fleeSpeed    = 80;   // move away in phase 3

        // Phases:
        // 1: full HP → simple floaty chase
        // 2: 66%–33% HP → alternating slow/fast rushes
        // 3: <33% HP → kites away & throws potions
        this.phase = 1;

        // For simple wiggle in phase 1
        this.wiggleSeed = Math.random() * Math.PI * 2;

        // For phase 2 rush pattern
        this.mode = 'slow';
        this.modeTimer = 0;

        // For phase 3 shooting
        this.shootCooldown = 0; // ms until next shot
        this.minShootDelay = 800;
        this.maxShootDelay = 1400;

        // Boss sleeps until player is close
        this.awake = false;
        this.activationRadius = 100; // pixels

        // --- KNOCKBACK / RETREAT AFTER HITTING PLAYER ---
        this.knockbackTimer    = 0;    // remaining ms of knockback
        this.knockbackDuration = 250;  // how long to retreat after a hit
        this.knockbackSpeed    = 140;  // retreat speed
        this.knockbackAngle    = 0;    // direction away from player
    }

    // Called by the scene when the boss has just hit the player up close
    applyKnockbackFromPlayer(player) {
        if (!player) return;

        // Direction from player → boss (i.e., away from player)
        this.knockbackAngle = Math.atan2(this.y - player.y, this.x - player.x);
        this.knockbackTimer = this.knockbackDuration;
    }

    // Decide phase based on remaining HP
    updatePhase() {
        const ratio = this.health / this.maxHealth;

        let newPhase = this.phase;
        if (ratio > 2 / 3) {
            newPhase = 1;
        } else if (ratio > 1 / 3) {
            newPhase = 2;
        } else {
            newPhase = 3;
        }

        if (newPhase !== this.phase) {
            this.phase = newPhase;
            console.log(`[Boss] Phase changed to ${this.phase}`);
            if (this.phase === 2) {
                this.setRushMode('slow');
            }
        }
    }

    setRushMode(mode) {
        this.mode = mode;
        if (mode === 'slow') {
            this.currentSpeed = this.chaseSpeed;
            this.modeTimer = 2000; // ms
        } else {
            this.currentSpeed = this.rushSpeed;
            this.modeTimer = 900;  // ms
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const player = this.scene.player;
        if (!player || !player.active) return;

        // --- WAKE-UP CHECK ---
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (!this.awake) {
            if (distToPlayer <= this.activationRadius) {
                this.awake = true;
                console.log('[Boss] Awakens!');
            } else {
                this.body.setVelocity(0, 0);
                return;
            }
        }

        // --- KNOCKBACK OVERRIDES EVERYTHING WHILE ACTIVE ---
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= delta;

            const vx = Math.cos(this.knockbackAngle) * this.knockbackSpeed;
            const vy = Math.sin(this.knockbackAngle) * this.knockbackSpeed;
            this.body.setVelocity(vx, vy);

            // Face generally toward the player even while backing up
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            this.rotation = angleToPlayer;

            // Don’t run normal AI while retreating
            return;
        }

        // --- NORMAL AI BEHAVIOR BELOW ---
        this.updatePhase();
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);

        if (this.phase === 1) {
            // PHASE 1: simple floaty chase with wiggle
            const wiggle = Math.sin(time * 0.003 + this.wiggleSeed) * 0.3;
            const angle = angleToPlayer + wiggle;

            const vx = Math.cos(angle) * this.chaseSpeed;
            const vy = Math.sin(angle) * this.chaseSpeed;

            this.body.setVelocity(vx, vy);
            this.rotation = angle;

        } else if (this.phase === 2) {
            // PHASE 2: slow/fast rushes
            this.modeTimer -= delta;
            if (this.modeTimer <= 0) {
                this.setRushMode(this.mode === 'slow' ? 'fast' : 'slow');
            }

            const vx = Math.cos(angleToPlayer) * this.currentSpeed;
            const vy = Math.sin(angleToPlayer) * this.currentSpeed;

            this.body.setVelocity(vx, vy);
            this.rotation = angleToPlayer;

        } else {
            // PHASE 3: kite + shoot
            this.handlePhase3Movement(distToPlayer, angleToPlayer, delta);
            this.handlePhase3Shooting(distToPlayer, angleToPlayer, delta);
        }
    }

    handlePhase3Movement(distToPlayer, angleToPlayer, delta) {
        const desiredMin = 80;
        const desiredMax = 140;

        let moveAngle = null;
        let speed = this.fleeSpeed;

        if (distToPlayer < desiredMin) {
            // Too close → move away
            moveAngle = angleToPlayer + Math.PI;
        } else if (distToPlayer > desiredMax) {
            // Too far → move toward
            moveAngle = angleToPlayer;
        } else {
            // In sweet spot: strafe around
            moveAngle = angleToPlayer + Math.PI / 2;
            speed = this.chaseSpeed;
        }

        const vx = Math.cos(moveAngle) * speed;
        const vy = Math.sin(moveAngle) * speed;

        this.body.setVelocity(vx, vy);
        this.rotation = angleToPlayer;
    }

    handlePhase3Shooting(distToPlayer, angleToPlayer, delta) {
        const shootRange = 220;
        if (distToPlayer > shootRange) {
            this.shootCooldown = Math.max(0, this.shootCooldown - delta);
            return;
        }

        this.shootCooldown -= delta;
        if (this.shootCooldown > 0) return;

        if (this.scene && typeof this.scene.bossShootPotion === 'function') {
            this.scene.bossShootPotion(this, angleToPlayer);
        }

        this.shootCooldown = Phaser.Math.Between(this.minShootDelay, this.maxShootDelay);
    }

    takeDamage(amount = 1) {
        if (!this.active) return;

        this.health = Math.max(0, this.health - amount);

        this.setTintFill(0xff4444);
        this.scene.time.delayedCall(120, () => this.clearTint());

        console.log(
            `[Boss] hit for ${amount}, hp = ${this.health}/${this.maxHealth}`
        );

        this.updatePhase();

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        if (!this.active) return;

        console.log('[Boss] defeated!');

        // mark boss as inactive globally if you want
        this.scene.registry.set('bossActive', false);

        // cache the scene reference because `this` inside the delayedCall
        // will NOT be the boss object
        const scene = this.scene;

        // small delay for the hit flash / dramatic pause
        scene.time.delayedCall(400, () => {
            // stop gameplay scenes and show Victory
            scene.scene.stop('BossArena');
            scene.scene.stop('HUD');
            scene.scene.start('Victory');
        });
        this.destroy();
    }
}