CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    premium_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_customer ON policies(customer_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_dates ON policies(start_date, end_date);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    policy_id UUID NOT NULL REFERENCES policies(id),
    status VARCHAR(20) NOT NULL DEFAULT 'FILED',
    incident_date DATE NOT NULL,
    description TEXT,
    claimed_amount DECIMAL(15,2),
    settled_amount DECIMAL(15,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_policy ON claims(policy_id);
CREATE INDEX idx_claims_status ON claims(status);
