const scene = new THREE.Scene();
scene.background = new THREE.Color(0x00ff00);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("gameCanvas")
});
renderer.setSize(window.innerWidth, window.innerHeight);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(cube);

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
