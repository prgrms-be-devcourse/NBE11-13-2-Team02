# 같이사 (gachisa)

공동구매 플랫폼. `gachisa-backend`(Spring Boot) + `gachisa-frontend`(React/Vite) 구성입니다.

## 처음 실행하기 (clone 직후)

### 1. 인프라 (MySQL, Redis) 띄우기

Docker가 설치되어 있다면 한 줄로 끝납니다.

```bash
docker compose up -d
```

- MySQL: `localhost:3306`, DB `gachisa`, 계정 `gachisa` / `gachisa1234`
- Redis: `localhost:6379`

Docker를 쓰지 않는다면 로컬에 MySQL 8 / Redis를 직접 설치하고 위와 동일한 DB/계정을 만들어주세요.

### 2. 백엔드 실행

```bash
cd gachisa-backend
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
```

`application-local.yml`은 `.gitignore`에 등록되어 있어 각자 로컬에만 존재합니다 (git에 올라가지 않음). 필요하면 `jwt.secret` 값을 원하는 랜덤 문자열로 바꿔주세요.

결제 기능(Toss)까지 테스트하려면 실행 전에 시크릿 키를 환경변수로 넘겨주세요 (Toss 개발자센터에서 발급):

```bash
export TOSS_SECRET_KEY=test_sk_...
```

실행:

```bash
./gradlew bootRun
```

`http://localhost:8080` 에서 뜹니다.

### 3. 프론트엔드 실행

```bash
cd gachisa-frontend
npm install
cp .env.example .env   # VITE_TOSS_CLIENT_KEY 값 채워넣기 (Toss 개발자센터에서 발급)
npm run dev
```

`http://localhost:5173` 에서 뜨고, `/api`·`/images` 요청은 자동으로 8080 백엔드로 프록시됩니다 (`vite.config.js`).

## 매번 다시 실행할 때

```bash
docker compose up -d          # 인프라가 꺼져 있다면
cd gachisa-backend && ./gradlew bootRun    # 터미널 1
cd gachisa-frontend && npm run dev         # 터미널 2
```

## 참고

- 백엔드 로컬 프로필은 `ddl-auto: create-drop` 이라 앱을 켤 때마다 스키마가 새로 생성되고 `data.sql`로 시드 데이터가 들어갑니다. 앱을 끄면 데이터가 사라지는 게 정상입니다.
- 인프라 데이터를 완전히 초기화하고 싶으면 `docker compose down -v` (볼륨까지 삭제).
