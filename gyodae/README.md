# 교대달력 플러스 (gyodae)

교대근무자가 **패턴을 바꿔도 지난 근무 기록이 그대로 남는** 근무 달력. 월 근무시간·야간시간·휴일근무시간을 집계하고, 시급을 넣으면 야간·휴일 가산분을 참고용으로 추정한다. 광고·회원가입·외부 전송 없음, 오프라인 동작.

| 항목 | 값 |
|---|---|
| 슬러그 | gyodae |
| 앱 주소 | https://apps.qaplus.kr/gyodae/ |
| 패키지명 | kr.qaplus.gyodae |
| 개인정보처리방침 | https://apps.qaplus.kr/gyodae/privacy.html |
| 운영자 | 큐에이 플러스 (사업자 783-65-00900, 통신판매업 제2026-전북완주-0182호) |
| 버전 | APP_VERSION 1.0.0 / CACHE_VERSION v1.0.0 |
| 권장 가격 | 1,900원 유료 앱 [확인 필요] |

## 핵심 가치 (경쟁 앱 대비 이길 지점 1개)
경쟁 앱 리뷰의 "근무형태를 바꾸면 기존 형태가 없어진다", "업데이트 후 두 달 근무내역이 날아갔다" 불만을 정면으로 해결한다.
- 패턴을 **적용 시작일 단위 기간**으로 저장 → 새 패턴은 그 날짜부터만 적용, 과거 날짜는 불변
- 기기 내 저장 + JSON 백업·복원으로 기록 유실 대비

## 수익화 가설
- Play 유료 앱 선결제(1,900원). 비교 근거: Supershift Pro 평생 66,000원(iOS), 교대타임 평생 22,000원·월 1,200~3,900원(iOS). 안드로이드 상위 무료 앱(나는교대자다2 100만+, 나는간호사다 10만+)은 모두 광고 포함.
- 검증 지표: 비공개 테스트 12명 중 "광고 없는 버전에 1,900원 낼 의향" 응답 비율, 출시 후 스토어 방문→구매 전환율.

### 웹 공개판과 앱판 차이(제안만, 미적용)
- 방식: `document.referrer`가 `android-app://kr.qaplus.gyodae`이면 전체 기능, 일반 웹은 체험판(예: 월 집계·백업 잠금).
- 장점: 웹 주소로 무료 사용하는 우회를 줄임.
- 단점·우회 가능성: referrer는 첫 진입에만 실리고 sessionStorage 등에 기억해야 하며, 개발자 도구·주소 조작으로 쉽게 우회 가능. 정적 사이트라 소스가 공개돼 근본 차단 불가. 일반 웹 사용자에게 기능을 잠그면 Play 정책상 "앱 밖 결제 유도"로 오해받지 않도록 결제 링크는 절대 넣지 않는다.
- 판단: 1차 출시는 동일 기능. 우회 비율보다 "스토어에서 찾아 설치하는 사용자"가 주 구매층이라는 가설을 먼저 검증한다.

## 폴더 구성
```
gyodae/
  index.html  sw.js  manifest.webmanifest  privacy.html
  README.md  assetlinks-entry.json  파일목록.md
  icons/  icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png favicon-32.png
  store/  play-icon-512.png feature-graphic-1024x500.png screenshot-1.png screenshot-2.png listing.md data-safety.md
```

## 배포 순서
1. 첨부 zip(`교대달력 플러스_gyodae.zip`)을 풀어 나온 `gyodae/` 폴더를 qaplus-apps 저장소 루트에 그대로 업로드(커밋).
2. https://apps.qaplus.kr/gyodae/ 접속 → 화면·오프라인·설치(홈 화면에 추가) 확인. (최초 1회: GitHub Pages 커스텀 도메인 apps.qaplus.kr, 가비아 CNAME, Enforce HTTPS)
3. PWABuilder(https://www.pwabuilder.com)에 앱 주소 입력 → Android 패키지 생성. 패키지명 `kr.qaplus.gyodae`, 앱 이름 "교대달력 플러스". 생성된 서명 키(.keystore)와 비밀번호는 별도 안전한 곳에 보관(분실 시 업데이트 불가).
4. PWABuilder가 준 SHA-256 지문 + Play Console의 "앱 서명 키 인증서" SHA-256 지문을 `assetlinks-entry.json`의 `sha256_cert_fingerprints` 배열에 넣고, 저장소 루트 `.well-known/assetlinks.json` 배열에 이 항목을 추가. (주소창이 보이면 지문 불일치)
5. Play Console 비공개 테스트: 신규 개인 계정은 테스터 12명 이상이 14일 연속 참여해야 프로덕션 신청 가능.
6. 정식 출시(유료 앱 가격 설정, 판매자 계정·결제 프로필 필요).

## 업데이트 방법
- 기능·화면 수정 시 `index.html`의 `APP_VERSION`과 `sw.js`의 `CACHE_VERSION`을 **함께** 올린다(예: 1.0.1 / v1.0.1).
- 설치된 앱은 다음 실행 때 "새 버전이 준비되었습니다" 안내 → 새로고침으로 적용.
- 데이터 키 `gyodae_data_v1` 구조를 바꾸면 `normalize()`에서 이전 형식을 읽어 이관할 것.

## 데이터·계산 기준
- 저장: localStorage `gyodae_data_v1` (기기 내), 백업 JSON.
- 야간: 22:00~06:00 겹치는 근무 구간(휴게 미차감). 휴일: 근무 시작일이 공휴일·내 휴일(옵션: 일요일)이면 해당 근무 순근무시간 전체.
- 가산 기본값: 야간 50%, 휴일 8시간 이내 50%·초과 100% (근로기준법 제56조 제2항·제3항). 사용자 변경 가능, 참고용 표기.
- 공휴일: 2026~2027년 내장. 2027년은 노동절(5/1)·제헌절(7/17) 공휴일 및 대체공휴일 반영(출처: shiftee 2027 공휴일 정리). [확인 필요: 2026년 노동절·제헌절 공휴일 적용 여부, 2028년 이후 데이터는 업데이트로 추가]

## 변경 사항
- 1.0.0 (2026-10-19): 최초 버전.
