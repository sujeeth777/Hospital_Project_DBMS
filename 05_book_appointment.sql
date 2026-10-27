
SET SQLBLANKLINES ON
SET VERIFY OFF

ACCEPT appointment_id NUMBER PROMPT 'Enter new Appointment ID: '
ACCEPT patient_id NUMBER PROMPT 'Enter Patient ID: '
ACCEPT doctor_id NUMBER PROMPT 'Enter Doctor ID: '
ACCEPT appointment_datetime CHAR PROMPT 'Enter appointment date and time (DD-MM-YYYY HH24:MI): '

INSERT INTO appointments (
    appointment_id,
    patient_id,
    doctor_id,
    appointment_time,
    status
)
VALUES (
    &appointment_id,
    &patient_id,
    &doctor_id,
    TO_DATE('&appointment_datetime', 'DD-MM-YYYY HH24:MI'),
    'SCHEDULED'
);

COMMIT;

PROMPT
PROMPT ===== APPOINTMENT BOOKED SUCCESSFULLY =====

SELECT a.appointment_id,
       p.patient_name,
       d.doctor_name,
       a.appointment_time,
       a.status
FROM appointments a
JOIN patients p
    ON a.patient_id = p.patient_id
JOIN doctors d
    ON a.doctor_id = d.doctor_id
WHERE a.appointment_id = &appointment_id;

UNDEFINE appointment_id
UNDEFINE patient_id
UNDEFINE doctor_id
UNDEFINE appointment_datetime

SET VERIFY ON
