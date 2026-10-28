-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM
-- PHASE 2: INSERT SAMPLE DATA
-- Oracle SQL*Plus
-- Run this script only ONCE on a fresh dataset.
-- =====================================================

SET SQLBLANKLINES ON

-- 1. DEPARTMENTS
INSERT INTO departments
VALUES (10, 'Cardiology', 'Block A');

INSERT INTO departments
VALUES (20, 'Neurology', 'Block B');

INSERT INTO departments
VALUES (30, 'Orthopedics', 'Block C');

INSERT INTO departments
VALUES (40, 'General Medicine', 'Block D');


-- 2. PATIENTS
INSERT INTO patients (patient_id, patient_name, date_of_birth, gender, phone, address, email, password_hash)
VALUES (1001, 'Rahul Sharma', DATE '2002-05-14',
        'Male', '9876501001', 'Chennai', 'rahulsharma@email.com', 'scrypt:32768:8:1');

INSERT INTO patients (patient_id, patient_name, date_of_birth, gender, phone, address, email, password_hash)
VALUES (1002, 'Priya Kumar', DATE '2001-11-22',
        'Female', '9876501002', 'Coimbatore', 'priyakumar@email.com', 'scrypt:32768:8:1');

INSERT INTO patients (patient_id, patient_name, date_of_birth, gender, phone, address, email, password_hash)
VALUES (1003, 'Arjun Reddy', DATE '1999-03-08',
        'Male', '9876501003', 'Vellore', 'arjunreddy@email.com', 'scrypt:32768:8:1');

INSERT INTO patients (patient_id, patient_name, date_of_birth, gender, phone, address, email, password_hash)
VALUES (1004, 'Sneha Iyer', DATE '2003-07-19',
        'Female', '9876501004', 'Chennai', 'snehaiyer@email.com', 'scrypt:32768:8:1');

INSERT INTO patients (patient_id, patient_name, date_of_birth, gender, phone, address, email, password_hash)
VALUES (1005, 'Karthik Raj', DATE '1998-12-02',
        'Male', '9876501005', 'Salem', 'karthikraj@email.com', 'scrypt:32768:8:1');

INSERT INTO patients (patient_id, patient_name, date_of_birth, gender, phone, address, email, password_hash)
VALUES (1006, 'Ananya Das', DATE '2000-09-30',
        'Female', '9876501006', 'Madurai', 'ananyadas@email.com', 'scrypt:32768:8:1');


-- 3. DOCTORS
INSERT INTO doctors (
    doctor_id, doctor_name, specialization, department_id, phone
)
VALUES (201, 'Dr. Meera Nair', 'Cardiologist', 10, '9000000201');

INSERT INTO doctors (
    doctor_id, doctor_name, specialization, department_id, phone
)
VALUES (202, 'Dr. Vikram Rao', 'Neurologist', 20, '9000000202');

INSERT INTO doctors (
    doctor_id, doctor_name, specialization, department_id, phone
)
VALUES (203, 'Dr. Anand Kumar', 'Orthopedic Surgeon', 30, '9000000203');

INSERT INTO doctors (
    doctor_id, doctor_name, specialization, department_id, phone
)
VALUES (204, 'Dr. Divya Menon', 'General Physician', 40, '9000000204');

INSERT INTO doctors (
    doctor_id, doctor_name, specialization, department_id, phone
)
VALUES (205, 'Dr. Sanjay Patel', 'Cardiologist', 10, '9000000205');


-- 4. APPOINTMENTS
INSERT INTO appointments
VALUES (5001, 1001, 201,
        TRUNC(SYSDATE) - 10 + 10/24, 'COMPLETED');

INSERT INTO appointments
VALUES (5002, 1002, 202,
        TRUNC(SYSDATE) - 8 + 11/24, 'COMPLETED');

INSERT INTO appointments
VALUES (5003, 1003, 203,
        TRUNC(SYSDATE) - 5 + 14/24, 'COMPLETED');

INSERT INTO appointments
VALUES (5004, 1004, 204,
        TRUNC(SYSDATE) - 3 + 9/24, 'COMPLETED');

INSERT INTO appointments
VALUES (5005, 1005, 201,
        TRUNC(SYSDATE) + 1 + 10/24, 'SCHEDULED');

INSERT INTO appointments
VALUES (5006, 1006, 205,
        TRUNC(SYSDATE) + 2 + 11/24, 'SCHEDULED');

INSERT INTO appointments
VALUES (5007, 1001, 204,
        TRUNC(SYSDATE) - 1 + 15/24, 'COMPLETED');

INSERT INTO appointments
VALUES (5008, 1003, 202,
        TRUNC(SYSDATE) + 3 + 12/24, 'CANCELLED');


-- 5. CONSULTATIONS
INSERT INTO consultations
VALUES (7001, 5001, 'Hypertension',
        'Routine blood pressure evaluation',
        TRUNC(SYSDATE) - 10 + 10/24);

INSERT INTO consultations
VALUES (7002, 5002, 'Migraine',
        'Patient reported recurring headaches',
        TRUNC(SYSDATE) - 8 + 11/24);

INSERT INTO consultations
VALUES (7003, 5003, 'Knee pain',
        'Physical examination completed',
        TRUNC(SYSDATE) - 5 + 14/24);

INSERT INTO consultations
VALUES (7004, 5004, 'Seasonal allergy',
        'General consultation completed',
        TRUNC(SYSDATE) - 3 + 9/24);

INSERT INTO consultations
VALUES (7005, 5007, 'Common cold',
        'Follow-up consultation',
        TRUNC(SYSDATE) - 1 + 15/24);


-- 6. PRESCRIPTIONS
INSERT INTO prescriptions
VALUES (8001, 7001, 'Medicine A',
        'As prescribed by doctor', '7 days');

INSERT INTO prescriptions
VALUES (8002, 7002, 'Medicine B',
        'As prescribed by doctor', '3 days');

INSERT INTO prescriptions
VALUES (8003, 7003, 'Medicine C',
        'As prescribed by doctor', '5 days');

INSERT INTO prescriptions
VALUES (8004, 7004, 'Medicine D',
        'As prescribed by doctor', '5 days');

INSERT INTO prescriptions
VALUES (8005, 7005, 'Medicine E',
        'As prescribed by doctor', '3 days');


-- 7. BILLS
INSERT INTO bills
VALUES (9001, 5001, 1500, TRUNC(SYSDATE) - 10, 'PAID');

INSERT INTO bills
VALUES (9002, 5002, 2000, TRUNC(SYSDATE) - 8, 'PARTIAL');

INSERT INTO bills
VALUES (9003, 5003, 1200, TRUNC(SYSDATE) - 5, 'UNPAID');

INSERT INTO bills
VALUES (9004, 5004, 800, TRUNC(SYSDATE) - 3, 'PAID');

INSERT INTO bills
VALUES (9005, 5007, 1000, TRUNC(SYSDATE) - 1, 'PARTIAL');


-- 8. PAYMENTS
INSERT INTO payments
VALUES (9501, 9001, 1500,
        TRUNC(SYSDATE) - 10, 'UPI');

INSERT INTO payments
VALUES (9502, 9002, 500,
        TRUNC(SYSDATE) - 8, 'CASH');

INSERT INTO payments
VALUES (9503, 9004, 800,
        TRUNC(SYSDATE) - 3, 'CARD');

INSERT INTO payments
VALUES (9504, 9005, 400,
        TRUNC(SYSDATE) - 1, 'UPI');


-- SAVE ALL INSERTIONS
COMMIT;

-- =====================================================
-- END OF SAMPLE DATA
-- =====================================================