-- Adjust existing user default fee rates from fractional values to percentage values
UPDATE users
SET default_employer_fee_rate = default_employer_fee_rate * 100
WHERE default_employer_fee_rate > 0 AND default_employer_fee_rate < 1;

UPDATE users
SET default_employee_fee_rate = default_employee_fee_rate * 100
WHERE default_employee_fee_rate > 0 AND default_employee_fee_rate < 1;
