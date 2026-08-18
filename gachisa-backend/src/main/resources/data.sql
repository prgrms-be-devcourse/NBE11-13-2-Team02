-- 같이사 프로젝트 개발용 시드 데이터
-- application.yml에서 ddl-auto: create-drop + defer-datasource-initialization: true 설정 시
-- 앱이 뜰 때 (Hibernate가 엔티티 기준으로 테이블 생성 직후) 자동으로 실행됩니다.
-- 앱을 끄면 테이블 자체가 삭제되므로, 이 파일은 항상 최신 스키마에 맞게 유지하면 됩니다.

INSERT INTO users (email, password, name, role, created_at) VALUES
                                                                 ('buyer1@test.com', '$2a$10$dummyHashedPassword1', '구매자1', 'ROLE_BUYER', NOW()),
                                                                 ('buyer2@test.com', '$2a$10$dummyHashedPassword2', '구매자2', 'ROLE_BUYER', NOW()),
                                                                 ('seller1@test.com', '$2a$10$dummyHashedPassword3', '판매자1', 'ROLE_SELLER', NOW()),
                                                                 ('admin@test.com',  '$2a$10$dummyHashedPassword4', '관리자',  'ROLE_ADMIN', NOW());

INSERT INTO category (name, parent_id) VALUES
                                           ('생활/리빙', NULL),
                                           ('식품', NULL),
                                           ('디지털', NULL),
                                           ('기타', NULL);

INSERT INTO product (seller_id, category_id, name, description, base_price, status, created_at) VALUES
                                                                                                    (3, 1, '텀블러 6종 세트', '보온·보냉 겸용 텀블러 6종 구성', 18000, 'ON_SALE', NOW()),
                                                                                                    (3, 2, '유기농 원두 1kg', '싱글 오리진 원두', 16000, 'ON_SALE', NOW());

INSERT INTO product_option (product_id, option_name, option_value, stock) VALUES
                                                                              (1, '기타', '기본', 100),
                                                                              (2, '기타', '기본', 100);

INSERT INTO group_buy (product_id, product_option_id, target_count, current_count, discount_rate, open_at, deadline, status) VALUES
                                                                                                                                  (1, 1, 10, 8, 0.30, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 'RECRUITING'),
                                                                                                                                  (2, 2, 8,  2, 0.20, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 'RECRUITING');

INSERT INTO participation (group_buy_id, user_id, quantity, status, participated_at) VALUES
                                                                                         (1, 1, 1, 'PARTICIPATING', NOW()),
                                                                                         (2, 2, 1, 'PARTICIPATING', NOW()),
                                                                                         (1, 2, 1, 'CONFIRMED', NOW());

-- 참여 3번(id=3)은 결제/주문까지 완료된 상태를 보여주는 예시 데이터
INSERT INTO payment (participation_id, amount, status, created_at, updated_at, paid_at) VALUES
                                                                                              (3, 12600, 'PAID', NOW(), NOW(), NOW());

INSERT INTO order_table (participation_id, payment_id, buyer_id, delivery_status, created_at, updated_at) VALUES
                                                                                                               (3, 1, 2, 'PREPARING', NOW(), NOW());
