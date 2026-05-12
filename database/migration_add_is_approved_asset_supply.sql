ALTER TABLE assets 
ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE supplies 
ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
CHECK (approval_status IN ('pending', 'approved', 'rejected'));