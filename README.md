# 🏥 Hospital Management System (HMS)
### 3rd Year CSE DBMS Project — Oracle 23ai & Embedded SQL (Pro*C)

An end-to-end, academic-grade Database Management System project built using **Oracle Database 23ai**, **Embedded SQL (C with Pro\*C precompiler)**, and an **Interactive Web Dashboard & Query Explorer**.

---

## ⚡ One-Click Quick Start (Single Run Setup)

Anyone cloning this repository can get the entire project running with **a single command or double-click**:

### For Windows Users (One-Click):
1. Clone the repository:
   ```bash
   git clone https://github.com/sujeeth777/Hospital_Project_DBMS.git
   cd Hospital_Project_DBMS
   ```
2. Double-click **`START.bat`** (or run `.\START.bat` in CMD / PowerShell).

### What `START.bat` Automatically Does For You:
- ✅ **Auto-installs Python packages**: Runs `pip install -r requirements.txt` silently (`Flask`, `oracledb`, `python-dotenv`).
- ✅ **Auto-creates `.env`**: Prompts for your local Oracle password if not yet configured.
- ✅ **Auto-seeds Oracle Database**: Runs `setup_database.py` which detects missing tables, executes `01_create_tables.sql`, and inserts sample data from `02_sample_data.sql`.
- ✅ **Auto-checks Embedded SQL C Binaries**: Verifies `hospital_menu.exe` or compiles via `build_all.bat` if Pro*C is installed.
- ✅ **Launches Dashboard & Browser**: Starts `server.py` and immediately opens **`http://localhost:5000`** in your default browser.
- ✅ **Console Control Center**: Provides an interactive terminal menu to launch the C console (`hospital_menu.exe`) anytime.

---

## 📌 Architecture & Design

This project demonstrates two connected interfaces interacting with the exact same normalized Oracle database:

1. **Embedded SQL (Pro\*C / C) Console Suite**:
   - `patient_search.pc` — Single row queries, host variables, SQLCA status inspection.
   - `patient_register.pc` — DML INSERTs, parameter binding, domain constraints.
   - `doctor_add.pc` — Doctor registration with foreign key validation against DEPARTMENTS.
   - `appointment_book.pc` — CURSOR management (DECLARE, OPEN, FETCH, CLOSE), conflict detection.
   - `consultation_add.pc` — Foreign key navigation across appointments and consultations.
   - `billing_payment.pc` — Multi-statement ACID transactions with `EXEC SQL COMMIT` and `ROLLBACK`.
   - `hospital_reports.pc` — Multi-table Joins, Outer Joins, Null Indicators, and Aggregates.
   - `hospital_menu.exe` — Unified C command-line menu orchestrator.

2. **Interactive Web Dashboard & Query Explorer (Flask + Vanilla Web UI)**:
   - **Overview KPIs**: Dynamic aggregates for patients, doctors, departments, appointments, and hospital revenue.
   - **Doctor & Department Management with Live Side Panel**:
     - Department cards with real-time counters: Available 🟢, Busy 🟡, and On-Leave 🔴 doctors.
     - Interactive filter: click any department card to view only doctors in that department.
     - Add new doctors and departments with foreign key constraint verification.
     - Inline availability status toggle for doctors.
   - **Quick Search**: Look up any patient by ID (e.g. `1001`) or partial name with linked appointment and invoice histories.
   - **Appointment Booking with Conflict Prevention**: Detects doctor double-booking concurrently.
   - **ACID Billing Settlement**: Demonstrates atomicity where bill creation and payment commit together or rollback on failure.
   - **DBMS Query Explorer**: Interactive playground for professors and examiners to inspect Relational Algebra concepts (Selection, Inner Joins, Left Outer Joins, GROUP BY, Subqueries, and custom SQL execution with execution timer).
   - **Embedded SQL Lab**: Built-in inspector for all Pro*C `.pc` files explaining host variables, indicator variables, and cursor processing.

3. **Patient Authentication & Self-Service Health Portal**:
   - **Secure Patient Sign-Up & Login**: Built with industry-standard cryptographic password hashing (scrypt) and session authentication.
   - **Login Identifiers**: Patients can authenticate using their registered **Email**, **Patient ID** (e.g. 1001), or **Phone Number**.
   - **Demo Patient Credentials**: 
     - **Identifier:** 1001 or 
ahulsharma@email.com
     - **Password:** patient123
     *(All seeded patients have default password patient123).*
   - **Dual-Mode Architecture**: Single-click toggle between **Hospital Admin View** (full operational controls) and **Patient Portal** (personalized patient view).
   - **Self-Service Features**:
     - **Health Summary**: Interactive KPI cards showing personal upcoming appointments, prescriptions, and total balance due.
     - **Appointment Self-Booking**: Patients select doctor & department with live conflict detection.
     - **Appointment Management**: One-click cancellation of upcoming visits.
     - **Prescriptions & Consultations**: View past diagnoses, prescribed medicines, dosages, and durations.
     - **Online Bill Payment**: Instant online settlement of outstanding invoices (UPI / Card / Net Banking) backed by atomic ACID transactions in Oracle.
     - **Profile & Password Management**: Self-service updates to phone, address, and login credentials.

---

## 🗄️ Relational Database Schema (3NF)

```text
+------------------+         +--------------------+         +------------------+
|   DEPARTMENTS    | 1     * |      DOCTORS       | 1     * |   APPOINTMENTS   |
| department_id PK |<--------| doctor_id PK       |<--------| appointment_id PK|
| department_name  |         | department_id FK   |         | patient_id FK    |
| location         |         | specialization     |         | doctor_id FK     |
+------------------+         +--------------------+         | appointment_time |
                                                            | status           |
+------------------+                                        +--------+---------+
|     PATIENTS     | 1                                               | 1
| patient_id PK    |<------------------------------------------------+
| patient_name     |                                                 | 1
| date_of_birth    |                                                 v
| gender (CHECK)   |                                        +------------------+
| phone, address   |                                        |  CONSULTATIONS   |
+------------------+                                        | consultation_idPK|
                                                            | appointment_id FK|
                                                            | diagnosis, notes |
                                                            +--------+---------+
                                                                     | 1
+------------------+ 1     * +--------------------+                  v *
|      BILLS       |--------<|      PAYMENTS      |         +------------------+
| bill_id PK       |         | payment_id PK      |         |  PRESCRIPTIONS   |
| appointment_id FK|         | bill_id FK         |         | prescription_idPK|
| total_amount     |         | amount, date       |         | consultation_idFK|
| status           |         | payment_method     |         | medicine, dosage |
+------------------+         +--------------------+         +------------------+
```

### Normalization Breakdown:
- **1NF (First Normal Form)**: All attributes contain atomic values (single phone, single dates, no repeating groups).
- **2NF (Second Normal Form)**: In 1NF and no partial dependencies exist; all non-key attributes depend fully on the primary key.
- **3NF (Third Normal Form)**: In 2NF and no transitive dependencies exist ($X \to Y \to Z$). For example, department locations are stored in `DEPARTMENTS`, not duplicated inside `DOCTORS`.

---

## 🚀 How to Run the Project

### Prerequisites

- Python 3.10 or later.
- Oracle Database Free with the `FREEPDB1` service available locally.
- For the Pro*C programs only: Oracle Pro*C precompiler and libraries, plus Visual Studio Build Tools with the C/C++ workload.

### Database setup

Connect to your Oracle PDB as a user allowed to create tables, then run these scripts in order:

```sql
@01_create_tables.sql
@02_sample_data.sql
```

Run `02_sample_data.sql` only once on a newly created schema. The three remaining SQL*Plus scripts demonstrate patient search, registration, and appointment booking.
If you already created the schema using an earlier version of this project, run `06_add_doctor_status.sql` once before starting the dashboard. Do not run this migration on a fresh schema.

### Option A: Launch the Web Dashboard (Recommended for Demos)

1. Create and activate a virtual environment, then install the Python dependencies:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and set `ORACLE_USER`, `ORACLE_PASSWORD`, and `ORACLE_DSN` to match your local Oracle account. Do not commit `.env`.
3. Start the dashboard:

   ```powershell
   python server.py
   ```

4. Open your browser at:
   ```
   http://localhost:5000
   ```
5. Use the top search bar to enter a Patient ID (e.g., `1001`) or search by name (e.g., `Rahul`).
6. Navigate to the **DBMS Query Explorer** tab to showcase Joins, Aggregations, and Subqueries to faculty.

### Option B: Run the Pro\*C Embedded SQL C Menu
1. Configure Oracle and MSVC as described under Prerequisites, then build the programs using Option C.
2. Run `hospital_menu.exe` in PowerShell / Command Prompt:
   ```powershell
   .\hospital_menu.exe
   ```
3. Select an option to run one of the compiled Pro*C programs.

### Option C: Recompiling Pro\*C Programs
Set `ORACLE_HOME` to your Oracle installation directory. If Visual Studio Build Tools is not installed at the default path, set `VSDEVCMD` to its `VsDevCmd.bat` file. For example:

```powershell
$env:ORACLE_HOME = "C:\app\oracle\product\23ai\dbhomeFree"
$env:VSDEVCMD = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"
.\build_all.bat
```

The script calls Oracle `proc.exe` to generate the C files from `.pc` sources and compiles them using MSVC `cl.exe` linked with `orasql.lib`.

---

## 💡 Key DBMS Viva Questions & Answers

1. **What is Embedded SQL, and how does it differ from dynamic SQL / database drivers?**
   - **Answer**: In Embedded SQL, SQL statements are written directly inside host language code (like C) using the `EXEC SQL` prefix. A precompiler (Oracle Pro\*C) parses the SQL statements at build time, verifies syntax, converts host variables into internal structures, and replaces the SQL with Oracle runtime library function calls. Database drivers (like JDBC or ODBC) interpret queries dynamically at runtime.

2. **What is the purpose of host variables and the colon (`:`) prefix?**
   - **Answer**: Host variables are C variables declared within `EXEC SQL BEGIN/END DECLARE SECTION`. They bridge the gap between C memory and the SQL database engine. When used inside a SQL statement, a colon (`:var_name`) informs the precompiler that it is referencing a host language variable rather than a database table column.

3. **What is `SQLCA`?**
   - **Answer**: The SQL Communications Area is a structure populated by Oracle after every SQL execution. The most vital field is `sqlca.sqlcode`:
     - `0`: Execution succeeded.
     - `1403`: `ORA-01403` "No Data Found" (end of cursor fetch or row not found).
     - `< 0`: Execution error (e.g. constraint violation, table not found).

4. **Why do we use Cursors in Embedded SQL?**
   - **Answer**: Relational SQL operations work on sets of records, whereas C operates on single variables. A cursor provides a mechanism to fetch and iterate through multi-row result sets tuple-by-tuple using `DECLARE`, `OPEN`, `FETCH INTO`, and `CLOSE`.

5. **How does the system enforce ACID properties in Billing?**
   - **Answer**: Atomicity and Consistency are enforced by wrapping bill creation and payment insertion in a single transaction. If any step fails (e.g. invalid amount or duplicate billing), `ROLLBACK WORK` restores the database to its pristine state. If all statements succeed, `COMMIT WORK` persists the changes.
