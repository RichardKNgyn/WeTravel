-- WeTravel Database Schema
-- PostgreSQL with PostGIS extension for geospatial data
-- Version: 1.0
-- Created: January 2026

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(500),
    bio TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP
);

-- Indexes for user queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- POSTS TABLE
-- ============================================================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption TEXT,
    location_name VARCHAR(255),
    location_coordinates GEOGRAPHY(POINT, 4326), -- PostGIS geography type (lat/lng)
    location_place_id VARCHAR(255), -- Google Places API ID
    location_address VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true
);

-- Indexes for post queries
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_location_place ON posts(location_place_id);
CREATE INDEX idx_posts_location_coords ON posts USING GIST(location_coordinates); -- Geospatial index
CREATE INDEX idx_posts_user_date ON posts(user_id, created_at DESC);

-- ============================================================================
-- POST MEDIA TABLE
-- ============================================================================
CREATE TABLE post_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url VARCHAR(500),
    order_index INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for media queries
CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_order ON post_media(post_id, order_index);

-- ============================================================================
-- POST LIKES TABLE
-- ============================================================================
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

-- Indexes for like queries
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

-- ============================================================================
-- POST COMMENTS TABLE
-- ============================================================================
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For replies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes_count INTEGER DEFAULT 0
);

-- Indexes for comment queries
CREATE INDEX idx_post_comments_post ON post_comments(post_id, created_at DESC);
CREATE INDEX idx_post_comments_user ON post_comments(user_id);
CREATE INDEX idx_post_comments_parent ON post_comments(parent_comment_id);

-- ============================================================================
-- LOCATION COMMENTS TABLE (For AI Analysis)
-- ============================================================================
CREATE TABLE location_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_place_id VARCHAR(255) NOT NULL,
    location_name VARCHAR(255),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    categories TEXT[], -- Array: ['food', 'accommodation', 'activity', 'transportation', 'safety']
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for location comment queries
CREATE INDEX idx_location_comments_place ON location_comments(location_place_id);
CREATE INDEX idx_location_comments_place_date ON location_comments(location_place_id, created_at DESC);
CREATE INDEX idx_location_comments_user ON location_comments(user_id);
CREATE INDEX idx_location_comments_rating ON location_comments(location_place_id, rating);

-- ============================================================================
-- LOCATION ANALYSES TABLE (AI-Generated Insights)
-- ============================================================================
CREATE TABLE location_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_place_id VARCHAR(255) UNIQUE NOT NULL,
    location_name VARCHAR(255),
    total_comments INTEGER NOT NULL DEFAULT 0,
    
    -- Sentiment scores (percentages)
    sentiment_positive FLOAT CHECK (sentiment_positive >= 0 AND sentiment_positive <= 100),
    sentiment_negative FLOAT CHECK (sentiment_negative >= 0 AND sentiment_negative <= 100),
    sentiment_neutral FLOAT CHECK (sentiment_neutral >= 0 AND sentiment_neutral <= 100),
    
    -- Top keywords extracted by AI
    top_keywords JSONB, -- [{"word": "amazing views", "frequency": 23, "sentiment": "positive"}, ...]
    
    -- Category-specific insights
    category_insights JSONB, -- {"accommodations": {"score": 4.2, "keywords": [...]}, "food": {...}, ...}
    
    -- AI-generated summary
    summary TEXT,
    
    -- Overall rating calculated from comments
    overall_rating FLOAT CHECK (overall_rating >= 0 AND overall_rating <= 5),
    
    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analysis_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analysis queries
CREATE INDEX idx_location_analyses_place ON location_analyses(location_place_id);
CREATE INDEX idx_location_analyses_updated ON location_analyses(last_updated DESC);
CREATE INDEX idx_location_analyses_rating ON location_analyses(overall_rating DESC);

-- ============================================================================
-- ITINERARIES TABLE
-- ============================================================================
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_public BOOLEAN DEFAULT false,
    cover_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for itinerary queries
CREATE INDEX idx_itineraries_user ON itineraries(user_id);
CREATE INDEX idx_itineraries_dates ON itineraries(start_date, end_date);
CREATE INDEX idx_itineraries_public ON itineraries(is_public, created_at DESC);

-- ============================================================================
-- ITINERARY DESTINATIONS TABLE
-- ============================================================================
CREATE TABLE itinerary_destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    location_place_id VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_coordinates GEOGRAPHY(POINT, 4326),
    order_index INTEGER NOT NULL,
    planned_date DATE,
    planned_time TIME,
    duration_hours FLOAT,
    notes TEXT,
    budget DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(itinerary_id, order_index) -- Ensure unique ordering
);

-- Indexes for destination queries
CREATE INDEX idx_itinerary_destinations_itinerary ON itinerary_destinations(itinerary_id, order_index);
CREATE INDEX idx_itinerary_destinations_place ON itinerary_destinations(location_place_id);

-- ============================================================================
-- ITINERARY LINKED POSTS TABLE
-- ============================================================================
CREATE TABLE itinerary_linked_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_destination_id UUID NOT NULL REFERENCES itinerary_destinations(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(itinerary_destination_id, post_id)
);

-- Indexes
CREATE INDEX idx_itinerary_linked_posts_destination ON itinerary_linked_posts(itinerary_destination_id);
CREATE INDEX idx_itinerary_linked_posts_post ON itinerary_linked_posts(post_id);

-- ============================================================================
-- USER FOLLOWS TABLE
-- ============================================================================
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id) -- Cannot follow yourself
);

-- Indexes for follow queries
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

-- ============================================================================
-- SAVED POSTS TABLE
-- ============================================================================
CREATE TABLE saved_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Indexes
CREATE INDEX idx_saved_posts_user ON saved_posts(user_id, created_at DESC);
CREATE INDEX idx_saved_posts_post ON saved_posts(post_id);

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);

-- ============================================================================
-- POST TAGS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE post_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, tag_id)
);

CREATE INDEX idx_post_tags_post ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'mention'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_id UUID, -- ID of related entity (post_id, comment_id, etc.)
    reference_type VARCHAR(50), -- 'post', 'comment', 'itinerary'
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- OFFLINE CACHE TABLE (For mobile app sync)
-- ============================================================================
CREATE TABLE offline_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'post', 'itinerary', 'location'
    entity_id UUID NOT NULL,
    data JSONB NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_offline_cache_user ON offline_cache(user_id);
CREATE INDEX idx_offline_cache_expires ON offline_cache(expires_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_comments_updated_at BEFORE UPDATE ON location_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Update post counts automatically
-- ============================================================================

-- Update likes_count on posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Update comments_count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ============================================================================
-- USEFUL QUERIES (Examples)
-- ============================================================================

-- Find posts within 5km radius of a location
-- SELECT * FROM posts
-- WHERE ST_DWithin(
--     location_coordinates,
--     ST_MakePoint(-117.9, 33.8)::geography, -- lng, lat
--     5000 -- radius in meters
-- )
-- ORDER BY created_at DESC
-- LIMIT 20;

-- Find posts in map viewport bounds
-- SELECT * FROM posts
-- WHERE location_coordinates && ST_MakeEnvelope(
--     -118.0, 33.7,  -- min lng, min lat
--     -117.8, 33.9,  -- max lng, max lat
--     4326
-- )::geography
-- ORDER BY created_at DESC;

-- Get location analysis with comment count
-- SELECT 
--     la.*,
--     COUNT(lc.id) as comment_count
-- FROM location_analyses la
-- LEFT JOIN location_comments lc ON la.location_place_id = lc.location_place_id
-- WHERE la.location_place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4'
-- GROUP BY la.id;

-- Find locations needing analysis update (5+ new comments since last analysis)
-- SELECT 
--     lc.location_place_id,
--     COUNT(*) as new_comments
-- FROM location_comments lc
-- LEFT JOIN location_analyses la ON lc.location_place_id = la.location_place_id
-- WHERE lc.created_at > COALESCE(la.last_updated, '1970-01-01')
-- GROUP BY lc.location_place_id
-- HAVING COUNT(*) >= 5
-- ORDER BY new_comments DESC;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
