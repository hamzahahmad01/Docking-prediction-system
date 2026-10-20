Use these files on the Excel Upload page:

1. project-import-live-test.csv
   - This is a valid live test file.
   - It uses current database-linked values:
     - Employee IDs: EMP003, EMP001
     - Funding agency: QAZ

1b. project-import-live-test-100.csv
   - This is a valid bulk live test file with 100 rows.
   - Use it to check large import handling.
   - It uses current database-linked values:
     - Employee IDs: EMP001 to EMP005
     - Funding agency: QAZ

2. project-import-invalid-test.csv
   - This is for checking validation errors.
   - It should show blocked rows for:
     - invalid employee ID
     - invalid funding agency
     - invalid date
     - invalid cost
     - invalid status

2b. project-import-invalid-test-100.csv
   - This is a bulk invalid test file with 100 rows.
   - It is useful for stress-testing the validation screen.
   - It includes:
     - rows with invalid employee IDs
     - rows with invalid funding agencies
     - rows with invalid start dates
     - rows with invalid costs
     - rows with invalid statuses

Important:
- If you import the valid file once successfully, importing it again will fail because project numbers must be unique.
- If that happens, change only the Project Number values before uploading again.
