-- Create the cat table
CREATE TABLE cat (
    id SERIAL PRIMARY KEY,
    breed VARCHAR(255) UNIQUE NOT NULL
);

-- Insert some initial data (optional, but good for testing)
INSERT INTO cat (breed) VALUES
    ('Siamese'),
    ('Persian'),
    ('Maine Coon'),
    ('Ragdoll'),
    ('Bengal'),
    ('Sphynx'),
    ('British Shorthair'),
    ('Abyssinian'),
    ('Scottish Fold'),
    ('Birman');
