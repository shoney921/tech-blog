---
title: "나닮 CI/CD — PR 검증부터 셀프호스팅 배포까지"
date: 2026-02-20T12:00:00
---

# 나닮 CI/CD — PR 검증부터 셀프호스팅 배포까지

나닮는 Mac Mini 한 대에서 셀프호스팅하는 프로젝트다. 코드를 푸시할 때마다 수동으로 SSH 접속해서 pull 하고 docker compose 다시 띄우는 식으로 하다 보니, 실수도 나고 머지 전에 뭔가 깨진 걸 놓치기도 했다. 그래서 PR 단계에서 자동 검증(CI)을 넣고, master 머지 시 자동 배포(CD)까지 붙여봤다. 배포 대상이 로컬 Mac이니까 GitHub 호스트 runner가 아니라 self-hosted runner를 쓰는 구조다.

이 글에서는 그때 만든 파이프라인 구조와, 설정하면서 겪은 것들, 그리고 아직 남아 있는 제약을 정리해본다.

---

## CI: PR마다 돌리는 네 가지 검증

PR이 생성되거나 업데이트될 때마다 네 개 job이 **병렬**로 돌아간다.

**Backend Test** — `pytest tests/ -v`. DB는 SQLite in-memory 쓰고, `OPENAI_API_KEY`는 `sk-fake`로 두어서 외부 API 호출 없이 테스트만 돌린다. 처음 한 번은 `sentence-transformers`랑 `torch` 때문에 5~10분 걸렸다. pip 캐시가 쌓인 뒤로는 30~60초 정도로 줄었다.

**Frontend Typecheck** — `npm ci` 후 `npx tsc --noEmit`. 타입 에러만 잡는다. 빌드까지 돌리진 않는다.

**Frontend Build** — `docker build -f Dockerfile.prod`로 프로덕션 이미지를 실제로 만든다. 성공하면 이미지는 바로 정리해서 디스크를 안 먹게 했다. "로컬에서는 되는데 배포용 Dockerfile에서만 터진다" 같은 걸 PR 단계에서 막으려는 목적이다.

**Version Check** — `frontend/src/` 쪽이 바뀌었는데 `APP_VERSION`을 안 올리면 실패시킨다. 실수로 버전을 안 범프하고 배포하는 걸 막으려고 넣었다.

네 개 다 통과해야 머지할 수 있게 두었다. 한 번에 다 돌리니까 대기 시간은 가장 긴 job 기준으로만 잡히고, 그게 보통 backend-test다.

---

## CD: master에 머지되면 자동 배포

master에 push(또는 PR 머지)가 되면 CD 워크플로우가 **순차**로 실행된다.

먼저 환경을 검증한다. `DEPLOY_DIR`이 있고, 그 안에 `.env.production`이 있고, Docker가 돌아가고 있는지 확인한다. Self-hosted runner가 그 Mac에서 돌기 때문에, 배포할 디렉터리와 Docker 상태를 여기서 한 번 더 체크하는 식이다.

그다음 DB 백업. 기존에 쓰던 `scripts/backup_db.sh`를 그대로 호출하고, 14일치만 보관하도록 해뒀다. 수동 배포할 때 백업 빼먹는 일이 있어서, CD에 꼭 넣었다.

이어서 rsync로 코드 동기화. `.env`, `data/`, `backups/` 같은 건 제외하고 레포 내용만 배포 디렉터리로 맞춘다. 그 다음 `docker compose up --build -d`로 이미지 빌드 후 컨테이너 올리고, PostgreSQL이 healthy 될 때까지, Backend `/health`가 응답할 때까지 각각 최대 90초씩 기다린다. 그다음 Alembic 마이그레이션을 돌리고, 마지막으로 `scripts/healthcheck.sh`로 컨테이너 상태와 Backend/Frontend 응답을 한 번 더 확인한다.

여기서 한 단계라도 실패하면 `scripts/rollback.sh`가 자동으로 실행된다. `git checkout HEAD~1 -- .`로 코드만 이전 커밋으로 되돌리고, 다시 `docker compose up --build -d` 한 뒤 Backend `/health`가 올 때까지 재시도한다. DB 마이그레이션은 자동 롤백하지 않는다. 데이터 손실 위험이 있어서, 필요하면 수동으로 `alembic downgrade -1` 하도록 해뒀다.

수동으로 CD만 돌리고 싶을 때는 workflow_dispatch에서 "백업 스킵" 옵션을 줄 수 있게 해뒀다.

---

## Self-hosted Runner와 Mac 한 대

배포 대상이 내 Mac Mini라서, GitHub 호스트 runner로는 배포 디렉터리나 Docker에 접근할 수 없다. 그래서 같은 Mac에 Actions runner를 설치했다.

Runner 디렉터리 만들고, GitHub에서 macOS arm64용 아카이브 받아서 풀고, `config.sh`로 레포에 등록한 뒤, LaunchAgent(`./svc.sh install` & `start`)로 서비스 등록해뒀다. 재부팅해도 runner가 자동으로 올라오게. GitHub Secrets에는 `DEPLOY_DIR`만 넣었고, `.env.production` 같은 건 그 Mac 디스크에만 두고 runner가 그 경로를 읽도록 했다. API 키를 Secrets에 넣지 않아도 되는 이유가 그거다.

한 가지 걸린 게, **Mac이 잠자기 들어가면 runner가 offline**이 된다는 점이다. 전원 어댑터 연결 + "전원 연결 시 자동으로 잠자기 방지" 설정을 켜두지 않으면, 새벽에 머지해도 job이 runner 대기 상태에서 멈춰 있을 수 있다. Docker Desktop도 "로그인 시 자동 시작" 해두지 않으면 CD가 실패한다. 로컬 한 대가 배포 서버이자 runner라서, 이 정도는 감수하고 쓰는 수밖에 없다.

---

## 헬스체크와 롤백 스크립트

CD 마지막에 쓰는 `healthcheck.sh`는 다음을 확인한다. 컨테이너 네 개가 전부 running인지, Backend `http://localhost:8001/health`가 응답하는지, Frontend도 HTTP 200이 나오는지. 각각 재시도 횟수와 간격을 두고 curl로 확인한다. 로컬에서 `bash scripts/healthcheck.sh`만 돌려도 동작 확인이 가능하다.

`rollback.sh`는 위에서 썼듯이 코드만 이전 커밋으로 되돌리고 다시 빌드·기동한 뒤 Backend health만 확인한다. 마이그레이션은 건드리지 않는다. "배포가 실패했을 때 최소한 이전 버전으로는 복구되게"가 목표다.

:::tip
DB 마이그레이션은 자동 롤백하지 않는다. 스키마를 올렸다가 롤백해야 할 때는 `docker compose -f docker-compose.prod.yml exec -T backend alembic downgrade -1` 같은 식으로 수동 실행해야 한다.
:::

---

## 알려진 제약과 트레이드오프

정리하면 이렇게다.

- **첫 CI**: sentence-transformers + torch 때문에 첫 실행은 5~10분 걸릴 수 있다. 캐시 뒤에는 30~60초 수준.
- **Mac 슬립**: runner가 같은 Mac에 있어서, 잠자기/전원 설정을 안 해두면 job이 대기 상태에 걸린다.
- **다운타임**: 배포 중 15~30초 정도는 PWA 서비스워커가 오프라인으로 보는 구간이 생길 수 있다.
- **pgvector**: CI에서는 SQLite로 테스트하므로, pgvector 전용 로직은 나중에 테스트를 나누는 게 나을 수 있다.

"완전 무중단 배포"까지는 아니고, 1인 개발·셀프호스팅 범위에서 "머지 전에 검증 + 머지 후 자동 배포 + 실패 시 자동 롤백" 정도를 목표로 둔 구성이다. 팀이 커지거나 트래픽이 늘면 runner를 분리하거나, 배포 전략을 바꿔야 할 것 같다.

---

## 참고한 것들

- GitHub Actions 문서 (workflow 문법, self-hosted runner)
- 기존 `docker-compose.prod.yml`, `frontend/Dockerfile.prod`
- `scripts/backup_db.sh` (기존 백업 스크립트)
- `docs/DEPLOYMENT_CHECKLIST.md` (예전 수동 배포 체크리스트)

상세한 단계별 설정(Secret 이름, Runner 설치 명령, 검증 순서)은 레포의 `docs/CICD_SETUP.md`(또는 프로젝트 내 동일 문서)에 정리해 두었다. 이 글은 그 구성을 왜 이렇게 잡았는지, 어떤 제약이 있는지를 중심으로 썼다.
