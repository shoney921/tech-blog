"""Rebuild the explanatory SVGs: python3 scripts/generate-ax-edu-diagrams.py.

Only Python's standard library is required. Sampling values are illustrative,
not measured model outputs. Existing article text is not modified by this script.
"""
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parents[1] / 'docs/public/images/ax-edu/diagrams'
OUT.mkdir(parents=True, exist_ok=True)
INK, MUTED, TEAL, BLUE, GOLD, RED = '#18343b', '#52646b', '#dcefe9', '#e4edf8', '#fff0cb', '#fae4df'


class Diagram:
    def __init__(self, name, title, subtitle, height=620):
        self.name, self.height = name, height
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="{height}" viewBox="0 0 640 {height}" role="img" aria-labelledby="title desc">',
                      f'<title id="title">{escape(title)}</title><desc id="desc">{escape(subtitle)}</desc>',
                      '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#52646b"/></marker></defs>',
                      '<style>text{font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;fill:#18343b} .small{fill:#52646b}</style>',
                      f'<rect width="640" height="{height}" rx="20" fill="#f8faf9"/>']
        self.text(28, 42, title, 27, weight=700)
        self.text(28, 76, subtitle, 18, cls='small')

    def text(self, x, y, text, size=22, anchor='start', weight=400, cls=''):
        self.parts.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" class="{cls}">{escape(str(text))}</text>')

    def rect(self, x, y, w, h, fill=TEAL, stroke='#c5d5d4'):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="{stroke}"/>')

    def box(self, x, y, w, h, title, detail='', fill=TEAL):
        self.rect(x, y, w, h, fill)
        self.text(x+w/2, y+(h/2+7 if not detail else 31), title, 23, 'middle', 700)
        if detail:
            for i, line in enumerate(detail.split('|')):
                self.text(x+w/2, y+59+i*27, line, 20, 'middle')

    def arrow(self, points, dashed=False):
        p=' '.join(f'{x},{y}' for x,y in points)
        dash=' stroke-dasharray="7 5"' if dashed else ''
        self.parts.append(f'<polyline points="{p}" fill="none" stroke="{MUTED}" stroke-width="2.5" stroke-linejoin="round" marker-end="url(#arrow)"{dash}/>')

    def note(self, y, *lines):
        for i,line in enumerate(lines): self.text(28,y+i*27,line,19,cls='small')

    def save(self):
        (OUT/(self.name+'.svg')).write_text('\n'.join(self.parts+['</svg>']))


# 1. Autoregressive generation: the selected token becomes the next input.
d=Diagram('next-token','문장은 다음 토큰을 고르며 자란다','자기회귀 텍스트 생성의 핵심 흐름',690)
for y,title,detail,fill in [(110,'현재 입력','사용자 입력 + 지금까지 생성한 토큰',BLUE),(232,'모델 계산','문맥을 반영한 다음 토큰 확률',TEAL),(354,'다음 토큰 선택','후보 분포에서 하나를 선택',GOLD),(476,'입력 뒤에 토큰 추가','종료 조건이면 멈추고, 아니면 반복',BLUE)]:
    d.box(74,y,492,90,title,detail,fill)
for y in [200,322,444]: d.arrow([(320,y),(320,y+32)])
d.arrow([(566,521),(603,521),(603,155),(566,155)])
d.note(610,'토큰은 단어와 항상 일치하지 않는다.','한 번에 완성된 문장을 꺼내는 과정이 아니다.')
d.save()

# 2. A probability chart, not a fabricated benchmark.
d=Diagram('sampling','Top-k와 Top-p는 무엇을 남길까?','가상 다음 토큰 분포 · 실제 모델 측정값 아님',650)
for i,(label,p) in enumerate([('좋다',.50),('덥다',.25),('흐리다',.15),('춥다',.10)]):
    y=120+i*65
    d.text(30,y+28,label)
    d.rect(115,y,400*p,40,TEAL)
    d.text(125+400*p,y+28,f'{p:.0%}')
d.text(115,398,'막대 길이 = 후보의 선택 확률',19,cls='small')
d.box(28,430,280,105,'Top-k = 2','좋다 · 덥다|상위 2개를 남김',BLUE)
d.box(332,430,280,105,'Top-p = 0.8','좋다 · 덥다 · 흐리다|누적 90%에서 80% 도달',GOLD)
d.note(572,'남은 후보의 확률을 다시 정규화해 선택한다.','Temperature는 후보 확률의 집중도를 바꾼다.','낮은 Temperature가 사실 정확성을 보장하지는 않는다.')
d.save()

# 3. Turn a vague request into actionable instructions.
d=Diagram('prompt-anatomy','요청을 네 가지 정보로 구체화하기','예시 과제: 회의록에서 후속 업무 추출',650)
d.box(28,108,584,65,'모호한 요청: “회의록 정리해 줘”',fill=RED)
d.arrow([(320,173),(320,206)])
for y,title,detail in [(210,'역할 · 대상','팀에 공유할 업무 요약을 작성한다'),(300,'작업 · 자료','아래 회의록에서 후속 업무를 추출한다'),(390,'제약 · 불확실성','담당자·기한이 없으면 “미정”으로 표시한다'),(480,'출력 형식','업무 / 담당자 / 기한 순서의 표로 작성한다')]:
    d.box(28,y,584,78,title,detail,BLUE if y in [210,390] else TEAL)
d.note(601,'구체적인 지시도 결과 검증을 대신하지는 않는다.')
d.save()

# 4. Few-shot examples are context, not weight updates.
d=Diagram('few-shot','예제는 모델에 어떤 패턴을 보여줄까?','같은 분류 과제에 예제를 추가하는 방식',630)
d.box(28,110,280,110,'Zero-shot','지시 + 새 입력|“배송이 빨라요” → ?',BLUE)
d.box(332,110,280,110,'Few-shot','지시 + 예제 + 새 입력|같은 분류 규칙을 보여 줌',TEAL)
d.arrow([(472,220),(472,250)])
d.box(28,258,584,170,'프롬프트 안의 예제','“정말 만족해요” → 긍정|“제품이 깨졌어요” → 부정|“아직 사용 전이에요” → 중립',TEAL)
d.arrow([(320,428),(320,460)])
d.box(28,468,584,76,'새 입력에 패턴 적용','“배송이 빨라요” → 긍정 (예시 응답)',GOLD)
d.note(583,'예제를 입력에 넣는 것이며, 모델 가중치를 학습시키지 않는다.')
d.save()

# 5. Separate offline indexing from query-time retrieval.
d=Diagram('rag-pipeline','RAG: 문서 준비와 질문 처리는 다르다','벡터 검색을 사용하는 기본 구성 예시',770)
d.text(28,120,'미리 준비 · 문서가 바뀌면 갱신',22,weight=700)
for x,title,detail in [(28,'문서 분할','검색 단위로 나눔'),(238,'임베딩','벡터로 변환'),(448,'인덱스','원문·벡터 연결')]:d.box(x,141,164,88,title,detail,BLUE)
d.arrow([(192,185),(236,185)]);d.arrow([(402,185),(446,185)])
d.text(28,282,'질문이 들어올 때',22,weight=700)
d.box(28,307,245,90,'질문 임베딩','같은 임베딩 공간',TEAL)
d.box(367,307,245,90,'관련 문서 검색','질문 벡터로 후보 탐색',TEAL)
d.arrow([(273,352),(365,352)])
d.arrow([(530,229),(530,305)])
d.box(90,442,460,90,'컨텍스트 구성','질문 + 지시 + 검색된 원문',GOLD)
d.arrow([(490,397),(490,419),(320,419),(320,440)])
d.box(90,578,460,90,'LLM 답변 생성','제공된 근거를 바탕으로 응답',BLUE)
d.arrow([(320,532),(320,576)])
d.note(711,'검색 결과는 모델 입력에 추가된다.','이 과정 자체가 모델 가중치를 바꾸지는 않는다.')
d.save()

# 6. Context selection is not a universal fixed ratio.
d=Diagram('context-selection','컨텍스트는 수집보다 선별이 중요하다','한 번의 모델 호출에 필요한 정보 구성',640)
d.box(28,110,584,110,'정보 후보','시스템 지시 · 도구 정의 · 대화 이력|검색 문서 · 도구 결과 · 예제',BLUE)
d.arrow([(320,220),(320,254)])
d.box(28,262,584,110,'선별 · 압축 · 갱신','관련 근거 선택 / 긴 이력 요약|중복 제거 / 오래된 상태 교체',GOLD)
d.arrow([(320,372),(320,406)])
d.box(28,414,584,110,'이번 호출의 입력 컨텍스트','현재 목표와 필요한 근거를 함께 전달|모델 한도에 맞춰 생성 여유도 고려',TEAL)
d.note(566,'다음 호출에서는 새 도구 결과와 상태를 반영한다.','구성 비율과 토큰 한도는 모델·작업에 따라 달라진다.')
d.save()

# 7. Responsibility boundary in function calling.
d=Diagram('function-calling','모델은 호출을 제안하고, 런타임이 실행한다','Function Calling의 역할 분담',720)
d.box(28,110,280,65,'모델 (LLM)',fill=BLUE)
d.box(332,110,280,65,'런타임 · 도구',fill=TEAL)
for y,left,right in [(221,'함수명·인자 출력','인자·권한 검증'),(372,'실행 결과 수신','허용된 도구 실행'),(523,'해석 후 응답·재호출','결과·오류 반환')]:
    d.box(28,y,280,76,left,fill=BLUE);d.box(332,y,280,76,right,fill=TEAL)
d.arrow([(308,259),(330,259)])
d.arrow([(472,297),(472,370)])
d.arrow([(472,448),(472,521)])
d.arrow([(332,560),(320,560),(320,410),(310,410)])
d.arrow([(168,448),(168,521)])
d.note(654,'모델이 출력한 호출을 그대로 신뢰하지 않는다.','실행 전 검증·권한 통제는 애플리케이션의 책임이다.')
d.save()

# 8. A bounded action-observation loop, with an explicit stop path.
d=Diagram('agent-loop','에이전트는 관찰한 결과로 다음 행동을 정한다','ReAct 패턴의 제어 흐름을 단순화한 그림',750)
d.box(95,110,450,70,'목표와 현재 상태 확인',fill=BLUE)
d.box(95,220,450,85,'다음 행동 판단','어떤 정보·도구가 필요한가?',TEAL)
d.box(95,350,450,85,'도구 실행','런타임에서 호출 수행',GOLD)
d.box(95,480,450,85,'결과 관찰 · 상태 갱신','목표 충족 여부와 실행 한도 확인',TEAL)
for a,b in [(180,218),(305,348),(435,478)]:d.arrow([(320,a),(320,b)])
d.arrow([(545,522),(594,522),(594,263),(547,263)])
d.text(573,409,'계속',18,'middle')
d.arrow([(320,565),(320,601)])
d.box(95,610,450,65,'완료 / 중단 / 사람에게 인계',fill=BLUE)
d.note(713,'실행 횟수·시간·비용 한도와 실패 시 종료 조건도 필요하다.')
d.save()

# 9. Same final answer can hide a problematic execution path.
d=Diagram('evaluation-scope','답이 맞아도 실행 과정에 문제가 있을 수 있다','가상 주문 조회 사례 · 평가 관점 비교',650)
d.box(28,110,584,70,'요청: 내 주문의 배송 상태를 알려 줘',fill=BLUE)
d.box(28,220,280,150,'경로 A','내 주문만 조회|필요한 도구 1회|허용된 데이터만 사용',TEAL)
d.box(332,220,280,150,'경로 B','전체 고객 주문 조회|불필요한 반복 호출|과도한 데이터 접근',RED)
d.arrow([(320,180),(320,197),(168,197),(168,218)])
d.arrow([(320,197),(472,197),(472,218)])
d.arrow([(168,370),(168,403),(320,403),(320,434)])
d.arrow([(472,370),(472,403),(320,403)])
d.box(28,442,584,70,'같은 답변: “현재 배송 중입니다”',fill=GOLD)
d.note(554,'결과 평가 → 답변의 정확성·완전성','과정 평가 → 권한 준수·비용·오류 복구','정해진 도구 호출 순서와의 일치만으로 채점하지 않는다.')
d.save()

# 10. Control must precede side effects, not just filter the final response.
d=Diagram('guardrail-layers','가드레일은 실행 전에도 필요하다','허용된 요청의 흐름 · 위험하면 각 지점에서 중단',770)
rows=[('외부 입력·검색 문서','출처와 신뢰 수준을 구분',BLUE),('입력 검사','민감정보·공격 징후·업무 범위 확인',TEAL),('모델의 행동 제안','도구명과 인자 생성',BLUE),('실행 전 권한 검사','최소 권한 / 위험 작업은 사람 승인',GOLD),('도구 실행 → 결과·응답 검사','유출·형식·근거를 점검한 후 전달',TEAL)]
for i,(title,detail,fill) in enumerate(rows):
    y=108+i*116;d.box(45,y,550,86,title,detail,fill)
    if i<4:d.arrow([(320,y+86),(320,y+114)])
d.note(724,'최종 답변을 가려도 이미 실행된 송금·삭제는 되돌릴 수 없다.')
d.save()

# 11. Review with acceptance conditions, rather than endless revisions.
d=Diagram('aind-review-loop','요청 → 검토 → 보완의 협업 사이클','완료 기준을 먼저 정하고 결과를 확인한다',670)
d.box(65,110,510,90,'요청 (Prompt)','목표·배경·제약·완료 기준 제공',BLUE)
d.box(65,240,510,90,'AI 초안 생성','설계·코드·테스트 등 작업 수행',TEAL)
d.box(65,370,510,90,'검토 (Review)','요구사항·동작·보안·테스트 확인',GOLD)
d.box(65,500,510,90,'보완 (Refine) 또는 완료','미달: 근거와 수정 조건을 구체화',BLUE)
for y in [200,330,460]:d.arrow([(320,y),(320,y+38)])
d.arrow([(575,545),(607,545),(607,155),(577,155)])
d.note(630,'기준 충족 시 종료한다. 반복 자체가 품질 향상을 보장하지 않는다.')
d.save()

# 12. Parallel responsibilities throughout development.
d=Diagram('aind-lifecycle','개발 전주기에서 AI와 사람의 역할','AI의 제안을 사람이 검토하고 결정한다',720)
d.text(177,120,'AI가 돕는 일',23,'middle',700)
d.text(463,120,'사람이 맡는 판단',23,'middle',700)
rows=[('요구사항','누락·예외 후보 찾기','범위·업무 규칙 확정'),('설계','구조·대안 제안','제약·트레이드오프 판단'),('구현','코드 생성·수정','변경 내용 검토'),('검증','테스트 초안 작성','기준 확인·결과 검증')]
for i,(stage,ai,human) in enumerate(rows):
    y=143+i*128
    d.text(28,y+20,stage,21,weight=700)
    d.box(28,y+35,280,60,ai,fill=TEAL)
    d.box(332,y+35,280,60,human,fill=BLUE)
    d.arrow([(308,y+65),(330,y+65)])
d.note(686,'필요하면 이전 단계의 요구사항·설계로 돌아가 수정한다.')
d.save()

# 13. Conceptual layers, not a maturity/time graph.
d=Diagram('dx-ax-rx','DX·AX·RX를 층으로 이해하기','시간 순서나 성숙도 점수를 나타내는 그래프가 아님',620)
d.box(95,110,450,110,'RX · 행동','화면에서 작업 수행|물리 세계에서 이동·조작',GOLD)
d.box(60,249,520,110,'AX · 지능','디지털 정보를 바탕으로|인식·예측·생성·판단',TEAL)
d.box(28,388,584,110,'DX · 디지털 기반','문서·업무·현장 정보를|데이터와 시스템으로 연결',BLUE)
d.arrow([(320,388),(320,361)])
d.arrow([(320,249),(320,222)])
d.note(543,'아래 기반 위에 지능과 행동 능력을 더하는 관점이다.','세 영역은 함께 운영되고 개선될 수 있다.')
d.save()

# 14. Simplified VLA control loop; robot state varies by model.
d=Diagram('vla-loop','VLA: 관찰과 지시를 로봇 행동으로','개념 흐름 · 모델·로봇에 따라 구체 구성은 다름',750)
d.box(28,110,280,100,'시각 관찰','카메라 속 컵·접시',BLUE)
d.box(332,110,280,100,'언어 지시','“컵을 접시에 놓아”',GOLD)
d.arrow([(168,210),(168,246),(320,246),(320,275)])
d.arrow([(472,210),(472,246),(320,246)])
d.box(95,283,450,90,'VLA 모델','관찰·지시를 바탕으로 행동 출력',TEAL)
d.arrow([(320,373),(320,405)])
d.box(95,413,450,90,'제어·안전 계층','행동을 실행 가능한 명령으로 적용',GOLD)
d.arrow([(320,503),(320,535)])
d.box(95,543,450,90,'로봇 동작 → 환경 변화','컵을 잡고 옮김 → 다시 관찰',BLUE)
d.arrow([(95,588),(12,588),(12,160),(26,160)])
d.note(680,'일부 모델은 관절 상태 등 추가 입력도 사용한다.','모델 출력과 실제 하드웨어 제어 사이의 검증이 필요하다.')
d.save()

print(f'Generated {len(list(OUT.glob("*.svg")))} diagrams in {OUT}')
