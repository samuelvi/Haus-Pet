-- Create the breed table
CREATE TABLE breed (
    id SERIAL PRIMARY KEY,
    breed VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(255) NOT NULL
);

-- Insert some initial data (optional, but good for testing)
INSERT INTO breed (breed, type) VALUES
    -- Cats
    ('Siamese', 'cat'),
    ('Persian', 'cat'),
    ('Maine Coon', 'cat'),
    ('Ragdoll', 'cat'),
    ('Bengal', 'cat'),
    ('Sphynx', 'cat'),
    ('British Shorthair', 'cat'),
    ('Abyssinian', 'cat'),
    ('Scottish Fold', 'cat'),
    ('Birman', 'cat'),

    -- Dogs
    ('Golden Retriever', 'dog'),
    ('Labrador Retriever', 'dog'),
    ('German Shepherd', 'dog'),
    ('Beagle', 'dog'),
    ('Poodle', 'dog'),
    ('Bulldog', 'dog'),
    ('Rottweiler', 'dog'),
    ('Dachshund', 'dog'),
    ('Siberian Husky', 'dog'),
    ('Chihuahua', 'dog'),

    -- Birds
    ('Parakeet', 'bird'),
    ('Cockatiel', 'bird'),
    ('Macaw', 'bird'),
    ('Canary', 'bird'),
    ('Finch', 'bird'),
    ('Lovebird', 'bird'),
    ('African Grey Parrot', 'bird'),
    ('Cockatoo', 'bird'),
    ('Amazon Parrot', 'bird'),
    ('Budgerigar', 'bird');
