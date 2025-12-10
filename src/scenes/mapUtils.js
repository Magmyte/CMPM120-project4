// src/scenes/mapUtils.js
import { Player } from '../gameobjects/player.js';

export function setupTilemap(scene, mapKey, tilesetConfig) {
    const map = scene.make.tilemap({ key: mapKey });

    // tilesetConfig: [{ name: 'Town', imageKey: 'townTiles' }, ...]
    const tilesets = tilesetConfig.map(cfg =>
        map.addTilesetImage(cfg.name, cfg.imageKey)
    );

    return { map, tilesets };
}

export function createLayers(map, tilesets, layerNames) {
    const layers = {};
    for (const name of layerNames) {
        if (map.getLayerIndex(name) !== null && map.getLayerIndex(name) !== -1) {
            layers[name] = map.createLayer(name, tilesets, 0, 0);
        }
    }
    return layers;
}

export function enableCollisions(scene, player, collidableLayers) {
    for (const layer of collidableLayers) {
        if (!layer) continue;
        layer.setCollisionByExclusion([-1]);
        scene.physics.add.collider(player, layer);
    }
}

export function createPlayerAtSpawn(scene, map, spawnLayerName, spawnName, textureKey = 'player') {
    const layer = map.getObjectLayer(spawnLayerName);
    let spawnX = 100;
    let spawnY = 100;

    if (layer) {
        const objs = layer.objects;
        let spawnObj = null;

        if (spawnName) {
            spawnObj = objs.find(o => o.name === spawnName);
        }
        if (!spawnObj && objs.length > 0) {
            spawnObj = objs[0];
        }
        if (spawnObj) {
            spawnX = spawnObj.x;
            spawnY = spawnObj.y;
        }
    }

    const player = new Player(scene, spawnX, spawnY, textureKey);
    scene.add.existing(player);
    scene.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

    return player;
}

export function setupCamera(scene, map, player, zoom = 2) {
    const width = map.widthInPixels;
    const height = map.heightInPixels;

    scene.physics.world.setBounds(0, 0, width, height);
    scene.cameras.main.setBounds(0, 0, width, height);
    scene.cameras.main.startFollow(player);
    scene.cameras.main.setZoom(zoom);
}

export function createPortals(scene, map, player) {
    const portalLayer = map.getObjectLayer('Portals');
    if (!portalLayer) return;

    portalLayer.objects.forEach(obj => {
        const zone = scene.add.zone(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width,
            obj.height
        );
        scene.physics.add.existing(zone, true);

        const props = obj.properties || [];
        const getProp = name => {
            const p = props.find(pp => pp.name === name);
            return p ? p.value : null;
        };

        const targetScene = getProp('targetScene');
        const targetSpawn = getProp('targetSpawn');

        scene.physics.add.overlap(player, zone, () => {
            if (!targetScene) return;
            scene.scene.start(targetScene, { spawn: targetSpawn });
        });
    });
}
