#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int choice;
    int running = 1;

    while (running)
    {
        printf("\n");
        printf("====================================================\n");
        printf("       HOSPITAL MANAGEMENT SYSTEM (EMBEDDED SQL)    \n");
        printf("       Oracle 23ai + C / Pro*C Architecture         \n");
        printf("====================================================\n");
        printf("  1. Patient Search (patient_search.exe)\n");
        printf("  2. Patient Registration (patient_register.exe)\n");
        printf("  3. Doctor Registration (doctor_add.exe)\n");
        printf("  4. Appointment Booking (appointment_book.exe)\n");
        printf("  5. Consultation & Prescription (consultation_add.exe)\n");
        printf("  6. Billing & Payment Transactions (billing_payment.exe)\n");
        printf("  7. Comprehensive Reports & Queries (hospital_reports.exe)\n");
        printf("  8. Launch Web Dashboard (Browser UI)\n");
        printf("  9. Exit\n");
        printf("====================================================\n");
        printf("Enter your choice (1-9): ");

        if (scanf("%d", &choice) != 1)
        {
            int ch;
            while ((ch = getchar()) != '\n' && ch != EOF)
            {
            }

            printf("\nInvalid input. Please enter a number from 1 to 9.\n");
            continue;
        }

        switch (choice)
        {
            case 1:
                printf("\n--- Launching Patient Search (Embedded SQL) ---\n");
                system("patient_search.exe");
                break;

            case 2:
                printf("\n--- Launching Patient Registration (Embedded SQL) ---\n");
                system("patient_register.exe");
                break;

            case 3:
                printf("\n--- Launching Doctor Registration (Embedded SQL) ---\n");
                system("doctor_add.exe");
                break;

            case 4:
                printf("\n--- Launching Appointment Booking (Embedded SQL) ---\n");
                system("appointment_book.exe");
                break;

            case 5:
                printf("\n--- Launching Consultation and Prescription (Embedded SQL) ---\n");
                system("consultation_add.exe");
                break;

            case 6:
                printf("\n--- Launching Billing and Payment (Embedded SQL) ---\n");
                system("billing_payment.exe");
                break;

            case 7:
                printf("\n--- Launching Hospital Reports & Cursors (Embedded SQL) ---\n");
                system("hospital_reports.exe");
                break;

            case 8:
                printf("\n--- Launching Web Dashboard & Query Explorer ---\n");
                system("start cmd /k python server.py");
                break;

            case 9:
                printf("\nThank you for using the Hospital Management System!\n");
                running = 0;
                break;

            default:
                printf("\nInvalid choice. Please enter a number from 1 to 9.\n");
                break;
        }

        if (running)
        {
            printf("\nPress Enter to return to the main menu...");
            {
                int ch;
                while ((ch = getchar()) != '\n' && ch != EOF)
                {
                }
                getchar();
            }
        }
    }

    return 0;
}
