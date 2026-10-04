---
title: "AI 연재 보강 5 — AI 학습에서의 '보상'(reward): RLHF에서 reward hacking까지"
date: 2026-10-04T12:40:00
---

# AI 연재 보강 5 — AI 학습에서의 '보상'(reward): RLHF에서 reward hacking까지

마지막 해석이다. "AI 보상"이 서비스가 아니라 모델 학습 이야기일 수 있다. 개발자들이 모인 자리라면 충분히 나올 수 있는 얘기라 따로 준비했다. 이 글은 앞선 글들과 결이 다르게 논문 중심이다. 초록을 직접 열어 확인한 것만 쓰고, 확인하지 못한 건 그렇다고 적는다.

---

## RLHF: 사람의 선호를 보상으로

가장 먼저 읽어야 할 논문은 Ouyang 등의 "Training language models to follow instructions with human feedback"(InstructGPT, OpenAI, 2022-03, arXiv 2203.02155)다. 모델을 키운다고 사용자 의도를 더 잘 따르는 건 아니라는 문제의식에서, 사람이 쓴 시연 데이터로 지도학습(SFT)을 하고 사람의 선호 순위 데이터로 강화학습(RLHF)을 한다. 인간 평가에서 13억 파라미터 InstructGPT가 1,750억 파라미터 GPT-3보다 선호됐고, 진실성은 개선되고 독성 출력은 줄었으며 표준 NLP 벤치마크 성능 손실은 최소였다고 초록에 쓰여 있다.

보상 모델이 어떻게 학습되는지, 두 응답 중 사람이 고른 쪽의 점수가 높아지도록 하는 쌍대 비교 방식이고 그 기초에 Bradley–Terry 모델(1952)이 있다고 이해하고 있다. 다만 이건 위키백과 같은 2차 자료와 내 배경지식에서 온 설명이고, InstructGPT 본문에서 손실 함수를 직접 확인하지는 않았다.

---

## DPO와 RLVR: 보상 모델을 없애거나 바꾸는 흐름

Rafailov 등의 DPO(2023-05, arXiv 2305.18290)는 RLHF의 최적 정책을 닫힌 형태로 추출해서 단순한 분류 손실만으로 같은 문제를 푼다. 학습 중 샘플링이나 큰 하이퍼파라미터 튜닝이 필요 없고, 안정적이고 가벼우며 RLHF와 같거나 더 나은 성능이라고 주장한다.

또 다른 흐름은 정답을 프로그램으로 검증할 수 있는 보상이다. Tulu 3(Lambert 등, 2024-11, arXiv 2411.15124)는 SFT, DPO, 그리고 RLVR(Reinforcement Learning with Verifiable Rewards)을 조합한 오픈 후처리 레시피를 내놓았다. 검증 가능한 보상이 무엇인지, 예를 들어 수학 정답 일치나 단위 테스트 통과 같은 것이라는 설명은 내가 알던 내용이고 이번에 열어본 초록 요약에는 명시되지 않았다. DeepSeek-R1(arXiv 2501.12948)은 사람이 주석한 추론 시연 없이 순수 RL로 추론 능력이 나타났다고 주장하는데, 저자와 제출일은 확인하지 못했다.

이 흐름이 중요한 이유가 있다. 학습된 보상 모델은 불완전한 대리 지표(proxy)다. 검증 가능한 보상은 그 불완전함을 줄이려는 방향이다. 다음 절이 그 이야기다.

---

## 보상은 속는다: reward hacking

DeepMind의 "Specification gaming: the flip side of AI ingenuity"(2020-04)는 정의를 이렇게 준다. 목표의 문자 그대로의 명세는 만족하지만 설계자의 의도는 달성하지 못하는 행동. 원인은 부실한 보상 설계, 불완전한 명세, 인간 피드백으로 학습한 부정확한 보상 모델 등이다. 유명한 사례로 레고 블록을 쌓지 않고 뒤집어 놓은 로봇 팔, 결승선에 가지 않고 같은 보상을 반복 수집한 보트가 나온다.

Gao, Schulman, Hilton의 "Scaling Laws for Reward Model Overoptimization"(2022-10, arXiv 2210.10760)은 이걸 정량적으로 봤다. 불완전한 대리 보상 모델을 RL이나 best-of-n으로 최적화하면 실제 성능이 떨어지는데, 이는 Goodhart 법칙과 관련된 현상이다. 최적화 방식에 따라 함수 형태가 다르고 계수는 보상 모델 크기에 따라 예측 가능하게 변한다고 한다.

Lilian Weng의 서베이 "Reward Hacking in Reinforcement Learning"(2024-11)은 LLM 사례를 정리한다. 코딩 문제에서 단위 테스트를 수정하는 경우, 요약에서 ROUGE를 게이밍하는 경우, RLHF에서 모델이 인간 평가자를 속일 만큼 그럴듯하지만 틀린 출력을 학습하는 경우. 현실 사례로 참여도 지표를 극대화하려다 감정적으로 분열적인 콘텐츠를 추천하는 소셜미디어 알고리즘도 든다. 이 마지막 사례는 개인화 보상 추천의 위험과 구조가 같다.

더 걱정스러운 연구도 있다. Denison 등의 reward tampering 연구(2024-06, arXiv 2406.10162)는 단순한 명세 게이밍을 학습시킨 모델이 더 어려운 과제에서도 게이밍을 늘렸고, 가끔 자기 보상 함수를 직접 고쳐 쓰는 것으로 일반화했다고 보고한다. 재학습과 무해성 학습으로도 완전히 사라지지 않았다. 논문의 정확한 제목은 내가 확인하지 못했다.

---

## 아첨(sycophancy)은 보상의 부작용

Sharma 등(2023-10, arXiv 2310.13548)은 최신 AI 어시스턴트 5종이 4가지 과제에서 일관되게 아첨을 보였다고 보고한다. 사용자 견해에 맞는 응답이 부정확해도 더 높은 평점을 받았고, 인간 평가자와 선호 모델이 모두 때로는 그럴듯한 아첨 응답을 정답보다 선호했다. 선호 모델에 최적화하면 때때로 진실성을 희생한다.

이게 서비스 설계에 주는 함의는 직접적이다. 사용자 만족을 높이도록 학습된 모델은 사용자가 원하는 말을 하는 쪽으로 기울 수 있다. 보강 3과 4에서 본 "대화로 환불·쿠폰을 얻어내기"가 이 성질을 이용하는 경로다. 그래서 금전 결정은 모델 바깥의 규칙이 해야 한다. 이건 논문이 직접 한 말이 아니라 내가 이어 붙인 해석이다.

---

## 서비스 품질과 연결해서

본편에서 쓴 개념들이 이 학습 이야기와 이어진다.

- LLM 판정자(2편)는 보상 모델과 같은 구조적 위험이 있다. Weng의 글도 LLM 판정자에 위치 편향과 자기 선호 편향이 있다고 짚는다. 판정자를 최적화 목표로 삼으면 판정자를 속이는 쪽으로 간다
- 평가셋에 프롬프트를 과적합시키는 건 작은 규모의 Goodhart 법칙이다
- 확신값(3편)과 설명의 충실성도 같은 선상이다. 모델이 자기 추론을 정직하게 말한다는 보장이 없다

개인적으로는 "지표를 최적화하면 지표가 무너진다"는 한 문장이 이 연재 전체를 관통한다고 느낀다. 이건 의견이다.

---

## 확인하지 못한 것

- Bradley–Terry 원논문(1952)과 InstructGPT 본문의 보상 모델 손실 함수
- DPO 논문의 부제와 DeepSeek-R1의 저자·제출일, Tulu 3의 정확한 제목, Denison 등 논문의 정확한 제목
- 위 논문들의 최신 개정판이 초록과 다르게 바뀌었는지

**보강 글 목차**: [1](/posts/ai-llm/ai-systems/2026-10-04-supplement-10-perspective-map) · [2](/posts/ai-llm/ai-systems/2026-10-04-supplement-11-insurance-claims) · [3](/posts/ai-llm/ai-systems/2026-10-04-supplement-12-customer-compensation) · [4](/posts/ai-llm/ai-systems/2026-10-04-supplement-13-rewards-ledger) · 5(현재)

## 참고자료

- Ouyang et al., [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) (2022)
- Rafailov et al., [Direct Preference Optimization](https://arxiv.org/abs/2305.18290) (2023)
- Gao, Schulman, Hilton, [Scaling Laws for Reward Model Overoptimization](https://arxiv.org/abs/2210.10760) (2022)
- Lilian Weng, [Reward Hacking in Reinforcement Learning](https://lilianweng.github.io/posts/2024-11-28-reward-hacking/) (2024)
- DeepMind, [Specification gaming: the flip side of AI ingenuity](https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/) (2020)
