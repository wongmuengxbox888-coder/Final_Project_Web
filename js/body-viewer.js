/* =========================================================
   Body viewer (Three.js) — ปรับจากโค้ดของเพื่อน (Anatomy BMI Viewer)
   - โหลดโมเดล .glb แล้วยืด/อ้วน/ผอมตาม Height + Weight ในฟอร์ม
   - ต้องรันผ่าน Live Server (ES modules ใช้ไม่ได้กับ file://)
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = 'model/anatomy_model.glb';   // วางไฟล์โมเดลไว้ที่นี่
const DEFAULT_H = 170;                         // ค่าเริ่มต้นเมื่อยังไม่เลือก
const DEFAULT_W = 63.6;
const EXAGGERATION = 1;                        // เพิ่มเพื่อให้เห็นอ้วน/ผอมชัดขึ้น

const $ = (id) => document.getElementById(id);
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

const view = $('bodyView');
const holder = $('bodyCanvas');

/* ---------- Scene ---------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.4, 5);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (err) {
  console.warn('WebGL ไม่พร้อมใช้งาน — แสดงรูปจำลองแทน', err);
}

if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  holder.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enableZoom = false;          // กันล้อเมาส์แย่งการเลื่อนหน้าเว็บ (เปิดได้ถ้าต้องการ)
  controls.enablePan = false;
  controls.autoRotateSpeed = 3;         // ~20 วินาทีต่อรอบ
  controls.addEventListener('start', () => view.classList.add('moved'));

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(3, 5, 4);
  scene.add(light);
  scene.add(new THREE.GridHelper(8, 32, 0xcfcfcf, 0xdddddd));

  /* ---------- Load model ---------- */
  let rig = null;   // กลุ่มที่ใช้ยืด/หดตาม BMI

  new GLTFLoader().load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene;

      // ปรับให้โมเดลสูง 1.7 หน่วย แล้ววางเท้าไว้ที่พื้น กลางจอ
      let box = new THREE.Box3().setFromObject(model);
      model.scale.setScalar(1.7 / box.getSize(new THREE.Vector3()).y);
      box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -box.min.y, -center.z);

      rig = new THREE.Group();
      rig.add(model);
      scene.add(rig);

      view.classList.add('loaded');   // ซ่อนรูปจำลอง แสดงโมเดลจริง
      resize();
      update();
    },
    undefined,
    (err) => {
      console.warn('โหลดโมเดลไม่ได้:', MODEL_URL, err);
      const msg = $('modelMsg');
      msg.hidden = false;
      msg.textContent = `ยังไม่พบไฟล์โมเดล (${MODEL_URL}) — แสดงรูปจำลองแทน`;
    }
  );

  /* ---------- BMI + body shape ---------- */
  function category(bmi) {   // เกณฑ์ BMI มาตรฐานเอเชีย
    if (bmi < 18.5) return ['ผอม', 'thin'];
    if (bmi < 23)   return ['ปกติ', 'normal'];
    if (bmi < 25)   return ['น้ำหนักเกิน', 'over'];
    if (bmi < 30)   return ['อ้วน', 'obese'];
    return ['อ้วนมาก', 'obese2'];
  }

  function update() {
    const hSel = Number($('height').value);
    const wSel = Number($('weight').value);
    const height = hSel || DEFAULT_H;
    const weight = wSel || DEFAULT_W;
    const bmi = weight / ((height / 100) ** 2);

    // แสดง BMI เมื่อเลือกครบทั้งส่วนสูงและน้ำหนัก
    const info = $('bmiInfo');
    info.hidden = !(hSel && wSel);
    if (!info.hidden) {
      const [text, cls] = category(bmi);
      $('bmiValue').textContent = bmi.toFixed(1);
      $('bmiCat').textContent = text;
      $('bmiCat').className = 'bmi-cat ' + cls;
    }

    // สูง = ตามส่วนสูง, ความกว้าง = ตาม BMI (เทียบกับ BMI 22)
    const sy = height / DEFAULT_H;
    const girth = clamp(1 + (Math.pow(bmi / 22, 0.7) - 1) * EXAGGERATION, 0.6, 1.9);
    if (rig) rig.scale.set(sy * girth, sy, sy * girth);
  }

  $('height').addEventListener('change', update);
  $('weight').addEventListener('change', update);

  /* ---------- Spin button ---------- */
  $('spinBtn').addEventListener('click', (e) => {
    controls.autoRotate = !controls.autoRotate;
    e.currentTarget.setAttribute('aria-pressed', controls.autoRotate);
    view.classList.add('moved');
  });

  /* ---------- Resize + render loop (หยุดเมื่อเลื่อนพ้นจอ) ---------- */
  function resize() {
    const w = holder.clientWidth, h = holder.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(holder);

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(view);

  (function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  })();
}
