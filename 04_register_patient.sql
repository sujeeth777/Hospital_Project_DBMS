
SET SQLBLANKLINES ON
SET VERIFY OFF

ACCEPT patient_id NUMBER PROMPT 'Enter new Patient ID: '
ACCEPT patient_name CHAR PROMPT 'Enter Patient Name: '
ACCEPT dob CHAR PROMPT 'Enter Date of Birth (DD-MM-YYYY): '
ACCEPT gender CHAR PROMPT 'Enter Gender (Male/Female/Other): '
ACCEPT phone CHAR PROMPT 'Enter Phone Number: '
ACCEPT address CHAR PROMPT 'Enter Address: '

INSERT INTO patients (
    patient_id,
    patient_name,
    date_of_birth,
    gender,
    phone,
    address
)
VALUES (
    &patient_id,
    '&patient_name',
    TO_DATE('&dob', 'DD-MM-YYYY'),
    '&gender',
    '&phone',
    '&address'
);

COMMIT;

PROMPT
PROMPT ===== PATIENT REGISTERED SUCCESSFULLY =====

SELECT patient_id, patient_name, phone, address
FROM patients
WHERE patient_id = &patient_id;

UNDEFINE patient_id
UNDEFINE patient_name
UNDEFINE dob
UNDEFINE gender
UNDEFINE phone
UNDEFINE address

SET VERIFY ON
