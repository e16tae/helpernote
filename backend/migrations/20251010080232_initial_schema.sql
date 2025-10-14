-- ================================================
-- 구인구직 매칭 중개 서비스 데이터베이스 스키마
-- 비즈니스 모델: 매칭 중개 수수료 기반
-- PostgreSQL 기준
-- ================================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. 보안 질문 테이블
-- ================================================
CREATE TABLE security_questions (
    id BIGSERIAL PRIMARY KEY,
    question_text VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

COMMENT ON TABLE security_questions IS '비밀번호 찾기용 보안 질문';

-- ================================================
-- 2. 사용자 테이블 (중개인)
-- ================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    security_question_id BIGINT NOT NULL,
    security_answer VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    default_employer_fee_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (default_employer_fee_rate >= 0 AND default_employer_fee_rate <= 100),
    default_employee_fee_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (default_employee_fee_rate >= 0 AND default_employee_fee_rate <= 100),
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (security_question_id) REFERENCES security_questions(id)
);

COMMENT ON TABLE users IS '중개 서비스를 운영하는 사용자 (중개인)';
COMMENT ON COLUMN users.default_employer_fee_rate IS '구인자로부터 받을 기본 수수료율 (%, 기본값 0)';
COMMENT ON COLUMN users.default_employee_fee_rate IS '구직자로부터 받을 기본 수수료율 (%, 기본값 0)';

-- ================================================
-- 3. 사용자 자료 테이블
-- ================================================
CREATE TABLE user_files (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'document', 'video', 'other')),
    file_size BIGINT,
    thumbnail_path VARCHAR(1000),
    original_filename VARCHAR(500),
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_files IS '중개인의 파일 (계약서, 서류 등)';

-- ================================================
-- 4. 사용자 메모 테이블
-- ================================================
CREATE TABLE user_memos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    memo_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_memos IS '중개인의 업무 메모';

-- ================================================
-- 5. 고객 테이블 (구인자/구직자)
-- ================================================
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    profile_photo_id BIGINT NULL,
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('employer', 'employee', 'both')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE customers IS '중개인이 관리하는 고객 (구인자/구직자)';
COMMENT ON COLUMN customers.customer_type IS 'employer: 구인자, employee: 구직자, both: 양쪽 가능';

-- ================================================
-- 6. 고객 자료 테이블
-- ================================================
CREATE TABLE customer_files (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'document', 'video', 'other')),
    file_size BIGINT,
    thumbnail_path VARCHAR(1000),
    original_filename VARCHAR(500),
    mime_type VARCHAR(100),
    is_profile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

COMMENT ON TABLE customer_files IS '고객의 프로필 사진, 이력서, 신분증 등';

-- profile_photo_id 외래키 추가 (순환 참조 방지를 위해 나중에 추가)
ALTER TABLE customers
ADD CONSTRAINT fk_customers_profile_photo
FOREIGN KEY (profile_photo_id) REFERENCES customer_files(id) ON DELETE SET NULL;

-- ================================================
-- 7. 고객 메모 테이블
-- ================================================
CREATE TABLE customer_memos (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    memo_content TEXT NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE customer_memos IS '고객에 대한 중개인의 메모';

-- ================================================
-- 8. 구인 공고 테이블
-- ================================================
CREATE TABLE job_postings (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    salary DECIMAL(12, 2) NOT NULL CHECK (salary > 0),
    description TEXT NOT NULL,
    employer_fee_rate DECIMAL(5, 2) NULL CHECK (employer_fee_rate >= 0 AND employer_fee_rate <= 100),
    settlement_status VARCHAR(20) DEFAULT 'unsettled' CHECK (settlement_status IN ('unsettled', 'settled')),
    settlement_amount DECIMAL(12, 2) CHECK (settlement_amount >= 0),
    settlement_memo TEXT,
    posting_status VARCHAR(20) DEFAULT 'published' CHECK (posting_status IN ('published', 'in_progress', 'closed', 'cancelled')),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

COMMENT ON TABLE job_postings IS '구인자의 구인 공고';
COMMENT ON COLUMN job_postings.salary IS '구인자가 구직자에게 제시하는 급여';
COMMENT ON COLUMN job_postings.employer_fee_rate IS '이 공고의 구인자 수수료율 (%). NULL이면 사용자의 기본 수수료율 사용';
COMMENT ON COLUMN job_postings.settlement_status IS '구인자가 중개인에게 지불할 수수료 정산 상태';
COMMENT ON COLUMN job_postings.settlement_amount IS '구인자가 중개인에게 지불할 중개 수수료';
COMMENT ON COLUMN job_postings.settlement_memo IS '수수료 정산 관련 메모 (예: 2025-10-15 수수료 50만원 입금)';
COMMENT ON COLUMN job_postings.is_favorite IS '즐겨찾기 여부 (상단 노출용)';

-- ================================================
-- 9. 구직 공고 테이블
-- ================================================
CREATE TABLE job_seeking_postings (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    desired_salary DECIMAL(12, 2) NOT NULL CHECK (desired_salary > 0),
    description TEXT NOT NULL,
    preferred_location TEXT NOT NULL,
    employee_fee_rate DECIMAL(5, 2) NULL CHECK (employee_fee_rate >= 0 AND employee_fee_rate <= 100),
    settlement_status VARCHAR(20) DEFAULT 'unsettled' CHECK (settlement_status IN ('unsettled', 'settled')),
    settlement_amount DECIMAL(12, 2) CHECK (settlement_amount >= 0),
    settlement_memo TEXT,
    posting_status VARCHAR(20) DEFAULT 'published' CHECK (posting_status IN ('published', 'in_progress', 'closed', 'cancelled')),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

COMMENT ON TABLE job_seeking_postings IS '구직자의 구직 공고';
COMMENT ON COLUMN job_seeking_postings.desired_salary IS '구직자가 희망하는 급여';
COMMENT ON COLUMN job_seeking_postings.employee_fee_rate IS '이 공고의 구직자 수수료율 (%). NULL이면 사용자의 기본 수수료율 사용';
COMMENT ON COLUMN job_seeking_postings.settlement_status IS '구직자가 중개인에게 지불할 수수료 정산 상태';
COMMENT ON COLUMN job_seeking_postings.settlement_amount IS '구직자가 중개인에게 지불할 중개 수수료';
COMMENT ON COLUMN job_seeking_postings.settlement_memo IS '수수료 정산 관련 메모 (예: 2025-10-20 수수료 30만원 입금)';
COMMENT ON COLUMN job_seeking_postings.is_favorite IS '즐겨찾기 여부 (상단 노출용)';

-- ================================================
-- 10. 매칭 테이블
-- ================================================
CREATE TABLE matchings (
    id BIGSERIAL PRIMARY KEY,
    job_posting_id BIGINT NOT NULL,
    job_seeking_posting_id BIGINT NOT NULL,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agreed_salary DECIMAL(12, 2) NOT NULL CHECK (agreed_salary > 0),
    employer_fee_rate DECIMAL(5, 2) NOT NULL CHECK (employer_fee_rate >= 0 AND employer_fee_rate <= 100),
    employee_fee_rate DECIMAL(5, 2) NOT NULL CHECK (employee_fee_rate >= 0 AND employee_fee_rate <= 100),
    employer_fee_amount DECIMAL(12, 2) CHECK (employer_fee_amount >= 0),
    employee_fee_amount DECIMAL(12, 2) CHECK (employee_fee_amount >= 0),
    matching_status VARCHAR(20) DEFAULT 'in_progress' CHECK (matching_status IN ('in_progress', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    cancelled_by BIGINT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (job_seeking_posting_id) REFERENCES job_seeking_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE matchings IS '구인자와 구직자의 매칭 정보';
COMMENT ON COLUMN matchings.agreed_salary IS '최종 합의된 급여';
COMMENT ON COLUMN matchings.employer_fee_rate IS '이 매칭에 적용된 구인자 수수료율 (%)';
COMMENT ON COLUMN matchings.employee_fee_rate IS '이 매칭에 적용된 구직자 수수료율 (%)';
COMMENT ON COLUMN matchings.employer_fee_amount IS '구인자가 지불할 수수료 금액 (agreed_salary * employer_fee_rate / 100)';
COMMENT ON COLUMN matchings.employee_fee_amount IS '구직자가 지불할 수수료 금액 (agreed_salary * employee_fee_rate / 100)';

-- ================================================
-- 11. 매칭 메모 테이블
-- ================================================
CREATE TABLE matching_memos (
    id BIGSERIAL PRIMARY KEY,
    matching_id BIGINT NOT NULL,
    memo_content TEXT NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (matching_id) REFERENCES matchings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE matching_memos IS '매칭 과정에서의 중개인 메모';

-- ================================================
-- 12. 태그 마스터 테이블
-- ================================================
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    tag_color VARCHAR(20) DEFAULT '#6B7280',
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, tag_name)
);

COMMENT ON TABLE tags IS '사용자별 태그 마스터 데이터';
COMMENT ON COLUMN tags.tag_color IS '태그 표시 색상 (UI용, hex 코드)';

-- ================================================
-- 13. 고객 태그 연결 테이블
-- ================================================
CREATE TABLE customer_tags (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE (customer_id, tag_id)
);

COMMENT ON TABLE customer_tags IS '고객에 적용된 태그';

-- ================================================
-- 14. 구인 공고 태그 연결 테이블
-- ================================================
CREATE TABLE job_posting_tags (
    id BIGSERIAL PRIMARY KEY,
    job_posting_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE (job_posting_id, tag_id)
);

COMMENT ON TABLE job_posting_tags IS '구인 공고에 적용된 태그';

-- ================================================
-- 15. 구직 공고 태그 연결 테이블
-- ================================================
CREATE TABLE job_seeking_posting_tags (
    id BIGSERIAL PRIMARY KEY,
    job_seeking_posting_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_seeking_posting_id) REFERENCES job_seeking_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE (job_seeking_posting_id, tag_id)
);

COMMENT ON TABLE job_seeking_posting_tags IS '구직 공고에 적용된 태그';

-- ================================================
-- 16. 인덱스 생성
-- ================================================

-- 사용자 테이블
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;

-- 고객 테이블
CREATE INDEX idx_customers_user_id ON customers(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_type ON customers(customer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_name ON customers(name) WHERE deleted_at IS NULL;

-- 구인 공고
CREATE INDEX idx_job_postings_customer ON job_postings(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_postings_status ON job_postings(posting_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_postings_settlement ON job_postings(settlement_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_postings_created ON job_postings(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_postings_favorite ON job_postings(is_favorite, created_at DESC) WHERE deleted_at IS NULL AND is_favorite = TRUE;
CREATE INDEX idx_job_postings_settlement_combo ON job_postings(posting_status, settlement_status) WHERE deleted_at IS NULL;

-- 구직 공고
CREATE INDEX idx_job_seeking_customer ON job_seeking_postings(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_seeking_status ON job_seeking_postings(posting_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_seeking_settlement ON job_seeking_postings(settlement_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_seeking_location ON job_seeking_postings(preferred_location) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_seeking_created ON job_seeking_postings(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_seeking_favorite ON job_seeking_postings(is_favorite, created_at DESC) WHERE deleted_at IS NULL AND is_favorite = TRUE;
CREATE INDEX idx_job_seeking_settlement_combo ON job_seeking_postings(posting_status, settlement_status) WHERE deleted_at IS NULL;

-- 매칭
CREATE INDEX idx_matchings_job_posting ON matchings(job_posting_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_matchings_job_seeking ON matchings(job_seeking_posting_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_matchings_status ON matchings(matching_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_matchings_date ON matchings(matched_at DESC) WHERE deleted_at IS NULL;

-- 파일 테이블
CREATE INDEX idx_user_files_user_id ON user_files(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_files_customer_id ON customer_files(customer_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uniq_customer_files_profile ON customer_files(customer_id) WHERE is_profile = TRUE AND deleted_at IS NULL;

-- 메모 테이블
CREATE INDEX idx_user_memos_user_id ON user_memos(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_memos_customer_id ON customer_memos(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_memos_created_by ON customer_memos(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_matching_memos_matching_id ON matching_memos(matching_id) WHERE deleted_at IS NULL;

-- 태그 테이블
CREATE INDEX idx_tags_user_id ON tags(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_tags_customer_id ON customer_tags(customer_id);
CREATE INDEX idx_customer_tags_tag_id ON customer_tags(tag_id);
CREATE INDEX idx_job_posting_tags_job_posting_id ON job_posting_tags(job_posting_id);
CREATE INDEX idx_job_posting_tags_tag_id ON job_posting_tags(tag_id);
CREATE INDEX idx_job_seeking_posting_tags_job_seeking_posting_id ON job_seeking_posting_tags(job_seeking_posting_id);
CREATE INDEX idx_job_seeking_posting_tags_tag_id ON job_seeking_posting_tags(tag_id);

-- ================================================
-- 17. 트리거 함수 (updated_at 자동 업데이트)
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_security_questions_updated_at
BEFORE UPDATE ON security_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_files_updated_at
BEFORE UPDATE ON user_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memos_updated_at
BEFORE UPDATE ON user_memos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_files_updated_at
BEFORE UPDATE ON customer_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_memos_updated_at
BEFORE UPDATE ON customer_memos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_seeking_updated_at
BEFORE UPDATE ON job_seeking_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matchings_updated_at
BEFORE UPDATE ON matchings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matching_memos_updated_at
BEFORE UPDATE ON matching_memos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 스키마 생성 완료
