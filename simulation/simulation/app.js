
const SESSION_KEY = "iao_demo_session";
const LOG_KEY = "iao_demo_events";

function createSessionId() {
  return "SIM-" + crypto.randomUUID();
}

let sessionId = sessionStorage.getItem(SESSION_KEY);

if (!sessionId) {
  sessionId = createSessionId();
  sessionStorage.setItem(SESSION_KEY, sessionId);
}

function recordEvent(eventName) {
  const events = JSON.parse(
    localStorage.getItem(LOG_KEY) || "[]"
  );

  events.push({
    session_id: sessionId,
    event: eventName,
    timestamp: new Date().toISOString(),
    simulation: true
  });

  localStorage.setItem(LOG_KEY, JSON.stringify(events));
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  const eventMap = {
    home: "home_opened",
    login: "login_page_opened",
    otp: "otp_page_opened",
    result: "simulation_completed"
  };

  if (eventMap[pageId]) {
    recordEvent(eventMap[pageId]);
  }
}

document.getElementById("loginForm")
  .addEventListener("submit", function(event) {
    event.preventDefault();

    // Không đọc hoặc lưu bất kỳ thông tin đăng nhập nào.
    recordEvent("demo_login_submitted");

    showPage("otp");
  });

document.getElementById("otpForm")
  .addEventListener("submit", function(event) {
    event.preventDefault();

    // Không đọc hoặc lưu mã OTP.
    recordEvent("demo_otp_submitted");

    showPage("result");
  });

// Ghi nhận lượt truy cập trang mô phỏng.
recordEvent("page_visited");

// Chỉ phục vụ kiểm tra cục bộ.
console.log("IAO Simulation Session:", sessionId);
