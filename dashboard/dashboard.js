
const SUPABASE_URL = "https://dkjjkjqxpqtadtoakwtp.supabase.co/rest/v1/";
const PUBLISHABLE_KEY = "sb_publishable_P7qsQ16T7LWfCFNmWmFizw_rbD_lQZr";

const db = window.supabase.createClient(
  SUPABASE_URL,
  PUBLISHABLE_KEY
);

let allEvents = [];
let activityChart = null;

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

async function checkAdmin() {
  const { data: { session } } = await db.auth.getSession();

  if (!session) {
    showLogin();
    return;
  }

  const { data: admin, error } = await db
    .from("dashboard_admins")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !admin) {
    await db.auth.signOut();
    showLogin();
    document.getElementById("loginError").textContent =
      "Tài khoản không có quyền quản trị.";
    return;
  }

  showDashboard();
}

function showLogin() {
  loginScreen.hidden = false;
  dashboardScreen.hidden = true;
}

function showDashboard() {
  loginScreen.hidden = true;
  dashboardScreen.hidden = false;
  loadEvents();
  subscribeRealtime();
}

// Đăng nhập admin
document.getElementById("adminLogin")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      document.getElementById("loginError").textContent =
        "Không thể đăng nhập. Kiểm tra thông tin tài khoản.";
      return;
    }

    await checkAdmin();
  });

// Đăng xuất
document.getElementById("logoutButton")
  .addEventListener("click", async () => {
    await db.auth.signOut();
    showLogin();
  });

// Lấy lịch sử
async function loadEvents() {
  document.getElementById("connectionStatus").textContent =
    "Loading data...";

  const { data, error } = await db
    .from("simulation_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    document.getElementById("connectionStatus").textContent =
      "Database error";
    console.error(error);
    return;
  }

  allEvents = data || [];

  renderDashboard();
  document.getElementById("connectionStatus").textContent =
    "● Connected";
}

// Thống kê
function renderDashboard() {
  const uniqueParticipants = new Set(
    allEvents.map(x => x.participant_id)
  );

  document.getElementById("participants").textContent =
    uniqueParticipants.size;

  document.getElementById("totalEvents").textContent =
    allEvents.length;

  document.getElementById("loginCount").textContent =
    allEvents.filter(x =>
      x.event === "demo_login_submitted"
    ).length;

  document.getElementById("completedCount").textContent =
    allEvents.filter(x =>
      x.event === "simulation_completed"
    ).length;

  renderTable();
  renderChart();
}

// Lọc và hiển thị lịch sử
function renderTable() {
  const filter = document.getElementById("eventFilter").value;

  const filtered = filter
    ? allEvents.filter(x => x.event === filter)
    : allEvents;

  const tbody = document.getElementById("eventTable");

  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="4">No events found</td></tr>';
    return;
  }

  tbody.replaceChildren();

  filtered.forEach(item => {
    const tr = document.createElement("tr");

    const values = [
      item.participant_id,
      item.session_id,
      item.event,
      new Date(item.created_at).toLocaleString("vi-VN")
    ];

    values.forEach(value => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

document.getElementById("eventFilter")
  .addEventListener("change", renderTable);

// Biểu đồ hoạt động 7 ngày
function renderChart() {
  const labels = [];
  const values = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = date.toLocaleDateString("en-CA");

    labels.push(key);

    values.push(
      allEvents.filter(x =>
        new Date(x.created_at).toLocaleDateString("en-CA") === key
      ).length
    );
  }

  if (activityChart) {
    activityChart.destroy();
  }

  activityChart = new Chart(
    document.getElementById("activityChart"),
    {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Simulation Events",
          data: values,
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.15)",
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#e7eaf0" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#9ca3af" },
            grid: { color: "#303a4b" }
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#9ca3af", precision: 0 },
            grid: { color: "#303a4b" }
          }
        }
      }
    }
  );
}

// Nhận dữ liệu mới ngay khi database thay đổi
function subscribeRealtime() {
  db.channel("simulation-live-events")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "simulation_events"
      },
      () => {
        loadEvents();
      }
    )
    .subscribe();
}

checkAdmin();
