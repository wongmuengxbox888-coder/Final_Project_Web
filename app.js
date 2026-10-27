import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// หาไฟล์ 
let MODEL_URL = 'model/anatomy_model.glb';
try {
  MODEL_URL = (await import('./model-path.js')).default;
} catch (e) {}
//เรียก id ปกติจ้า
const $ = (id) => document.getElementById(id);
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

//  สร้างจาก
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 2, 5); //แกน

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
$('viewport').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.85, 0);

// แสง + พื้น
scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(3, 5, 4);
scene.add(light);
scene.add(new THREE.GridHelper(8, 32, 0x555555, 0x2a2a2a));

// load model (ไม่จำเป็นอีก)
let rig; // กลุ่มที่เราจะยืด/หดตามค่า BMI

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    const model = gltf.scene;

    // ปรับให้โมเดลสูง 1.7 หน่วย
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(1.7 / size.y);

    // วางไว้กลางจอ และให้เท้าอยู่ที่พื้น
    box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);

    rig = new THREE.Group(); //ห่อหุ่น
    rig.add(model);
    scene.add(rig);

    $('status').style.display = 'none'; // ซ่อนหน้าโหลด
    update();
  },
);

// คำนวณ BMI + ปรับรูปร่าง 
let height = 170;
let weight = 63.6;

function update() {
  const bmi = weight / ((height / 100) * (height / 100));

  // แสดงค่าบนหน้าเว็บ
  $('height').value = height;
  $('heightRange').value = height;
  $('weight').value = weight;
  $('weightRange').value = weight;
  $('bmiRange').value = bmi;
  $('bmiValue').textContent = bmi.toFixed(1);

  // ระดับ BMI (เกณฑ์เอเชีย) 
  let text = 'ปกติ';
  let color = 'bg-green-600/20 text-green-400';
  if (bmi < 18.5) { text = 'ผอม'; color = 'bg-sky-600/20 text-sky-400'; }
  else if (bmi >= 30) { text = 'อ้วนมาก'; color = 'bg-red-600/20 text-red-400'; }
  else if (bmi >= 25) { text = 'อ้วน'; color = 'bg-orange-600/20 text-orange-400'; }
  else if (bmi >= 23) { text = 'น้ำหนักเกิน'; color = 'bg-yellow-600/20 text-yellow-400'; }
  $('bmiCategory').textContent = text;
  $('bmiCategory').className = 'rounded-full px-3 py-1 text-xs font-semibold ' + color;

  // ตัวชี้บนแถบสี
  $('bmiMarker').style.left = clamp(((bmi - 12) / 33) * 100, 0, 100) + '%';

  // ความชัดของรูปร่าง (ไม่จำเป็น)
  const ex = Number($('exaggeration').value);
  $('exaggerationLabel').textContent = ex.toFixed(1) + '×';

  // สูง = ตามส่วนสูง, ความกว้าง = ตาม BMI (เทียบกับ BMI 22)
  const sy = height / 170;
  let girth = 1 + (Math.pow(bmi / 22, 0.7) - 1) * ex;
  girth = clamp(girth, 0.6, 1.9);

  if (rig) rig.scale.set(sy * girth, sy, sy * girth);

  $('infoHeight').textContent = height + ' ซม.';
  $('infoGirth').textContent = Math.round(girth * 100) + '% ของปกติ';
}

// ปุ่ม
$('height').onchange = $('heightRange').oninput = (e) => {
  height = clamp(e.target.value, 120, 220);
  update();
};

$('weight').onchange = $('weightRange').oninput = (e) => {
  weight = clamp(e.target.value, 30, 200);
  update();
};
//ดึง id
// ลาก BMI แล้วน้ำหนักเปลี่ยนตาม
$('bmiRange').oninput = (e) => {
  weight = clamp(e.target.value * (height / 100) * (height / 100), 30, 200);
  weight = Math.round(weight * 10) / 10;
  update();
};

$('exaggeration').oninput = update;

$('autoRotate').onchange = (e) => {
  controls.autoRotate = e.target.checked;
  controls.autoRotateSpeed = 90;
};

$('reset').onclick = () => {
  height = 170;
  weight = 60;
  $('exaggeration').value = 1;
  update();
};

// ปรับขนาดจอ + วนแสดงผล ของโมเดลลลลลลลลลลลลล
function resize() {
  const box = $('viewport');
  renderer.setSize(box.clientWidth, box.clientHeight);
  camera.aspect = box.clientWidth / box.clientHeight;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe($('viewport'));

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

update();
animate();