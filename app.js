const greetingElement = document.getElementById("greeting");
const dateElement = document.getElementById("today");
const questionTextElement = document.getElementById("question-text");
const answerInput = document.getElementById("answer");
const submitButton = document.getElementById("submit-answer");
const responseMessageElement = document.getElementById("response-message");
const streakMessageElement = document.getElementById("streak-message");
const surpriseElement = document.getElementById("surprise");
const loveTokensElement = document.getElementById("love-tokens-value");
const timeCapsuleStatusElement = document.getElementById("time-capsule-status");
const useTokenRescueButton = document.getElementById("use-token-rescue");

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

// Hàm phụ: trả về số ngày chênh lệch giữa hai ngày, đã chuẩn hóa về 0h.
function getDayDifference(date1, date2) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffMs = d1.getTime() - d2.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

function updateLoveStateUI(state) {
  if (!loveTokensElement || !timeCapsuleStatusElement || !useTokenRescueButton) {
    return;
  }

  if (!state) {
    loveTokensElement.textContent = "0";
    timeCapsuleStatusElement.textContent = "⏳ Chưa có dữ liệu love state";
    useTokenRescueButton.disabled = true;
    return;
  }

  const tokens = state.tokens || 0;
  loveTokensElement.textContent = String(tokens);

  if (state.time_capsule_active) {
    timeCapsuleStatusElement.textContent = "⏳ Time Capsule đang được kích hoạt";
  } else {
    timeCapsuleStatusElement.textContent = "✅ Time Capsule đang tắt";
  }

  useTokenRescueButton.disabled = tokens <= 0;
}

// Cập nhật trạng thái love_state trên Supabase sau khi em gửi câu trả lời.
// Bảng love_state chỉ có 1 dòng, lưu:
// - current_streak: số ngày liên tiếp trả lời (theo Supabase)
// - last_answer_date: ngày cuối cùng trả lời (kiểu date)
// - tokens: số token cứu streak
// - time_capsule_active: đang bật time capsule hay không
async function updateLoveStateAfterAnswer(options = {}) {
  if (!window.supabase) {
    return null;
  }

  const today = new Date();
  const dateOnly = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await window.supabase.from("love_state").select("*").limit(1);

  if (error) {
    console.error("Không tải được love_state:", error);
    return null;
  }

  let state = Array.isArray(data) && data.length > 0 ? data[0] : null;

  // Nếu chưa có dòng nào: khởi tạo state mới với streak = 1
  if (!state) {
    const insertResult = await window.supabase
      .from("love_state")
      .insert([
        {
          current_streak: 1,
          last_answer_date: dateOnly,
          tokens: 0,
          time_capsule_active: false
        }
      ])
      .select("*");

    if (insertResult.error) {
      console.error("Không khởi tạo được love_state:", insertResult.error);
      return null;
    }

    const inserted =
      Array.isArray(insertResult.data) && insertResult.data.length > 0
        ? insertResult.data[0]
        : null;

    updateLoveStateUI(inserted);
    console.log("Love state khởi tạo:", inserted);
    return inserted;
  }

  const useTokenRescue = Boolean(options.useTokenRescue);

  // Nếu time capsule đang bật và em trả lời: đây là Time Capsule Rescue miễn phí
  if (state.time_capsule_active) {
    const updateResult = await window.supabase
      .from("love_state")
      .update({
        time_capsule_active: false,
        last_answer_date: dateOnly
      })
      .eq("id", state.id)
      .select("*");

    if (updateResult.error) {
      console.error("Không cập nhật time capsule:", updateResult.error);
      return state;
    }

    const updated =
      Array.isArray(updateResult.data) && updateResult.data.length > 0
        ? updateResult.data[0]
        : state;

    updateLoveStateUI(updated);
    console.log("Love state sau Time Capsule Rescue:", updated);
    return updated;
  }

  const lastDate = state.last_answer_date ? new Date(state.last_answer_date) : null;

  if (!lastDate || Number.isNaN(lastDate.getTime())) {
    // Nếu dữ liệu cũ không hợp lệ: reset nhẹ
    state.current_streak = 1;
    state.last_answer_date = dateOnly;
  } else {
    const diffDays = getDayDifference(today, lastDate);

    if (diffDays === 0) {
      // diff = 0: không làm gì
    } else if (diffDays === 1) {
      // diff = 1: tăng streak
      const newStreak = (state.current_streak || 0) + 1;
      state.current_streak = newStreak;
      state.last_answer_date = dateOnly;

      // Thưởng token theo mốc streak
      if (newStreak === 7) {
        state.tokens = (state.tokens || 0) + 1;
      } else if (newStreak === 30) {
        state.tokens = (state.tokens || 0) + 3;
      }
    } else if (diffDays === 2) {
      // diff = 2: kích hoạt time capsule
      state.time_capsule_active = true;
    } else if (diffDays >= 3) {
      // diff >= 3: cho phép dùng token cứu streak
      if (useTokenRescue && state.tokens > 0) {
        state.tokens -= 1;
        state.last_answer_date = dateOnly;
        // Khi dùng token rescue: giữ nguyên current_streak
      } else {
        // Không dùng rescue: streak reset
        state.current_streak = 1;
        state.last_answer_date = dateOnly;
      }
    }
  }

  const { data: updatedData, error: updateError } = await window.supabase
    .from("love_state")
    .update({
      current_streak: state.current_streak,
      last_answer_date: state.last_answer_date,
      tokens: state.tokens,
      time_capsule_active: state.time_capsule_active
    })
    .eq("id", state.id)
    .select("*");

  if (updateError) {
    console.error("Không lưu được love_state:", updateError);
    return state;
  }

  const updatedState =
    Array.isArray(updatedData) && updatedData.length > 0 ? updatedData[0] : state;

  updateLoveStateUI(updatedState);
  console.log("Love state sau cập nhật:", updatedState);
  return updatedState;
}

async function loadInitialLoveState() {
  if (!window.supabase) {
    return;
  }

  const { data, error } = await window.supabase.from("love_state").select("*").limit(1);

  if (error) {
    console.error("Không tải được love_state ban đầu:", error);
    return;
  }

  const state = Array.isArray(data) && data.length > 0 ? data[0] : null;
  updateLoveStateUI(state);
  if (state) {
    const streak = typeof state.current_streak === "number" ? state.current_streak : 0;
    if (streak >= 2) {
      if (streak >= 7) {
        streakMessageElement.textContent =
          "🔥 7 ngày liên tiếp! Anh thấy em rất chăm mở trang này đó ❤️";
      } else {
        streakMessageElement.textContent =
          `🔥 Em đã trả lời ${streak} ngày liên tiếp rồi đó`;
      }
      streakMessageElement.classList.remove("hidden");
    }
  }
}

async function saveAnswer(question, answerText, today, dayOfYear) {
  if (!window.supabase) {
    return { error: new Error("Chưa cấu hình Supabase. Vui lòng kiểm tra supabase.js.") };
  }

  const { error } = await window.supabase.from("answers").insert([
    {
      question,
      answer: answerText,
      created_at: today.toISOString(),
      day_number: dayOfYear
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

let shouldUseTokenRescue = false;

async function init() {
  const now = new Date();
  greetingElement.textContent = getGreetingByTime(now);
  dateElement.textContent = `Hôm nay là: ${formatVietnameseDate(now)}`;

  maybeShowSurprise();

  loadInitialLoveState();

  try {
    const questions = await loadQuestions();
    const dayOfYear = getDayOfYear(now);
    const question = questions[dayOfYear % questions.length];
    questionTextElement.textContent = question;

    if (useTokenRescueButton) {
      useTokenRescueButton.addEventListener("click", () => {
        shouldUseTokenRescue = true;
      });
    }

    submitButton.addEventListener("click", async () => {
      const answerText = answerInput.value.trim();
      responseMessageElement.classList.add("hidden");

      if (!answerText) {
        responseMessageElement.textContent = "Em hãy viết gì đó trước khi gửi nhé.";
        responseMessageElement.classList.remove("hidden");
        return;
      }

      submitButton.disabled = true;

      const { error } = await saveAnswer(question, answerText, new Date(), dayOfYear);

      submitButton.disabled = false;

      if (error) {
        responseMessageElement.textContent =
          "Không gửi được câu trả lời. Em thử lại sau một chút nhé.";
        responseMessageElement.classList.remove("hidden");
        return;
      }

      let loveStateAfterAnswer = null;

      try {
        loveStateAfterAnswer = await updateLoveStateAfterAnswer({
          useTokenRescue: shouldUseTokenRescue
        });
        shouldUseTokenRescue = false;
      } catch (e) {
        console.error("Không cập nhật được love_state sau khi trả lời:", e);
      }

      const cute = getRandomItem(cuteResponses);
      responseMessageElement.textContent = cute;
      responseMessageElement.classList.remove("hidden");

      const streak =
        loveStateAfterAnswer && typeof loveStateAfterAnswer.current_streak === "number"
          ? loveStateAfterAnswer.current_streak
          : 0;

      if (streak >= 2) {
        if (streak >= 7) {
          streakMessageElement.textContent =
            "🔥 7 ngày liên tiếp! Anh thấy em rất chăm mở trang này đó ❤️";
        } else {
          streakMessageElement.textContent =
            `🔥 Em đã trả lời ${streak} ngày liên tiếp rồi đó`;
        }
        streakMessageElement.classList.remove("hidden");
      } else {
        streakMessageElement.classList.add("hidden");
      }
    });
  } catch (error) {
    questionTextElement.textContent =
      "Không thể tải câu hỏi hôm nay. Em thử tải lại trang giúp anh nhé.";
  }
}

document.addEventListener("DOMContentLoaded", init);
