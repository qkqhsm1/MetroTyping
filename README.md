# MetroTyping

서울·인천·도쿄의 실제 노선을 따라 역명을 입력하는 React 타이핑 게임입니다.

## 실행

```powershell
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 엽니다.

## 품질 검사

```powershell
npm run check
```

`check`는 ESLint, 클라이언트/서버 테스트, 엄격한 TypeScript 검사, 프로덕션 빌드를 모두 실행합니다. 의존성 버전은 `package.json`의 semver 범위와 `package-lock.json`으로 고정합니다.

## 온라인 닉네임·랭킹

`.env.example`을 `.env.local`로 복사하고 Firebase 웹 앱 설정을 입력합니다. Firebase 설정이 없거나 연결되지 않아도 연습 게임은 정상 동작합니다. 랭킹 제출은 익명 인증, App Check, Cloud Functions의 서버 검증을 거치도록 구성되어 있습니다.

## 지도 출처

서울 지도: 서울특별시·서울교통공사, `지하철 노선도(2025-09-29)`, 공공누리 제1유형. 원본 PDF와 5102×5102 JPG를 `public/assets`에 포함했습니다.

야마노테선 도형은 공식 역 순서를 바탕으로 이 프로젝트에서 새로 그린 SVG이며, JR East의 지도 이미지를 복제하지 않습니다.
