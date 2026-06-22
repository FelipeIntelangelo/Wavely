CREATE TABLE IF NOT EXISTS Playlists (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(300) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_playlists_user_name UNIQUE (user_id, name),
    CONSTRAINT fk_playlists_user FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PlaylistItems (
    id BIGINT NOT NULL AUTO_INCREMENT,
    playlist_id BIGINT NOT NULL,
    podcast_id BIGINT NULL,
    episode_id INT NULL,
    added_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_playlist_podcast UNIQUE (playlist_id, podcast_id),
    CONSTRAINT uk_playlist_episode UNIQUE (playlist_id, episode_id),
    CONSTRAINT chk_playlist_item_content CHECK (
        (podcast_id IS NOT NULL AND episode_id IS NULL)
        OR (podcast_id IS NULL AND episode_id IS NOT NULL)
    ),
    CONSTRAINT fk_playlist_items_playlist FOREIGN KEY (playlist_id) REFERENCES Playlists (id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_items_podcast FOREIGN KEY (podcast_id) REFERENCES Podcasts (id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_items_episode FOREIGN KEY (episode_id) REFERENCES Episodes (id) ON DELETE CASCADE
);
