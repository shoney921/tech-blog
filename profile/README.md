# Shoney 개인 홈페이지

`shoneylife.com`의 프로필·프로젝트 소개 사이트. 기술 블로그와 독립된 HTML/CSS/Canvas 모션을 사용한다. 이 저장소에서 함께 관리하지만 기존 블로그 파일과 글은 교체하지 않는다.

- 소스: `home.html`, `assets/`, `projects.mjs`
- 빌드: 저장소 루트에서 `pnpm profile:build`
- 미리보기: `python3 -m http.server 4174 --bind 127.0.0.1 --directory profile/dist`
- 검증: `pnpm profile:check` (먼저 빌드·로컬 서버 실행)
- 배포: `npx -y wrangler@4.153.0 deploy --config profile/wrangler.jsonc`
- 배포 대상: Cloudflare Worker `shoney-personal`, 루트 커스텀 도메인 `shoneylife.com`. 기존 `blog.shoneylife.com` Pages와 독립.

Wrangler의 기존 로그인만 사용한다. 토큰 파일을 직접 읽거나 저장소에 인증 정보를 저장하지 않는다. 루트 DNS가 다른 서비스에 이미 연결돼 있다면 임의로 덮어쓰지 말고 기존 용도를 확인한다.

소유권 확인용 메타 태그와 루트 ads.txt에는 운영자가 제공한 게시자 ID를 사용한다. 실제 광고 로더는 이 사이트에 넣지 않는다. 게시자 ID는 블로그 설정 파일에서 읽으므로 두 사이트가 일치한다. Google 계정의 확인·검토 요청은 운영자가 직접 한다.

프로젝트 소개는 각 저장소의 개요 문서에 근거한다. 웹에 공개한 서비스라고 단정하지 않고 개인용 도구·개발 기록 상태를 구분한다. 카드 그래픽은 실제 화면 캡처가 아닌 설명용 CSS 그래픽임을 표시한다. 개인 원격 접속 주소, 개인 대화·운동 데이터, 업무 내부 자료는 공개하지 않는다.

모션: 입자 그래픽, 포인터 반응, 진입 애니메이션, 스크롤 reveal, 흐르는 타이포그래피, 프로젝트별 애니메이션, 호버 반응. 모션 정지 버튼과 `prefers-reduced-motion`을 지원하며, 캔버스는 화면 밖 또는 비활성 탭에서 중지한다. 정지 선택은 해당 탭의 sessionStorage에만 저장한다. JS를 실행하지 않아도 본문과 프로젝트 링크는 보인다.

사람이 확정할 것: 이메일 문의 자료의 보관·삭제 기준. 루트 사이트에는 회원가입·문의 폼·분석/광고 스크립트가 없으며 해당 사실을 개인정보 안내에 적었다.
