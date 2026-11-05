/* =========================================================
   AI Health Assistant — chat UI (ข้อมูลตัวอย่าง + คำตอบจำลอง)
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);

/* ---------- Sample data (แก้ตรงนี้ หรือเปลี่ยนไปดึงจาก API ภายหลัง) ---------- */
const SAMPLE_REPLY =
  "This is a sample answer. I can share general health information, but I can't replace a doctor's diagnosis.";

let nextId = 100;
const conversations = [
  { id: 1, title: "How to remove a splinter at home", days: 1 },
  { id: 2, title: "What feeling is this", days: 2 },
  { id: 3, title: "What medicine for a headache", days: 3 },
  { id: 4, title: "Cheapest clinic near me", days: 4 },
  { id: 5, title: "How can I know if I have a fever", days: 7 },
  { id: 6, title: "New medicine side effects", days: 12 },
  { id: 7, title: "What is the rarest blood type", days: 22 },
  { id: 8, title: "How to become a blood donor", days: 32 },
  { id: 9, title: "Can the human body survive without sleep", days: 52 },
].map((c) => ({
  ...c,
  messages: [{ role: "user", text: c.title }, { role: "ai", text: SAMPLE_REPLY }],
}));

let activeId = null;   // null = แชตใหม่ที่ยังไม่มีข้อความ
let busy = false;

/* ---------- Helpers ---------- */
const agoText = (d) => (d === 0 ? "Today" : `${d}days Ago`);   // รูปแบบตามดีไซน์
const stage = $("#chatStage");
const messagesEl = $("#messages");
const historyEl = $("#historyList");
const input = $("#prompt");
const sendBtn = $("#send");

function renderHistory() {
  historyEl.innerHTML = "";
  conversations.forEach((c) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "history-item";
    if (c.id === activeId) btn.setAttribute("aria-current", "true");
    const t = document.createElement("span");
    t.className = "t"; t.textContent = c.title;
    const d = document.createElement("span");
    d.className = "d"; d.textContent = agoText(c.days);
    btn.append(t, d);
    btn.addEventListener("click", () => openConversation(c.id));
    li.appendChild(btn);
    historyEl.appendChild(li);
  });
}

function bubble(role, text) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;           // textContent กัน XSS
  messagesEl.appendChild(el);
  scrollDown();
  return el;
}

function scrollDown() { stage.scrollTop = stage.scrollHeight; }

function showConversation(conv) {
  messagesEl.innerHTML = "";
  const has = conv && conv.messages.length > 0;
  stage.classList.toggle("has-messages", !!has);
  if (has) conv.messages.forEach((m) => bubble(m.role, m.text));
}

function openConversation(id) {
  activeId = id;
  showConversation(conversations.find((c) => c.id === id));
  renderHistory();
  input.focus();
}

function newChat() {
  activeId = null;
  showConversation(null);
  renderHistory();
  input.value = "";
  input.focus();
}

/* ---------- ส่งข้อความไป AI ---------- */
// TODO: เปลี่ยนเป็นเรียก API จริง เช่น
//   const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: text }) });
//   return (await res.json()).reply;
async function askAI(text) {
  await new Promise((r) => setTimeout(r, 900));
  return SAMPLE_REPLY;
}

async function send(text) {
  let conv = conversations.find((c) => c.id === activeId);
  if (!conv) {
    conv = { id: nextId++, title: text.slice(0, 60), days: 0, messages: [] };
    conversations.unshift(conv);
    activeId = conv.id;
    renderHistory();
  }
  conv.messages.push({ role: "user", text });
  stage.classList.add("has-messages");
  bubble("user", text);

  busy = true; sendBtn.disabled = true;
  const typing = bubble("ai", "");
  typing.innerHTML = '<span class="typing" aria-label="AI is typing"><i></i><i></i><i></i></span>';

  try {
    const reply = await askAI(text);
    typing.textContent = reply;
    conv.messages.push({ role: "ai", text: reply });
  } catch (err) {
    console.error(err);
    typing.textContent = "Sorry, something went wrong. Please try again.";
  } finally {
    busy = false; sendBtn.disabled = false;
    scrollDown();
    input.focus();
  }
}

$("#composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  input.value = "";
  send(text);
});
$("#newChat").addEventListener("click", newChat);

/* ---------- User dropdown (navbar จาก form.html — สลับคลาส Tailwind "hidden") ---------- */
(function () {
  const btn = $("#avatarButton");
  const menu = $("#userDropdown");
  if (!btn || !menu) return;
  const setOpen = (open) => menu.classList.toggle("hidden", !open);
  btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(menu.classList.contains("hidden")); });
  document.addEventListener("click", (e) => { if (!menu.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
})();

renderHistory();
showConversation(null);
