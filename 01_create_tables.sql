SET SQLBLANKLINES ON
-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM
-- PHASE 1: DATABASE TABLE CREATION
-- Database: Oracle
-- Execute using SQL*Plus
-- =====================================================

-- 1. DEPARTMENTS
CREATE TABLE departments (
    department_id   NUMBER(5) PRIMARY KEY,
    department_name VARCHAR2(100) NOT NULL,
    location        VARCHAR2(100),
    CONSTRAINT uq_department_name UNIQUE (department_name)
);

-- 2. PATIENTS
CREATE TABLE patients (
    patient_id      NUMBER(6) PRIMARY KEY,
    patient_name    VARCHAR2(100) NOT NULL,
    date_of_birth   DATE,
    gender          VARCHAR2(10),
    phone           VARCHAR2(15),
    address         VARCHAR2(250),
    CONSTRAINT chk_patient_gender
        CHECK (gender IN ('Male', 'Female', 'Other')
               OR gender IS NULL)
);

-- 3. DOCTORS
CREATE TABLE doctors (
    doctor_id       NUMBER(5) PRIMARY KEY,
    doctor_name     VARCHAR2(100) NOT NULL,
    specialization  VARCHAR2(100),
    department_id   NUMBER(5),
    phone           VARCHAR2(15),
    status          VARCHAR2(15) DEFAULT 'AVAILABLE' NOT NULL,
    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id),
    CONSTRAINT chk_doctor_status
        CHECK (status IN ('AVAILABLE', 'BUSY', 'ON_LEAVE'))
);

-- 4. APPOINTMENTS
CREATE TABLE appointments (
    appointment_id   NUMBER(8) PRIMARY KEY,
    patient_id       NUMBER(6) NOT NULL,
    doctor_id        NUMBER(5) NOT NULL,
    appointment_time DATE NOT NULL,
    status           VARCHAR2(15) DEFAULT 'SCHEDULED' NOT NULL,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id),

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id),

    CONSTRAINT chk_appointment_status
        CHECK (status IN
            ('SCHEDULED', 'COMPLETED', 'CANCELLED'))
);

-- 5. CONSULTATIONS
CREATE TABLE consultations (
    consultation_id   NUMBER(8) PRIMARY KEY,
    appointment_id    NUMBER(8) NOT NULL,
    diagnosis          VARCHAR2(500),
    consultation_notes VARCHAR2(1000),
    consultation_date  DATE DEFAULT SYSDATE NOT NULL,

    CONSTRAINT uq_consultation_appointment
        UNIQUE (appointment_id),

    CONSTRAINT fk_consultation_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id)
);

-- 6. PRESCRIPTIONS
CREATE TABLE prescriptions (
    prescription_id NUMBER(8) PRIMARY KEY,
    consultation_id NUMBER(8) NOT NULL,
    medicine_name   VARCHAR2(100) NOT NULL,
    dosage          VARCHAR2(100),
    duration        VARCHAR2(100),

    CONSTRAINT fk_prescription_consultation
        FOREIGN KEY (consultation_id)
        REFERENCES consultations(consultation_id)
);

-- 7. BILLS
CREATE TABLE bills (
    bill_id         NUMBER(8) PRIMARY KEY,
    appointment_id  NUMBER(8) NOT NULL,
    total_amount    NUMBER(10,2) NOT NULL,
    bill_date       DATE DEFAULT SYSDATE NOT NULL,
    status          VARCHAR2(15) DEFAULT 'UNPAID' NOT NULL,

    CONSTRAINT uq_bill_appointment
        UNIQUE (appointment_id),

    CONSTRAINT chk_bill_amount
        CHECK (total_amount >= 0),

    CONSTRAINT chk_bill_status
        CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID')),

    CONSTRAINT fk_bill_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id)
);

-- 8. PAYMENTS
CREATE TABLE payments (
    payment_id     NUMBER(8) PRIMARY KEY,
    bill_id        NUMBER(8) NOT NULL,
    amount         NUMBER(10,2) NOT NULL,
    payment_date   DATE DEFAULT SYSDATE NOT NULL,
    payment_method VARCHAR2(20),

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0),

    CONSTRAINT fk_payment_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id),

    CONSTRAINT chk_payment_method
        CHECK (payment_method IN
            ('CASH', 'CARD', 'UPI', 'BANK')
            OR payment_method IS NULL)
);

-- END OF TABLE CREATION