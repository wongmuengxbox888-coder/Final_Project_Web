/* =========================================================
   My Health page — sample data + interactions
   ========================================================= */

/* ---------- Sample data (แก้ตรงนี้ หรือเปลี่ยนไปดึงจาก API ภายหลัง) ---------- */
const SAMPLE_SYMPTOMS = [
  { id: "s1", date: "2026-03-14", name: "ปวดหัว",     level: "mid" },
  { id: "s2", date: "2026-03-10", name: "ไอ เสมหะ",   level: "mid" },
  { id: "s3", date: "2026-03-05", name: "ไข้ ตัวร้อน", level: "severe" },
  { id: "s4", date: "2026-03-04", name: "อ่อนเพลีย",   level: "mid" },
  { id: "s5", date: "2026-03-03", name: "ไอ",          level: "mild" },
  { id: "s6", date: "2026-03-03", name: "มีไข้",       level: "mid" },
];
// กล่อง "อาการล่าสุด" ตามดีไซน์ — ใช้จนกว่าผู้ใช้จะบันทึกอาการของตัวเอง
const LATEST_DEFAULT = { name: "ปวดหัวเล็กน้อย", level: "mild" };
const ROWS_PREVIEW = 6;   // จำนวนแถวที่แสดงก่อนกด "ดูทั้งหมด"
const LEVELS = {
  mild:   { label: "ไม่รุนแรง", cls: "badge-mild" },
  mid:    { label: "ปานกลาง",   cls: "badge-mid" },
  severe: { label: "รุนแรง",    cls: "badge-severe" },
};

const HOSPITALS = [
  { name: "โรงพยาบาลศิริราช",       tags: ["ทั่วไป", "อายุรกรรม", "กระดูก"],      dist: "12 กม." },
  { name: "โรงพยาบาลกรุงเทพ",       tags: ["ทั่วไป", "ทันตแพทย์", "ศัลยกรรม"],    dist: "12 กม." },
  { name: "โรงพยาบาลลาดพร้าวกรณ์",  tags: ["ทั่วไป", "อายุรกรรม", "ศัลยกรรม"],    dist: "12 กม." },
];

const TREATMENTS = [
  { name: "ตรวจสุขภาพทั่วไป", cost: 2000 },
  { name: "พบแพทย์ทั่วไป",     cost: 800 },
  { name: "ตรวจเลือดครบชุด",   cost: 1500 },
  { name: "ทันตกรรม",          cost: 1200 },
  { name: "เอกซเรย์ / อัลตราซาวด์", cost: 2500 },
];

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = (n) => Math.round(n).toLocaleString("th-TH");
// ผูก event แบบปลอดภัย: ถ้าไม่พบ element (เช่น my-health.html เป็นเวอร์ชันเก่า) ให้เตือนใน Console แล้วไปต่อ ไม่ให้ทั้งหน้าพัง
const on = (sel, evt, fn) => {
  const el = $(sel);
  if (el) el.addEventListener(evt, fn);
  else console.warn(`[my-health] ไม่พบ ${sel} — ตรวจว่า my-health.html เป็นเวอร์ชันล่าสุด`);
};

/* =========================================================
   1) วันที่ + ข้อมูลอาการ (ตัวอย่าง + ที่ผู้ใช้บันทึกเอง)
   ========================================================= */
const USE_REAL_TODAY = false;  // true = ใช้วันที่จริงของเครื่อง | false = ล็อกที่ 14 มี.ค. 2026 ให้ตรงกับดีไซน์และข้อมูลตัวอย่าง
const TODAY = USE_REAL_TODAY ? new Date() : new Date(2026, 2, 14);

const THAI_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
// "14 มี.ค. 2569" (compact → "14 มี.ค.2569" ตามหัวข้ออัปเดตล่าสุดในดีไซน์)
function thaiDate(iso, compact = false) {
  const d = fromISO(iso);
  return `${pad2(d.getDate())} ${THAI_MON[d.getMonth()]}${compact ? "" : " "}${d.getFullYear() + 543}`;
}

/* ---- อาการที่ผู้ใช้บันทึก: เก็บใน localStorage (ทดลองเท่านั้น — ของจริงควรเก็บที่ backend) ---- */
const STORE_KEY = "wplus.symptoms.v1";
const isLevel = (v) => Object.prototype.hasOwnProperty.call(LEVELS, v);
const validEntry = (e) =>
  e && typeof e.id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
  typeof e.name === "string" && e.name.trim() !== "" && isLevel(e.level);
function loadUserSymptoms() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(validEntry) : [];
  } catch (err) { return []; }
}
function saveUserSymptoms(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
  catch (err) { return false; }
}
let userSymptoms = loadUserSymptoms();

// ใหม่สุดก่อน: เรียงตามวันที่ (มาก→น้อย) วันเดียวกันให้ที่บันทึกล่าสุด/ของผู้ใช้ขึ้นก่อนตัวอย่าง
function allSymptoms() {
  const mine = [...userSymptoms].reverse().map((e) => ({ ...e, mine: true }));
  return mine.concat(SAMPLE_SYMPTOMS).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

let activeFilter = null;   // { from: "YYYY-MM-DD", to: "YYYY-MM-DD" } หรือ null = ทั้งหมด
let showAll = false;

/* =========================================================
   2) Calendar (เลือกวัน/ช่วงวัน → กรองประวัติอาการ)
   ========================================================= */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const cal = { year: TODAY.getFullYear(), month: TODAY.getMonth(), selected: new Date(TODAY), rangeStart: null };

function sameDay(a, b) { return a && b && a.toDateString() === b.toDateString(); }

function renderCalendar() {
  const box = $("#calDays");
  box.innerHTML = "";
  const marked = new Set(allSymptoms().map((s) => s.date));   // วันที่มีบันทึกอาการ → แสดงจุดเล็ก ๆ
  const first = new Date(cal.year, cal.month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
  const prevDays = new Date(cal.year, cal.month, 0).getDate();
  const cells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  for (let i = 0; i < cells; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    let d, date, out = false;
    if (i < startOffset) { d = prevDays - startOffset + i + 1; date = new Date(cal.year, cal.month - 1, d); out = true; }
    else if (i >= startOffset + daysInMonth) { d = i - startOffset - daysInMonth + 1; date = new Date(cal.year, cal.month + 1, d); out = true; }
    else { d = i - startOffset + 1; date = new Date(cal.year, cal.month, d); }

    btn.textContent = d;
    if (out) { btn.classList.add("out"); btn.disabled = true; }
    if (!out && marked.has(toISO(date))) {
      btn.classList.add("has-entry");
      btn.setAttribute("aria-label", `${d} — มีบันทึกอาการ`);
    }
    if (cal.rangeStart && cal.selected && date >= cal.rangeStart && date <= cal.selected && !out) btn.classList.add("in-range");
    if (sameDay(date, cal.selected)) btn.classList.add("sel");
    btn.addEventListener("click", () => {
      cal.selected = date; cal.rangeStart = null;
      $$(".cal-presets [data-preset]").forEach((c) => c.classList.remove("on"));
      renderCalendar();   // เลือกวันแล้วกด Apply เพื่อกรอง
    });
    box.appendChild(btn);
  }

  $$("#calMonths li").forEach((li, i) => li.classList.toggle("cur", i === cal.month));
}

function renderMonths() {
  const ul = $("#calMonths");
  ul.innerHTML = MONTHS.map((m, i) => `<li data-m="${i}">${m}</li>`).join("");
  ul.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    cal.month = +li.dataset.m;
    renderCalendar();
  });
  // เลื่อนให้เดือนปัจจุบันอยู่กลาง
  requestAnimationFrame(() => {
    const cur = $("#calMonths li:nth-child(" + (cal.month + 1) + ")");
    if (cur) ul.scrollTop = cur.offsetTop - ul.clientHeight / 2 + cur.clientHeight / 2;
  });
}

function setPreset(kind) {
  const end = new Date(TODAY);
  let start = null;
  if (kind === "week") { start = new Date(end); start.setDate(end.getDate() - 7); }                       // 8 วันล่าสุด
  if (kind === "month") { start = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate()); }       // 1 เดือนที่ผ่านมา
  cal.selected = end; cal.rangeStart = start;
  cal.year = end.getFullYear(); cal.month = end.getMonth();
  renderCalendar();
}

// ใช้ช่วงวันที่เลือกในปฏิทินเป็นตัวกรองประวัติ
function applySelection() {
  if (!cal.selected) { clearFilter(); return; }
  const to = toISO(cal.selected);
  const from = cal.rangeStart ? toISO(cal.rangeStart) : to;
  activeFilter = { from, to };
  showAll = false;
  renderHistory();
}

function clearFilter() {
  activeFilter = null;
  cal.rangeStart = null;
  $$(".cal-presets [data-preset]").forEach((b) => b.classList.remove("on"));
  renderCalendar();
  renderHistory();
}

$$(".cal-presets [data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".cal-presets [data-preset]").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    setPreset(btn.dataset.preset);
    applySelection();   // ปุ่มลัดกรองทันที
  });
});
on("#calToggle", "click", () => $("#calMonths").classList.toggle("hidden-months"));
on("#calClear", "click", () => { cal.selected = null; clearFilter(); });
on("#calApply", "click", applySelection);

/* =========================================================
   3) Symptom history + latest + hospitals
   ========================================================= */
function renderHistory() {
  const all = allSymptoms();
  let rows = activeFilter ? all.filter((s) => s.date >= activeFilter.from && s.date <= activeFilter.to) : all;
  const total = rows.length;
  if (!activeFilter && !showAll) rows = rows.slice(0, ROWS_PREVIEW);

  const tbody = $("#historyTable tbody");
  tbody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3; td.className = "empty";
    td.textContent = "ไม่มีอาการที่บันทึกไว้ในช่วงนี้";
    tr.appendChild(td); tbody.appendChild(tr);
  }

  rows.forEach((s) => {
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.textContent = thaiDate(s.date);

    const tdName = document.createElement("td");
    tdName.textContent = s.name;                      // textContent กัน XSS
    if (s.note) {
      const small = document.createElement("small");
      small.className = "note"; small.textContent = s.note;
      tdName.appendChild(small);
    }

    const tdLevel = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge " + LEVELS[s.level].cls;
    badge.textContent = LEVELS[s.level].label;
    tdLevel.appendChild(badge);
    if (s.mine) {
      const del = document.createElement("button");
      del.type = "button"; del.className = "row-del";
      del.textContent = "×";
      del.setAttribute("aria-label", `ลบอาการ ${s.name}`);
      del.addEventListener("click", () => {
        if (!confirm(`ลบอาการ "${s.name}" ใช่ไหม?`)) return;
        userSymptoms = userSymptoms.filter((e) => e.id !== s.id);
        saveUserSymptoms(userSymptoms);
        renderAll();
      });
      tdLevel.appendChild(del);
    }

    tr.append(tdDate, tdName, tdLevel);
    tbody.appendChild(tr);
  });

  // ข้อความบอกตัวกรอง + ลิงก์ "ดูทั้งหมด"
  const note = $("#filterNote");
  if (note) {
    note.hidden = !activeFilter;
    if (activeFilter) {
      const label = activeFilter.from === activeFilter.to
        ? thaiDate(activeFilter.from)
        : `${thaiDate(activeFilter.from)} – ${thaiDate(activeFilter.to)}`;
      const txt = $("#filterText");
      if (txt) txt.textContent = `กำลังแสดง: ${label} · ${total} รายการ`;
    }
  }
  const link = $("#linkAllHistory");
  if (link) {
    link.hidden = !!activeFilter || all.length <= ROWS_PREVIEW;
    link.textContent = showAll ? "แสดงน้อยลง" : "ดูทั้งหมด →";
  }
}

// กล่อง "อาการล่าสุด" + วันที่อัปเดตล่าสุด
function renderLatest() {
  const top = allSymptoms()[0];
  const useReal = userSymptoms.length > 0;
  const name = useReal ? top.name : LATEST_DEFAULT.name;
  const level = useReal ? top.level : LATEST_DEFAULT.level;
  const title = $("#latestTitle"), badge = $("#latestBadge"), upd = $("#updatedDate");
  if (title) title.textContent = name;
  if (badge) { badge.className = "badge " + LEVELS[level].cls; badge.textContent = LEVELS[level].label; }
  if (upd) upd.textContent = thaiDate(top.date, true);
}

function renderAll() {
  renderCalendar();
  renderHistory();
  renderLatest();
}

on("#linkAllHistory", "click", (e) => { e.preventDefault(); showAll = !showAll; renderHistory(); });
on("#filterClear", "click", clearFilter);

function renderHospitals() {
  $("#hospList").innerHTML = HOSPITALS.map(h => `
    <li>
      <h3>${h.name}</h3>
      <div class="hosp-tags">
        ${h.tags.map(t => `<span class="tag">${t}</span>`).join("")}
        <span class="hosp-dist">${h.dist} <span aria-hidden="true">›</span></span>
      </div>
    </li>`).join("");
}

on("#btnRefresh", "click", (e) => {
  const b = e.currentTarget;
  b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
  userSymptoms = loadUserSymptoms();   // โหลดข้อมูลล่าสุดจาก storage
  renderAll();
});

/* =========================================================
   3) Cost calculator
   ========================================================= */
const treatSel = $("#treatType");
treatSel.innerHTML = TREATMENTS.map((t, i) => `<option value="${i}">${t.name}</option>`).join("");

let payMode = "insurance";

/* ---- Package ประกัน (ข้อมูลตัวอย่าง — แก้ discount ให้ตรงกับของจริงที่นี่) ---- */
const PACKAGES = [
  { id: "basic",   name: "แผนคุ้มครองปกติ",    price: 590,  discount: 0.10 },
  { id: "premium", name: "แผนคุ้มครอง Premium", price: 1590, discount: 0.30 },
  { id: "plus",    name: "แผนคุ้มครอง Plus",    price: 990,  discount: 0.20 },
];
const pkgSel = $("#package");
pkgSel.innerHTML = '<option value="">เลือก Package ที่มีอยู่</option>' +
  PACKAGES.map((p) => `<option value="${p.id}">${p.name} · ฿${fmt(p.price)}</option>`).join("");

function updateEstimate() {
  const base = TREATMENTS[+treatSel.value].cost;
  const budget = +$("#budget").value || 0;
  let total = base;
  let hint = "";

  if (payMode === "insurance") {
    const plan = PACKAGES.find((p) => p.id === pkgSel.value);
    if (plan) { total = base * (1 - plan.discount); hint = `ราคาปกติ ${fmt(base)} บาท · ส่วนลดจาก ${plan.name} ${Math.round(plan.discount * 100)}%`; }
    else { hint = "เลือก Package เพื่อดูราคาหลังหักส่วนลด"; }
  }
  $("#estimate").textContent = `${fmt(total)} บาท`;
  if (budget && total > budget) hint = `เกินงบ ${fmt(total - budget)} บาท` + (hint ? " · " + hint : "");
  else if (budget && total <= budget && payMode === "self") hint = `อยู่ในงบ เหลือ ${fmt(budget - total)} บาท`;
  $("#estimateHint").textContent = hint;
}

treatSel.addEventListener("change", () => {
  $("#budget").value = TREATMENTS[+treatSel.value].cost;
  updateEstimate();
});
on("#budget", "input", updateEstimate);
on("#package", "change", updateEstimate);

$$(".pay-opt").forEach(btn => {
  btn.addEventListener("click", () => {
    payMode = btn.dataset.pay;
    $$(".pay-opt").forEach(b => { const on = b === btn; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); });
    $("#insuranceBox").hidden = payMode !== "insurance";
    updateEstimate();
  });
});

on("#btnConfirm", "click", () => {
  const t = TREATMENTS[+treatSel.value].name;
  $("#costToast").textContent = `บันทึกประมาณการ "${t}" ${$("#estimate").textContent} แล้ว`;
  // TODO: ส่งข้อมูลไป backend
});

/* =========================================================
   4) Symptom Checker — selects, form, drag-to-spin body
   ========================================================= */
function fillSelect(id, from, to, step, suffix, blank) {
  const el = $(id);
  let html = `<option value="">${blank}</option>`;
  for (let v = from; v <= to; v += step) html += `<option value="${v}">${v}${suffix}</option>`;
  el.innerHTML = html;
}
  fillSelect("#age", 1, 100, 1, "", "");
  fillSelect("#height", 100, 220, 1, " cm", "");
  fillSelect("#weight", 30, 160, 1, " kg", "");
on("#checkerForm", "submit", (e) => {
  e.preventDefault();
  const out = $("#checkResult");
  const text = $("#symptom").value.trim();
  if (!$("#age").value || !text) {
    out.innerHTML = `<span class="err">กรุณาเลือกอายุและพิมพ์อาการของคุณ</span>`;
    return;
  }
  const data = {
    age: +$("#age").value,
    gender: $('input[name="gender"]:checked').value,
    height: +$("#height").value || null,
    weight: +$("#weight").value || null,
    symptom: text,
  };
  console.log("Symptom check payload:", data); // TODO: ส่งไป API / AI จริง
  out.textContent = `รับข้อมูลแล้ว: "${text}" — (ตัวอย่าง) ระบบกำลังประเมินอาการเบื้องต้น`;
});

/* =========================================================
   5) Misc buttons + init
   ========================================================= */
/* ---- บันทึกอาการใหม่ (dialog) ---- */
const dlg = $("#symptomDialog");
const sForm = $("#symptomForm");
let msgTimer;
function flashMsg(text) {
  const el = $("#saveMsg");
  if (!el) return;
  el.textContent = text;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.textContent = ""; }, 4000);
}

on("#btnNew", "click", () => {
  if (!dlg || !sForm) { alert("ต้องอัปเดต my-health.html เป็นเวอร์ชันล่าสุดก่อน จึงจะบันทึกอาการได้"); return; }
  sForm.reset();                                   // ความรุนแรงกลับเป็น "ปานกลาง"
  $("#sDate").value = toISO(TODAY);
  $("#sDate").max = toISO(TODAY);                  // บันทึกล่วงหน้าไม่ได้
  $("#sErr").textContent = "";
  dlg.showModal();
});
on("#sCancel", "click", () => dlg.close());

on("#symptomForm", "submit", (e) => {
  e.preventDefault();
  const name = $("#sName").value.trim();
  const date = $("#sDate").value;
  const checked = sForm.querySelector('input[name="sLevel"]:checked');
  const level = checked ? checked.value : "";
  const err = $("#sErr");
  if (!name) { err.textContent = "กรุณากรอกอาการ"; $("#sName").focus(); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { err.textContent = "กรุณาเลือกวันที่"; $("#sDate").focus(); return; }
  if (date > toISO(TODAY)) { err.textContent = "เลือกวันที่หลังวันนี้ไม่ได้"; $("#sDate").focus(); return; }
  if (!isLevel(level)) { err.textContent = "กรุณาเลือกความรุนแรง"; return; }

  const id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  userSymptoms.push({ id, date, name, level, note: $("#sNote").value.trim() });
  const saved = saveUserSymptoms(userSymptoms);
  dlg.close();

  // แสดงอาการที่เพิ่งบันทึกในปฏิทิน + ตาราง (ล้างตัวกรองเดิม)
  const d = fromISO(date);
  activeFilter = null; showAll = false; cal.rangeStart = null; cal.selected = d;
  cal.year = d.getFullYear(); cal.month = d.getMonth();
  $$(".cal-presets [data-preset]").forEach((b) => b.classList.remove("on"));
  renderAll();
  flashMsg(saved ? "บันทึกอาการแล้ว" : "บันทึกแล้ว แต่เก็บในเบราว์เซอร์ไม่ได้ ข้อมูลจะหายเมื่อรีเฟรช");
});

// ดูประวัติทั้งหมด = ล้างตัวกรอง แล้วแสดงทุกแถว
on("#btnHistory", "click", () => {
  showAll = true;
  clearFilter();
  $(".history-head").scrollIntoView({ behavior: "smooth", block: "center" });
});
$$("[data-go]").forEach(b => b.addEventListener("click", () => {
  if (b.dataset.go === "ai") $("#checkerTitle").scrollIntoView({ behavior: "smooth" });
  else alert("TODO: ไปหน้านัดหมายแพทย์");
}));

renderMonths();
renderAll();
renderHospitals();
updateEstimate();


/* =========================================================
   6) User dropdown (navbar จาก form.html — สลับคลาส Tailwind "hidden")
   ========================================================= */
(function () {
  const btn = $("#avatarButton");
  const menu = $("#userDropdown");
  if (!btn || !menu) return;
  const setOpen = (open) => menu.classList.toggle("hidden", !open);
  btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(menu.classList.contains("hidden")); });
  document.addEventListener("click", (e) => { if (!menu.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
})();
