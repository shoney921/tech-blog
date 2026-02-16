---
title: "LangChain 입문 — 설치부터 로컬 LLM 연동까지"
date: 2026-02-16T11:00:00
---

# LangChain 입문 — 설치부터 로컬 LLM 연동까지

솔직히 처음에 LangChain 문서를 열었을 때 좀 막막했다. Chain, Agent, Tool, Memory... 개념 하나하나는 이해가 되는데, 이것들이 어떻게 맞물리는지 감을 잡기까지 시간이 꽤 걸렸다. 그래서 이 글에서는 내가 실제로 LangChain을 처음 세팅하고 돌려보기까지의 과정을 정리해본다. OpenAI API부터 시작해서, 로컬에서 Ollama로 오픈소스 모델을 돌리고, 허깅 페이스 모델까지 연결하는 흐름이다.

---

## LangChain이 뭔데?

LangChain은 LLM 기반 애플리케이션을 만들기 위한 오픈소스 프레임워크다. 2022년에 등장했고, 지금은 AI 에이전트 개발의 사실상 표준 프레임워크 중 하나로 자리잡았다.

핵심 아이디어는 단순하다. LLM을 단독으로 쓰는 게 아니라, 프롬프트 템플릿, 외부 도구, 메모리, 데이터 검색 등을 **모듈로 조합**해서 더 복잡한 워크플로우를 만드는 것이다. 레고 블록처럼 필요한 조각을 끼워 맞추는 느낌이라고 보면 된다.

LangChain의 주요 구성요소를 간단히 정리하면 이렇다:

- **Models** — LLM과의 인터페이스. OpenAI, Ollama, HuggingFace 등 다양한 모델 프로바이더를 통일된 API로 사용
- **Prompts** — 프롬프트 템플릿을 정의하고 변수를 주입하는 구조
- **Chains** — 여러 단계를 순서대로 연결하는 파이프라인. 정해진 순서대로 실행된다
- **Agents** — Chain과 달리 LLM이 스스로 판단해서 어떤 도구를 쓸지, 어떤 순서로 실행할지 결정
- **Tools** — Agent가 사용할 수 있는 외부 기능들 (검색, 계산기, API 호출 등)
- **Memory** — 대화 히스토리를 저장하고 참조하는 구조
- **Retrievers** — 벡터 DB 등에서 관련 문서를 가져오는 RAG 관련 컴포넌트

Chain과 Agent의 차이를 좀 더 직관적으로 설명하면 — Chain은 공장의 컨베이어 벨트다. 입력이 들어오면 정해진 순서대로 처리되고 출력이 나온다. Agent는 비서에 더 가깝다. 상황을 보고, 어떤 행동을 취할지 스스로 판단하고, 필요하면 도구를 꺼내 쓰고, 결과를 보고 다시 생각한다.

참고로, 2025년부터 LangChain 팀은 복잡한 에이전트를 만들 때 LangGraph를 쓰는 것을 공식 권장하고 있다. LangGraph는 상태 기반의 그래프 구조로 에이전트를 만드는 프레임워크인데, 이 이야기는 다음 글에서 다루겠다. 이 글에서는 LangChain의 기본기에 집중한다.

---

## 환경 설정과 ChatOpenAI 활용법

### 설치

LangChain은 Python 3.9 이상이 필요하다. 패키지 구조가 좀 독특한데, 코어와 각 프로바이더별 통합 패키지가 분리되어 있다. 처음엔 이게 좀 헷갈렸다.

```bash
# 코어 패키지
pip install langchain

# OpenAI 통합 (ChatGPT 사용 시)
pip install langchain-openai

# Ollama 통합 (로컬 LLM 사용 시)
pip install langchain-ollama

# HuggingFace 통합
pip install langchain-huggingface
```

필요한 것만 골라서 설치하면 된다. 전부 설치할 필요는 없다. OpenAI API만 쓸 거면 `langchain`과 `langchain-openai`면 충분하다.

### OpenAI API 키 설정

OpenAI 모델을 쓰려면 API 키가 필요하다. [platform.openai.com](https://platform.openai.com)에서 발급받을 수 있다.

```python
import os
os.environ["OPENAI_API_KEY"] = "sk-..."
```

실제 프로젝트에서는 `.env` 파일과 `python-dotenv`를 쓰는 게 좋다. 코드에 API 키를 하드코딩하는 건 당연히 나쁜 습관이다.

### ChatOpenAI로 첫 대화

가장 기본적인 사용법부터 보자.

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# 모델 인스턴스 생성
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    max_tokens=1024,
)

# 메시지 리스트로 대화
messages = [
    SystemMessage(content="당신은 친절한 한국어 AI 비서입니다."),
    HumanMessage(content="LangChain을 한 문장으로 설명해줘."),
]

response = llm.invoke(messages)
print(response.content)
```

`invoke()`가 LangChain의 기본 호출 메서드다. 메시지 리스트를 넣으면 AI의 응답이 돌아온다. 간단하다.

### LCEL로 체인 만들기

LangChain에서 요즘 권장하는 체인 작성 방식은 **LCEL(LangChain Expression Language)**이다. 파이프(`|`) 연산자로 컴포넌트를 연결하는 방식인데, 처음 보면 좀 낯설 수 있지만 익숙해지면 꽤 직관적이다.

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 프롬프트 템플릿
prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 {role} 전문가입니다. 간결하게 답변하세요."),
    ("human", "{question}"),
])

# 모델
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 출력 파서
parser = StrOutputParser()

# LCEL 체인: 프롬프트 → 모델 → 파서
chain = prompt | llm | parser

# 실행
result = chain.invoke({
    "role": "파이썬 개발",
    "question": "리스트 컴프리헨션의 장점이 뭐야?"
})
print(result)
```

`prompt | llm | parser` — 이 한 줄이 핵심이다. 프롬프트 템플릿에 변수를 채우고, 그 결과를 LLM에 보내고, 응답을 문자열로 파싱하는 일련의 흐름을 파이프로 연결한다. 예전에는 `LLMChain` 같은 클래스를 써야 했는데, LCEL이 이를 완전히 대체했다.

---

## Ollama를 활용한 로컬 LLM

여기서부터가 내가 개인적으로 흥미를 많이 느낀 부분이다. OpenAI API는 편하지만, 매번 돈이 나가고, 데이터가 외부 서버로 나간다는 점이 신경 쓰인다. 특히 회사 내부 데이터를 다루는 프로젝트라면 로컬 LLM이 거의 필수다.

### Ollama가 뭔가

Ollama는 로컬에서 오픈소스 LLM을 쉽게 실행할 수 있게 해주는 도구다. 내부적으로는 `llama.cpp`를 기반으로 하고 있어서 성능이 준수하다. NVIDIA GPU(CUDA), Apple Silicon(Metal), AMD GPU(ROCm) 전부 지원한다. 내 경험상 M1 이상의 맥에서 7B~8B 모델 정도는 꽤 쾌적하게 돌아간다.

지원하는 모델이 정말 많다. 2025년 기준으로 100개가 넘는다.

| 모델 | 크기 | 특징 |
|------|------|------|
| Llama 3.3 | 70B | Meta의 최신 오픈소스 모델. 405B급 성능 |
| Llama 3.2 | 1B / 3B | 엣지 디바이스용 경량 모델 |
| Mistral | 7B | 범용 모델. Apache 라이선스 |
| Qwen 2.5 | 다양 | 알리바바. 128K 컨텍스트, 다국어 지원 |
| Gemma 2 | 2B / 9B / 27B | 구글. 크기 대비 성능 우수 |
| DeepSeek-R1 | 다양 | 추론 특화 모델 |

### 설치와 모델 다운로드

Ollama 설치는 놀랍도록 간단하다.

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# 또는 ollama.com에서 직접 다운로드

# 모델 실행 (없으면 자동 다운로드)
ollama run llama3.2
```

`ollama run` 한 줄이면 모델 다운로드부터 실행까지 끝난다. Docker 경험이 있다면 `docker pull` + `docker run` 같은 느낌이라고 보면 된다.

### LangChain에서 Ollama 사용하기

이제 진짜 핵심이다. LangChain과 Ollama를 연결하면 OpenAI API를 쓸 때와 거의 동일한 코드로 로컬 모델을 사용할 수 있다.

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

# Ollama가 로컬에서 실행 중이어야 한다 (기본 포트: 11434)
llm = ChatOllama(
    model="llama3.2",
    temperature=0.7,
)

messages = [
    SystemMessage(content="당신은 친절한 한국어 AI 비서입니다."),
    HumanMessage(content="파이썬에서 비동기 프로그래밍이 왜 필요한지 설명해줘."),
]

response = llm.invoke(messages)
print(response.content)
```

`ChatOpenAI`를 `ChatOllama`로 바꾸고, `model`만 Ollama에서 사용 가능한 모델명으로 변경하면 끝이다. 나머지 코드는 완전히 동일하다. 이게 LangChain을 쓰는 가장 큰 이유 중 하나다 — 모델 프로바이더를 바꿔도 나머지 코드를 손댈 필요가 없다.

LCEL 체인도 당연히 그대로 쓸 수 있다.

```python
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "주어진 코드를 리뷰하고 개선점을 제안하세요."),
    ("human", "{code}"),
])

llm = ChatOllama(model="llama3.2", temperature=0)
chain = prompt | llm | StrOutputParser()

result = chain.invoke({"code": "def add(a,b): return a+b"})
print(result)
```

처음에 Ollama 연동 테스트를 했을 때, 솔직히 좀 감동받았다. API 키도 없이, 인터넷 연결 없이도, 내 노트북에서 LLM 기반 체인이 돌아간다는 게. 물론 GPT-4o 수준의 성능을 기대하면 안 된다. 하지만 프로토타이핑이나 개인 프로젝트, 데이터 프라이버시가 중요한 상황에서는 충분히 실용적이다.

:::tip 팁: Ollama 모델 선택
처음 시작한다면 `llama3.2` (3B)를 추천한다. 가볍고 빠르다. 좀 더 품질이 필요하면 `llama3.3` (70B)이나 `mistral-small` (24B)를 시도해보자. 단, 70B 모델은 메모리가 넉넉해야 한다 (최소 64GB RAM 권장).
:::

---

## 허깅 페이스의 오픈소스 LLM 활용

Ollama가 "간편하게 로컬에서 돌리기"에 초점이 맞춰져 있다면, 허깅 페이스(Hugging Face)는 오픈소스 AI 모델의 거대한 생태계 자체다. 수십만 개의 모델이 올라와 있고, 그중 상당수를 LangChain에서 바로 사용할 수 있다.

### langchain-huggingface 패키지

HuggingFace와 LangChain 팀이 공동으로 관리하는 공식 통합 패키지가 있다.

```bash
pip install langchain-huggingface
```

사용 방식은 크게 두 가지다:

1. **로컬 실행** — `HuggingFacePipeline`로 모델을 직접 내 머신에서 돌린다
2. **API 활용** — `HuggingFaceEndpoint`로 HuggingFace의 Inference API를 호출한다

### 로컬에서 HuggingFace 모델 돌리기

```python
from langchain_huggingface import ChatHuggingFace, HuggingFacePipeline

# 로컬 파이프라인 생성
llm = HuggingFacePipeline.from_model_id(
    model_id="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    task="text-generation",
    pipeline_kwargs={
        "max_new_tokens": 256,
        "temperature": 0.7,
    },
)

# 채팅 모델로 래핑
chat_model = ChatHuggingFace(llm=llm)

response = chat_model.invoke("Python의 GIL이 뭔지 설명해줘")
print(response.content)
```

`HuggingFacePipeline`이 모델을 로컬에 다운로드하고 추론 파이프라인을 만든다. `ChatHuggingFace`로 감싸면 다른 LangChain 채팅 모델과 동일한 인터페이스로 사용할 수 있다.

솔직히 말하면, 로컬 HuggingFace 파이프라인은 Ollama에 비해 초기 설정이 좀 번거롭다. `transformers`, `torch` 같은 무거운 의존성이 필요하고, 모델에 따라 추가 설정이 필요한 경우도 있다. 내 경험상 "그냥 빨리 돌려보고 싶다" 싶으면 Ollama가 훨씬 편하다.

그러면 HuggingFace를 왜 쓰냐? 모델 선택의 폭이 압도적으로 넓기 때문이다. 특정 도메인에 파인튜닝된 모델, 한국어 특화 모델, 최신 연구 모델 등 Ollama 라이브러리에 없는 모델을 쓰고 싶을 때 HuggingFace가 빛을 발한다.

### HuggingFace Inference API 활용

모델을 로컬에서 돌리기엔 GPU가 부족할 때, HuggingFace의 서버리스 Inference API를 사용할 수도 있다.

```python
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

# HF_TOKEN 환경변수 설정 필요
llm = HuggingFaceEndpoint(
    repo_id="mistralai/Mistral-7B-Instruct-v0.3",
    task="text-generation",
    max_new_tokens=512,
)

chat_model = ChatHuggingFace(llm=llm)
response = chat_model.invoke("LangChain의 장점을 세 가지 알려줘")
print(response.content)
```

무료 티어도 있어서 가볍게 테스트하기에는 괜찮다. 다만 rate limit이 있으니 프로덕션용으로는 적합하지 않다.

---

## 어떤 걸 써야 하나

이쯤 되면 "그래서 뭘 쓰라는 거냐"는 의문이 들 수 있다. 정답은 없지만, 내 기준은 이렇다:

| 상황 | 추천 |
|------|------|
| 빠른 프로토타이핑, 최고 품질 필요 | ChatOpenAI (gpt-4o) |
| 데이터 프라이버시, 오프라인 환경 | ChatOllama + 로컬 모델 |
| 특수 모델, 파인튜닝 모델 사용 | HuggingFace Pipeline |

중요한 건, LangChain을 쓰면 이 세 가지 사이를 왔다갔다하는 게 거의 비용이 없다는 점이다. 모델 클래스만 바꾸면 나머지 체인, 프롬프트, 파서 코드는 그대로 재사용된다. 이게 프레임워크를 쓰는 진짜 이유다.

---

## 마무리하며

이 글에서 다룬 건 LangChain의 정말 기초적인 부분이다. 설치하고, 모델 연결하고, 간단한 체인을 만드는 것까지. 하지만 이 기초가 탄탄해야 나중에 RAG, Agent, Tool 같은 고급 기능으로 넘어갈 때 헤매지 않는다.

아직 고민되는 부분도 있다. Ollama와 HuggingFace Pipeline 사이에서 어떤 걸 기본으로 쓸지, LCEL이 항상 최선인지. 이런 건 좀 더 써봐야 답이 나올 것 같다.

다음 글에서는 LangChain의 프롬프트 엔지니어링과 출력 파서를 좀 더 깊이 다뤄볼 생각이다.

---

**참고자료**

- [LangChain 공식 문서 — Python](https://python.langchain.com/)
- [ChatOpenAI 통합 가이드](https://docs.langchain.com/oss/python/integrations/chat/openai)
- [ChatOllama 통합 가이드](https://docs.langchain.com/oss/python/integrations/chat/ollama)
- [Hugging Face x LangChain 파트너 패키지](https://huggingface.co/blog/langchain)
- [Ollama 모델 라이브러리](https://ollama.com/library)
