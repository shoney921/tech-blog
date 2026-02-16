---
title: "멀티 에이전트 오케스트레이션부터 MCP, 그리고 실전 사례까지"
date: 2026-02-16T12:30:00
---

# 멀티 에이전트 오케스트레이션부터 MCP, 그리고 실전 사례까지

에이전트 하나로 모든 걸 해결하던 시대는 사실상 끝났다. 복잡한 업무를 LLM에 맡기려면 여러 에이전트가 역할을 나눠 협업하는 구조가 필요하고, 외부 도구와의 연결도 표준화되어야 한다. 이 글에서는 LangGraph의 슈퍼바이저 패턴으로 에이전트를 오케스트레이션하는 방법, MCP(Model Context Protocol)를 통한 도구 통합, LangSmith로 운영 중인 에이전트를 들여다보는 방법, 그리고 실제로 이걸 프로덕션에 올린 회사들의 이야기를 다뤄본다.

솔직히 나도 처음에 "에이전트 여러 개를 동시에 돌린다"는 개념이 와닿지 않았다. 그냥 프롬프트 잘 쓰면 되는 거 아닌가 싶었는데, 실제로 복잡한 워크플로를 만들어보면 한 에이전트가 모든 컨텍스트를 감당하는 게 얼마나 비효율적인지 금방 체감하게 된다.

## 슈퍼바이저 패턴: 누가 지휘할 것인가

멀티 에이전트 시스템에서 가장 많이 쓰이는 패턴이 슈퍼바이저(Supervisor) 패턴이다. 구조는 직관적이다. 하나의 슈퍼바이저 에이전트가 여러 워커 에이전트에게 작업을 분배하고, 결과를 수집해서 최종 응답을 만든다.

세 개의 레이어로 나눠서 생각하면 이해가 쉽다.

- **Planner Layer** -- 슈퍼바이저가 사용자 요청을 분석하고 어떤 에이전트에게 위임할지 결정한다
- **Agents Layer** -- 각자 전문 영역을 가진 워커 에이전트들이 실제 작업을 수행한다
- **Tooling Layer** -- 에이전트들이 공유하거나 개별적으로 사용하는 도구 모음

이 외에도 계층형(Hierarchical) 패턴이나 P2P(Peer-to-Peer) 패턴이 있다. 계층형은 슈퍼바이저 아래에 또 다른 슈퍼바이저를 두는 방식이고, P2P는 에이전트끼리 직접 메시지를 주고받는 구조다. 내 경험상 대부분의 경우 슈퍼바이저 패턴으로 충분하고, 정말 복잡한 도메인에서만 계층형이 필요해지는 것 같다.

### LangGraph의 Command 클래스

LangGraph에서 멀티 에이전트 오케스트레이션을 구현할 때 핵심이 되는 것이 `Command` 클래스다. 기존에는 조건부 엣지(conditional edge)로 라우팅을 처리했는데, Command는 **상태 업데이트와 라우팅을 하나의 객체로 묶어서** 반환할 수 있게 해준다.

```python
from langgraph.types import Command

def supervisor_node(state):
    # LLM이 다음에 어떤 에이전트를 호출할지 결정
    response = llm.invoke(state["messages"])
    next_agent = parse_routing(response)

    return Command(
        goto=next_agent,        # 다음 노드 지정
        update={
            "messages": [response],
            "current_task": "검색 수행"
        }
    )
```

`Command`의 `goto` 파라미터로 다음에 실행할 노드를 지정하고, `update`로 그래프 상태를 동시에 갱신한다. 이게 왜 좋으냐면, 노드 내부에서 "내가 어디로 갈지"와 "상태를 어떻게 바꿀지"를 한 번에 선언할 수 있어서 코드가 훨씬 명확해진다.

타입 힌트도 깔끔하게 걸 수 있다.

```python
def supervisor_node(state) -> Command[Literal["researcher", "coder", "__end__"]]:
    ...
```

이렇게 하면 슈퍼바이저가 갈 수 있는 목적지가 `researcher`, `coder`, 또는 종료(`__end__`)뿐이라는 걸 타입 레벨에서 보장한다. 그래프를 시각화할 때도 이 정보가 반영되니까 디버깅이 한결 편해진다.

### 에이전트 노드 구성

실제로 그래프를 구성할 때는 각 에이전트를 노드로 등록하고, 슈퍼바이저를 엔트리 포인트로 설정한다.

```python
from langgraph.graph import StateGraph

builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("researcher", research_agent)
builder.add_node("coder", coding_agent)
builder.set_entry_point("supervisor")

# 각 워커 에이전트는 작업 완료 후 슈퍼바이저로 복귀
builder.add_edge("researcher", "supervisor")
builder.add_edge("coder", "supervisor")

graph = builder.compile()
```

워커 에이전트가 작업을 끝내면 다시 슈퍼바이저로 돌아오고, 슈퍼바이저는 결과를 보고 다음 단계를 결정하거나 최종 응답을 반환한다. 이 루프가 멀티 에이전트 오케스트레이션의 핵심이다.

한 가지 팁이 있다면, 워커 에이전트 안에서도 도구 호출을 포함한 자체 루프를 돌릴 수 있다는 것이다. 즉, 워커 자체가 하나의 서브 그래프가 될 수 있다. 이걸 잘 활용하면 계층형 아키텍처를 자연스럽게 만들 수 있다.

## MCP: 에이전트의 도구 연결을 표준화하다

여기서 잠깐 방향을 틀어서 MCP(Model Context Protocol) 이야기를 해보자. 에이전트가 아무리 똑똑해도 외부 도구를 못 쓰면 반쪽짜리다. 문제는 도구마다 연결 방식이 다 다르다는 것이었는데, MCP가 이걸 해결하려고 등장했다.

MCP는 2024년 11월 Anthropic이 발표한 오픈 프로토콜로, LLM 애플리케이션과 외부 데이터 소스/도구 간의 연결을 표준화한다. 비유하자면 USB-C 같은 거다. 예전에는 각 기기마다 다른 충전 케이블이 필요했듯이, 각 도구마다 별도의 어댑터를 만들어야 했는데, MCP가 하나의 표준 인터페이스를 제공한다.

### 클라이언트-서버 구조

MCP는 JSON-RPC 2.0 기반의 클라이언트-서버 아키텍처다.

- **MCP 서버**: 특정 도구나 데이터 소스를 노출하는 역할. GitHub API, 데이터베이스, 파일 시스템 등 무엇이든 MCP 서버로 감쌀 수 있다
- **MCP 클라이언트**: AI 애플리케이션 내부에서 MCP 서버에 연결하여 도구를 발견하고 호출하는 역할
- **호스트**: 클라이언트를 실행하는 AI 앱 자체 (Claude Desktop, IDE 플러그인 등)

MCP 서버가 제공하는 세 가지 핵심 프리미티브가 있다: **도구(Tools)**, **리소스(Resources)**, **프롬프트(Prompts)**. 도구는 실행 가능한 함수, 리소스는 읽기 전용 데이터, 프롬프트는 미리 정의된 템플릿이다.

2025년 12월에는 Anthropic이 MCP를 Linux Foundation 산하의 Agentic AI Foundation(AAIF)에 기부했고, OpenAI, Google DeepMind, Microsoft도 공식적으로 채택했다. 2025년 말 기준으로 커뮤니티에서 만든 MCP 서버가 16,000개를 넘었다고 하니, 생태계가 꽤 빠르게 커지고 있다.

### LangChain에서 MCP 도구 사용하기

LangChain 생태계에서는 `langchain-mcp-adapters` 패키지를 통해 MCP 도구를 LangChain/LangGraph 호환 도구로 변환할 수 있다. 2025년 3월에 공개된 이 패키지는 MCP 서버에 연결해서 사용 가능한 도구를 자동으로 발견하고, LangChain 도구 객체로 변환해준다.

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

async with MultiServerMCPClient(
    {
        "filesystem": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
        },
        "github": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {"GITHUB_TOKEN": "..."},
        },
    }
) as client:
    tools = client.get_tools()  # MCP 도구 → LangChain 도구로 자동 변환
    agent = create_react_agent(llm, tools)
```

여러 MCP 서버에 동시에 연결하고, 각 서버의 도구를 한꺼번에 가져올 수 있다. 별도의 어댑터 코드를 작성할 필요가 없다는 게 핵심이다. 이건 좀 의견이 갈릴 수 있는데, 나는 MCP가 장기적으로 대부분의 커스텀 도구 통합 코드를 대체할 거라고 본다.

## LangSmith로 에이전트 들여다보기

에이전트를 만드는 것보다 운영하는 게 더 어렵다는 말에 동의한다. 멀티 에이전트 시스템은 특히 그렇다. 어느 에이전트에서 문제가 생겼는지, 토큰은 어디서 많이 쓰이는지, 지연 시간 병목은 어디인지 파악하기가 쉽지 않다.

LangSmith는 LangChain에서 만든 관측성(Observability) 플랫폼으로, 에이전트의 모든 LLM 호출, 도구 실행, 중간 추론 단계를 트레이스로 기록한다. LangChain이나 LangGraph를 쓰고 있다면 환경 변수 하나만 설정하면 바로 트레이싱이 시작된다.

주로 보게 되는 지표들:

| 지표 | 설명 | 왜 중요한가 |
|------|------|-------------|
| Tokens (Input/Output) | LLM 호출당 사용된 토큰 수 | 비용 최적화의 핵심 |
| Latency (P50, P99) | 응답 시간 분포 | 사용자 경험에 직결 |
| Error Rate | 도구 호출 실패, LLM 오류 비율 | 안정성 모니터링 |

디버깅할 때 가장 유용한 건 트레이스 뷰다. 하나의 요청이 슈퍼바이저 → 워커A → 도구 호출 → 워커A 응답 → 슈퍼바이저 → 워커B → ... 이런 흐름으로 흘러가는 걸 시각적으로 볼 수 있다. 어디서 시간이 오래 걸렸는지, 어떤 프롬프트가 들어갔는지 전부 확인 가능하다.

최근에는 **Insights Agent** 기능도 추가되어서, 프로덕션 트래픽 패턴을 AI가 자동으로 분석해주기도 한다. 멀티턴 평가(Multi-turn Evals)도 지원하기 시작해서 대화형 에이전트의 품질을 체계적으로 측정할 수 있게 되었다.

:::tip LangSmith 평가의 두 가지 축
**오프라인 평가**: 미리 준비한 데이터셋으로 벤치마킹. 회귀 테스트에 유용하다.
**온라인 평가**: 실제 프로덕션 트래픽을 실시간으로 평가. 배포 후 품질 모니터링에 적합하다.
:::

## 실전에서 증명된 사례들

이론은 이 정도로 하고, 실제로 이런 기술을 프로덕션에 올린 회사들의 이야기가 더 흥미롭다. 성공 사례도 있고, 예상치 못한 반전도 있다.

### Uber: 21,000시간을 아낀 코드 마이그레이션 에이전트

Uber의 개발자 플랫폼 팀은 5,000명의 엔지니어가 수억 줄의 코드베이스에서 작업하는 환경을 지원해야 했다. 이들은 LangGraph를 기반으로 여러 AI 도구를 만들었는데, 대표적인 것이 Validator(코드 위반 감지)와 AutoCover(자동 테스트 생성)다.

특히 인상적인 건 아키텍처다. 중앙 에이전트가 LLM 기반 서브 에이전트와 정적 분석 도구를 동시에 조율하는 하이브리드 방식을 택했다. 자주 발생하는 수정 사항은 미리 계산해두고, 동적 평가가 필요한 부분에서만 LLM을 호출한다. 이 방식으로 자동 테스트 생성만으로 **약 21,000 개발자 시간을 절약**했다고 한다.

Uber는 아예 내부적으로 `LangEffect`라는 LangGraph 위의 래퍼 프레임워크를 만들었다. 잘 설계된 추상화 덕분에 보안 팀 같은 비-AI 팀도 기저의 에이전트 구현을 이해하지 않고도 규칙을 기여할 수 있었다는 점이 인상적이다.

### AppFolio: 부동산 관리의 AI 코파일럿

AppFolio는 부동산 관리 소프트웨어 회사인데, Realm-X라는 AI 코파일럿을 LangChain + LangGraph + LangSmith 조합으로 만들었다. 처음에는 LangChain만 썼다가, 워크플로가 복잡해지면서 LangGraph로 전환했다고 한다. 나도 비슷한 경험을 한 적이 있어서 공감이 갔다.

LangGraph의 병렬 실행 기능을 잘 활용해서, 사용자 질문을 처리하면서 동시에 폴백 응답과 도움말 페이지 검색을 병렬로 돌린다. 이렇게 하면 레이턴시를 최소화하면서도 풍부한 응답을 제공할 수 있다. 결과적으로 **부동산 관리자들의 주당 10시간 이상 절약**, **응답 정확도 2배 향상**을 달성했다.

프로덕션에서는 LangSmith로 실시간 피드백 차트를 모니터링하면서 에러율, 비용, 레이턴시를 추적한다고 한다.

### LinkedIn: 채용 담당자의 생산성을 70% 끌어올린 Hiring Assistant

LinkedIn의 Hiring Assistant는 채용 프로세스에서 관리 업무를 자동화하는 AI 에이전트다. 채용 공고 작성, 후보자 식별 및 순위 매기기, 아웃리치, 사전 검증까지 처리한다.

보안 솔루션 기업 Certis의 사례가 구체적인데, 후보자 숏리스트 작성이 며칠에서 몇 분으로 단축되었고, 소싱 시간이 거의 1/3로 줄었다. 채용 담당자 생산성은 **60~70% 향상**되었다고 한다.

이건 단순히 효율 도구가 아니라, 채용 담당자가 행정 업무에서 벗어나 후보자와의 실질적인 대화에 더 집중할 수 있게 해준다는 점에서 의미가 있다.

### Elastic: 검색 AI 에이전트 빌더

Elastic은 Elasticsearch 위에 AI Agent Builder라는 새로운 레이어를 구축했다. 하이브리드 검색을 활용해 에이전트에게 필요한 컨텍스트를 제공하는 구조다. 특정 비즈니스 도메인의 전문가 역할을 하는 맞춤형 에이전트를 만들 수 있다.

예를 들어, 금융 매니저가 "최근 포트폴리오 리스크 요인이 뭐야?"라고 물으면, 에이전트가 뉴스 피드와 포트폴리오 데이터를 교차 검색해서 답변한다. 수동으로 여러 대시보드를 뒤지던 방식과는 차원이 다르다. 2025년에는 SupportLogic에서 'Best Use of AI for Assisted Support' 상도 수상했다.

### Klarna: 빛과 그림자

Klarna 사례는 좀 복잡하다. OpenAI 기반 AI 고객 서비스 에이전트를 도입해서 초기에는 놀라운 수치를 기록했다. 월 130만 건의 고객 채팅을 처리하고, 853명의 풀타임 상담원 업무를 대체했으며, 해결 시간은 80% 단축, 고객 만족도는 47% 향상, 연간 6천만 달러 절감. 수치만 보면 대성공이다.

그런데 반전이 있다. 2025년에 CEO Sebastian Siemiatkowski가 인정한 바에 따르면, **비용 절감에 너무 치중한 나머지 품질이 떨어졌다**는 것이다. 결국 Klarna는 다시 인간 상담원을 재고용하기 시작했다. AI 역량은 계속 확대하면서도 인간-AI 하이브리드 모델로 전환한 셈이다.

이 사례가 주는 교훈은 명확하다. AI 에이전트로 비용을 절감할 수 있지만, 품질과 비용 사이의 균형은 여전히 사람이 설계해야 한다는 것. 자동화 비율을 끝없이 올리는 게 능사가 아니다.

## 아직 고민 중인 것들

이 글을 쓰면서 몇 가지 답이 안 나온 것들이 있다.

멀티 에이전트 시스템의 적정 복잡도는 어디까지인가? 에이전트를 5개, 10개 늘리면 정말 성능이 비례해서 올라가는가, 아니면 어느 시점부터 오케스트레이션 오버헤드가 더 커지는가? Uber 같은 대규모 사례를 보면 효과가 분명하지만, 소규모 팀에서도 같은 패턴이 유효한지는 잘 모르겠다.

MCP 생태계가 16,000개 서버까지 커진 건 좋은데, 품질 관리는 어떻게 되고 있는 건지도 궁금하다. npm 패키지 생태계 초기와 비슷한 혼란기가 올 수도 있지 않을까.

Klarna 사례처럼, AI 에이전트의 도입 효과를 측정하는 기준 자체도 더 정교해져야 할 것 같다. 비용 절감과 응답 시간만 보면 대성공인데, 고객 만족도의 미묘한 하락은 나중에야 드러나니까.

결국 도구와 프레임워크는 계속 발전하고 있지만, "어디까지 자동화하고 어디에 사람을 남길 것인가"는 각 조직이 직접 답을 찾아야 하는 문제다.

---

**참고자료**

- [Command: A new tool for building multi-agent architectures in LangGraph](https://blog.langchain.com/command-a-new-tool-for-multi-agent-architectures-in-langgraph/)
- [LangChain MCP Adapters - GitHub](https://github.com/langchain-ai/langchain-mcp-adapters)
- [Uber: Building AI Developer Tools Using LangGraph](https://www.zenml.io/llmops-database/building-ai-developer-tools-using-langgraph-for-large-scale-software-development)
- [How AppFolio transformed property management workflows with Realm-X](https://www.blog.langchain.com/customers-appfolio/)
- [Klarna Customer Service: From AI-First to Human-Hybrid Balance](https://blog.promptlayer.com/klarna-customer-service-from-ai-first-to-human-hybrid-balance/)
