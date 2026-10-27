-- Optional migration for schemas created before doctor availability was added.
-- Do not run this after 01_create_tables.sql on a fresh schema.

ALTER TABLE doctors
    ADD (status VARCHAR2(15) DEFAULT 'AVAILABLE' NOT NULL);

ALTER TABLE doctors
    ADD CONSTRAINT chk_doctor_status
    CHECK (status IN ('AVAILABLE', 'BUSY', 'ON_LEAVE'));

COMMIT;
