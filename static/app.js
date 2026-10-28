// Hospital Management System & Patient Self-Service Portal — JavaScript

const API_BASE = "";

// State
let allPatients = [];
let allDoctors = [];
let allDepartments = [];
let queryCatalog = [];
let selectedDeptId = null;
let doctorSearchTimer = null;

// Auth & Portal State
let currentUser = null;
let currentRole = "gateway"; // "gateway", "admin", or "patient"
let portalData = null;

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initPortalTabs();
  initTopSearch();
  checkAuthStatus();

  // Set default appointment date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const dateInput = document.getElementById("bookApptDate");
  if (dateInput) dateInput.value = tomorrowStr;
  const portalDateInput = document.getElementById("portalBookDate");
  if (portalDateInput) portalDateInput.value = tomorrowStr;
});

// ==========================================
// AUTHENTICATION & ROLE-BASED ACCESS CONTROL
// ==========================================
async function checkAuthStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`);
    const data = await res.json();
    if (data.authenticated) {
      if (data.role === "admin") {
        currentUser = data.user;
        setAppRole("admin");
      } else if (data.role === "patient" && data.patient) {
        currentUser = data.patient;
        setAppRole("patient");
      } else {
        setAppRole("gateway");
      }
    } else {
      currentUser = null;
      setAppRole("gateway");
    }
  } catch (err) {
    console.warn("Auth check failed:", err);
    setAppRole("gateway");
  }
}

function setAppRole(role) {
  currentRole = role;
  const gatewayView = document.getElementById("loginGatewayView");
  const adminLayout = document.getElementById("adminLayout");
  const patientLayout = document.getElementById("patientPortalLayout");
  const adminSearch = document.getElementById("headerAdminSearch");
  const navRoleBadge = document.getElementById("navRoleBadge");
  const navSubtitle = document.getElementById("navSubtitle");
  const btnQuickSwitch = document.getElementById("btnQuickSwitchRole");
  const quickSwitchText = document.getElementById("quickSwitchText");
  const quickSwitchIcon = document.getElementById("quickSwitchIcon");
  const navUserBadge = document.getElementById("navUserBadge");
  const userDisplayName = document.getElementById("userDisplayName");
  const userDisplayRole = document.getElementById("userDisplayRole");
  const userAvatarCircle = document.getElementById("userAvatarCircle");
  const btnNavSignIn = document.getElementById("btnNavSignIn");

  if (role === "admin") {
    if (gatewayView) gatewayView.style.display = "none";
    if (adminLayout) adminLayout.style.display = "flex";
    if (patientLayout) patientLayout.style.display = "none";
    if (adminSearch) adminSearch.style.display = "flex";
    if (btnNavSignIn) btnNavSignIn.style.display = "none";

    if (navRoleBadge) {
      navRoleBadge.textContent = "Administrator Mode";
      navRoleBadge.className = "nav-role-badge role-admin";
    }
    if (navSubtitle) navSubtitle.textContent = "Clinical Operations & DBMS Administration";

    if (btnQuickSwitch) {
      btnQuickSwitch.style.display = "inline-flex";
      if (quickSwitchText) quickSwitchText.textContent = "Switch to Patient View";
      if (quickSwitchIcon) quickSwitchIcon.textContent = "👤";
    }

    if (navUserBadge) {
      navUserBadge.style.display = "flex";
      if (userDisplayName) userDisplayName.textContent = currentUser ? (currentUser.name || "Administrator") : "Admin";
      if (userDisplayRole) userDisplayRole.textContent = "Staff / Admin";
      if (userAvatarCircle) userAvatarCircle.textContent = "🛡️";
    }

    // Load admin operations and relational explorer
    fetchOverviewStats();
    loadPatients();
    loadDepartments();
    loadDoctors();
    loadAppointments();
    loadBilling();
    loadQueryCatalog();
    loadEmbeddedSqlFiles();

  } else if (role === "patient") {
    if (gatewayView) gatewayView.style.display = "none";
    if (adminLayout) adminLayout.style.display = "none";
    if (patientLayout) patientLayout.style.display = "flex";
    if (adminSearch) adminSearch.style.display = "none";
    if (btnNavSignIn) btnNavSignIn.style.display = "none";

    if (navRoleBadge) {
      navRoleBadge.textContent = "Patient Portal";
      navRoleBadge.className = "nav-role-badge role-patient";
    }
    if (navSubtitle) navSubtitle.textContent = "Personal Health Overview & Online Services";

    if (btnQuickSwitch) {
      btnQuickSwitch.style.display = "inline-flex";
      if (quickSwitchText) quickSwitchText.textContent = "Switch to Staff Admin";
      if (quickSwitchIcon) quickSwitchIcon.textContent = "🛡️";
    }

    if (navUserBadge) {
      navUserBadge.style.display = "flex";
      if (userDisplayName) userDisplayName.textContent = currentUser ? currentUser.patient_name : "Patient";
      if (userDisplayRole) userDisplayRole.textContent = currentUser ? `ID: #${currentUser.patient_id}` : "Patient";
      if (userAvatarCircle) userAvatarCircle.textContent = "👤";
    }

    // Load patient self-service dashboard
    loadPatientPortalDashboard();

  } else { // "gateway"
    if (gatewayView) gatewayView.style.display = "block";
    if (adminLayout) adminLayout.style.display = "none";
    if (patientLayout) patientLayout.style.display = "none";
    if (adminSearch) adminSearch.style.display = "none";
    if (btnQuickSwitch) btnQuickSwitch.style.display = "none";
    if (navUserBadge) navUserBadge.style.display = "none";
    if (btnNavSignIn) btnNavSignIn.style.display = "inline-flex";

    if (navRoleBadge) {
      navRoleBadge.textContent = "System Gateway";
      navRoleBadge.className = "nav-role-badge";
    }
    if (navSubtitle) navSubtitle.textContent = "Relational DBMS & Patient Self-Service System";
  }
}

// 1-Click Instant Demo Login (for viva evaluation)
async function quickLoginDemo(role) {
  try {
    showToast(`Logging in as Demo ${role.toUpperCase()}...`, "info");
    const res = await fetch(`${API_BASE}/api/auth/demo/${role}`, { method: "POST" });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || "Login failed.", "error");
      return;
    }
    currentUser = role === "admin" ? data.user : data.patient;
    setAppRole(role);
    showToast(`Welcome! Logged in as ${role === "admin" ? "Chief Administrator" : data.patient.patient_name}`, "success");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}

async function quickSwitchRole() {
  const targetRole = currentRole === "admin" ? "patient" : "admin";
  await quickLoginDemo(targetRole);
}

// Gateway Admin Login Handler
async function handleAdminGatewayLogin(e) {
  e.preventDefault();
  const alertBox = document.getElementById("adminLoginAlert");
  if (alertBox) alertBox.style.display = "none";

  const identifier = document.getElementById("adminUserField").value.trim();
  const password = document.getElementById("adminPassField").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const result = await res.json();
    if (!result.success || result.role !== "admin") {
      if (alertBox) {
        alertBox.textContent = result.error || "Invalid administrator credentials (use admin / admin123).";
        alertBox.style.display = "block";
      }
      return;
    }
    currentUser = result.user;
    setAppRole("admin");
    showToast("Authenticated as Administrator!", "success");
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = `Error: ${err.message}`;
      alertBox.style.display = "block";
    }
  }
}

// Gateway Patient Login Handler
async function handlePatientGatewayLogin(e) {
  e.preventDefault();
  const alertBox = document.getElementById("patientLoginAlert");
  if (alertBox) alertBox.style.display = "none";

  const identifier = document.getElementById("patientIdField").value.trim();
  const password = document.getElementById("patientPassField").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const result = await res.json();
    if (!result.success || result.role !== "patient") {
      if (alertBox) {
        alertBox.textContent = result.error || "Invalid patient credentials (demo: 1001 / patient123).";
        alertBox.style.display = "block";
      }
      return;
    }
    currentUser = result.patient;
    setAppRole("patient");
    showToast(`Welcome back, ${currentUser.patient_name}!`, "success");
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = `Error: ${err.message}`;
      alertBox.style.display = "block";
    }
  }
}

// Modal Login Handler (if accessed from modal)
async function handlePatientLogin(e) {
  e.preventDefault();
  const alertBox = document.getElementById("loginErrorAlert");
  if (alertBox) alertBox.style.display = "none";

  const identifier = document.getElementById("loginIdentifier").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const result = await res.json();

    if (!result.success) {
      if (alertBox) {
        alertBox.textContent = result.error || "Login failed.";
        alertBox.style.display = "block";
      }
      return;
    }

    if (result.role === "admin") {
      currentUser = result.user;
      setAppRole("admin");
    } else {
      currentUser = result.patient;
      setAppRole("patient");
    }

    closeModal("patientAuthModal");
    showToast(`Logged in successfully!`, "success");
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = `Error: ${err.message}`;
      alertBox.style.display = "block";
    }
  }
}

async function handlePatientSelfRegister(e) {
  e.preventDefault();
  const alertBox = document.getElementById("registerErrorAlert");
  if (alertBox) alertBox.style.display = "none";

  const name = document.getElementById("authRegName").value.trim();
  const email = document.getElementById("authRegEmail").value.trim();
  const password = document.getElementById("authRegPassword").value.trim();
  const dob = document.getElementById("authRegDOB").value;
  const gender = document.getElementById("authRegGender").value;
  const phone = document.getElementById("authRegPhone").value.trim();
  const address = document.getElementById("authRegAddress").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_name: name,
        email,
        password,
        date_of_birth: dob,
        gender,
        phone,
        address
      })
    });
    const result = await res.json();

    if (!result.success) {
      if (alertBox) {
        alertBox.textContent = result.error || "Registration failed.";
        alertBox.style.display = "block";
      }
      return;
    }

    showToast(`Account created! Welcome, ${name} (ID: #${result.patient.patient_id})`, "success");
    currentUser = result.patient;
    closeModal("patientAuthModal");
    setAppRole("patient");
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = `Error: ${err.message}`;
      alertBox.style.display = "block";
    }
  }
}

async function handleLogout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
  } catch (err) {}
  currentUser = null;
  setAppRole("gateway");
  showToast("Logged out successfully. Returning to Gateway.", "info");
}

function switchAuthTab(tab) {
  const btnLogin = document.getElementById("btnTabLogin");
  const btnReg = document.getElementById("btnTabRegister");
  const formLogin = document.getElementById("patientLoginForm");
  const formReg = document.getElementById("patientRegisterForm");
  if (btnLogin) btnLogin.classList.toggle("active", tab === "login");
  if (btnReg) btnReg.classList.toggle("active", tab === "register");
  if (formLogin) formLogin.style.display = tab === "login" ? "block" : "none";
  if (formReg) formReg.style.display = tab === "register" ? "block" : "none";
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function scrollToGatewayCards() {
  const grid = document.getElementById("gatewayCardsGrid");
  if (grid) grid.scrollIntoView({ behavior: "smooth" });
}

// Aliases for backwards compatibility
function toggleAppMode() { quickSwitchRole(); }
function setAppMode(mode) { setAppRole(mode); }

// ==========================================
// PATIENT PORTAL CONTROLLER & MODULES
// ==========================================
function initPortalTabs() {
  const portalNavItems = document.querySelectorAll(".portal-nav-item");
  portalNavItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.getAttribute("data-portal-tab");
      switchPortalTab(targetTab);
    });
  });
}

function switchPortalTab(tabId) {
  document.querySelectorAll(".portal-nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-portal-tab") === tabId);
  });

  document.querySelectorAll(".portal-tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === `portal-tab-${tabId}`);
  });

  if (tabId === "my-overview" || tabId === "my-appointments" || tabId === "my-prescriptions" || tabId === "my-billing") {
    loadPatientPortalDashboard();
  }
}

async function loadPatientPortalDashboard() {
  if (!currentUser) return;

  try {
    const res = await fetch(`${API_BASE}/api/patient/dashboard`, {
      headers: { "X-Patient-ID": currentUser.patient_id }
    });
    const result = await res.json();
    if (!result.success) {
      if (res.status === 401) {
        openModal("patientAuthModal");
      }
      return;
    }

    portalData = result;
    const { patient, appointments, prescriptions, bills, stats } = portalData;

    // Sidebar & Banner Welcome
    document.getElementById("portalPatientName").textContent = patient.patient_name;
    document.getElementById("portalPatientIdBadge").textContent = `ID: #${patient.patient_id}`;
    document.getElementById("portalGreeting").textContent = `Welcome back, ${patient.patient_name}!`;
    document.getElementById("portalGreetingSub").textContent = `Patient ID: #${patient.patient_id} • Contact: ${patient.phone || 'N/A'} • ${patient.gender || ''}`;

    // Stats
    document.getElementById("portalStatUpcoming").textContent = stats.scheduled_appointments;
    document.getElementById("portalStatVisits").textContent = stats.total_appointments;
    document.getElementById("portalStatPrescriptions").textContent = stats.total_prescriptions;
    document.getElementById("portalStatDues").textContent = `₹${stats.total_balance_due.toFixed(2)}`;

    // Render Upcoming Appointments Table in Overview
    const upcoming = appointments.filter(a => a.status === "SCHEDULED");
    const upcomingBody = document.getElementById("portalUpcomingApptsBody");
    if (upcoming.length === 0) {
      upcomingBody.innerHTML = `<tr><td colspan="6" class="loading-cell">No upcoming appointments scheduled. Click "Book Doctor Appointment" to schedule one!</td></tr>`;
    } else {
      upcomingBody.innerHTML = upcoming.map(a => `
        <tr>
          <td><strong>#${a.appointment_id}</strong></td>
          <td><strong>${escapeHtml(a.doctor_name)}</strong> <span style="font-size:11px; color:#0284c7;">(${escapeHtml(a.specialization)})</span></td>
          <td>${escapeHtml(a.department_name || '-')} (📍 ${escapeHtml(a.location || 'Main')})</td>
          <td><strong>${a.appt_time}</strong></td>
          <td><span class="badge badge-scheduled">SCHEDULED</span></td>
          <td>
            <button class="btn btn-outline btn-xs btn-danger" onclick="handlePatientCancelAppt(${a.appointment_id})">
              Cancel
            </button>
          </td>
        </tr>
      `).join("");
    }

    // Render All Appointments in Booking Tab
    const allApptsBody = document.getElementById("portalAllApptsBody");
    if (appointments.length === 0) {
      allApptsBody.innerHTML = `<tr><td colspan="7" class="loading-cell">No appointments recorded yet.</td></tr>`;
    } else {
      allApptsBody.innerHTML = appointments.map(a => `
        <tr>
          <td><strong>#${a.appointment_id}</strong></td>
          <td><strong>${escapeHtml(a.doctor_name)}</strong></td>
          <td>${escapeHtml(a.specialization)}</td>
          <td>${escapeHtml(a.department_name || '-')}</td>
          <td><strong>${a.appt_time}</strong></td>
          <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
          <td>
            ${a.status === 'SCHEDULED' ? `
              <button class="btn btn-outline btn-xs btn-danger" onclick="handlePatientCancelAppt(${a.appointment_id})">
                Cancel
              </button>
            ` : '<span style="color:#94a3b8; font-size:11px;">Completed/Archived</span>'}
          </td>
        </tr>
      `).join("");
    }

    // Render Prescriptions Cards
    const prescContainer = document.getElementById("portalPrescriptionsList");
    if (prescriptions.length === 0) {
      prescContainer.innerHTML = `<div class="content-card" style="padding:24px; text-align:center; color:#64748b;">No prescription records found for your visits.</div>`;
    } else {
      prescContainer.innerHTML = prescriptions.map(p => `
        <div class="prescription-card">
          <div class="presc-top">
            <div>
              <div class="presc-doctor">👨‍⚕️ ${escapeHtml(p.doctor_name)}</div>
              <div style="font-size:11px; color:#0284c7;">${escapeHtml(p.specialization)}</div>
            </div>
            <div class="presc-date">📅 ${p.consultation_date}</div>
          </div>
          <div class="presc-diagnosis">
            <strong>Clinical Diagnosis:</strong> ${escapeHtml(p.diagnosis || 'General Checkup')}
          </div>
          <div class="presc-medicines">
            <div style="font-weight:700; margin-bottom:4px; color:#1e293b;">💊 Prescribed Medication:</div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
              <div style="font-size:13px; font-weight:700; color:#0f172a;">${escapeHtml(p.medicine_name)}</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">Dosage: <strong>${escapeHtml(p.dosage || '-')}</strong> • Duration: <strong>${escapeHtml(p.duration || '-')}</strong></div>
            </div>
          </div>
        </div>
      `).join("");
    }

    // Render Bills & Pay Online Table
    const billsBody = document.getElementById("portalBillsTableBody");
    if (bills.length === 0) {
      billsBody.innerHTML = `<tr><td colspan="8" class="loading-cell">No medical invoices found.</td></tr>`;
    } else {
      billsBody.innerHTML = bills.map(b => {
        const isPaid = b.status === "PAID" || b.balance_due <= 0;
        return `
          <tr>
            <td><strong>#${b.bill_id}</strong></td>
            <td>Appt #${b.appointment_id} with ${escapeHtml(b.doctor_name || 'Doctor')} (${b.appt_date || ''})</td>
            <td>₹${b.total_amount.toFixed(2)}</td>
            <td>₹${b.paid_amount.toFixed(2)}</td>
            <td style="font-weight:700; color:${isPaid ? '#15803d' : '#b91c1c'};">₹${b.balance_due.toFixed(2)}</td>
            <td>${b.bill_date}</td>
            <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
            <td>
              ${!isPaid ? `
                <button class="btn btn-primary btn-xs" onclick="openPatientPayModal(${b.bill_id}, ${b.total_amount}, ${b.balance_due})">
                  💳 Pay Online
                </button>
              ` : '<span style="color:#15803d; font-size:12px; font-weight:700;">✓ Settled</span>'}
            </td>
          </tr>
        `;
      }).join("");
    }

    // Populate Booking Dropdowns
    populatePortalBookingDropdowns();

    // Populate Profile Form
    document.getElementById("portalProfId").value = `#${patient.patient_id}`;
    document.getElementById("portalProfName").value = patient.patient_name;
    document.getElementById("portalProfEmail").value = patient.email || "Not specified";
    document.getElementById("portalProfDob").value = patient.dob || "Not specified";
    document.getElementById("portalProfPhone").value = patient.phone || "";
    document.getElementById("portalProfAddress").value = patient.address || "";

  } catch (err) {
    console.error("Failed to load patient dashboard:", err);
  }
}

function populatePortalBookingDropdowns() {
  const deptSelect = document.getElementById("portalBookDeptSelect");
  if (!deptSelect) return;

  deptSelect.innerHTML = `<option value="">-- Choose Department --</option>` +
    allDepartments.map(d => `<option value="${d.department_id}">${escapeHtml(d.department_name)} (📍 ${escapeHtml(d.location || 'Wing')})</option>`).join("");

  filterPortalDoctorsByDept();
}

function filterPortalDoctorsByDept() {
  const deptId = document.getElementById("portalBookDeptSelect").value;
  const docSelect = document.getElementById("portalBookDoctorSelect");
  if (!docSelect) return;

  let filtered = allDoctors;
  if (deptId) {
    filtered = allDoctors.filter(d => String(d.department_id) === String(deptId));
  }

  if (filtered.length === 0) {
    docSelect.innerHTML = `<option value="">No doctors available in this department</option>`;
  } else {
    docSelect.innerHTML = `<option value="">-- Choose Doctor --</option>` +
      filtered.map(d => `<option value="${d.doctor_id}">#${d.doctor_id} - ${escapeHtml(d.doctor_name)} (${escapeHtml(d.specialization)}) [${d.status || 'AVAILABLE'}]</option>`).join("");
  }
}

async function handlePatientSelfBooking(e) {
  e.preventDefault();
  const alertBox = document.getElementById("portalConflictAlert");
  alertBox.style.display = "none";

  const doctorId = document.getElementById("portalBookDoctorSelect").value;
  const dateStr = document.getElementById("portalBookDate").value;
  const timeStr = document.getElementById("portalBookTime").value;

  if (!doctorId || !dateStr || !timeStr) {
    alert("Please select doctor, appointment date, and time slot.");
    return;
  }

  const appointmentTime = `${dateStr} ${timeStr}`;

  try {
    const res = await fetch(`${API_BASE}/api/patient/appointments/book`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Patient-ID": currentUser.patient_id
      },
      body: JSON.stringify({
        doctor_id: parseInt(doctorId),
        appointment_time: appointmentTime
      })
    });
    const result = await res.json();

    if (!result.success) {
      if (result.conflict) {
        alertBox.textContent = `⚠️ ${result.error}`;
        alertBox.style.display = "block";
        return;
      }
      throw new Error(result.error);
    }

    showToast(`Appointment booked successfully! (${result.message})`, "success");
    document.getElementById("patientSelfBookForm").reset();
    loadPatientPortalDashboard();
    loadAppointments(); // update admin list
    fetchOverviewStats();
  } catch (err) {
    alertBox.textContent = `Error: ${err.message}`;
    alertBox.style.display = "block";
  }
}

async function handlePatientCancelAppt(appointmentId) {
  if (!confirm(`Are you sure you want to cancel appointment #${appointmentId}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/patient/appointments/${appointmentId}/cancel`, {
      method: "PATCH",
      headers: { "X-Patient-ID": currentUser.patient_id }
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    showToast(`Appointment #${appointmentId} has been cancelled.`, "info");
    loadPatientPortalDashboard();
    loadAppointments();
    fetchOverviewStats();
  } catch (err) {
    showToast("Cancellation failed: " + err.message, "error");
  }
}

function openPatientPayModal(billId, total, due) {
  document.getElementById("payModalBillId").value = billId;
  document.getElementById("payModalBillRef").textContent = `#${billId}`;
  document.getElementById("payModalBillTotal").textContent = `₹${total.toFixed(2)}`;
  document.getElementById("payModalBillDue").textContent = `₹${due.toFixed(2)}`;
  document.getElementById("payModalAmount").value = due.toFixed(2);
  document.getElementById("payModalAmount").max = due;
  openModal("patientPayModal");
}

async function handlePatientPaymentSubmit(e) {
  e.preventDefault();
  const billId = document.getElementById("payModalBillId").value;
  const amount = document.getElementById("payModalAmount").value;
  const payMethodInput = document.querySelector('input[name="payMethod"]:checked');
  const paymentMethod = payMethodInput ? payMethodInput.value : "UPI";

  try {
    const res = await fetch(`${API_BASE}/api/patient/bills/${billId}/pay`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Patient-ID": currentUser.patient_id
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        payment_method: paymentMethod
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    showToast(`Payment of ₹${amount} successful! Bill #${billId} is now ${result.bill_status}.`, "success");
    closeModal("patientPayModal");
    loadPatientPortalDashboard();
    loadBilling();
    fetchOverviewStats();
  } catch (err) {
    showToast("Payment failed: " + err.message, "error");
  }
}

async function handlePortalProfileUpdate(e) {
  e.preventDefault();
  const phone = document.getElementById("portalProfPhone").value.trim();
  const address = document.getElementById("portalProfAddress").value.trim();
  const password = document.getElementById("portalProfPassword").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/patient/profile`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "X-Patient-ID": currentUser.patient_id
      },
      body: JSON.stringify({ phone, address, password })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    showToast("Profile updated successfully in Oracle Database!", "success");
    if (password) document.getElementById("portalProfPassword").value = "";
    loadPatientPortalDashboard();
    loadPatients();
  } catch (err) {
    showToast("Profile update failed: " + err.message, "error");
  }
}


// ==========================================
// ADMIN TABS & NAVIGATION
// ==========================================
function initTabs() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });

  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === `tab-${tabId}`);
  });

  // Lazy refresh based on tab
  if (tabId === "overview") fetchOverviewStats();
  if (tabId === "patients") loadPatients();
  if (tabId === "doctors") {
    loadDepartments();
    loadDoctors();
  }
  if (tabId === "appointments") loadAppointments();
  if (tabId === "billing") loadBilling();
  if (tabId === "rubric-validation") runLiveValidationSuite();
}

// ==========================================
// TOP SEARCH BAR (Search by ID or Name)
// ==========================================
function initTopSearch() {
  const input = document.getElementById("topSearchInput");
  const btn = document.getElementById("topSearchBtn");

  const doSearch = () => {
    const val = input.value.trim();
    if (!val) return;
    if (currentAppMode !== "admin") setAppMode("admin");
    switchTab("patients");
    const filterInput = document.getElementById("patientFilterInput");
    filterInput.value = val;
    loadPatients();
  };

  if (btn) btn.addEventListener("click", doSearch);
  if (input) input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") doSearch();
  });
}

// ==========================================
// 1. OVERVIEW & STATS
// ==========================================
async function fetchOverviewStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    const data = await res.json();
    if (!data.success) return;

    const stats = data.data;
    document.getElementById("statPatients").textContent = stats.patients;
    document.getElementById("statDoctors").textContent = stats.doctors;
    document.getElementById("statDepartments").textContent = stats.departments;
    document.getElementById("statAppointments").textContent = stats.appointments.total;
    document.getElementById("statScheduled").textContent = stats.appointments.scheduled;
    document.getElementById("statCompleted").textContent = stats.appointments.completed;
    
    document.getElementById("statRevenue").textContent = `₹${stats.billing.total_received.toLocaleString()}`;
    document.getElementById("statUnpaid").textContent = stats.billing.unpaid_count;

    const badge = document.getElementById("dbStatusBadge");
    if (badge) {
      badge.innerHTML = `<span class="status-dot online"></span><span class="status-text">Oracle 23ai (${stats.patients} Patients)</span>`;
    }
  } catch (err) {
    console.error("Failed to load overview stats:", err);
  }
}

// ==========================================
// 2. PATIENTS MODULE (ADMIN)
// ==========================================
async function loadPatients() {
  const query = document.getElementById("patientFilterInput")?.value.trim() || "";
  const tbody = document.getElementById("patientsTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">Searching database...</td></tr>`;

  try {
    const url = query ? `${API_BASE}/api/patients?q=${encodeURIComponent(query)}` : `${API_BASE}/api/patients`;
    const res = await fetch(url);
    const result = await res.json();

    if (!result.success || !result.data.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No patients found in Oracle database.</td></tr>`;
      return;
    }

    allPatients = result.data;
    renderPatientsTable(allPatients);
    populatePatientSelects(allPatients);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell" style="color:red;">Error fetching patients: ${err.message}</td></tr>`;
  }
}

function clearPatientSearch() {
  const input = document.getElementById("patientFilterInput");
  if (input) input.value = "";
  loadPatients();
}

function renderPatientsTable(patients) {
  const tbody = document.getElementById("patientsTableBody");
  if (!tbody) return;
  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><strong>#${p.patient_id}</strong></td>
      <td><strong>${escapeHtml(p.patient_name)}</strong></td>
      <td>${p.dob || '-'}</td>
      <td>${p.gender || '-'}</td>
      <td>${p.phone || '-'}</td>
      <td>${escapeHtml(p.email || '-')}</td>
      <td>${escapeHtml(p.address || '-')}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="viewPatientProfile(${p.patient_id})">
          📋 History
        </button>
      </td>
    </tr>
  `).join("");
}

async function viewPatientProfile(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    const data = await res.json();
    if (!data.success) {
      alert(data.error);
      return;
    }

    const { patient, appointments, bills } = data;

    // Header info
    document.getElementById("profileHeader").innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:18px; margin-bottom:4px;">${escapeHtml(patient.patient_name)} <span style="font-size:14px; color:#64748b;">(#${patient.patient_id})</span></h2>
          <div style="font-size:13px; color:#475569;">
            Gender: <strong>${patient.gender || '-'}</strong> | DOB: <strong>${patient.dob || '-'}</strong> | Phone: <strong>${patient.phone || '-'}</strong>
          </div>
          <div style="font-size:12px; color:#64748b;">Address: ${escapeHtml(patient.address || 'N/A')}</div>
        </div>
      </div>
    `;

    // Appointments
    const apptsBody = document.getElementById("profileApptsBody");
    if (appointments.length === 0) {
      apptsBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No appointments recorded for this patient.</td></tr>`;
    } else {
      apptsBody.innerHTML = appointments.map(a => `
        <tr>
          <td>#${a.appointment_id}</td>
          <td>${escapeHtml(a.doctor_name)} <span style="font-size:11px; color:#64748b;">(${a.specialization})</span></td>
          <td>${a.appt_time}</td>
          <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
          <td>${a.diagnosis ? escapeHtml(a.diagnosis) : '<span style="color:#94a3b8;">None recorded</span>'}</td>
        </tr>
      `).join("");
    }

    // Bills
    const billsBody = document.getElementById("profileBillsBody");
    if (bills.length === 0) {
      billsBody.innerHTML = `<tr><td colspan="6" class="loading-cell">No billing invoices found.</td></tr>`;
    } else {
      billsBody.innerHTML = bills.map(b => `
        <tr>
          <td>#${b.bill_id}</td>
          <td>₹${b.total_amount.toFixed(2)}</td>
          <td>₹${b.paid_amount.toFixed(2)}</td>
          <td style="font-weight:700; color:${b.balance_due > 0 ? '#b91c1c' : '#15803d'}">₹${b.balance_due.toFixed(2)}</td>
          <td>${b.bill_date}</td>
          <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
        </tr>
      `).join("");
    }

    openModal("patientDetailsModal");
  } catch (err) {
    alert("Failed to load patient history: " + err.message);
  }
}

async function handlePatientRegistration(e) {
  e.preventDefault();
  const name = document.getElementById("regPatientName").value.trim();
  const dob = document.getElementById("regPatientDOB").value;
  const gender = document.getElementById("regPatientGender").value;
  const email = document.getElementById("regPatientEmail")?.value.trim() || "";
  const password = document.getElementById("regPatientPassword")?.value.trim() || "patient123";
  const phone = document.getElementById("regPatientPhone").value.trim();
  const address = document.getElementById("regPatientAddress").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        patient_name: name, 
        date_of_birth: dob, 
        gender, 
        phone, 
        address,
        email,
        password
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    alert(`Success: ${result.message}`);
    closeModal("registerPatientModal");
    document.getElementById("registerPatientForm").reset();
    loadPatients();
    fetchOverviewStats();
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
}

// ==========================================
// 3. DEPARTMENTS & DOCTORS MODULE (ADMIN)
// ==========================================
async function loadDepartments() {
  try {
    const res = await fetch(`${API_BASE}/api/departments`);
    const result = await res.json();
    if (!result.success) return;

    allDepartments = result.data;

    // Calculate overall totals
    let totalDocs = 0, totalAvail = 0, totalBusy = 0, totalLeave = 0;
    allDepartments.forEach(dept => {
      totalDocs += dept.total_doctors;
      totalAvail += dept.available_doctors;
      totalBusy += dept.busy_doctors;
      totalLeave += dept.on_leave_doctors;
    });

    const allDeptsCount = document.getElementById("allDeptsCount");
    if (allDeptsCount) allDeptsCount.textContent = `${totalDocs} Doctors`;
    const allAvailCount = document.getElementById("allAvailCount");
    if (allAvailCount) allAvailCount.textContent = `🟢 ${totalAvail} Avail`;
    const allBusyCount = document.getElementById("allBusyCount");
    if (allBusyCount) allBusyCount.textContent = `🟡 ${totalBusy} Busy`;
    const allLeaveCount = document.getElementById("allLeaveCount");
    if (allLeaveCount) allLeaveCount.textContent = `🔴 ${totalLeave} Leave`;

    // Render department cards in admin side panel
    const panel = document.getElementById("departmentListPanel");
    if (panel) {
      panel.innerHTML = allDepartments.map(dept => `
        <div class="dept-card ${selectedDeptId === dept.department_id ? 'active' : ''}" 
             onclick="filterDoctorsByDept(${dept.department_id})">
          <div class="dept-card-top">
            <span class="dept-name">${escapeHtml(dept.department_name)}</span>
            <span class="dept-total-badge">${dept.total_doctors} ${dept.total_doctors === 1 ? 'Doc' : 'Docs'}</span>
          </div>
          <div class="dept-location">📍 ${escapeHtml(dept.location || 'Wing A')}</div>
          <div class="dept-status-breakdown">
            <span class="status-chip chip-avail">🟢 ${dept.available_doctors} Avail</span>
            <span class="status-chip chip-busy">🟡 ${dept.busy_doctors} Busy</span>
            <span class="status-chip chip-leave">🔴 ${dept.on_leave_doctors} Leave</span>
          </div>
        </div>
      `).join("");
    }

    // Populate department dropdown in Add Doctor modal
    const deptSelect = document.getElementById("docDepartmentSelect");
    if (deptSelect) {
      deptSelect.innerHTML = `<option value="">-- Select Department --</option>` +
        allDepartments.map(d => `<option value="${d.department_id}">${escapeHtml(d.department_name)} (${d.location || 'Main'})</option>`).join("");
    }
  } catch (err) {
    console.error("Failed to load departments:", err);
  }
}

function filterDoctorsByDept(deptId) {
  selectedDeptId = deptId;

  const allCard = document.getElementById("deptFilterAll");
  if (allCard) allCard.classList.toggle("active", deptId === null);

  document.querySelectorAll(".dept-card:not(.all-depts-card)").forEach((card, idx) => {
    const d = allDepartments[idx];
    if (d) {
      card.classList.toggle("active", d.department_id === deptId);
    }
  });

  loadDoctors();
}

function debounceDoctorSearch() {
  clearTimeout(doctorSearchTimer);
  doctorSearchTimer = setTimeout(() => {
    loadDoctors();
  }, 300);
}

function resetDoctorFilters() {
  selectedDeptId = null;
  const search = document.getElementById("doctorSearchInput");
  if (search) search.value = "";
  const filter = document.getElementById("doctorStatusFilter");
  if (filter) filter.value = "";
  const allCard = document.getElementById("deptFilterAll");
  if (allCard) allCard.classList.add("active");
  document.querySelectorAll(".dept-card:not(.all-depts-card)").forEach(c => c.classList.remove("active"));
  loadDoctors();
}

async function loadDoctors() {
  const tbody = document.getElementById("doctorsTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Loading doctors...</td></tr>`;

  const status = document.getElementById("doctorStatusFilter")?.value || "";
  const query = document.getElementById("doctorSearchInput")?.value.trim() || "";

  let url = `${API_BASE}/api/doctors?`;
  if (selectedDeptId) url += `dept_id=${selectedDeptId}&`;
  if (status) url += `status=${encodeURIComponent(status)}&`;
  if (query) url += `q=${encodeURIComponent(query)}&`;

  try {
    const res = await fetch(url);
    const result = await res.json();
    if (!result.success) return;

    allDoctors = result.data;
    if (allDoctors.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No doctors match the selected department or status filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = allDoctors.map(d => {
      const docStatus = (d.status || 'AVAILABLE').toUpperCase();

      return `
        <tr>
          <td><strong>#${d.doctor_id}</strong></td>
          <td><strong>${escapeHtml(d.doctor_name)}</strong></td>
          <td><span style="color:#0284c7; font-weight:600;">${escapeHtml(d.specialization)}</span></td>
          <td>
            <div><strong>${escapeHtml(d.department_name || '-')}</strong></div>
            <div style="font-size:11px; color:#64748b;">📍 ${escapeHtml(d.location || 'Wing')}</div>
          </td>
          <td>${d.phone || '-'}</td>
          <td>
            <select class="status-inline-select" onchange="updateDoctorStatus(${d.doctor_id}, this.value)">
              <option value="AVAILABLE" ${docStatus === 'AVAILABLE' ? 'selected' : ''}>🟢 Available</option>
              <option value="BUSY" ${docStatus === 'BUSY' ? 'selected' : ''}>🟡 Busy</option>
              <option value="ON_LEAVE" ${docStatus === 'ON_LEAVE' ? 'selected' : ''}>🔴 On Leave</option>
            </select>
          </td>
          <td>
            <span class="badge badge-scheduled" style="font-size:12px;">
              ${d.total_appointments} ${d.total_appointments === 1 ? 'Appt' : 'Appts'}
            </span>
          </td>
        </tr>
      `;
    }).join("");

    populateDoctorSelects(allDoctors);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Failed to load doctors: ${err.message}</td></tr>`;
  }
}

async function updateDoctorStatus(doctorId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    loadDepartments();
  } catch (err) {
    alert("Status update failed: " + err.message);
    loadDoctors();
  }
}

async function handleDoctorRegistration(e) {
  e.preventDefault();
  const name = document.getElementById("docName").value.trim();
  const specialization = document.getElementById("docSpecialization").value.trim();
  const departmentId = document.getElementById("docDepartmentSelect").value;
  const status = document.getElementById("docStatusSelect").value;
  const phone = document.getElementById("docPhone").value.trim();

  if (!name || !specialization || !departmentId) {
    alert("Please fill in Doctor Name, Specialization, and Department.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/doctors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_name: name,
        specialization: specialization,
        department_id: parseInt(departmentId),
        status: status,
        phone: phone
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    alert(`✅ Success: ${result.message}`);
    closeModal("addDoctorModal");
    document.getElementById("addDoctorForm").reset();
    loadDepartments();
    loadDoctors();
    fetchOverviewStats();
  } catch (err) {
    alert("Failed to register doctor: " + err.message);
  }
}

async function handleDepartmentRegistration(e) {
  e.preventDefault();
  const name = document.getElementById("deptName").value.trim();
  const location = document.getElementById("deptLocation").value.trim();

  if (!name) {
    alert("Please enter a Department Name.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department_name: name,
        location: location
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    alert(`✅ Success: ${result.message}`);
    closeModal("addDepartmentModal");
    document.getElementById("addDepartmentForm").reset();
    loadDepartments();
    fetchOverviewStats();
  } catch (err) {
    alert("Failed to create department: " + err.message);
  }
}

// ==========================================
// 4. APPOINTMENTS MODULE (ADMIN)
// ==========================================
async function loadAppointments() {
  const tbody = document.getElementById("appointmentsTableBody");
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/api/appointments`);
    const result = await res.json();
    if (!result.success) return;

    const appts = result.data;
    if (appts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="loading-cell">No appointments scheduled.</td></tr>`;
      return;
    }

    tbody.innerHTML = appts.map(a => `
      <tr>
        <td><strong>#${a.appointment_id}</strong></td>
        <td>
          <div><strong>${escapeHtml(a.patient_name)}</strong></div>
          <div style="font-size:11px; color:#64748b;">ID: #${a.patient_id}</div>
        </td>
        <td>
          <div><strong>${escapeHtml(a.doctor_name)}</strong></div>
          <div style="font-size:11px; color:#0284c7;">#${a.doctor_id}</div>
        </td>
        <td>${escapeHtml(a.specialization)}</td>
        <td><strong>${a.appointment_time}</strong></td>
        <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
      </tr>
    `).join("");

    populateAppointmentSelects(appts);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-cell">Error: ${err.message}</td></tr>`;
  }
}

async function handleAppointmentBooking(e) {
  e.preventDefault();
  const alertBox = document.getElementById("conflictAlert");
  alertBox.style.display = "none";

  const patientId = document.getElementById("bookPatientSelect").value;
  const doctorId = document.getElementById("bookDoctorSelect").value;
  const dateStr = document.getElementById("bookApptDate").value;
  const timeStr = document.getElementById("bookApptTime").value;

  if (!patientId || !doctorId || !dateStr || !timeStr) {
    alert("Please fill all required fields.");
    return;
  }

  const appointmentTime = `${dateStr} ${timeStr}`;

  try {
    const res = await fetch(`${API_BASE}/api/appointments/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: parseInt(patientId),
        doctor_id: parseInt(doctorId),
        appointment_time: appointmentTime
      })
    });

    const result = await res.json();
    if (!result.success) {
      if (result.conflict) {
        alertBox.textContent = `⚠️ ${result.error}`;
        alertBox.style.display = "block";
        return;
      }
      throw new Error(result.error);
    }

    alert(`✅ Success: ${result.message}`);
    closeModal("bookAppointmentModal");
    document.getElementById("bookAppointmentForm").reset();
    loadAppointments();
    loadDoctors();
    fetchOverviewStats();
  } catch (err) {
    alertBox.textContent = `Error: ${err.message}`;
    alertBox.style.display = "block";
  }
}

// ==========================================
// 5. BILLING & PAYMENTS (ADMIN)
// ==========================================
async function loadBilling() {
  const tbody = document.getElementById("billingTableBody");
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/api/billing`);
    const result = await res.json();
    if (!result.success) return;

    const bills = result.data;
    if (bills.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No bills found in Oracle.</td></tr>`;
      return;
    }

    tbody.innerHTML = bills.map(b => `
      <tr>
        <td><strong>#${b.bill_id}</strong></td>
        <td>Appt #${b.appointment_id}</td>
        <td><strong>${escapeHtml(b.patient_name)}</strong></td>
        <td>₹${b.total_amount.toFixed(2)}</td>
        <td>₹${b.paid_amount.toFixed(2)}</td>
        <td style="font-weight:700; color:${b.balance_due > 0 ? '#b91c1c' : '#15803d'};">
          ₹${b.balance_due.toFixed(2)}
        </td>
        <td>${b.bill_date}</td>
        <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">Error: ${err.message}</td></tr>`;
  }
}

async function handleBillCreation(e) {
  e.preventDefault();
  const appointmentId = document.getElementById("billAppointmentSelect").value;
  const totalAmount = document.getElementById("billTotalAmount").value;
  const initialPayment = document.getElementById("billPaymentAmount").value || 0;
  const paymentMethod = document.getElementById("billPaymentMethod").value;

  try {
    const res = await fetch(`${API_BASE}/api/billing/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointment_id: parseInt(appointmentId),
        total_amount: parseFloat(totalAmount),
        initial_payment: parseFloat(initialPayment),
        payment_method: paymentMethod
      })
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    alert(`✅ Transaction Committed: ${result.message}`);
    closeModal("createBillModal");
    document.getElementById("createBillForm").reset();
    loadBilling();
    fetchOverviewStats();
  } catch (err) {
    alert("Transaction Failed / Rolled Back: " + err.message);
  }
}

// ==========================================
// 6. QUERY EXPLORER (DBMS SYLLABUS LAB)
// ==========================================
async function loadQueryCatalog() {
  try {
    const res = await fetch(`${API_BASE}/api/query_explorer/catalog`);
    const result = await res.json();
    if (!result.success) return;

    queryCatalog = result.catalog;
    const container = document.getElementById("queryList");
    if (!container) return;

    container.innerHTML = queryCatalog.map((q, idx) => `
      <div class="query-card-item ${idx === 0 ? 'active' : ''}" onclick="selectQuery('${q.id}')">
        <div class="query-card-title">${q.title}</div>
        <div class="query-card-desc">${q.concept}</div>
      </div>
    `).join("");

    if (queryCatalog.length > 0) {
      selectQuery(queryCatalog[0].id);
    }

    const btnRun = document.getElementById("btnExecuteQuery");
    if (btnRun) btnRun.addEventListener("click", executeCurrentQuery);
  } catch (err) {
    console.error("Query catalog load error:", err);
  }
}

function selectQuery(queryId) {
  const item = queryCatalog.find(q => q.id === queryId);
  if (!item) return;

  document.querySelectorAll(".query-card-item").forEach(card => {
    card.classList.toggle("active", card.textContent.includes(item.title));
  });

  document.getElementById("queryTitle").textContent = item.title;
  document.getElementById("queryConcept").textContent = `DBMS Concept: ${item.concept}`;
  document.getElementById("sqlQueryInput").value = item.sql;

  executeCurrentQuery();
}

async function executeCurrentQuery() {
  const sql = document.getElementById("sqlQueryInput").value.trim();
  const thead = document.getElementById("queryResultsHead");
  const tbody = document.getElementById("queryResultsBody");
  const rowCountSpan = document.getElementById("queryRowCount");
  const execTimeSpan = document.getElementById("queryExecTime");

  if (!sql) return;

  tbody.innerHTML = `<tr><td class="loading-cell">Executing query on Oracle 23ai...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/query_explorer/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql })
    });
    const result = await res.json();

    if (!result.success) {
      tbody.innerHTML = `<tr><td style="color:#b91c1c; padding:20px;"><strong>Oracle SQL Error:</strong> ${result.error}</td></tr>`;
      rowCountSpan.textContent = "0";
      execTimeSpan.textContent = "0 ms";
      return;
    }

    rowCountSpan.textContent = result.row_count;
    execTimeSpan.textContent = `${result.execution_time_ms} ms`;

    // Render columns
    thead.innerHTML = `<tr>${result.columns.map(c => `<th>${c}</th>`).join("")}</tr>`;

    // Render rows
    if (result.rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${result.columns.length}" class="loading-cell">0 rows returned (Query executed successfully).</td></tr>`;
    } else {
      tbody.innerHTML = result.rows.map(row => `
        <tr>${row.map(val => `<td>${val !== null ? escapeHtml(String(val)) : '<span style="color:#94a3b8">NULL</span>'}</td>`).join("")}</tr>
      `).join("");
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td style="color:red; padding:20px;">Execution failed: ${err.message}</td></tr>`;
  }
}

// ==========================================
// 7. EMBEDDED SQL (PRO*C) LAB
// ==========================================
async function loadEmbeddedSqlFiles() {
  try {
    const res = await fetch(`${API_BASE}/api/embedded_sql_files`);
    const result = await res.json();
    if (!result.success) return;

    const list = document.getElementById("pcFileList");
    if (!list) return;

    list.innerHTML = result.files.map((f, idx) => `
      <div class="pc-file-item ${idx === 0 ? 'active' : ''}" onclick="viewPcFile('${f.name}', '${escapeHtml(f.desc)}')">
        <div class="pc-file-name">📄 ${f.name}</div>
        <div class="pc-file-desc">${f.desc}</div>
      </div>
    `).join("");

    if (result.files.length > 0) {
      viewPcFile(result.files[0].name, result.files[0].desc);
    }
  } catch (err) {
    console.error("Pro*C files listing failed:", err);
  }
}

async function viewPcFile(fileName, fileDesc) {
  document.querySelectorAll(".pc-file-item").forEach(item => {
    item.classList.toggle("active", item.textContent.includes(fileName));
  });

  document.getElementById("viewingFileName").textContent = fileName;
  document.getElementById("viewingFileDesc").textContent = fileDesc;
  const codeBox = document.getElementById("codeViewerContent");
  codeBox.textContent = `Loading ${fileName}...`;

  try {
    const res = await fetch(`${API_BASE}/api/embedded_sql_files/${fileName}`);
    const result = await res.json();
    if (result.success) {
      codeBox.textContent = result.content;
    } else {
      codeBox.textContent = `Error: ${result.error}`;
    }
  } catch (err) {
    codeBox.textContent = `Failed to read file: ${err.message}`;
  }
}

// ==========================================
// UTILITIES & POPULATORS
// ==========================================
function populatePatientSelects(patients) {
  const select = document.getElementById("bookPatientSelect");
  if (!select) return;
  select.innerHTML = `<option value="">-- Choose Patient --</option>` +
    patients.map(p => `<option value="${p.patient_id}">#${p.patient_id} - ${escapeHtml(p.patient_name)} (${p.phone || 'No phone'})</option>`).join("");
}

function populateDoctorSelects(doctors) {
  const select = document.getElementById("bookDoctorSelect");
  if (!select) return;
  select.innerHTML = `<option value="">-- Choose Doctor --</option>` +
    doctors.map(d => `<option value="${d.doctor_id}">#${d.doctor_id} - ${escapeHtml(d.doctor_name)} (${escapeHtml(d.specialization)}) [${d.status || 'AVAILABLE'}]</option>`).join("");
}

function populateAppointmentSelects(appts) {
  const select = document.getElementById("billAppointmentSelect");
  if (!select) return;
  select.innerHTML = `<option value="">-- Choose Appointment --</option>` +
    appts.map(a => `<option value="${a.appointment_id}">Appt #${a.appointment_id} - ${escapeHtml(a.patient_name)} with ${escapeHtml(a.doctor_name)} (${a.appointment_time})</option>`).join("");
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ==========================================
// ORACLE 23ai CLINICAL DOCTOR MATCH & VALIDATION
// ==========================================
function setAiPrompt(context, text) {
  const inputId = context === "admin" ? "aiAdminSymptomInput" : "aiPatientSymptomInput";
  const el = document.getElementById(inputId);
  if (el) el.value = text;
}

async function runAiDoctorMatch(context) {
  const inputId = context === "admin" ? "aiAdminSymptomInput" : "aiPatientSymptomInput";
  const resultsDiv = document.getElementById(context === "admin" ? "aiAdminMatchResults" : "aiPatientMatchResults");
  const deptNameEl = document.getElementById(context === "admin" ? "aiAdminDeptName" : "aiPatientDeptName");
  const deptLocEl = document.getElementById(context === "admin" ? "aiAdminDeptLocation" : "aiPatientDeptLocation");
  const rationaleEl = document.getElementById(context === "admin" ? "aiAdminRationale" : "aiPatientRationale");
  const badgeEl = document.getElementById(context === "admin" ? "aiAdminConfidenceBadge" : "aiPatientConfidenceBadge");
  const tbody = document.getElementById(context === "admin" ? "aiAdminDoctorsBody" : "aiPatientDoctorsBody");

  const symptoms = document.getElementById(inputId).value.trim();
  if (!symptoms) {
    showToast("Please enter or select symptoms first.", "error");
    return;
  }

  showToast("Running Oracle 23ai Clinical Resolution...", "info");

  try {
    const res = await fetch(`${API_BASE}/api/ai/recommend-doctor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || "Analysis failed.", "error");
      return;
    }

    const ai = data.ai_analysis;
    deptNameEl.textContent = ai.recommended_department;
    deptLocEl.textContent = `Department Clinical Wing • ${ai.matched_clinical_indicators.join(", ")}`;
    rationaleEl.textContent = ai.clinical_rationale;
    badgeEl.textContent = `${ai.confidence_score}% Confidence Match`;

    const docs = data.recommendations || [];
    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No active doctors found for this department.</td></tr>`;
    } else {
      tbody.innerHTML = docs.map(d => {
        const statusBadge = `<span class="badge badge-${d.status.toLowerCase()}">${d.status}</span>`;
        const scoreBadge = `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:800;">${d.match_percentage}%</span>`;
        if (context === "admin") {
          return `
            <tr>
              <td><strong>#${d.doctor_id}</strong></td>
              <td><strong>${escapeHtml(d.doctor_name)}</strong></td>
              <td>${escapeHtml(d.specialization)}</td>
              <td>${escapeHtml(d.department_name)} (${escapeHtml(d.location)})</td>
              <td>${statusBadge}</td>
              <td>${scoreBadge}</td>
            </tr>
          `;
        } else {
          return `
            <tr>
              <td><strong>${escapeHtml(d.doctor_name)}</strong></td>
              <td>${escapeHtml(d.specialization)}</td>
              <td>${escapeHtml(d.department_name)} (${escapeHtml(d.location)})</td>
              <td>${statusBadge}</td>
              <td>${scoreBadge}</td>
              <td>
                <button class="btn btn-primary btn-xs" onclick="bookWithRecommendedDoctor(${d.doctor_id}, '${escapeHtml(d.department_name)}')">
                  📅 Book Doctor
                </button>
              </td>
            </tr>
          `;
        }
      }).join("");
    }

    resultsDiv.style.display = "block";
    showToast(`Matched department: ${ai.recommended_department}`, "success");
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}

function bookWithRecommendedDoctor(doctorId, deptName) {
  switchPortalTab("my-appointments");
  setTimeout(() => {
    const docSelect = document.getElementById("portalBookDoctorSelect");
    if (docSelect) {
      docSelect.value = doctorId;
    }
    showToast(`Selected doctor #${doctorId} for self-booking.`, "info");
  }, 200);
}

// Live Validation Suite Runner
async function runLiveValidationSuite() {
  const tbody = document.getElementById("validationResultsBody");
  const summaryBadge = document.getElementById("validationSuiteSummary");
  const ratingBadge = document.getElementById("rubricValidationRatingBadge");

  tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">Executing live test queries against Oracle Database 23ai...</td></tr>`;
  showToast("Running automated test cases on Oracle 23ai...", "info");

  try {
    const res = await fetch(`${API_BASE}/api/validation/run`);
    const data = await res.json();
    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="8" class="loading-cell" style="color:red;">Error running test suite: ${data.error}</td></tr>`;
      return;
    }

    const sum = data.summary;
    summaryBadge.textContent = `${sum.passed}/${sum.total} Passed (${sum.score_percentage}%) — ${sum.assessment_level}`;
    summaryBadge.className = sum.passed === sum.total ? "badge badge-completed" : "badge badge-partial";

    if (ratingBadge) {
      ratingBadge.textContent = `Rating: ${sum.assessment_level}`;
    }

    tbody.innerHTML = data.results.map(r => {
      const isPass = r.status === "PASS";
      const statusBadge = isPass 
        ? `<span class="badge badge-completed">✅ PASS</span>` 
        : `<span class="badge badge-cancelled">❌ FAIL</span>`;
      return `
        <tr>
          <td><strong>${r.test_id}</strong></td>
          <td><code style="font-size:11px; background:#f1f5f9; padding:2px 4px; border-radius:4px;">${r.co_mapping}</code></td>
          <td>${escapeHtml(r.category)}</td>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td style="font-size:11.5px; color:#64748b;">${escapeHtml(r.expected)}</td>
          <td style="font-size:11.5px; color:#0f172a;">${escapeHtml(r.actual)}</td>
          <td>${statusBadge}</td>
          <td style="font-family:var(--font-mono); font-size:11.5px;">${r.time_ms} ms</td>
        </tr>
      `;
    }).join("");

    showToast(`Validation Complete: ${sum.passed}/${sum.total} Tests Passed! (${sum.assessment_level})`, "success");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell" style="color:red;">Failed to execute validation runner: ${err.message}</td></tr>`;
    showToast(`Test suite execution error: ${err.message}`, "error");
  }
}
