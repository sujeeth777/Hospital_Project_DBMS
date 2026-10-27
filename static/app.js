// Hospital Management System Dashboard — JavaScript

const API_BASE = "";

// State
let allPatients = [];
let allDoctors = [];
let allDepartments = [];
let queryCatalog = [];
let selectedDeptId = null;
let doctorSearchTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initTopSearch();
  fetchOverviewStats();
  loadPatients();
  loadDepartments();
  loadDoctors();
  loadAppointments();
  loadBilling();
  loadQueryCatalog();
  loadEmbeddedSqlFiles();

  // Set default appointment date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const dateInput = document.getElementById("bookApptDate");
  if (dateInput) dateInput.value = tomorrowStr;
});

// ==========================================
// TABS & NAVIGATION
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
    switchTab("patients");
    const filterInput = document.getElementById("patientFilterInput");
    filterInput.value = val;
    loadPatients();
  };

  btn.addEventListener("click", doSearch);
  input.addEventListener("keypress", (e) => {
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
    badge.innerHTML = `<span class="status-dot online"></span><span class="status-text">Oracle 23ai Connected (${stats.patients} Patients)</span>`;
  } catch (err) {
    console.error("Failed to load overview stats:", err);
  }
}

// ==========================================
// 2. PATIENTS MODULE
// ==========================================
async function loadPatients() {
  const query = document.getElementById("patientFilterInput")?.value.trim() || "";
  const tbody = document.getElementById("patientsTableBody");
  tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Searching database...</td></tr>`;

  try {
    const url = query ? `${API_BASE}/api/patients?q=${encodeURIComponent(query)}` : `${API_BASE}/api/patients`;
    const res = await fetch(url);
    const result = await res.json();

    if (!result.success || !result.data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No patients found in Oracle database.</td></tr>`;
      return;
    }

    allPatients = result.data;
    renderPatientsTable(allPatients);
    populatePatientSelects(allPatients);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color:red;">Error fetching patients: ${err.message}</td></tr>`;
  }
}

function clearPatientSearch() {
  const input = document.getElementById("patientFilterInput");
  if (input) input.value = "";
  loadPatients();
}

function renderPatientsTable(patients) {
  const tbody = document.getElementById("patientsTableBody");
  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><strong>#${p.patient_id}</strong></td>
      <td><strong>${escapeHtml(p.patient_name)}</strong></td>
      <td>${p.dob || '-'}</td>
      <td>${p.gender || '-'}</td>
      <td>${p.phone || '-'}</td>
      <td>${p.address || '-'}</td>
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
  const phone = document.getElementById("regPatientPhone").value.trim();
  const address = document.getElementById("regPatientAddress").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_name: name, date_of_birth: dob, gender, phone, address })
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
// 3. DEPARTMENTS & DOCTORS MODULE (Workload & Availability)
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

    document.getElementById("allDeptsCount").textContent = `${totalDocs} Doctors`;
    document.getElementById("allAvailCount").textContent = `🟢 ${totalAvail} Avail`;
    document.getElementById("allBusyCount").textContent = `🟡 ${totalBusy} Busy`;
    document.getElementById("allLeaveCount").textContent = `🔴 ${totalLeave} Leave`;

    // Render department cards in side panel
    const panel = document.getElementById("departmentListPanel");
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

  // Toggle active class on all dept card vs specific dept cards
  document.getElementById("deptFilterAll").classList.toggle("active", deptId === null);
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
  document.getElementById("doctorSearchInput").value = "";
  document.getElementById("doctorStatusFilter").value = "";
  document.getElementById("deptFilterAll").classList.add("active");
  document.querySelectorAll(".dept-card:not(.all-depts-card)").forEach(c => c.classList.remove("active"));
  loadDoctors();
}

async function loadDoctors() {
  const tbody = document.getElementById("doctorsTableBody");
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
      const statusBadgeClass = docStatus === 'AVAILABLE' ? 'badge-available' : (docStatus === 'BUSY' ? 'badge-busy' : 'badge-on_leave');

      return `
        <tr>
          <td><strong>#${d.doctor_id}</strong></td>
          <td>
            <strong>${escapeHtml(d.doctor_name)}</strong>
          </td>
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

    loadDepartments(); // Update department availability counters
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
// 4. APPOINTMENTS MODULE (Conflict Prevention)
// ==========================================
async function loadAppointments() {
  const tbody = document.getElementById("appointmentsTableBody");
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
        <td>${a.specialization}</td>
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
    loadDoctors(); // update doctor workload
    fetchOverviewStats();
  } catch (err) {
    alertBox.textContent = `Error: ${err.message}`;
    alertBox.style.display = "block";
  }
}

// ==========================================
// 5. BILLING & PAYMENTS (ACID Transactions)
// ==========================================
async function loadBilling() {
  const tbody = document.getElementById("billingTableBody");
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
    container.innerHTML = queryCatalog.map((q, idx) => `
      <div class="query-card-item ${idx === 0 ? 'active' : ''}" onclick="selectQuery('${q.id}')">
        <div class="query-card-title">${q.title}</div>
        <div class="query-card-desc">${q.concept}</div>
      </div>
    `).join("");

    if (queryCatalog.length > 0) {
      selectQuery(queryCatalog[0].id);
    }

    document.getElementById("btnExecuteQuery").addEventListener("click", executeCurrentQuery);
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
    patients.map(p => `<option value="${p.patient_id}">#${p.patient_id} - ${p.patient_name} (${p.phone || 'No phone'})</option>`).join("");
}

function populateDoctorSelects(doctors) {
  const select = document.getElementById("bookDoctorSelect");
  if (!select) return;
  select.innerHTML = `<option value="">-- Choose Doctor --</option>` +
    doctors.map(d => `<option value="${d.doctor_id}">#${d.doctor_id} - ${d.doctor_name} (${d.specialization}) [${d.status || 'AVAILABLE'}]</option>`).join("");
}

function populateAppointmentSelects(appts) {
  const select = document.getElementById("billAppointmentSelect");
  if (!select) return;
  select.innerHTML = `<option value="">-- Choose Appointment --</option>` +
    appts.map(a => `<option value="${a.appointment_id}">Appt #${a.appointment_id} - ${a.patient_name} with ${a.doctor_name} (${a.appointment_time})</option>`).join("");
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
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
