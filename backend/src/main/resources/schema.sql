DROP TABLE IF EXISTS note_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS note_links;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS processing_logs;
DROP TABLE IF EXISTS inbox_entries;

-- input 
CREATE TABLE inbox_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    content_type VARCHAR(20),     -- text, link, idea, code
    source VARCHAR(50),           -- manual, web, audio
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    metadata TEXT                 -- (titulo do link)
);

-- log do que ocurre cando se procesa (util para usar con IA para depurar)
CREATE TABLE processing_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inbox_id BIGINT,
    action VARCHAR(50),          -- classified, summarized...
    result TEXT,                 -- resultado
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inbox_id) REFERENCES inbox_entries(id) ON DELETE CASCADE
);

-- información xa procesada
CREATE TABLE info_just_process (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,                 -- markdown
    note_type VARCHAR(50),        -- concept, resource, idea
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    source_inbox_id BIGINT,
    FOREIGN KEY (source_inbox_id) REFERENCES inbox_entries(id) ON DELETE SET NULL
);

-- relacionar a información xa procesada entre si
CREATE TABLE info_just_process_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_note_id BIGINT,
    to_note_id BIGINT,
    relation_type VARCHAR(50),   -- related, extends, example
    FOREIGN KEY (from_note_id) REFERENCES info_just_process(id) ON DELETE CASCADE,
    FOREIGN KEY (to_note_id) REFERENCES info_just_process(id) ON DELETE CASCADE
);

-- tags para categorias
CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

-- conectar as info_just_process con tags
CREATE TABLE info_just_process_tags (
    note_id BIGINT,
    tag_id BIGINT,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES info_just_process(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);