---
title: "LangGraph 입문 — 워크플로와 에이전트, 뭐가 다른 걸까"
date: 2026-02-16T12:00:00
---

# LangGraph 입문 — 워크플로와 에이전트, 뭐가 다른 걸까

LangGraph를 처음 접했을 때 솔직히 왜 필요한지 감이 안 왔다. LangChain이 있는데 왜 또 새로운 걸 배워야 하지? 그래프? 노드? 엣지? 갑자기 컴퓨터 과학 수업 같은 용어들이 쏟아지니까 진입 장벽이 꽤 높게 느껴졌다.

그런데 LLM 기반 앱을 만들다 보면 "이 단계에서 실패하면 다시 돌아가야 하는데..." 같은 상황이 반드시 온다. 단순한 체인(chain)으로는 한계가 있는 순간. LangGraph는 바로 그 지점에서 필요해진다.

---

## LangGraph가 뭔데

LangGraph는 LangChain 팀이 만든 **상태 기반(stateful) 워크플로 오케스트레이션 프레임워크**다. 핵심 아이디어는 간단하다. LLM 애플리케이션의 로직을 그래프(graph)로 표현하자는 것.

그래프라고 하면 거창해 보이지만, 결국 세 가지만 알면 된다.

- **State**: 그래프 전체에서 공유하는 데이터. 딕셔너리 같은 거라고 생각하면 된다.
- **Node**: 실제 작업을 수행하는 함수. State를 입력받아서 업데이트된 State를 반환한다.
- **Edge**: 노드 간의 연결. "A 다음에 B를 실행해라", 또는 "조건에 따라 B나 C로 가라"를 정의한다.

Google의 Pregel 시스템에서 영감을 받았다고 하는데, 핵심은 "슈퍼스텝(super-step)"이라는 개념이다. 같은 슈퍼스텝에 속한 노드들은 병렬로 실행되고, 순차적으로 실행되는 노드들은 별도의 슈퍼스텝에 배치된다. 처음에는 이게 뭔 소린가 싶었는데, 실제로 병렬 처리가 필요한 워크플로를 짜보면 꽤 직관적으로 느껴진다.

가장 기본적인 그래프 구성 코드를 보자.

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, START, END

# 1. 상태 정의
class State(TypedDict):
    question: str
    answer: str

# 2. 노드 함수 정의
def think(state: State) -> dict:
    # LLM 호출 등의 로직
    return {"answer": f"{state['question']}에 대한 답변"}

# 3. 그래프 구성
graph = StateGraph(State)
graph.add_node("think", think)
graph.add_edge(START, "think")
graph.add_edge("think", END)

# 4. 컴파일 & 실행
app = graph.compile()
result = app.invoke({"question": "LangGraph가 뭐야?"})
```

`StateGraph`를 만들고, 노드를 추가하고, 엣지로 연결하고, 컴파일한다. 이 네 단계가 LangGraph의 전부다. 물론 여기에 조건부 엣지나 병렬 실행 같은 것들이 붙으면서 복잡해지긴 하지만, 뼈대는 항상 이 구조다.

---

## LangChain이랑 뭐가 다른 건데

이 질문을 정말 많이 받는다. 나도 처음에 헷갈렸고.

짧게 말하면, LangChain은 **체인(chain)**, LangGraph는 **그래프(graph)**다. 체인은 기본적으로 DAG(Directed Acyclic Graph), 즉 방향은 있지만 순환(loop)이 없는 구조다. A에서 B로, B에서 C로. 되돌아가는 건 안 된다.

LangGraph는 순환을 허용한다. 에이전트가 도구를 호출하고, 결과를 보고, 다시 생각하고, 또 도구를 호출하는... 이런 루프가 가능하다. 이게 결정적인 차이다.

| | LangChain | LangGraph |
|---|---|---|
| 구조 | 체인 (DAG, 비순환) | 그래프 (순환 가능) |
| 상태 관리 | 체인 간 암묵적 전달 | 명시적 State 객체 |
| 적합한 용도 | RAG 파이프라인, 단순 챗봇 | 멀티스텝 에이전트, 복잡한 워크플로 |

그렇다고 둘 중 하나만 골라야 하는 건 아니다. 오히려 같이 쓰는 경우가 많다. LangChain의 프롬프트 템플릿이나 LLM 래퍼를 LangGraph 노드 안에서 사용하는 식이다. LangChain은 개별 작업 단위를 쉽게 만들어주고, LangGraph는 그 작업들을 복잡하게 엮어주는 역할이라고 보면 된다.

내 경험상 "LangChain으로 시작해서, 워크플로가 복잡해지면 LangGraph로 넘어가라"는 조언이 꽤 현실적이다. 처음부터 LangGraph를 쓰면 간단한 것도 오버엔지니어링하게 되는 경우가 있었다.

---

## 잠깐, 상태 관리 얘기를 좀 더 하자

LangGraph에서 State는 단순한 딕셔너리가 아니다. **리듀서(reducer)**라는 개념이 있는데, 이게 꽤 중요하다.

```python
from typing import Annotated
from operator import add
from langgraph.graph import MessagesState

class MyState(TypedDict):
    query: str                              # 덮어쓰기 (기본)
    results: Annotated[list[str], add]      # 리스트 누적
```

`query`는 새 값이 들어오면 그냥 덮어쓴다. 그런데 `results`에는 `Annotated[list[str], add]`라는 타입 힌트가 붙어 있다. 이 `add` 리듀서 덕분에 여러 노드가 `results`에 값을 추가하면 기존 리스트에 누적된다. 덮어쓰지 않고.

이게 왜 중요하냐면, 병렬로 실행되는 노드들이 같은 State 키를 동시에 업데이트할 때 충돌이 생기지 않도록 해준다. 노드 A가 `["결과1"]`을 반환하고 노드 B가 `["결과2"]`를 반환하면, 최종 State에는 `["결과1", "결과2"]`가 들어간다.

특히 메시지 기반 에이전트를 만들 때는 `add_messages` 리듀서를 자주 쓴다. 대화 히스토리를 관리하는 데 딱이다.

---

## 워크플로 — 예측 가능한 흐름을 짜다

여기서부터 본론이다. Anthropic의 "Building Effective Agents" 글에서 잘 정리한 구분이 있는데, **워크플로(workflow)**는 "LLM과 도구가 미리 정의된 코드 경로를 통해 오케스트레이션되는 시스템"이다.

핵심은 **미리 정의된 코드 경로**라는 부분. 개발자가 "이 순서로, 이 조건에 따라 실행해라"고 명시적으로 짜놓은 흐름이다. LLM이 다음에 뭘 할지 스스로 결정하는 게 아니라, 코드가 결정한다.

워크플로에도 여러 패턴이 있다.

### 순차 실행

가장 단순한 패턴. A 다음에 B, B 다음에 C. 예를 들어 문서를 받아서 요약하고, 요약 결과를 번역하는 파이프라인이 이런 구조다.

### 병렬 실행

하나의 노드에서 여러 노드로 동시에 엣지를 연결하면 병렬 실행이 된다. 문서를 받아서 감성 분석, 키워드 추출, 요약을 동시에 돌리는 식이다. LangGraph에서는 한 노드의 outgoing edge가 여러 개면 자동으로 병렬 처리한다.

### 조건부 분기

이게 워크플로에서 가장 유용한 패턴인 것 같다. 실제 코드로 보자.

```python
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    query: str
    category: str
    response: str

def classify(state: State) -> dict:
    # LLM으로 질문 분류
    category = llm.invoke(f"분류해줘: {state['query']}")
    return {"category": category}

def handle_tech(state: State) -> dict:
    return {"response": "기술 질문 처리..."}

def handle_general(state: State) -> dict:
    return {"response": "일반 질문 처리..."}

# 라우팅 함수
def route(state: State) -> str:
    if state["category"] == "tech":
        return "handle_tech"
    return "handle_general"

graph = StateGraph(State)
graph.add_node("classify", classify)
graph.add_node("handle_tech", handle_tech)
graph.add_node("handle_general", handle_general)

graph.add_edge(START, "classify")
graph.add_conditional_edges("classify", route)  # 조건부 분기
graph.add_edge("handle_tech", END)
graph.add_edge("handle_general", END)

app = graph.compile()
```

`add_conditional_edges`가 핵심이다. `route` 함수가 현재 State를 보고 다음에 어떤 노드로 갈지 결정한다. 교통 정리 같은 거다. 질문 유형에 따라 다른 처리 파이프라인으로 보내는 라우팅 패턴은 실무에서 정말 많이 쓰인다.

워크플로의 장점은 **예측 가능성**이다. 어떤 입력이 들어와도 흐름이 코드에 정의된 경로를 따르니까, 디버깅이 쉽고 비용도 예측할 수 있다. 반면 유연성은 떨어진다. 미리 생각하지 못한 상황에는 대응하기 어렵다.

---

## 에이전트 — LLM이 스스로 판단하게 놔두다

에이전트는 워크플로와 결정적으로 다른 점이 하나 있다. **LLM이 다음 행동을 스스로 결정한다**는 것.

Anthropic의 정의를 다시 빌리면, 에이전트는 "LLM이 자신의 프로세스와 도구 사용을 동적으로 지시하는 시스템"이다. 개발자가 흐름을 짜는 게 아니라, LLM에게 도구를 주고 "알아서 해봐"라고 맡기는 거다. 물론 완전히 방임하는 건 아니고, 도구의 종류와 종료 조건 같은 틀은 개발자가 정한다.

가장 대표적인 에이전트 패턴이 **ReAct(Reasoning + Acting)**다. 생각하고, 행동하고, 관찰하고, 다시 생각하는 루프.

```python
from typing import Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def call_model(state: AgentState) -> dict:
    # LLM에게 도구 목록과 함께 메시지 전달
    response = model.bind_tools(tools).invoke(state["messages"])
    return {"messages": [response]}

def call_tools(state: AgentState) -> dict:
    # 마지막 메시지의 tool_calls를 실행
    last_message = state["messages"][-1]
    results = []
    for tool_call in last_message.tool_calls:
        result = tool_map[tool_call["name"]].invoke(tool_call["args"])
        results.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))
    return {"messages": results}

# 계속할지 말지 결정하는 함수
def should_continue(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"    # 도구 호출이 있으면 계속
    return END            # 없으면 종료

graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tools", call_tools)

graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue)  # 루프의 핵심
graph.add_edge("tools", "agent")  # 도구 실행 후 다시 에이전트로

app = graph.compile()
```

이 코드에서 주목할 부분은 `"tools"` 노드에서 다시 `"agent"` 노드로 돌아가는 엣지다. 이게 루프다. LangChain의 체인에서는 불가능했던 구조가 LangGraph에서는 자연스럽게 표현된다.

동작 순서를 정리하면 이렇다.

1. `agent` 노드: LLM에게 메시지와 도구 목록을 주고 응답을 받는다
2. `should_continue`: LLM 응답에 도구 호출이 있는지 확인한다
3. 도구 호출이 있으면 → `tools` 노드에서 도구를 실행하고, 결과를 State에 추가한 뒤 다시 1번으로
4. 도구 호출이 없으면 → 종료

LLM이 "이 정보만으로는 부족하니까 검색 도구를 한 번 더 쓸게"라고 스스로 판단하는 거다. 몇 번 루프를 돌지, 어떤 도구를 쓸지는 LLM이 결정한다.

참고로 LangGraph는 `create_react_agent`라는 프리빌트 함수도 제공한다. 위의 코드를 직접 짤 필요 없이 한 줄로 ReAct 에이전트를 만들 수 있다. 하지만 내부 동작을 이해하려면 한 번쯤은 밑바닥부터 짜보는 걸 추천한다.

---

## 워크플로 vs 에이전트, 언제 뭘 써야 할까

솔직히 이건 좀 의견이 갈릴 수 있는 부분이다. 내 기준에서는 이렇게 구분한다.

**워크플로가 나은 경우:**
- 단계의 수와 순서를 미리 알 수 있을 때
- 비용과 지연 시간을 예측해야 할 때
- 실패 시 어디서 문제가 생겼는지 명확해야 할 때
- 예: 문서 요약 파이프라인, 정형화된 데이터 처리, 고객 문의 분류

**에이전트가 나은 경우:**
- 단계의 수와 순서를 미리 알 수 없을 때
- 다양한 도구를 상황에 따라 조합해야 할 때
- 복잡한 추론이 필요할 때
- 예: 코딩 어시스턴트, 리서치 에이전트, 복잡한 고객 응대

Anthropic이 강조하는 원칙이 있는데, 나도 이게 맞다고 생각한다. **가능한 한 가장 단순한 솔루션부터 시작하라.** 워크플로로 충분한 문제를 에이전트로 풀면 비용도 늘고 디버깅도 어려워진다. 에이전트는 LLM을 여러 번 호출하니까 토큰 비용이 빠르게 올라간다.

그리고 실제로는 둘을 섞어 쓰는 경우가 많다. 전체 흐름은 워크플로로 짜되, 특정 단계에서만 에이전트를 쓰는 하이브리드 방식. 이런 유연한 구성이 가능한 게 LangGraph의 강점이라고 생각한다.

---

## 아직 고민 중인 것들

LangGraph를 쓰면서 느낀 건, 러닝커브가 확실히 있다는 거다. State 설계를 잘못하면 나중에 고치기가 꽤 고통스럽다. 리듀서를 언제 쓰고 언제 안 쓸지, 노드 단위를 얼마나 잘게 쪼갈지... 이런 설계 판단이 경험이 없으면 쉽지 않다.

그리고 에이전트의 자율성을 어디까지 허용할 건지도 여전히 명확한 답이 없는 영역이다. 너무 풀어주면 예측 불가능하고 비용이 터지고, 너무 조이면 에이전트를 쓰는 의미가 없고. 이 균형은 아직도 프로젝트마다 시행착오를 겪으면서 찾아가는 중이다.

그래도 한 가지 확실한 건, LLM 애플리케이션이 점점 복잡해지는 흐름에서 LangGraph 같은 그래프 기반 오케스트레이션 도구는 필수에 가까워지고 있다는 점이다. 지금 당장은 안 쓰더라도, 기본 개념 정도는 알아두면 나중에 도움이 될 거다.

---

## 참고자료

- [LangGraph 공식 문서 — Workflows and Agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [LangGraph: How to create a ReAct agent from scratch](https://langchain-ai.github.io/langgraph/how-tos/react-agent-from-scratch/)
- [LangChain Blog — How to think about agent frameworks](https://blog.langchain.com/how-to-think-about-agent-frameworks/)
