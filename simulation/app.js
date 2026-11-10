
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY";

const EVENT_API =
  `${SUPABASE_URL}/functions/v1/collect-event`;

const SESSION_KEY = "iao_demo_session";
const PARTICIPANT_KEY = "iao_participant";

let sessionId = sessionStorage.getItem(SESSION_KEY);

if (!sessionId) {
  sessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, sessionId);
}

// Tạo mã người tham gia giả lập
let participantId = sessionStorage.getItem(PARTICIPANT_KEY);

if (!participantId) {
  participantId = "USER-" +
    crypto.randomUUID().slice(0, 8).toUpperCase();

  sessionStorage.setItem(PARTICIPANT_KEY, participantId);
}

// Gửi sự kiện về Supabase
async function recordEvent(eventName) {
  const allowedEvents = [
    "page_visited",
    "home_opened",
    "login_page_opened",
    "demo_login_submitted",
    "otp_page_opened",
    "demo_otp_submitted",
    "simulation_completed"
  ];

  if (!allowedEvents.includes(eventName)) return;

  try {
    const response = await fetch(EVENT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": PUBLISHABLE_KEY,
        "Authorization": `Bearer ${PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        participant_id: participantId,
        event: eventName
      })
    });

    if (!response.ok) {
      console.error("Event API error:", response.status);
    }

  } catch (error) {
    console.error("Connection error:", error);
  }
}

// Chuyển màn hình
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  const events = {
    home: "home_opened",
    login: "login_page_opened",
    otp: "otp_page_opened",
    result: "simulation_completed"
  };

  if (events[pageId]) {
    recordEvent(events[pageId]);
  }
}

// Gửi sự kiện đăng nhập demo
document.getElementById("loginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    await recordEvent("demo_login_submitted");
    showPage("otp");
  });

// Gửi sự kiện OTP demo
document.getElementById("otpForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    await recordEvent("demo_otp_submitted");
    showPage("result");
  });

recordEvent("page_visited");
