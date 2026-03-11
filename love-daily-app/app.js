const greetingElement = document.getElementById("greeting");
const dateElement = document.getElementById("today");
const questionTextElement = document.getElementById("question-text");
const answerInput = document.getElementById("answer");
const submitButton = document.getElementById("submit-answer");
const responseMessageElement = document.getElementById("response-message");
const streakMessageElement = document.getElementById("streak-message");
const surpriseElement = document.getElementById("surprise");

const STREAK_COUNT_KEY = "love_daily_streak_count";
const LAST_ANSWER_DATE_KEY = "love_daily_last_answer_date";

const cuteResponses = [
  "Anh thích câu trả lời này ❤️",
  "Nghe có vẻ rất tuyệt",
  "Anh cũng muốn làm điều đó cùng em",
  "Nghe giống một buổi hẹn hò hoàn hảo",
  "Câu trả lời này làm anh mỉm cười đó"
];

const surpriseMessages = [
  "💌 Chỉ muốn nói là anh rất thích em",
  "Hy vọng hôm nay em có một ngày thật vui",
  "Anh đang nghĩ về em đó",
  "Cảm ơn em vì đã ở bên anh",
  "Chúc em hôm nay nhận được thật nhiều điều dễ thương"
];

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getGreetingByTime(date) {
  const hour = date.getHours();
  if (hour < 12) {
    return "Chào buổi sáng ☀️";
  }
  if (hour < 18) {
    return "Chào buổi chiều 🌤";
  }
  return "Chào buổi tối 🌙";
}

function formatVietnameseDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

async function loadQuestions() {
  const response = await fetch("questions.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Không thể tải danh sách câu hỏi");
  }
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Danh sách câu hỏi không hợp lệ");
  }
  return data;
}

function getRandomItem(list) {
  if (!list || list.length === 0) {
    return "";
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function calculateStreak(today) {
  const lastDateRaw = localStorage.getItem(LAST_ANSWER_DATE_KEY);
  const streakRaw = localStorage.getItem(STREAK_COUNT_KEY);
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!lastDateRaw || !streakRaw) {
    return { streak: 1, dateToStore: currentDate.toISOString() };
  }

  const lastDate = new Date(lastDateRaw);
  const normalizedLast = new Date(
    lastDate.getFullYear(),
    lastDate.getMonth(),
    lastDate.getDate()
  );

  const diffMs = currentDate.getTime() - normalizedLast.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const previousStreak = Number(streakRaw) || 1;

  if (diffDays === 0) {
    return { streak: previousStreak, dateToStore: lastDateRaw, noIncrement: true };
  }

  if (diffDays === 1) {
    return { streak: previousStreak + 1, dateToStore: currentDate.toISOString() };
  }

  return { streak: 1, dateToStore: currentDate.toISOString() };
}

function updateStreak(today) {
  const result = calculateStreak(today);

  if (!result.noIncrement) {
    localStorage.setItem(STREAK_COUNT_KEY, String(result.streak));
    localStorage.setItem(LAST_ANSWER_DATE_KEY, result.dateToStore);
  }

  if (result.streak >= 2) {
    streakMessageElement.textContent = `🔥 Em đã trả lời ${result.streak} ngày liên tiếp rồi đó`;
    streakMessageElement.classList.remove("hidden");
  }
}

async function saveAnswer(question, answerText, today) {
  if (!window.supabase) {
    return { error: new Error("Chưa cấu hình Supabase. Vui lòng kiểm tra supabase.js.") };
  }

  const { error } = await window.supabase.from("answers").insert([
    {
      question,
      answer: answerText,
      created_at: today.toISOString()
    }
  ]);

  if (error) {
    return { error };
  }

  return { error: null };
}

function maybeShowSurprise() {
  const chance = Math.random();
  if (chance <= 0.1) {
    const message = getRandomItem(surpriseMessages);
    if (message) {
      surpriseElement.textContent = message;
      surpriseElement.classList.remove("hidden");
    }
  }
}

async function init() {
  const now = new Date();
  greetingElement.textContent = getGreetingByTime(now);
  dateElement.textContent = `Hôm nay là: ${formatVietnameseDate(now)}`;

  maybeShowSurprise();

  try {
    const questions = await loadQuestions();
    const dayOfYear = getDayOfYear(now);
    const question = questions[dayOfYear % questions.length];
    questionTextElement.textContent = question;

    submitButton.addEventListener("click", async () => {
      const answerText = answerInput.value.trim();
      responseMessageElement.classList.add("hidden");

      if (!answerText) {
        responseMessageElement.textContent = "Em hãy viết gì đó trước khi gửi nhé.";
        responseMessageElement.classList.remove("hidden");
        return;
      }

      submitButton.disabled = true;

      const { error } = await saveAnswer(question, answerText, new Date());

      submitButton.disabled = false;

      if (error) {
        responseMessageElement.textContent =
          "Không gửi được câu trả lời. Em thử lại sau một chút nhé.";
        responseMessageElement.classList.remove("hidden");
        return;
      }

      const cute = getRandomItem(cuteResponses);
      responseMessageElement.textContent = cute;
      responseMessageElement.classList.remove("hidden");

      updateStreak(new Date());
    });
  } catch (error) {
    questionTextElement.textContent =
      "Không thể tải câu hỏi hôm nay. Em thử tải lại trang giúp anh nhé.";
  }
}

document.addEventListener("DOMContentLoaded", init);

