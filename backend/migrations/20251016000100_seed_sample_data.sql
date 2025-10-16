-- Seed demo customers and postings to keep initial dropdowns populated.
-- Inserts only run when at least one user exists and demo records are absent.

WITH first_user AS (
    SELECT id
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY id
    LIMIT 1
),
employer_customer AS (
    INSERT INTO customers (user_id, name, phone, customer_type, address)
    SELECT
        first_user.id,
        'Demo Employer'::varchar,
        '010-9000-1000'::varchar,
        'employer'::varchar,
        '서울특별시 중구 데모로 10'
    FROM first_user
    WHERE EXISTS (SELECT 1 FROM first_user)
      AND NOT EXISTS (
          SELECT 1 FROM customers
          WHERE name = 'Demo Employer' AND deleted_at IS NULL
      )
    RETURNING id
),
employer_id AS (
    SELECT id FROM employer_customer
    UNION ALL
    SELECT id
    FROM customers
    WHERE name = 'Demo Employer' AND deleted_at IS NULL
    LIMIT 1
),
employee_customer AS (
    INSERT INTO customers (user_id, name, phone, customer_type, address)
    SELECT
        first_user.id,
        'Demo Employee'::varchar,
        '010-9000-2000'::varchar,
        'employee'::varchar,
        '서울특별시 강남구 데모로 20'
    FROM first_user
    WHERE EXISTS (SELECT 1 FROM first_user)
      AND NOT EXISTS (
          SELECT 1 FROM customers
          WHERE name = 'Demo Employee' AND deleted_at IS NULL
      )
    RETURNING id
),
employee_id AS (
    SELECT id FROM employee_customer
    UNION ALL
    SELECT id
    FROM customers
    WHERE name = 'Demo Employee' AND deleted_at IS NULL
    LIMIT 1
)
-- Insert demo job posting
INSERT INTO job_postings (customer_id, salary, description, employer_fee_rate)
SELECT
    employer_id.id,
    3500000,
    'Demo employer looking for administrative assistant'::text,
    NULL
FROM employer_id
WHERE NOT EXISTS (
    SELECT 1
    FROM job_postings
    WHERE customer_id = employer_id.id
      AND description = 'Demo employer looking for administrative assistant'
      AND deleted_at IS NULL
);

-- Insert demo job seeking posting
INSERT INTO job_seeking_postings (
    customer_id,
    desired_salary,
    description,
    preferred_location,
    employee_fee_rate
)
SELECT
    employee_id.id,
    3200000,
    'Demo candidate seeking administrative assistant role'::text,
    '서울 전지역',
    NULL
FROM employee_id
WHERE NOT EXISTS (
    SELECT 1
    FROM job_seeking_postings
    WHERE customer_id = employee_id.id
      AND description = 'Demo candidate seeking administrative assistant role'
      AND deleted_at IS NULL
);
