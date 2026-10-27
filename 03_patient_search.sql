
SET SQLBLANKLINES ON
SET LINESIZE 180
SET PAGESIZE 50
SET VERIFY OFF

COLUMN patient_name FORMAT A25
COLUMN gender FORMAT A10
COLUMN phone FORMAT A15
COLUMN doctor_name FORMAT A25
COLUMN specialization FORMAT A22
COLUMN diagnosis FORMAT A25
COLUMN appointment_date FORMAT A22
COLUMN appointment_status FORMAT A15
COLUMN bill_status FORMAT A12

ACCEPT patient_id NUMBER PROMPT 'Enter Patient ID: '

PROMPT
PROMPT ===== PATIENT DETAILS =====

SELECT patient_id,
       patient_name,
       TO_CHAR(date_of_birth, 'DD-MON-YYYY') AS date_of_birth,
       gender,
       phone,
       address
FROM patients
WHERE patient_id = &patient_id;

PROMPT
PROMPT ===== APPOINTMENT HISTORY =====

SELECT a.appointment_id,
       TO_CHAR(a.appointment_time,
               'DD-MON-YYYY HH:MI AM') AS appointment_date,
       d.doctor_name,
       d.specialization,
       a.status AS appointment_status,
       c.diagnosis
FROM appointments a
JOIN doctors d
    ON a.doctor_id = d.doctor_id
LEFT JOIN consultations c
    ON a.appointment_id = c.appointment_id
WHERE a.patient_id = &patient_id
ORDER BY a.appointment_time DESC;

PROMPT
PROMPT ===== BILLING HISTORY =====

SELECT a.appointment_id,
       b.bill_id,
       b.total_amount,
       NVL(SUM(pay.amount), 0) AS amount_paid,
       b.total_amount - NVL(SUM(pay.amount), 0) AS balance,
       b.status AS bill_status
FROM appointments a
JOIN bills b
    ON a.appointment_id = b.appointment_id
LEFT JOIN payments pay
    ON b.bill_id = pay.bill_id
WHERE a.patient_id = &patient_id
GROUP BY a.appointment_id,
         b.bill_id,
         b.total_amount,
         b.status
ORDER BY a.appointment_id;

UNDEFINE patient_id
SET VERIFY ON
