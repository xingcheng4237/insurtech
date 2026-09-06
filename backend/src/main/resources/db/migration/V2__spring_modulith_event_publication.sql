-- Spring Modulith 1.1.x event publication registry (spring-modulith-starter-jpa).
-- Required because spring.jpa.hibernate.ddl-auto=validate: Hibernate checks this
-- table exists at startup. Schema follows the official Modulith documentation
-- for PostgreSQL.
CREATE TABLE IF NOT EXISTS event_publication (
    id               UUID PRIMARY KEY,
    publication_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_date  TIMESTAMP WITH TIME ZONE,
    listener_id      VARCHAR(512) NOT NULL,
    event_type       VARCHAR(512) NOT NULL,
    serialized_event TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_publication_completion ON event_publication(completion_date);
