-- Wrap in a guard so the migration can run safely even before the users table exists.
DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL THEN
        EXECUTE $sql$
            UPDATE users
            SET default_employer_fee_rate = default_employer_fee_rate * 100
            WHERE default_employer_fee_rate > 0 AND default_employer_fee_rate < 1;
        $sql$;

        EXECUTE $sql$
            UPDATE users
            SET default_employee_fee_rate = default_employee_fee_rate * 100
            WHERE default_employee_fee_rate > 0 AND default_employee_fee_rate < 1;
        $sql$;
    END IF;
END;
$$;
