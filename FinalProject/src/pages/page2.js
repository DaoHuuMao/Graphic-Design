// AUTHOR: NGUYEN VAN A - ID: 20221111
import * as THREE from 'three';

export function init(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);



    const linematerial = new THREE.LineBasicMaterial( {color: 0x0000ff});
    const points = [];
    points.push( new THREE.Vector3(-10, 0, 0));
    points.push( new THREE.Vector3(0, 10, 0));
    points.push( new THREE.Vector3(10, 0, 0));

    const linegeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line( linegeometry, linematerial);
    scene.add(line);

    camera.position.z = 30;

    function animate() {
        requestAnimationFrame(animate);
        line.rotation.x += 0.01;
        line.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}