# 같이사 (gachisa)

공동구매 플랫폼. `gachisa-backend`(Spring Boot) + `gachisa-frontend`(React/Vite) 구성입니다.

## 처음 실행하기 (clone 직후)

### 0. 인프라 (MySQL, Redis) 준비

로컬에 MySQL 8 / Redis를 설치하고 아래 계정/DB를 만들어주세요.

- MySQL: `localhost:3306`, DB `gachisa`, 계정 `gachisa` / `gachisa1234`
- Redis: `localhost:6379`

### 1. 설정 파일 생성 + 프론트 의존성 설치

```bash
./setup.sh
```

`application-local.yml`(백엔드), `.env`(프론트) 설정 파일을 예제에서 복사해 만들고, `npm install`까지 자동으로 실행합니다. 이미 파일이 있으면 건드리지 않으니 여러 번 실행해도 안전합니다.

두 파일 다 `.gitignore`에 등록되어 있어 각자 로컬에만 존재합니다 (git에 올라가지 않음).

- 백엔드 `application-local.yml`: 필요하면 `jwt.secret` 값을 랜덤 문자열로 바꿔주세요.
- 프론트 `.env`: 결제(Toss) 테스트를 하려면 `VITE_TOSS_CLIENT_KEY` 값을 채워넣어야 합니다 (Toss 개발자센터에서 발급).

`setup.sh` 없이 수동으로 하려면:

```bash
cp gachisa-backend/src/main/resources/application-local.yml.example gachisa-backend/src/main/resources/application-local.yml
cp gachisa-frontend/.env.example gachisa-frontend/.env
cd gachisa-frontend && npm install
```

### 2. 백엔드 실행

결제 기능(Toss)까지 테스트하려면 실행 전에 시크릿 키를 환경변수로 넘겨주세요 (Toss 개발자센터에서 발급):

```bash
export TOSS_SECRET_KEY=test_sk_...
```

```bash
cd gachisa-backend
./gradlew bootRun
```

`http://localhost:8080` 에서 뜹니다.

### 3. 프론트엔드 실행

```bash
cd gachisa-frontend
npm run dev
```

`http://localhost:5173` 에서 뜨고, `/api`·`/images` 요청은 자동으로 8080 백엔드로 프록시됩니다 (`vite.config.js`).

## 매번 다시 실행할 때

```bash
cd gachisa-backend && ./gradlew bootRun    # 터미널 1 (MySQL/Redis가 떠 있어야 함)
cd gachisa-frontend && npm run dev         # 터미널 2
```

## 참고

- 백엔드 로컬 프로필은 `ddl-auto: create-drop` 이라 앱을 켤 때마다 스키마가 새로 생성되고 `data.sql`로 시드 데이터가 들어갑니다. 앱을 끄면 데이터가 사라지는 게 정상입니다.
