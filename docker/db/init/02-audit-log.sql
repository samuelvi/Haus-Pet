-- Create the audit_log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(50),
    http_method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    request_body TEXT,
    before_state TEXT,
    after_state TEXT
);
