"""
Hospital Management System - Database Setup & Verification
Verifies connection to Oracle Database and initializes tables/sample data if needed.
Safe to run multiple times: skips tables if they already exist.
"""

import os
import sys
import re
from dotenv import load_dotenv
import oracledb

load_dotenv()

def ensure_env_file():
    """Prompts for credentials and writes .env if missing."""
    if not os.path.exists(".env"):
        print("\n[SETUP] .env file not found. Let's configure your database connection:")
        default_user = "system"
        default_dsn = "localhost:1521/FREEPDB1"
        
        user = input(f"Enter Oracle username [{default_user}]: ").strip() or default_user
        password = input("Enter Oracle password [sujeeth]: ").strip() or "sujeeth"
        dsn = input(f"Enter Oracle connection string [{default_dsn}]: ").strip() or default_dsn
        
        with open(".env", "w", encoding="utf-8") as f:
            f.write(f"ORACLE_USER={user}\n")
            f.write(f"ORACLE_PASSWORD={password}\n")
            f.write(f"ORACLE_DSN={dsn}\n")
        print("[SETUP] Created .env successfully!\n")
        load_dotenv(override=True)

def parse_sql_file(filepath):
    """Reads a SQL script and splits it into executable statements."""
    if not os.path.exists(filepath):
        print(f"[WARN] Script {filepath} not found.")
        return []
        
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Remove SQL*Plus specific commands (like SET SQLBLANKLINES ON)
    cleaned_lines = []
    for line in content.splitlines():
        trimmed = line.strip()
        if trimmed.upper().startswith("SET ") or trimmed.upper().startswith("PROMPT ") or trimmed.startswith("--"):
            continue
        cleaned_lines.append(line)
        
    cleaned_content = "\n".join(cleaned_lines)
    # Split by semicolon
    statements = [stmt.strip() for stmt in cleaned_content.split(";") if stmt.strip()]
    return statements

def init_database():
    ensure_env_file()
    
    user = os.getenv("ORACLE_USER", "system")
    password = os.getenv("ORACLE_PASSWORD")
    dsn = os.getenv("ORACLE_DSN", "localhost:1521/FREEPDB1")

    if not password:
        print("[ERROR] ORACLE_PASSWORD is not set in .env")
        sys.exit(1)

    print(f"Connecting to Oracle Database at {dsn} as {user}...")
    try:
        conn = oracledb.connect(user=user, password=password, dsn=dsn)
        cursor = conn.cursor()
        print("[SUCCESS] Connected to Oracle successfully!")
    except Exception as e:
        print(f"\n[FAILED] Could not connect to Oracle: {e}")
        print("Please ensure Oracle Database 23ai is running and credentials in .env are correct.")
        sys.exit(1)

    # Check which tables exist
    cursor.execute("""
        SELECT table_name FROM user_tables 
        WHERE table_name IN ('DEPARTMENTS', 'PATIENTS', 'DOCTORS', 'APPOINTMENTS', 'CONSULTATIONS', 'PRESCRIPTIONS', 'BILLS', 'PAYMENTS')
    """)
    existing_tables = {row[0] for row in cursor.fetchall()}
    
    required_tables = {'DEPARTMENTS', 'PATIENTS', 'DOCTORS', 'APPOINTMENTS', 'CONSULTATIONS', 'PRESCRIPTIONS', 'BILLS', 'PAYMENTS'}
    missing_tables = required_tables - existing_tables

    if missing_tables:
        print(f"\n[INFO] Missing tables detected: {', '.join(missing_tables)}")
        print("Creating tables from 01_create_tables.sql...")
        
        create_stmts = parse_sql_file("01_create_tables.sql")
        for stmt in create_stmts:
            try:
                cursor.execute(stmt)
            except Exception as e:
                # Ignore already existing object errors
                if "ORA-00955" not in str(e):
                    print(f"Note: {e}")

        conn.commit()
        print("[SUCCESS] Tables created successfully.")

        # Insert sample data
        print("Inserting sample data from 02_sample_data.sql...")
        sample_stmts = parse_sql_file("02_sample_data.sql")
        inserted_count = 0
        for stmt in sample_stmts:
            try:
                cursor.execute(stmt)
                inserted_count += 1
            except Exception as e:
                pass
        conn.commit()
        print(f"[SUCCESS] Loaded sample data ({inserted_count} records).")
    else:
        print(f"[SUCCESS] All 8 required tables exist in Oracle database.")

    # Check status column on doctors
    try:
        cursor.execute("SELECT status FROM doctors WHERE ROWNUM = 1")
    except Exception:
        print("[INFO] Adding status column to DOCTORS table...")
        try:
            cursor.execute("ALTER TABLE doctors ADD (status VARCHAR2(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BUSY', 'ON_LEAVE')))")
            conn.commit()
            print("[SUCCESS] Added status column.")
        except Exception as e:
            print(f"Note on status column: {e}")

    # Check email and password_hash columns on patients
    try:
        cursor.execute("SELECT email, password_hash FROM patients WHERE ROWNUM = 1")
    except Exception:
        print("[INFO] Adding email and password_hash columns to PATIENTS table...")
        try:
            cursor.execute("ALTER TABLE patients ADD (email VARCHAR2(100), password_hash VARCHAR2(255))")
            conn.commit()
            print("[SUCCESS] Added auth columns to patients.")
        except Exception as e:
            print(f"Note on patient auth columns: {e}")

    # Set default password for any patients missing password_hash
    try:
        from werkzeug.security import generate_password_hash
        default_hash = generate_password_hash('patient123')
        cursor.execute("UPDATE patients SET password_hash = :1 WHERE password_hash IS NULL", [default_hash])
        cursor.execute("UPDATE patients SET email = LOWER(REPLACE(patient_name, ' ', '')) || '@email.com' WHERE email IS NULL")
        conn.commit()
    except Exception as e:
        print(f"Note setting default patient hashes: {e}")

    # Summary
    cursor.execute("SELECT COUNT(*) FROM patients")
    pt_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM doctors")
    doc_cnt = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM appointments")
    appt_cnt = cursor.fetchone()[0]
    
    print("\n--- Current Database Summary ---")
    print(f" Patients    : {pt_cnt}")
    print(f" Doctors     : {doc_cnt}")
    print(f" Appointments: {appt_cnt}")
    print("--------------------------------\n")
    
    conn.close()

if __name__ == "__main__":
    init_database()
