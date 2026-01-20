// ---------------------
// LocalStorage DB
// ---------------------
const STORAGE_KEY = "todo_lists_v2";

function loadDB() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { lists: [] };
  } catch {
    return { lists: [] };
  }
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ---------------------
// Name Save
// ---------------------
const nameInput = document.getElementById("nameInput");
nameInput.value = localStorage.getItem("todo_user_name") || "";

nameInput.addEventListener("input", () => {
  localStorage.setItem("todo_user_name", nameInput.value);
});

// ---------------------
// IST Date + Time
// ---------------------
const todayDateEl = document.getElementById("todayDate");
const liveTimeEl = document.getElementById("liveTime");

function getISTDateTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60000);
}

function formatDateIST(d) {
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatTimeIST(d) {
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

function updateDateTime() {
  const ist = getISTDateTime();
  todayDateEl.innerText = formatDateIST(ist);
  liveTimeEl.innerText = formatTimeIST(ist);
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ---------------------
// UI Render
// ---------------------
const cardsWrap = document.getElementById("cardsWrap");
const emptyState = document.getElementById("emptyState");

const cardColors = [
  "#fff1dd",
  "#fef3c7",
  "#e7f7ee",
  "#e6f0ff",
  "#fde7f3",
  "#efeaff",
  "#e6fbfb"
];

function render() {
  const db = loadDB();
  const lists = db.lists || [];

  cardsWrap.innerHTML = "";

  emptyState.style.display = lists.length === 0 ? "block" : "none";

  lists.forEach((list, index) => {
    const card = document.createElement("section");
    card.className = "card";
    card.setAttribute("draggable", "true");
    card.dataset.date = list.date;
    card.style.background = cardColors[index % cardColors.length];

    card.innerHTML = `
      <div class="card-top">
        <button class="card-delete" title="Delete this card">✖</button>

        <div class="card-date-wrap">
          <span class="card-date-text">${list.date}</span>
          <input class="card-date-edit" type="date"/>
        </div>
      </div>

      <form class="task-form">
        <input class="task-input" placeholder="Add task for this date..." required />
        <button class="add-task-btn" type="submit">Add</button>
      </form>

      <ul class="task-list"></ul>
    `;

    // Delete card
    card.querySelector(".card-delete").addEventListener("click", () => {
      if (!confirm("Delete this date card?")) return;
      const db2 = loadDB();
      db2.lists = db2.lists.filter((x) => x.date !== list.date);
      saveDB(db2);
      render();
    });

    // Edit date on click
    const dateText = card.querySelector(".card-date-text");
    const dateEdit = card.querySelector(".card-date-edit");

    dateText.addEventListener("click", () => {
      dateEdit.value = list.date;
      dateText.style.display = "none";
      dateEdit.style.display = "inline-block";
      dateEdit.focus();
    });

    dateEdit.addEventListener("blur", () => {
      dateEdit.style.display = "none";
      dateText.style.display = "inline-block";
    });

    dateEdit.addEventListener("change", () => {
      const newDate = dateEdit.value;
      if (!newDate || newDate === list.date) return;

      const db3 = loadDB();
      if (db3.lists.some((x) => x.date === newDate)) {
        alert("Date already exists!");
        return;
      }

      const target = db3.lists.find((x) => x.date === list.date);
      if (target) target.date = newDate;

      saveDB(db3);
      render();
    });

    // Add task
    const form = card.querySelector(".task-form");
    const input = card.querySelector(".task-input");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      const db4 = loadDB();
      const target = db4.lists.find((x) => x.date === list.date);
      if (!target) return;

      target.tasks.push({
        id: Date.now().toString(),
        text,
        done: false
      });

      saveDB(db4);
      input.value = "";
      render();
    });

    // Render tasks
    const ul = card.querySelector(".task-list");
    (list.tasks || []).forEach((t) => {
      const li = document.createElement("li");
      li.className = "task-item" + (t.done ? " done" : "");
      li.innerHTML = `
        <button class="tick-btn" type="button"><span class="tick-icon">${t.done ? "✔" : ""}</span></button>
        <span class="task-text">${t.text}</span>
        <button class="delete-btn" type="button">✖</button>
      `;

      // Toggle done
      li.querySelector(".tick-btn").addEventListener("click", () => {
        const db5 = loadDB();
        const target = db5.lists.find((x) => x.date === list.date);
        const task = target.tasks.find((x) => x.id === t.id);
        task.done = !task.done;
        saveDB(db5);
        render();
      });

      // Delete task
      li.querySelector(".delete-btn").addEventListener("click", () => {
        const db6 = loadDB();
        const target = db6.lists.find((x) => x.date === list.date);
        target.tasks = target.tasks.filter((x) => x.id !== t.id);
        saveDB(db6);
        render();
      });

      // Edit task on click
      li.querySelector(".task-text").addEventListener("click", () => {
        const oldText = t.text;
        const edit = prompt("Edit Task:", oldText);
        if (!edit || !edit.trim()) return;

        const db7 = loadDB();
        const target = db7.lists.find((x) => x.date === list.date);
        const task = target.tasks.find((x) => x.id === t.id);
        task.text = edit.trim();
        saveDB(db7);
        render();
      });

      ul.appendChild(li);
    });

    cardsWrap.appendChild(card);
  });

  enableDragDrop();
}

// ---------------------
// Create Date Card
// ---------------------
const modal = document.getElementById("modal");
const fabBtn = document.getElementById("fabBtn");
const modalClose = document.getElementById("modalClose");
const createCardBtn = document.getElementById("createCardBtn");
const newCardDate = document.getElementById("newCardDate");

fabBtn.addEventListener("click", () => modal.classList.add("show"));
modalClose.addEventListener("click", () => modal.classList.remove("show"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("show");
});

createCardBtn.addEventListener("click", () => {
  const date = newCardDate.value;
  if (!date) return alert("Please select a date!");

  const db = loadDB();
  if (db.lists.some((x) => x.date === date)) {
    alert("Date card already exists!");
    return;
  }

  db.lists.unshift({ date, tasks: [] });
  saveDB(db);

  newCardDate.value = "";
  modal.classList.remove("show");
  render();
});

// ---------------------
// Drag & Drop reorder
// ---------------------
function enableDragDrop() {
  let dragged = null;

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      dragged = card;
      card.style.opacity = "0.6";
    });

    card.addEventListener("dragend", () => {
      card.style.opacity = "1";
      dragged = null;

      const order = [...document.querySelectorAll(".card")].map((c) => c.dataset.date);
      const db = loadDB();

      const map = new Map(db.lists.map((x) => [x.date, x]));
      db.lists = order.map((d) => map.get(d)).filter(Boolean);

      saveDB(db);
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getAfterElement(cardsWrap, e.clientY);
      if (!afterElement) cardsWrap.appendChild(dragged);
      else cardsWrap.insertBefore(dragged, afterElement);
    });
  });
}

function getAfterElement(container, y) {
  const els = [...container.querySelectorAll(".card")];

  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ---------------------
// Floating Dots (Double)
// ---------------------
const dotsLayer = document.getElementById("dotsLayer");
const totalDots = 80;
const dots = [];

for (let i = 0; i < totalDots; i++) {
  const dot = document.createElement("div");
  dot.className = "dot";
  dot.style.background = "lightgreen";
  dotsLayer.appendChild(dot);

  dots.push({
    el: dot,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5
  });
}

function animateDots() {
  dots.forEach((d) => {
    d.x += d.vx;
    d.y += d.vy;

    if (d.x < 0 || d.x > window.innerWidth) d.vx *= -1;
    if (d.y < 0 || d.y > window.innerHeight) d.vy *= -1;

    d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
  });

  requestAnimationFrame(animateDots);
}
animateDots();

// Start
render();
