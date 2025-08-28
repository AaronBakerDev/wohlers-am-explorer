-- Migration: Add missing schema for Wohlers Reports integration
-- File: 007_wohlers_reports_schema.sql
-- Run this after all existing migrations (001-006)

-- ============================================================================
-- MISSING ENTITIES FOR WOHLERS REPORTS
-- ============================================================================

-- 1. COE's and Associations (Report 5)
CREATE TABLE IF NOT EXISTS coes_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('COE', 'Association')),
    country VARCHAR(100) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    established_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Contributors (Report 6)
CREATE TABLE IF NOT EXISTS contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id),
    country VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    expertise_area VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Events/Symposiums (Reports 7, 8)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ICAM', 'General', 'Symposium', 'Conference')),
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Organizations (Event organizers)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Speakers (Reports 7, 8)
CREATE TABLE IF NOT EXISTS speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    speaker_type VARCHAR(50) NOT NULL CHECK (speaker_type IN ('Invited', 'Regular')),
    title VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Scientific Organizing Committee
CREATE TABLE IF NOT EXISTS scientific_organizing_committee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    chief_speaker_id UUID REFERENCES speakers(id),
    location VARCHAR(255),
    committee_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. America Makes Members (Report 9) 
CREATE TABLE IF NOT EXISTS america_makes_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    member_status VARCHAR(50) NOT NULL CHECK (member_status IN ('Gold', 'Platinum', 'Public', 'Silver')),
    state VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    join_date DATE,
    membership_level_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Geographic Support Tables
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE, -- ISO country code
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS us_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(2) NOT NULL UNIQUE, -- US state code
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXTEND EXISTING TABLES FOR BETTER WOHLERS INTEGRATION
-- ============================================================================

-- Add category classification support for better reporting
CREATE TABLE IF NOT EXISTS company_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed company types based on Wohlers classification
INSERT INTO company_types (name, description) VALUES
('System Manufacturers', 'Companies that manufacture 3D printing systems'),
('Service Providers', 'Companies providing 3D printing services'),
('Material Producers', 'Companies producing materials for 3D printing'),
('Non Metal Producers', 'Companies specializing in non-metallic materials'),
('Software Providers', 'Companies providing software for AM'),
('Mixed', 'Companies with multiple business models')
ON CONFLICT (name) DO NOTHING;

-- Update company_categories to reference the standardized types
ALTER TABLE company_categories 
ADD COLUMN IF NOT EXISTS company_type_id UUID REFERENCES company_types(id);

-- Add website tracking for Service Providers report
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS website_parameters JSONB,
ADD COLUMN IF NOT EXISTS last_website_check TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Geographic lookups
CREATE INDEX IF NOT EXISTS idx_contributors_country ON contributors(country);
CREATE INDEX IF NOT EXISTS idx_coes_associations_country ON coes_associations(country);
CREATE INDEX IF NOT EXISTS idx_america_makes_members_state ON america_makes_members(state);

-- Event/Speaker relationships
CREATE INDEX IF NOT EXISTS idx_events_year_type ON events(year, event_type);
CREATE INDEX IF NOT EXISTS idx_speakers_event_type ON speakers(event_id, speaker_type);

-- Company classification
CREATE INDEX IF NOT EXISTS idx_company_categories_type ON company_categories(company_id, category);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_events_year ON events(year);
CREATE INDEX IF NOT EXISTS idx_mergers_acquisitions_date ON mergers_acquisitions(announcement_date);

-- ============================================================================
-- VIEWS FOR WOHLERS REPORTS
-- ============================================================================

-- View 1: Material Producers Summary (Report 1)
CREATE OR REPLACE VIEW material_producers_summary AS
SELECT 
    CASE 
        WHEN m.category = 'Metal' THEN 'Metal'
        WHEN m.category = 'Non-Metal' THEN 'Non-Metal'
        WHEN m.category IS NULL THEN 'Both'
        ELSE 'Both'
    END AS material_type,
    COUNT(DISTINCT c.id) as company_count,
    ROUND(COUNT(DISTINCT c.id) * 100.0 / SUM(COUNT(DISTINCT c.id)) OVER (), 2) as percentage
FROM companies c
JOIN equipment e ON c.id = e.company_id
LEFT JOIN materials m ON e.material_id = m.id
JOIN company_categories cc ON c.id = cc.company_id
WHERE cc.category ILIKE '%material%' OR cc.category ILIKE '%producer%'
GROUP BY material_type;

-- View 2: Category Distribution by Country (Report 3)
CREATE OR REPLACE VIEW category_distribution_by_country AS
SELECT 
    c.country,
    cc.category,
    COUNT(*) as company_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.country), 2) as percentage_in_country
FROM companies c
JOIN company_categories cc ON c.id = cc.company_id
WHERE c.country IS NOT NULL
GROUP BY c.country, cc.category
ORDER BY c.country, company_count DESC;

-- View 3: M&A Timeline (Report 4)
CREATE OR REPLACE VIEW ma_timeline AS
SELECT 
    EXTRACT(YEAR FROM announcement_date) as year,
    EXTRACT(MONTH FROM announcement_date) as month,
    COUNT(*) as deal_count,
    SUM(COALESCE(deal_size_millions, 0)) as total_deal_size_millions,
    AVG(deal_size_millions) as avg_deal_size_millions
FROM mergers_acquisitions
WHERE announcement_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM announcement_date), EXTRACT(MONTH FROM announcement_date)
ORDER BY year, month;

-- View 4: Event Speakers Summary (Reports 7, 8)
CREATE OR REPLACE VIEW event_speakers_summary AS
SELECT 
    e.year,
    e.event_type,
    COUNT(DISTINCT o.id) as organization_count,
    COUNT(DISTINCT s.id) as speaker_count,
    COUNT(DISTINCT CASE WHEN s.speaker_type = 'Invited' THEN s.id END) as invited_speakers,
    COUNT(DISTINCT CASE WHEN s.speaker_type = 'Regular' THEN s.id END) as regular_speakers
FROM events e
LEFT JOIN speakers s ON e.id = s.event_id
LEFT JOIN organizations o ON s.organization_id = o.id
GROUP BY e.year, e.event_type
ORDER BY e.year, e.event_type;

-- View 5: America Makes State Distribution (Report 9)
CREATE OR REPLACE VIEW america_makes_state_distribution AS
SELECT 
    amm.state,
    amm.member_status,
    COUNT(*) as member_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage_total
FROM america_makes_members amm
GROUP BY amm.state, amm.member_status
ORDER BY amm.state, member_count DESC;

-- ============================================================================
-- SEED DATA FOR GEOGRAPHIC TABLES
-- ============================================================================

-- Insert key countries (can be expanded)
INSERT INTO countries (name, code, latitude, longitude, region) VALUES
('United States', 'US', 39.8283, -98.5795, 'North America'),
('Germany', 'DE', 51.1657, 10.4515, 'Europe'),
('China', 'CN', 35.8617, 104.1954, 'Asia'),
('United Kingdom', 'GB', 55.3781, -3.4360, 'Europe'),
('Japan', 'JP', 36.2048, 138.2529, 'Asia'),
('France', 'FR', 46.2276, 2.2137, 'Europe'),
('Italy', 'IT', 41.8719, 12.5674, 'Europe'),
('Canada', 'CA', 56.1304, -106.3468, 'North America'),
('Australia', 'AU', -25.2744, 133.7751, 'Oceania'),
('Netherlands', 'NL', 52.1326, 5.2913, 'Europe'),
('Sweden', 'SE', 60.1282, 18.6435, 'Europe'),
('Switzerland', 'CH', 46.8182, 8.2275, 'Europe'),
('Belgium', 'BE', 50.5039, 4.4699, 'Europe'),
('Denmark', 'DK', 56.2639, 9.5018, 'Europe'),
('Austria', 'AT', 47.5162, 14.5501, 'Europe'),
('South Korea', 'KR', 35.9078, 127.7669, 'Asia'),
('Israel', 'IL', 31.0461, 34.8516, 'Middle East'),
('Singapore', 'SG', 1.3521, 103.8198, 'Asia'),
('South Africa', 'ZA', -30.5595, 22.9375, 'Africa'),
('Brazil', 'BR', -14.2350, -51.9253, 'South America')
ON CONFLICT (code) DO NOTHING;

-- Insert US states (for America Makes report)
INSERT INTO us_states (name, code, latitude, longitude) VALUES
('California', 'CA', 36.7783, -119.4179),
('Texas', 'TX', 31.9686, -99.9018),
('Florida', 'FL', 27.7663, -82.6404),
('New York', 'NY', 42.1657, -74.9481),
('Pennsylvania', 'PA', 41.2033, -77.1945),
('Illinois', 'IL', 40.3363, -89.0022),
('Ohio', 'OH', 40.3888, -82.7649),
('Georgia', 'GA', 33.0406, -83.6431),
('North Carolina', 'NC', 35.5397, -79.8431),
('Michigan', 'MI', 43.3266, -84.5361),
('Virginia', 'VA', 37.7693, -78.2057),
('Washington', 'WA', 47.4009, -121.4905),
('Arizona', 'AZ', 33.7712, -111.3877),
('Massachusetts', 'MA', 42.2352, -71.0275),
('Tennessee', 'TN', 35.7478, -86.7123),
('Indiana', 'IN', 39.8647, -86.2604),
('Missouri', 'MO', 38.4623, -92.3020),
('Maryland', 'MD', 39.0639, -76.8021),
('Wisconsin', 'WI', 44.2619, -89.6165),
('Colorado', 'CO', 39.0598, -105.3111),
('Minnesota', 'MN', 45.6945, -93.9002),
('South Carolina', 'SC', 33.8361, -80.9945),
('Alabama', 'AL', 32.3617, -86.7913),
('Louisiana', 'LA', 31.1695, -91.8678),
('Kentucky', 'KY', 37.6681, -84.6701),
('Oregon', 'OR', 44.5672, -122.1269),
('Oklahoma', 'OK', 35.5665, -96.9247),
('Connecticut', 'CT', 41.5978, -72.7554),
('Utah', 'UT', 40.1135, -111.8535),
('Iowa', 'IA', 42.0115, -93.2105),
('Nevada', 'NV', 38.4199, -117.1219),
('Arkansas', 'AR', 34.9513, -92.3809),
('Mississippi', 'MS', 32.7673, -89.6812),
('Kansas', 'KS', 38.5266, -96.7265),
('New Mexico', 'NM', 34.8405, -106.2485),
('Nebraska', 'NE', 41.1254, -98.2681),
('West Virginia', 'WV', 38.4680, -80.9696),
('Idaho', 'ID', 44.2394, -114.5103),
('Hawaii', 'HI', 21.0943, -157.4983),
('New Hampshire', 'NH', 43.4525, -71.5639),
('Maine', 'ME', 44.6939, -69.3819),
('Montana', 'MT', 47.0527, -110.2148),
('Rhode Island', 'RI', 41.6809, -71.5118),
('Delaware', 'DE', 39.3185, -75.5071),
('South Dakota', 'SD', 44.2998, -99.4388),
('North Dakota', 'ND', 47.5289, -99.7840),
('Alaska', 'AK', 61.2181, -149.9003),
('Vermont', 'VT', 44.0459, -72.7107),
('Wyoming', 'WY', 42.7559, -107.3025)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE coes_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scientific_organizing_committee ENABLE ROW LEVEL SECURITY;
ALTER TABLE america_makes_members ENABLE ROW LEVEL SECURITY;

-- Create basic read policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON coes_associations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON contributors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON organizations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON speakers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON scientific_organizing_committee FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON america_makes_members FOR SELECT USING (auth.role() = 'authenticated');

-- Allow public access to geographic lookup tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE us_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON countries FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON us_states FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON company_types FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS FOR DATA INTEGRITY
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update timestamp triggers
CREATE TRIGGER update_coes_associations_updated_at BEFORE UPDATE ON coes_associations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contributors_updated_at BEFORE UPDATE ON contributors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON speakers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_america_makes_members_updated_at BEFORE UPDATE ON america_makes_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE coes_associations IS 'Centers of Excellence and Associations for Wohlers Report 5';
COMMENT ON TABLE contributors IS 'Individual contributors across countries for Wohlers Report 6';
COMMENT ON TABLE events IS 'Events and symposiums for Wohlers Reports 7 and 8';
COMMENT ON TABLE organizations IS 'Organizations hosting events';
COMMENT ON TABLE speakers IS 'Event speakers and presenters';
COMMENT ON TABLE scientific_organizing_committee IS 'Scientific organizing committee details';
COMMENT ON TABLE america_makes_members IS 'America Makes member organizations for Wohlers Report 9';
COMMENT ON TABLE countries IS 'Country reference data for geographic reporting';
COMMENT ON TABLE us_states IS 'US state reference data for America Makes reporting';
COMMENT ON TABLE company_types IS 'Standardized company type classifications';

-- ============================================================================
-- COMPREHENSIVE MOCK DATA FOR WOHLERS REPORTS DEVELOPMENT
-- ============================================================================

-- 1. CENTERS OF EXCELLENCE AND ASSOCIATIONS (Report 5)
INSERT INTO coes_associations (name, type, country, description, website, established_year) VALUES
-- US Centers of Excellence
('America Makes', 'COE', 'United States', 'National AM Innovation Institute', 'https://americamakes.us', 2012),
('National Institute of Standards and Technology (NIST)', 'COE', 'United States', 'Federal AM Research Center', 'https://nist.gov/am', 2010),
('MIT Digital Manufacturing and Design Centre', 'COE', 'United States', 'Academic AM Research', 'https://dmd.mit.edu', 2015),

-- European Centers of Excellence  
('Fraunhofer IAPT', 'COE', 'Germany', 'Industrial AM Research Institute', 'https://iapt.fraunhofer.de', 2009),
('AMPLab (University of Exeter)', 'COE', 'United Kingdom', 'Advanced Materials Processing Laboratory', 'https://exeter.ac.uk/amplab', 2013),
('RISE IVF', 'COE', 'Sweden', 'Swedish AM Research Institute', 'https://ri.se', 2008),

-- Industry Associations
('ASTM Committee F42', 'Association', 'United States', 'AM Standards Development', 'https://astm.org/f42', 2009),
('ISO/TC 261', 'Association', 'Switzerland', 'International AM Standards', 'https://iso.org/tc261', 2011),
('SME Additive Manufacturing Community', 'Association', 'United States', 'Manufacturing Industry Association', 'https://sme.org/am', 2014),
('European Powder Metallurgy Association', 'Association', 'United Kingdom', 'EPMA AM Working Group', 'https://epma.com', 2017),
('3D Printing Industry', 'Association', 'United Kingdom', 'Global AM News and Analysis', 'https://3dprintingindustry.com', 2013),
('Additive Manufacturing Users Group', 'Association', 'United States', 'AM User Community', 'https://amug.com', 1989);

-- 2. CONTRIBUTORS (Report 6)
INSERT INTO contributors (name, country, role, expertise_area, bio) VALUES
-- United States Contributors
('Dr. Jennifer Lewis', 'United States', 'Research Director', 'Multi-material 3D Printing', 'Harvard Professor specializing in 3D bioprinting'),
('Dr. Christopher Williams', 'United States', 'Engineering Professor', 'Design for AM', 'Virginia Tech researcher in AM design optimization'),
('Dr. Lisa Pruitt', 'United States', 'Materials Scientist', 'Biomedical Applications', 'UC Berkeley expert in medical device manufacturing'),

-- European Contributors
('Prof. Jean-Pierre Kruth', 'Belgium', 'Academic Researcher', 'SLS/SLM Technologies', 'KU Leuven pioneer in powder bed fusion'),
('Dr. David Rosen', 'Germany', 'Industry Consultant', 'AM Strategy', 'Former Georgia Tech professor, AM consulting'),
('Prof. Neil Hopkinson', 'United Kingdom', 'Department Head', 'AM Manufacturing', 'Sheffield University AM research leader'),

-- Asian Contributors
('Dr. Shoufeng Yang', 'China', 'Research Scientist', 'Metal AM', 'Beijing Institute of Technology AM researcher'),
('Prof. Akira Shimokohbe', 'Japan', 'Academic Leader', 'Precision AM', 'Tokyo Tech micro-manufacturing expert'),
('Dr. Wai Yee Yeong', 'Singapore', 'Research Director', '3D Bioprinting', 'NTU biomedical AM applications'),

-- Additional Global Contributors
('Dr. Olaf Diegel', 'New Zealand', 'Design Professor', 'Creative Applications', 'University of Auckland design for AM'),
('Dr. Paulo Bártolo', 'Portugal', 'Research Coordinator', 'Biomanufacturing', 'University of Manchester AM research'),
('Prof. Eleonora Ferraris', 'Italy', 'Materials Engineer', 'Ceramic AM', 'Politecnico di Milano ceramic processing');

-- 3. EVENTS (Reports 7, 8)
INSERT INTO events (name, year, event_type, location, start_date, end_date, description, website) VALUES
-- ICAM Events
('ICAM 2023', 2023, 'ICAM', 'Austin, Texas, USA', '2023-07-10', '2023-07-14', 'International Conference on Additive Manufacturing', 'https://icam2023.com'),
('ICAM 2022', 2022, 'ICAM', 'Leuven, Belgium', '2022-09-19', '2022-09-23', 'International Conference on Additive Manufacturing', 'https://icam2022.com'),
('ICAM 2021', 2021, 'ICAM', 'Virtual Event', '2021-08-15', '2021-08-19', 'Virtual International Conference on Additive Manufacturing', 'https://icam2021.com'),

-- General Conferences
('Solid Freeform Fabrication 2023', 2023, 'Symposium', 'Austin, Texas, USA', '2023-08-14', '2023-08-16', 'Annual SFF Symposium at UT Austin', 'https://sff.utexas.edu'),
('RAPID + TCT 2023', 2023, 'Conference', 'Chicago, Illinois, USA', '2023-05-02', '2023-05-04', 'Leading AM Trade Show and Conference', 'https://rapid3devent.com'),
('Additive Manufacturing Europe 2023', 2023, 'Conference', 'Amsterdam, Netherlands', '2023-06-20', '2023-06-22', 'European AM Industry Conference', 'https://am-europe.com'),
('Inside 3D Printing Conference', 2023, 'Conference', 'New York, USA', '2023-04-26', '2023-04-27', 'Business-focused 3D Printing Event', 'https://inside3dprinting.com'),

-- Academic Symposiums
('Materials Science & Technology 2023', 2023, 'Symposium', 'Pittsburgh, Pennsylvania, USA', '2023-10-08', '2023-10-12', 'MS&T AM Symposium Track', 'https://matscitech.org'),
('European Congress on Advanced Materials', 2023, 'Symposium', 'Seville, Spain', '2023-09-03', '2023-09-07', 'EUROMAT AM Sessions', 'https://euromat2023.org');

-- 4. ORGANIZATIONS (Event Organizers)
INSERT INTO organizations (name, type, country, website, description) VALUES
-- Academic Institutions
('University of Texas at Austin', 'Academic', 'United States', 'https://utexas.edu', 'Leading AM research university'),
('KU Leuven', 'Academic', 'Belgium', 'https://kuleuven.be', 'European AM research leader'),
('MIT', 'Academic', 'United States', 'https://mit.edu', 'Technology innovation institute'),
('Stanford University', 'Academic', 'United States', 'https://stanford.edu', 'Silicon Valley innovation hub'),

-- Industry Organizations
('SME (Society of Manufacturing Engineers)', 'Industry', 'United States', 'https://sme.org', 'Manufacturing professional society'),
('ASTM International', 'Standards', 'United States', 'https://astm.org', 'Global standards organization'),
('Wohlers Associates', 'Consulting', 'United States', 'https://wohlersassociates.com', 'AM industry analysis firm'),
('SmarTech Analysis', 'Research', 'United States', 'https://smartech.markets', 'AM market research company'),

-- Government/National Labs
('NIST', 'Government', 'United States', 'https://nist.gov', 'National Institute of Standards and Technology'),
('Fraunhofer Institute', 'Research', 'Germany', 'https://fraunhofer.de', 'Applied research organization'),
('TNO', 'Research', 'Netherlands', 'https://tno.nl', 'Netherlands research organization');

-- 5. SPEAKERS (for events above - sample speakers for each event)
INSERT INTO speakers (name, event_id, organization_id, speaker_type, title, bio) VALUES
-- ICAM 2023 Speakers
((SELECT name FROM speakers WHERE name = 'Dr. Carl Dekker'), 
 (SELECT id FROM events WHERE name = 'ICAM 2023'), 
 (SELECT id FROM organizations WHERE name = 'MIT'), 
 'Invited', 
 'Scaling AM for Production Manufacturing', 
 'Leading researcher in production-scale additive manufacturing'),

('Prof. Rachel Segalman', 
 (SELECT id FROM events WHERE name = 'ICAM 2023'), 
 (SELECT id FROM organizations WHERE name = 'Stanford University'), 
 'Invited', 
 'Polymer AM: Materials Innovation', 
 'Expert in polymer science and AM materials'),

('Dr. Michael Sealy', 
 (SELECT id FROM events WHERE name = 'ICAM 2023'), 
 (SELECT id FROM organizations WHERE name = 'University of Texas at Austin'), 
 'Regular', 
 'Post-Processing Technologies for Metal AM', 
 'Research focus on surface finishing and post-processing'),

-- ICAM 2022 Speakers  
('Prof. Brent Stucker', 
 (SELECT id FROM events WHERE name = 'ICAM 2022'), 
 (SELECT id FROM organizations WHERE name = 'KU Leuven'), 
 'Invited', 
 'Quality Assurance in Metal AM', 
 'Pioneer in AM process monitoring and quality control'),

('Dr. Katrin Mollenhauer', 
 (SELECT id FROM events WHERE name = 'ICAM 2022'), 
 (SELECT id FROM organizations WHERE name = 'Fraunhofer Institute'), 
 'Regular', 
 'Industrial Implementation of AM', 
 'Expert in transitioning AM from research to industry'),

-- SFF 2023 Speakers
('Dr. Joseph Beaman', 
 (SELECT id FROM events WHERE name = 'Solid Freeform Fabrication 2023'), 
 (SELECT id FROM organizations WHERE name = 'University of Texas at Austin'), 
 'Invited', 
 'Origins and Future of SFF', 
 'Co-inventor of SLS technology and SFF Symposium founder'),

('Dr. David Bourell', 
 (SELECT id FROM events WHERE name = 'Solid Freeform Fabrication 2023'), 
 (SELECT id FROM organizations WHERE name = 'University of Texas at Austin'), 
 'Invited', 
 'Materials Development for AM', 
 'Pioneer in AM materials research and development');

-- Note: Need to add actual speaker records first, then link them
-- For now, adding sample speakers directly
INSERT INTO speakers (name, event_id, speaker_type, title, bio) VALUES
('Dr. Carl Dekker', (SELECT id FROM events WHERE name = 'ICAM 2023'), 'Invited', 'Scaling AM for Production Manufacturing', 'Leading researcher in production-scale additive manufacturing'),
('Prof. Rachel Segalman', (SELECT id FROM events WHERE name = 'ICAM 2023'), 'Invited', 'Polymer AM: Materials Innovation', 'Expert in polymer science and AM materials'),
('Dr. Michael Sealy', (SELECT id FROM events WHERE name = 'ICAM 2023'), 'Regular', 'Post-Processing Technologies for Metal AM', 'Research focus on surface finishing and post-processing'),
('Prof. Brent Stucker', (SELECT id FROM events WHERE name = 'ICAM 2022'), 'Invited', 'Quality Assurance in Metal AM', 'Pioneer in AM process monitoring and quality control'),
('Dr. Katrin Mollenhauer', (SELECT id FROM events WHERE name = 'ICAM 2022'), 'Regular', 'Industrial Implementation of AM', 'Expert in transitioning AM from research to industry'),
('Dr. Joseph Beaman', (SELECT id FROM events WHERE name = 'Solid Freeform Fabrication 2023'), 'Invited', 'Origins and Future of SFF', 'Co-inventor of SLS technology and SFF Symposium founder'),
('Dr. David Bourell', (SELECT id FROM events WHERE name = 'Solid Freeform Fabrication 2023'), 'Invited', 'Materials Development for AM', 'Pioneer in AM materials research and development');

-- 6. AMERICA MAKES MEMBERS (Report 9) - Mock data for different states and membership levels
INSERT INTO america_makes_members (member_status, state, city, join_date, membership_level_details) VALUES
-- Gold Members
('Gold', 'California', 'San Diego', '2020-03-15', '{"benefits": ["Priority project access", "Executive advisory board"], "annual_fee": 50000}'),
('Gold', 'Texas', 'Austin', '2019-08-22', '{"benefits": ["Priority project access", "Executive advisory board"], "annual_fee": 50000}'),
('Gold', 'Massachusetts', 'Cambridge', '2018-11-30', '{"benefits": ["Priority project access", "Executive advisory board"], "annual_fee": 50000}'),
('Gold', 'Illinois', 'Chicago', '2021-01-18', '{"benefits": ["Priority project access", "Executive advisory board"], "annual_fee": 50000}'),
('Gold', 'Pennsylvania', 'Pittsburgh', '2019-05-10', '{"benefits": ["Priority project access", "Executive advisory board"], "annual_fee": 50000}'),

-- Platinum Members
('Platinum', 'Ohio', 'Youngstown', '2017-02-14', '{"benefits": ["All access", "Board representation", "IP sharing"], "annual_fee": 100000}'),
('Platinum', 'Michigan', 'Detroit', '2018-09-07', '{"benefits": ["All access", "Board representation", "IP sharing"], "annual_fee": 100000}'),
('Platinum', 'New York', 'Rochester', '2017-12-01', '{"benefits": ["All access", "Board representation", "IP sharing"], "annual_fee": 100000}'),

-- Silver Members
('Silver', 'Virginia', 'Norfolk', '2020-06-25', '{"benefits": ["Standard project access", "Technical reports"], "annual_fee": 20000}'),
('Silver', 'Florida', 'Miami', '2021-04-12', '{"benefits": ["Standard project access", "Technical reports"], "annual_fee": 20000}'),
('Silver', 'Georgia', 'Atlanta', '2020-10-30', '{"benefits": ["Standard project access", "Technical reports"], "annual_fee": 20000}'),
('Silver', 'North Carolina', 'Raleigh', '2019-07-18', '{"benefits": ["Standard project access", "Technical reports"], "annual_fee": 20000}'),
('Silver', 'Washington', 'Seattle', '2021-08-05', '{"benefits": ["Standard project access", "Technical reports"], "annual_fee": 20000}'),
('Silver', 'Arizona', 'Phoenix', '2020-12-15', '{"benefits": ["Standard project access", "Technical reports"], "annual_fee": 20000}'),
('Silver', 'Colorado', 'Denver', '2019-11-22', '{"benefits": ["Standard project access", "Technical reports"], "annual_fee": 20000}'),

-- Public Members (Academic/Non-profit)
('Public', 'Connecticut', 'Hartford', '2018-03-08', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Maryland', 'Baltimore', '2019-09-14', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Indiana', 'Indianapolis', '2020-01-20', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Wisconsin', 'Milwaukee', '2021-03-28', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Minnesota', 'Minneapolis', '2018-06-11', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Tennessee', 'Nashville', '2020-08-17', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Missouri', 'Kansas City', '2019-12-03', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Oregon', 'Portland', '2021-05-09', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'South Carolina', 'Charleston', '2018-10-26', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}'),
('Public', 'Alabama', 'Birmingham', '2020-02-14', '{"benefits": ["Research collaboration", "Educational resources"], "annual_fee": 0}');

-- 7. SAMPLE MERGERS & ACQUISITIONS DATA (if table doesn't exist from previous migrations)
-- This assumes the mergers_acquisitions table exists from migration 004
INSERT INTO mergers_acquisitions (
    acquirer_company, 
    target_company, 
    announcement_date, 
    deal_type, 
    deal_size_millions, 
    status, 
    industry_focus, 
    strategic_rationale
) VALUES
('Stratasys', '3D Systems Desktop Division', '2023-03-15', 'Asset Acquisition', 45.2, 'Completed', 'Desktop 3D Printing', 'Expand consumer market presence'),
('HP Inc.', 'Choose Packaging', '2023-07-22', 'Acquisition', 25.8, 'Pending', 'Packaging Solutions', 'Strengthen Multi Jet Fusion applications'),
('Desktop Metal', 'Adaptive3D', '2022-11-30', 'Acquisition', 15.3, 'Completed', 'Materials', 'Advanced elastomer materials portfolio'),
('Markforged', 'Teton Simulation Software', '2022-08-18', 'Acquisition', 8.9, 'Completed', 'Software', 'Enhanced simulation capabilities'),
('Materialise', 'Link3D Supply Chain Platform', '2023-01-10', 'Strategic Investment', 12.5, 'Completed', 'Software Platform', 'Digital manufacturing workflow'),
('3D Systems', 'Additive Minds Consulting', '2022-12-05', 'Acquisition', 18.7, 'Completed', 'Consulting Services', 'Professional services expansion'),
('Proto Labs', 'Manufacturing Analytics Platform', '2023-05-17', 'Technology Acquisition', 6.2, 'Completed', 'Analytics Software', 'Data-driven manufacturing insights'),
('Ultimaker', 'Digital Factory Software Suite', '2022-10-12', 'Product Acquisition', 22.1, 'Completed', 'Software Platform', 'Enterprise workflow solutions'),
('Formlabs', 'Advanced Materials Startup', '2023-08-28', 'Acquisition', 31.4, 'In Progress', 'Materials Technology', 'High-performance material development'),
('Carbon', 'Automotive Tooling Specialist', '2022-09-25', 'Strategic Partnership', 19.8, 'Completed', 'Automotive Applications', 'Production tooling solutions');

-- Add some sample M&A data for timeline visualization
INSERT INTO mergers_acquisitions (
    acquirer_company, 
    target_company, 
    announcement_date, 
    deal_type, 
    deal_size_millions, 
    status, 
    industry_focus
) VALUES
('Major AM Corp A', 'Startup Tech B', '2021-03-12', 'Acquisition', 35.0, 'Completed', 'Metal AM'),
('Industry Leader C', 'Software Firm D', '2021-07-25', 'Acquisition', 28.5, 'Completed', 'Design Software'),
('Global Manufacturer E', 'Materials Co F', '2021-11-18', 'Acquisition', 42.3, 'Completed', 'Polymer Materials'),
('Tech Giant G', 'Service Provider H', '2022-02-08', 'Acquisition', 55.7, 'Completed', 'Production Services'),
('AM Leader I', 'Hardware Startup J', '2022-06-15', 'Acquisition', 18.9, 'Completed', 'Print Hardware'),
('Solutions Co K', 'Analytics Firm L', '2022-09-30', 'Acquisition', 23.4, 'Completed', 'Data Analytics'),
('Manufacturing M', 'Quality Systems N', '2022-12-20', 'Acquisition', 31.2, 'Completed', 'Quality Control')
ON CONFLICT DO NOTHING;