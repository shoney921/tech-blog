---
title: "LangChain으로 RAG 파이프라인 구성하기 — Chroma부터 LCEL까지"
date: 2026-02-16T11:30:00
---

# LangChain으로 RAG 파이프라인 구성하기 — Chroma부터 LCEL까지

RAG 파이프라인을 직접 구성하다 보면, 처음에는 "문서 넣고 검색하면 끝 아냐?"라는 생각이 든다. 나도 그랬다. 그런데 막상 해보면 벡터 저장소 선택, 문서 전처리, 체인 구성, 비용 관리까지 신경 쓸 게 한두 가지가 아니다. 이 글에서는 LangChain 기반으로 RAG 파이프라인을 처음부터 끝까지 구성하면서 겪었던 것들을 정리해본다.

---

## Chroma, 왜 처음에 쓰기 좋은가

벡터 저장소를 고르는 건 생각보다 머리 아픈 일이다. Pinecone, Weaviate, Milvus, Qdrant... 선택지가 너무 많다. 그 중에서 Chroma는 로컬에서 바로 돌릴 수 있고, 별도 서버 설정 없이 임베딩을 저장하고 검색할 수 있어서 프로토타이핑 단계에서 상당히 편하다.

설치부터 간단하다.

```bash
pip install langchain-chroma chromadb langchain-openai
```

문서를 로드하고 Chroma에 저장하는 기본 흐름은 이렇다.

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# 1. 문서 로드
loader = PyPDFLoader("my_document.pdf")
docs = loader.load()

# 2. 청킹
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
chunks = splitter.split_documents(docs)

# 3. 벡터 저장소에 저장
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=OpenAIEmbeddings(),
    persist_directory="./chroma_db"  # 로컬 디스크에 영속화
)
```

`persist_directory`를 지정하면 프로세스를 재시작해도 벡터가 유지된다. 개발할 때 매번 임베딩을 다시 생성하지 않아도 되니까 시간과 API 비용을 절약할 수 있다. Chroma Cloud도 있긴 한데, 솔직히 프로토타이핑 단계에서는 로컬로 충분하다.

한 가지 주의할 점은, Chroma는 대규모 프로덕션 환경에서 Pinecone이나 Weaviate 같은 매니지드 서비스에 비해 확장성이 제한적이다. 수십만 건 이상의 문서를 다룰 계획이라면 나중에 마이그레이션을 고려해야 한다. 근데 처음부터 그런 고민을 하면 아무것도 시작을 못하니까, 일단 Chroma로 시작하는 게 내 경험상 맞았다.

---

## 청킹 전략 — 여기서 검색 품질이 갈린다

RAG에서 가장 과소평가되는 단계가 청킹이다. "적당히 잘라서 넣으면 되겠지"라고 생각하기 쉬운데, 청크를 어떻게 나누느냐에 따라 검색 품질이 체감상 완전히 달라진다.

### RecursiveCharacterTextSplitter

LangChain에서 가장 많이 쓰이는 스플리터다. `["\n\n", "\n", " ", ""]` 순서로 분할을 시도하는데, 가능한 한 문단 단위를 유지하려고 한다. 대부분의 상황에서 합리적인 기본 선택이다.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", ". ", " ", ""]
)
```

`chunk_overlap`은 꼭 넣는 게 좋다. 청크 경계에서 문맥이 잘리는 걸 어느 정도 막아준다. 내 경험상 청크 사이즈의 15~20% 정도가 적당했다.

### 토큰 기반 분할

문자 수 기반 분할의 한계는, 같은 500자라도 토큰 수가 꽤 다를 수 있다는 점이다. 특히 한국어는 영어보다 토큰당 문자 수가 적어서 이 차이가 더 크다. LLM의 컨텍스트 윈도우는 토큰 단위로 계산되니까, 토큰 기반 분할이 더 정확할 수 있다.

```python
from langchain_text_splitters import TokenTextSplitter

splitter = TokenTextSplitter(
    chunk_size=400,
    chunk_overlap=50
)
```

### 시맨틱 청킹

최근에는 의미적 유사도를 기반으로 청크를 나누는 시맨틱 청킹도 주목받고 있다. 인접한 문장들의 임베딩 유사도를 계산해서, 유사도가 급격히 떨어지는 지점에서 청크를 나누는 방식이다. Chroma 팀의 연구에 따르면 RecursiveCharacterTextSplitter 대비 recall이 최대 9%p 정도 개선되는 경우도 있다고 한다.

그런데 시맨틱 청킹이 항상 좋은 건 아니다. 임베딩 호출이 추가로 필요해서 전처리 비용이 올라가고, 문서 구조가 명확한 경우(기술 문서, API 문서)에는 그냥 구조 기반으로 자르는 게 더 나을 수 있다. 정답은 없고, 자기 데이터로 실험해보는 수밖에.

---

## LCEL로 체인 구성하기

LangChain을 쓸 때 가장 호불호가 갈리는 부분이 체인 구성이다. 예전에는 `LLMChain`, `SequentialChain` 같은 클래스를 조합했는데, 지금은 LCEL(LangChain Expression Language)이 기본이다. 파이프 연산자(`|`)로 컴포넌트를 연결하는 방식인데, Unix의 파이프라인과 비슷하다.

### 기본 RAG 체인

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

template = """다음 컨텍스트를 바탕으로 질문에 답변하세요.
컨텍스트에 없는 내용은 모른다고 답하세요.

컨텍스트: {context}
질문: {question}
"""
prompt = ChatPromptTemplate.from_template(template)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 실행
answer = chain.invoke("Chroma의 장점은 무엇인가요?")
```

여기서 `RunnablePassthrough()`는 입력값을 그대로 다음 단계로 넘긴다. 딕셔너리 형태로 구성하면 `context`에는 retriever 결과가, `question`에는 원래 입력이 들어간다. 처음 보면 좀 낯선데, 익숙해지면 꽤 직관적이다.

### 분할 정복 — RunnableParallel

복잡한 질문을 처리할 때, 하나의 프롬프트에 모든 걸 다 넣는 것보다 작업을 분할해서 병렬로 처리하는 게 나을 때가 있다. `RunnableParallel`이 이걸 가능하게 한다.

```python
from langchain_core.runnables import RunnableParallel

# 여러 retriever에서 동시에 검색
parallel_retrieval = RunnableParallel(
    tech_context=tech_retriever,
    business_context=business_retriever,
    question=RunnablePassthrough()
)
```

예를 들어 "이 기술을 도입하면 비용 절감이 되나요?"라는 질문이 들어오면, 기술 문서와 비즈니스 문서에서 동시에 검색을 돌리고, 각각의 결과를 합쳐서 LLM에게 넘길 수 있다. 독립적인 작업이 여러 개일 때 레이턴시를 줄이는 데 효과적이다.

### LCEL의 진짜 장점

솔직히 말하면, LCEL의 파이프 문법 자체가 Python 개발자에게 항상 자연스러운 건 아니다. 처음에는 "그냥 함수 호출하면 안 되나?"라는 생각이 들 수 있다. 근데 LCEL이 진짜 빛나는 건 스트리밍과 비동기 처리다.

```python
# 스트리밍 — 한 줄만 바꾸면 됨
for chunk in chain.stream("질문"):
    print(chunk, end="", flush=True)

# 비동기 — 역시 한 줄
result = await chain.ainvoke("질문")
```

`invoke`, `stream`, `ainvoke`, `astream` 같은 메서드를 모든 LCEL 컴포넌트가 공유한다. 체인을 한 번 구성해놓으면, 실행 방식만 바꿔서 동기/비동기/스트리밍을 자유롭게 전환할 수 있다. 프로덕션에서 이건 꽤 큰 장점이다.

---

## 소규모 LLM으로 비용 잡기

RAG 파이프라인에서 비용의 대부분은 LLM 호출에서 나온다. GPT-4o를 쓰면 답변 품질은 좋지만, 트래픽이 조금만 늘어도 비용이 급격히 올라간다.

내가 최근에 쓰는 전략은 이렇다. 단순한 질문(사실 확인, 정의 설명 등)은 `gpt-4o-mini`나 `claude-3-haiku` 같은 소규모 모델로 처리하고, 복잡한 추론이 필요한 질문만 큰 모델로 라우팅한다.

```python
from langchain_openai import ChatOpenAI

small_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
large_llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 질문 복잡도에 따라 라우팅
def route_by_complexity(question: str):
    # 간단한 분류 로직 (실제로는 더 정교하게)
    complex_keywords = ["비교", "분석", "왜", "어떻게 다른"]
    if any(kw in question for kw in complex_keywords):
        return large_llm
    return small_llm
```

실제로 7B 파라미터 수준의 SLM(Small Language Model)은 대형 모델 대비 10~30배 저렴하면서, RAG로 컨텍스트를 보강하면 도메인 특화 태스크에서 정확도 차이가 3~5%p 내로 좁혀진다는 보고도 있다. 모든 질문에 GPT-4o를 쏘는 건 솔직히 과잉 투자인 경우가 많다.

시맨틱 캐싱도 고려해볼 만하다. 비슷한 질문이 반복되면 LLM을 다시 호출하지 않고 캐시된 답변을 돌려주는 건데, 프로덕션 환경에서 LLM 비용을 최대 60~70% 절감할 수 있다.

---

## LangChain 없이 RAG를 만든다면?

한 가지 솔직한 이야기를 하자면, LangChain이 유일한 선택지는 아니다. 오히려 "LangChain이 너무 무겁다", "추상화가 과하다"는 비판도 꽤 있다. LangChain 없이 RAG를 구성하는 것도 전혀 어렵지 않다.

```python
# LangChain 없이 순수 OpenAI API + ChromaDB
import chromadb
from openai import OpenAI

client = OpenAI()
chroma = chromadb.Client()
collection = chroma.create_collection("my_docs")

# 임베딩 & 저장
def embed_and_store(texts):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    embeddings = [e.embedding for e in response.data]
    collection.add(
        documents=texts,
        embeddings=embeddings,
        ids=[f"doc_{i}" for i in range(len(texts))]
    )

# 검색 & 생성
def ask(question):
    q_emb = client.embeddings.create(
        model="text-embedding-3-small",
        input=[question]
    ).data[0].embedding

    results = collection.query(
        query_embeddings=[q_emb], n_results=3
    )

    context = "\n".join(results["documents"][0])
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"컨텍스트: {context}\n\n질문: {question}"
        }]
    )
    return response.choices[0].message.content
```

코드가 오히려 더 읽기 쉽다고 느낄 수도 있다. 의존성도 적고, 디버깅도 직관적이다.

**LlamaIndex**는 RAG에 특화된 프레임워크로, 데이터 커넥터와 인덱싱 기능이 강력하다. Notion, Slack, SharePoint 같은 소스에서 직접 데이터를 가져오는 로더가 잘 갖춰져 있어서, 검색 중심의 파이프라인을 빠르게 구축할 수 있다. 벤치마크에서는 레이턴시가 LangChain보다 빠른 편(~6ms vs ~10ms)이라는 결과도 있다.

**Haystack**은 엔터프라이즈 환경에 강하다. 파이프라인 모니터링, 스케일링 기능이 탄탄해서 프로덕션 배포를 염두에 둔다면 고려할 만하다.

그래서 뭘 써야 하나? 내 생각에는 이렇다.

- 빠르게 프로토타입 → LangChain (생태계가 넓어서 예제가 많음)
- 검색 최적화가 핵심 → LlamaIndex
- 프로덕션 안정성 우선 → Haystack
- 최대한 가볍게 → 직접 OpenAI API + ChromaDB

정답은 없다. 프로젝트 성격에 따라 다르고, 심지어 섞어 쓰는 것도 가능하다.

---

## LangChain의 유연한 스택 구성

그럼에도 LangChain을 쓰는 이유가 있다면, 구성 요소를 자유롭게 교체할 수 있다는 점이다. LLM을 OpenAI에서 Anthropic으로 바꾸든, 벡터 저장소를 Chroma에서 Pinecone으로 바꾸든, 코드 변경이 최소화된다.

```python
# LLM 교체 — import와 초기화만 변경
from langchain_anthropic import ChatAnthropic
llm = ChatAnthropic(model="claude-3-5-haiku-latest")

# 벡터 저장소 교체
from langchain_pinecone import PineconeVectorStore
vectorstore = PineconeVectorStore(
    index_name="my-index",
    embedding=OpenAIEmbeddings()
)

# 체인은 동일
chain = (
    {"context": vectorstore.as_retriever(), "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

LCEL로 구성된 체인은 그대로 두고, 개별 컴포넌트만 교체하면 되는 구조다. 이게 실무에서 생각보다 중요하다. "이번 달에 Claude로 바꿔볼까?"라는 결정을 내릴 때, 파이프라인 전체를 다시 짜지 않아도 된다. 임베딩 모델도, 벡터 저장소도, 프롬프트 템플릿도 독립적으로 교체 가능하다.

LangSmith와의 통합도 빠뜨릴 수 없다. 체인의 각 단계별 입출력을 추적하고, 검색 품질이나 LLM 응답을 모니터링할 수 있다. RAG 파이프라인은 한 번 만들고 끝이 아니라 계속 관찰하고 개선해야 하는 시스템이니까, 이런 관측 도구가 있다는 건 큰 장점이다.

---

## 아직 고민 중인 것들

여기까지 읽으면 RAG 파이프라인 구성이 깔끔하게 정리된 것 같지만, 솔직히 아직 명쾌한 답을 못 찾은 부분도 있다.

청킹 전략은 여전히 프로젝트마다 새로 고민해야 한다. "이 설정이 만능"이라는 건 없었다. 문서의 성격, 질문의 유형, 임베딩 모델의 특성에 따라 최적값이 다 다르다. 결국 평가 데이터셋을 만들어서 실험해보는 수밖에 없다.

LangChain의 추상화 수준도 장단점이 있다. 처음에는 편한데, 뭔가 커스텀하려고 하면 내부 구현을 파고들어야 할 때가 있다. 그래서 "처음에는 LangChain으로, 나중에는 필요한 부분만 직접 구현"하는 방식이 현실적이라고 느끼고 있다.

RAG는 결국 검색 시스템이다. LLM이 아무리 똑똑해도 엉뚱한 문서가 검색되면 좋은 답변이 나올 수 없다. 화려한 모델보다 지루한 데이터 전처리와 검색 품질 튜닝이 결과에 더 큰 영향을 미친다는 걸, 몇 번의 삽질 끝에 배웠다.

---

## 참고자료

- [LangChain Chroma Integration - 공식 문서](https://python.langchain.com/docs/integrations/vectorstores/chroma/)
- [LCEL 개념 - LangChain Docs](https://python.langchain.com/docs/concepts/lcel/)
- [Chunking Strategies for RAG - Pinecone](https://www.pinecone.io/learn/chunking-strategies/)
- [RAG Frameworks 비교 - AIMultiple](https://research.aimultiple.com/rag-frameworks/)
- [LLM Cost Optimization Guide - Koombea](https://ai.koombea.com/blog/llm-cost-optimization)
