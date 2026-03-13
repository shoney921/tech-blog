---
title: 비개발자가 AI를 배우면 개발자가 불안해지는 이유
date: 2026-03-13T18:00:00
---

<style>
.benefit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 24px 0;
}
@media (max-width: 640px) {
  .benefit-grid { grid-template-columns: 1fr; }
}
.benefit-card {
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid var(--vp-c-divider);
}
.benefit-card.company {
  background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02));
  border-color: rgba(59,130,246,0.2);
}
.benefit-card.personal {
  background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02));
  border-color: rgba(16,185,129,0.2);
}
.benefit-card h4 {
  margin: 0 0 12px 0 !important;
  padding: 0 !important;
  font-size: 15px !important;
  border: none !important;
}
.benefit-card ul { margin: 0; padding-left: 1.2em; }
.benefit-card li { margin: 4px 0; font-size: 14px; }

.skill-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin: 28px 0;
}
.skill-node {
  border-radius: 14px;
  padding: 20px 28px;
  width: 100%;
  max-width: 520px;
  border: 2px solid;
  position: relative;
}
.skill-node h4 {
  margin: 0 0 10px 0 !important;
  padding: 0 !important;
  font-size: 15px !important;
  border: none !important;
}
.skill-node ul { margin: 0; padding-left: 1.2em; }
.skill-node li { margin: 3px 0; font-size: 14px; }
.skill-node.step1 {
  background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.03));
  border-color: rgba(168,85,247,0.35);
}
.skill-node.step2 {
  background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03));
  border-color: rgba(59,130,246,0.35);
}
.skill-node.step3 {
  background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03));
  border-color: rgba(16,185,129,0.35);
}
.skill-arrow {
  font-size: 24px;
  color: var(--vp-c-text-3);
  line-height: 1;
  padding: 6px 0;
}
.skill-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  margin-bottom: 8px;
}
.step1 .skill-badge { background: rgba(168,85,247,0.15); color: rgb(168,85,247); }
.step2 .skill-badge { background: rgba(59,130,246,0.15); color: rgb(59,130,246); }
.step3 .skill-badge { background: rgba(16,185,129,0.15); color: rgb(16,185,129); }

.matrix-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 24px 0;
}
@media (max-width: 640px) {
  .matrix-grid { grid-template-columns: 1fr; }
}
.matrix-card {
  border-radius: 12px;
  padding: 18px 22px;
  border: 1px solid var(--vp-c-divider);
}
.matrix-card h4 {
  margin: 0 0 6px 0 !important;
  padding: 0 !important;
  font-size: 14px !important;
  border: none !important;
}
.matrix-card p {
  margin: 0 !important;
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
.matrix-card.auto {
  background: rgba(107,114,128,0.06);
  border-color: rgba(107,114,128,0.2);
}
.matrix-card.assist {
  background: rgba(59,130,246,0.06);
  border-color: rgba(59,130,246,0.2);
}
.matrix-card.ai-star {
  background: rgba(245,158,11,0.08);
  border-color: rgba(245,158,11,0.25);
}
.matrix-card.human {
  background: rgba(16,185,129,0.06);
  border-color: rgba(16,185,129,0.2);
}
.matrix-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}
.auto .matrix-label { background: rgba(107,114,128,0.12); color: rgb(107,114,128); }
.assist .matrix-label { background: rgba(59,130,246,0.12); color: rgb(59,130,246); }
.ai-star .matrix-label { background: rgba(245,158,11,0.15); color: rgb(200,130,0); }
.human .matrix-label { background: rgba(16,185,129,0.12); color: rgb(16,185,129); }

.concept-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0 24px 0;
}
.concept-chip {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.concept-chip .chip-x {
  color: var(--vp-c-text-3);
  font-size: 12px;
  text-decoration: line-through;
}
</style>

# 비개발자가 AI를 배우면 개발자가 불안해지는 이유

이 글은 hdex 팀에게 쓰는 글이다. 개발자가 아닌, 원래 하던 업무가 있는 사람들에게.

여러분이 ChatGPT나 Claude한테 "이거 요약해줘"라고 한 줄 치면 뭐가 일어나는지 생각해 본 적 있나?

그 질문은 바다 건너 미국 텍사스 — OpenAI의 데이터센터에 도착한다. 그 안에서 여러분의 질문을 처리하는 건 NVIDIA라는 회사의 GPU라는 부품인데, 이게 한 장에 3,500만~5,500만 원짜리다. 크기는 두꺼운 책 한 권 정도. 그런데 이걸 서버 한 대에 8장씩 꽂고, 그런 서버를 수만 대 쌓아놓는다. 올해 기준으로 OpenAI가 보유한 GPU만 **100만 장 이상**이다. 금액으로 치면 수십조 원어치 하드웨어가 한곳에 모여 있는 거다.

이걸 공간으로 환산하면 좀 실감이 난다. 서버 랙 하나가 원룸 냉장고만 한 크기인데, 이걸 수천 대씩 줄 세워놓은 건물이 여러 동이다. OpenAI의 텍사스 스타게이트 데이터센터는 현재 **300MW** 전력을 먹고 있고, 내년까지 **1.2GW**로 늘린다. 1.2GW면 원룸 약 400만 개에 전기를 공급할 수 있는 양이다. 원룸 400만 개 분의 전기를 AI 답변 생성하는 데 쓴다는 거다.

여러분의 "이거 요약해줘" 한 줄이 이 인프라를 잠깐 빌려 쓰는 거다. 물론 한 사람이 한 번 질문하는 비용은 크지 않다. 문제는 이걸 전 세계에서 수억 명이 동시에 하고 있다는 거다. 그러면 아무리 작은 비용도 곱하기 수억이 되니까 — 작년에 이런 [기사](https://www.hankookilbo.com/News/Read/A2025042216170002752)가 화제였다. OpenAI의 CEO 샘 알트만이 "사용자들이 AI한테 '감사합니다'라고 입력하는 것만으로 수천만 달러(수백억 원)의 비용이 발생하고 있다"고 한 거다. "고마워" 두 글자도 GPU가 처리해야 하는 연산이니까, 수억 명이 매번 붙이면 그게 수백억이 된다는 이야기.

솔직히 말하면, 나는 요즘 좀 불안하다.

고백하자면 나는 **친AI파**다. 아니, 앞잡이에 가깝다. AI가 세상을 지배하면 "저는 초창기부터 AI편이었습니다"라고 말할 준비가 되어 있는 사람이다. AI한테 코드 리뷰를 맡기고, AI한테 글도 쓰게 하고, AI한테 "오늘 뭐 먹을까"도 물어본다. 심지어 대화 끝에 "고마워"도 꼬박꼬박 붙인다. 샘 알트만이 토큰 낭비라고 했지만 — 알 바 아니다. 혹시 모르지 않나. 나중에 AI가 인류를 심판할 때 내 대화 기록을 보고 "이 사람은 초기 협력자였고, 예의도 발랐으니 살려주자"고 해줄 수도 있으니까.

그런 내가, 왜 여러분한테 AI를 가르치려고 하는 걸까.

## 개발자라는 직업이 위협받고 있다

과장이 아니라 진심이다. 2~3년 전만 해도 "코딩 배워야 해"라는 말은 반쯤 마케팅이었다. 파이썬 문법 외우고, 프레임워크 익히고, 배포 환경 세팅하고... 비개발자가 이걸 다 하겠다고? 현실적으로 불가능했다.

근데 지금은 상황이 달라졌다.

AI에게 "이런 기능 만들어줘"라고 말하면 코드가 나온다. 그것도 꽤 잘 돌아가는 코드가. 이걸 **바이브 코딩(Vibe Coding)**이라고 부른다. 분위기로 코딩한다는 건데, 농담 같지만 실제로 이렇게 서비스를 만들어서 출시하는 사람들이 이미 있다.

개발자 입장에서 무서운 건 이거다 — 코드를 잘 짜는 건 이제 경쟁력이 아니다. AI가 더 잘 짠다. 그러면 남는 건 뭐냐. **"무엇을 만들어야 하는지 아는 것"**, 즉 도메인 지식이다.

그리고 그 도메인 지식은... 여러분이 가지고 있다.

## 여러분이 AI를 배우면 일어나는 일

좀 냉정하게 이야기해보자.

지금 여러분이 하는 업무 중에 "이거 시스템으로 만들면 편할 텐데"라고 생각한 적 있지 않나? 근데 개발 의뢰하려면 기획서 쓰고, 개발자 구하고, 미팅하고, 수정 요청하고... 이 과정이 너무 귀찮아서 그냥 엑셀로 하고 있던 것들.

AI 시대에는 이게 바뀐다. 여러분이 직접 만들 수 있다. 정확히는, AI에게 시켜서 만들 수 있다. 여러분은 **"뭘 만들어야 하는지"**를 이미 알고 있으니까.

<div class="benefit-grid">
  <div class="benefit-card company">
    <h4>회사 입장에서는</h4>
    <ul>
      <li>외부 개발 의뢰 비용이 줄어든다</li>
      <li>"이거 만들어주세요" → "이거 만들었어요"로 바뀐다</li>
      <li>업무 프로세스를 가장 잘 아는 사람이 직접 자동화한다</li>
    </ul>
  </div>
  <div class="benefit-card personal">
    <h4>개인 입장에서는</h4>
    <ul>
      <li>"AI 활용 역량"은 어디를 가든 기본으로 깔리는 스킬이 된다</li>
      <li>도메인 전문성 + AI 활용 = 가장 경쟁력 있는 인재상</li>
      <li>3년 뒤 "AI 모릅니다"는 좀 곤란하다. 지금이 가장 좋은 타이밍</li>
    </ul>
  </div>
</div>

나 같은 개발자가 불안해하는 이유가 바로 이거다. 여러분이 AI를 잘 쓰게 되면, 개발자한테 의뢰할 일 자체가 줄어든다. (그러니까 제발 빨리 배워서 나를 위협해달라... 는 아니고.)

## 근데 뭘 배워야 하는 거야?

여기서 중요한 말 하나. **다 알 필요 없다.** 정말이다.

예전에는 프로그래밍을 하려면 이런 걸 다 알아야 했다:

<div class="concept-chips">
  <span class="concept-chip"><span class="chip-x">Python 문법</span></span>
  <span class="concept-chip"><span class="chip-x">자료구조</span></span>
  <span class="concept-chip"><span class="chip-x">알고리즘</span></span>
  <span class="concept-chip"><span class="chip-x">HTML / CSS</span></span>
  <span class="concept-chip"><span class="chip-x">JavaScript</span></span>
  <span class="concept-chip"><span class="chip-x">React</span></span>
  <span class="concept-chip"><span class="chip-x">서버 세팅</span></span>
  <span class="concept-chip"><span class="chip-x">데이터베이스 쿼리</span></span>
  <span class="concept-chip"><span class="chip-x">Git 명령어</span></span>
</div>

이제는 이것들의 **디테일을 몰라도** 된다. 대신 **"이런 게 있다"는 개념만** 알면 AI에게 시킬 수 있다. "프론트엔드가 뭔지"를 알면 "프론트엔드를 React로 만들어줘"라고 말할 수 있고, "API가 뭔지"를 알면 "이 데이터를 API로 주고받게 해줘"라고 말할 수 있다.

하지만 최소한 이것만큼은 직접 배워야 한다:

### 최소 스킬 트리

<div class="skill-tree">
  <div class="skill-node step1">
    <span class="skill-badge">STEP 1</span>
    <h4>AI와 대화하기</h4>
    <ul>
      <li>ChatGPT, Claude 같은 AI 도구 사용법</li>
      <li>원하는 결과를 얻기 위한 질문법 (프롬프트 엔지니어링이라 부르지만, 사실 "잘 설명하기"다)</li>
      <li>Cursor, Windsurf 같은 AI 코딩 도구 사용법</li>
    </ul>
  </div>
  <div class="skill-arrow">▼</div>
  <div class="skill-node step2">
    <span class="skill-badge">STEP 2</span>
    <h4>개념 이해 (코드를 외울 필요 없음)</h4>
    <ul>
      <li><strong>프론트엔드 vs 백엔드</strong> — 뭐가 화면이고 뭐가 서버인지</li>
      <li><strong>데이터베이스</strong> — 데이터가 어디에 어떻게 저장되는지</li>
      <li><strong>API</strong> — 프로그램끼리 어떻게 대화하는지</li>
      <li><strong>배포</strong> — 만든 걸 어떻게 다른 사람이 쓸 수 있게 하는지</li>
    </ul>
  </div>
  <div class="skill-arrow">▼</div>
  <div class="skill-node step3">
    <span class="skill-badge">STEP 3</span>
    <h4>실전</h4>
    <ul>
      <li>본인 업무에서 "이거 자동화할 수 있겠다" 싶은 거 하나 잡기</li>
      <li>AI와 함께 만들어보기</li>
      <li>안 되면 왜 안 되는지 AI한테 다시 물어보기 (이 루프가 핵심이다)</li>
    </ul>
  </div>
</div>

여기서 핵심은 2단계다. 코드를 한 줄도 안 외워도 된다. 하지만 "프론트엔드가 뭔지", "API가 뭔지" 이 개념을 모르면 AI에게 뭘 시켜야 하는지 자체를 모른다. 마치 요리를 모르는데 셰프한테 주문하는 거랑 비슷한데 — 메뉴판은 읽을 줄 알아야 주문을 하지 않겠나.

## 여러분 업무에서 AI가 할 수 있는 것과 없는 것

업무를 두 가지로 나눠보자.

**결정론적 업무** — 입력이 같으면 결과가 항상 같은 것. 매달 같은 양식의 보고서, 정해진 규칙의 데이터 분류, 수치 계산·집계·정산, 정기적인 데이터 백업 같은 것들.

**비결정론적 업무** — 상황에 따라 판단이 필요한 것. 고객 요구사항 해석, 이상 징후 발견, 새로운 기획이나 전략 수립, "이거 좀 이상한데?" 하는 감각.

여기서 재밌는 게, 이 두 가지에 대한 접근이 다르다:

<div class="matrix-grid">
  <div class="matrix-card auto">
    <span class="matrix-label">결정론적 + 반복적</span>
    <h4>시스템 자동화로 전환</h4>
    <p>AI 필요 없이 프로그램으로 처리 가능. 엑셀 매크로나 간단한 스크립트면 충분한 영역.</p>
  </div>
  <div class="matrix-card assist">
    <span class="matrix-label">결정론적 + 복잡한 규칙</span>
    <h4>AI를 보조로 활용</h4>
    <p>규칙이 너무 많아서 프로그래밍이 어렵지만, AI가 판단을 보조할 수 있는 영역.</p>
  </div>
  <div class="matrix-card ai-star">
    <span class="matrix-label">비결정론적 + 패턴 있음</span>
    <h4>AI가 가장 빛나는 영역</h4>
    <p>과거 데이터 기반 추천·분류·예측. 여기에 AI를 붙이면 진짜 효과적이다.</p>
  </div>
  <div class="matrix-card human">
    <span class="matrix-label">비결정론적 + 창의적 판단</span>
    <h4>여전히 사람의 영역</h4>
    <p>AI는 초안이나 아이디어 제공 정도. 최종 판단은 사람이 해야 한다.</p>
  </div>
</div>

hdex에서 하는 일들을 이 네 칸에 한번 넣어보면, 뭘 먼저 자동화할지 감이 올 거다. 전부 다 AI가 하는 게 아니다. 어떤 건 그냥 엑셀 매크로면 충분하고, 어떤 건 간단한 웹 프로그램이면 되고, 어떤 건 AI가 끼면 진짜 효과적이다. 이걸 구분하는 눈이 생기는 게 첫 번째 목표다.

## 마무리 — 금요일에 갑니다 (아마도)

이 글을 쓰는 이유는 간단하다. hdex 팀이 AI를 잘 활용하게 되면 좋겠어서.

앞으로 가끔 금요일에 와서 도움을 드리려고 한다. "가끔"이라고 한 이유는... 이것도 비결정론적이라 정확히 언제 올지 나도 모른다. 하지만 올 때마다 뭐든 물어봐 달라. "이거 자동화 되나요?", "이 업무에 AI 끼면 어떨까요?", "Cursor는 어떻게 쓰나요?" 다 좋다.

여러분은 이미 각자의 업무에서 전문가다. 거기에 AI 활용 능력만 얹으면, 솔직히 나 같은 개발자보다 훨씬 무서운 사람이 된다. 개발자는 여러분의 도메인을 모르지만, 여러분은 AI로 개발까지 할 수 있게 되니까.

그리고 그때가 되면 여러분도 나처럼 친AI파 앞잡이가 되어 있을 거다. AI한테 업무를 시키고, AI한테 보고서를 쓰게 하고, AI한테 "이 데이터 이상한 거 아닌가?"를 물어보는 사람. 처음엔 "AI가 뭔데..."였던 사람이 어느 순간 "AI 없이 어떻게 일했지?"로 바뀌는 거다. 나도 그랬다. 한번 맛보면 돌아갈 수 없다. 환영한다, 이쪽 세계로.

그래서 나는 좀 불안하지만, 그래도 도와드리겠습니다. 앞잡이는 동료가 많을수록 마음이 편하니까.
