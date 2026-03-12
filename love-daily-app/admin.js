const adminLockElement = document.getElementById("admin-lock");
const adminAppElement = document.getElementById("admin-app");
const adminPasscodeInput = document.getElementById("admin-passcode");
const adminUnlockButton = document.getElementById("admin-unlock");
const adminLockErrorElement = document.getElementById("admin-lock-error");
const filterDateInput = document.getElementById("filter-date");
const loadAnswersButton = document.getElementById("load-answers");
const adminStatusElement = document.getElementById("admin-status");
const answersListElement = document.getElementById("answers-list");

const ADMIN_PASSCODE = "loveadmin";

function getDayOfYearForAdmin(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

async function loadAnswersForDay(dayNumber) {
  if (!window.supabase) {
    adminStatusElement.textContent = "Supabase chưa được cấu hình đúng. Kiểm tra lại supabase.js.";
    answersListElement.innerHTML = "";
    return;
  }

  adminStatusElement.textContent = "Đang tải dữ liệu...";
  answersListElement.innerHTML = "";

  const { data, error } = await window.supabase
    .from("answers")
    .select("*")
    .eq("day_number", dayNumber)
    .order("created_at", { ascending: true });

  if (error) {
    adminStatusElement.textContent = "Không tải được dữ liệu. Em kiểm tra lại cấu hình Supabase giúp anh.";
    answersListElement.innerHTML = "";
    return;
  }

  if (!data || data.length === 0) {
    adminStatusElement.textContent = "Không có câu trả lời nào cho ngày này.";
    answersListElement.innerHTML = "";
    return;
  }

  adminStatusElement.textContent = `Có ${data.length} câu trả lời cho ngày này.`;

  const fragments = document.createDocumentFragment();

  data.forEach((row) => {
    const item = document.createElement("div");
    item.className = "admin-answer-item";

    const meta = document.createElement("div");
    meta.className = "admin-answer-meta";
    meta.textContent = `${formatDateTime(row.created_at)} · Ngày thứ ${row.day_number}`;

    const question = document.createElement("div");
    question.className = "admin-answer-question";
    question.textContent = row.question || "";

    const answer = document.createElement("div");
    answer.className = "admin-answer-text";
    answer.textContent = row.answer || "";

    item.appendChild(meta);
    item.appendChild(question);
    item.appendChild(answer);

    fragments.appendChild(item);
  });

  answersListElement.innerHTML = "";
  answersListElement.appendChild(fragments);
}

function handleUnlock() {
  const value = adminPasscodeInput.value.trim();
  if (!value) {
    adminLockErrorElement.textContent = "Anh cần nhập mật mã.";
    adminLockErrorElement.classList.remove("hidden");
    return;
  }

  if (value !== ADMIN_PASSCODE) {
    adminLockErrorElement.textContent = "Mật mã chưa đúng.";
    adminLockErrorElement.classList.remove("hidden");
    return;
  }

  adminLockErrorElement.classList.add("hidden");
  adminLockElement.classList.add("hidden");
  adminAppElement.classList.remove("hidden");

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  filterDateInput.value = `${yyyy}-${mm}-${dd}`;

  const dayNumber = getDayOfYearForAdmin(today);
  loadAnswersForDay(dayNumber);
}

function handleLoadAnswersClick() {
  const raw = filterDateInput.value;
  if (!raw) {
    adminStatusElement.textContent = "Anh hãy chọn một ngày.";
    answersListElement.innerHTML = "";
    return;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    adminStatusElement.textContent = "Ngày không hợp lệ.";
    answersListElement.innerHTML = "";
    return;
  }
  const dayNumber = getDayOfYearForAdmin(date);
  loadAnswersForDay(dayNumber);
}

function initAdminPage() {
  if (!adminUnlockButton || !adminPasscodeInput || !loadAnswersButton) {
    return;
  }
  adminUnlockButton.addEventListener("click", handleUnlock);
  adminPasscodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleUnlock();
    }
  });
  loadAnswersButton.addEventListener("click", handleLoadAnswersClick);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdminPage);
} else {
  initAdminPage();
}
