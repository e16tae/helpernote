-- Seed security questions for user registration
-- Inserts common security questions used for account recovery

INSERT INTO security_questions (question_text)
VALUES
    ('어머니의 출생지는 어디입니까?'),
    ('첫 번째 반려동물의 이름은 무엇입니까?'),
    ('가장 좋아하는 영화는 무엇입니까?'),
    ('다녔던 초등학교 이름은 무엇입니까?'),
    ('가장 친한 친구의 이름은 무엇입니까?'),
    ('태어난 도시는 어디입니까?'),
    ('좋아하는 음식은 무엇입니까?')
ON CONFLICT DO NOTHING;
