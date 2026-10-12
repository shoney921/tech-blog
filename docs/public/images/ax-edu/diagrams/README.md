# AX 교육 본문 설명 도식

장식용 삽화와 별도로, 기존 챕터의 개념과 예시를 재구성한 SVG 14개다.
제품 화면·공식 아키텍처·실측 성능 자료가 아니다. 한글 텍스트와 화살표를
정확히 수정할 수 있도록 이미지 생성 모델 대신 코드로 작성했다.

| 챕터 | 파일 | 설명 |
| --- | --- | --- |
| 1 | `next-token.svg` | 자기회귀 생성 루프 |
| 1 | `sampling.svg` | Top-k·Top-p 비교, 가상 분포 50/25/15/10% |
| 2 | `prompt-anatomy.svg` | 역할·작업·제약·출력 형식 |
| 2 | `few-shot.svg` | 예제를 입력에 넣는 방식 |
| 3 | `rag-pipeline.svg` | 문서 준비와 질문 시 검색·생성 |
| 3 | `context-selection.svg` | 컨텍스트 선별·압축·갱신 |
| 4 | `function-calling.svg` | 모델·런타임의 역할과 실행 경계 |
| 4 | `agent-loop.svg` | 행동·관찰 루프와 종료 조건 |
| 5 | `evaluation-scope.svg` | 결과 평가와 실행 과정 평가 |
| 5 | `guardrail-layers.svg` | 입력·실행 전·출력의 검사 지점 |
| 6 | `aind-review-loop.svg` | 요청·검토·보완 사이클 |
| 6 | `aind-lifecycle.svg` | 개발 전주기의 AI와 사람 역할 |
| 7 | `dx-ax-rx.svg` | 디지털 기반·지능·행동의 층 |
| 7 | `vla-loop.svg` | 관찰·지시·제어·행동 피드백 |

저장소 루트에서 재생성:

```sh
python3 scripts/generate-ax-edu-diagrams.py
```

표준 라이브러리만 사용한다. 실행하면 SVG만 갱신하며 본문은 수정하지 않는다.
이미지마다 title/desc를 포함하고, 본문에 대체 텍스트·캡션·원본 확대 링크를 제공한다.
모든 SVG의 글자 경계와 브라우저 렌더링을 확인하고, 390px·1280px 화면에서
7편의 이미지 14개 로딩·너비·확대 링크를 점검했다.
