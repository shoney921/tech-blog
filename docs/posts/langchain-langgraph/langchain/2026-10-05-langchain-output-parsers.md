---
title: "LangChain 출력 파서, 아직 쓸 일이 있을까 — with_structured_output과 나란히 놓고 보기"
description: StrOutputParser, JsonOutputParser, PydanticOutputParser가 각각 무엇을 하는지, 그리고 with_structured_output이 생긴 지금 파서를 언제 여전히 쓰는지 정리한 글.
date: 2026-10-05T10:00:00
---

# LangChain 출력 파서, 아직 쓸 일이 있을까

LLM은 문자열을 뱉는다. 그런데 코드가 원하는 건 대개 문자열이 아니다. 딕셔너리, 리스트, 아니면 필드가 정해진 객체다.

출력 파서(Output Parser)는 그 사이를 메우려고 나온 도구다. LangChain 공식 레퍼런스도 파서를 "구조화된 출력을 얻기 위한 초기의 해법"이라고 소개하고, 요즘은 모델이 구조화 출력을 직접 지원하는지부터 확인해 보라고 권한다. 그러니 질문은 "파서가 뭐냐"보다 "지금도 쓸 일이 있냐"에 가깝다.

> 이 글의 코드는 직접 실행해 확인한 것이 아니라 공식 문서의 사용법을 기준으로 쓴 예시다. 버전에 따라 import 경로나 동작이 다를 수 있으니, 복사해서 쓰기 전에 설치된 버전에서 한 번 돌려 보길 권한다.

## 파서가 하는 일은 두 가지다

파서는 보통 체인 맨 끝에 붙는다.

```python
from langchain_core.output_parsers import StrOutputParser

chain = prompt | model | StrOutputParser()
chain.invoke({"topic": "출력 파서"})  # 'AIMessage'가 아니라 그냥 str
```

`StrOutputParser`는 모델이 돌려준 메시지 객체에서 텍스트만 꺼낸다. 가장 단순하지만 체인을 짤 때 제일 많이 만나게 된다.

구조화된 파서는 한 가지를 더 한다. 프롬프트에 "이런 형식으로 답해 달라"는 지시문을 넣어 주는 일이다. 파서가 `get_format_instructions()`로 그 지시문을 만들어 주고, 모델이 답하면 같은 파서가 그 텍스트를 파싱한다. 지시와 해석을 한 객체가 맡는 셈이다.

## Pydantic으로 스키마를 걸면

```python
from pydantic import BaseModel, Field
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate

class Review(BaseModel):
    sentiment: str = Field(description="positive, negative 중 하나")
    summary: str = Field(description="한 문장 요약")

parser = PydanticOutputParser(pydantic_object=Review)

prompt = ChatPromptTemplate.from_messages([
    ("system", "다음 리뷰를 분석하세요.\n{format_instructions}"),
    ("human", "{review}"),
]).partial(format_instructions=parser.get_format_instructions())

chain = prompt | model | parser
result = chain.invoke({"review": "배송은 빨랐는데 포장이 아쉬웠다."})
# result는 Review 인스턴스
```

여기서 짚을 점은 모델에게 JSON을 "부탁"한다는 것이다. 강제가 아니다. 모델이 코드블록으로 감싸거나 앞에 설명을 붙이면 파싱이 실패하고 `OutputParserException`이 난다. 프롬프트에 의존하는 방식이라 어쩔 수 없는 구조다.

`JsonOutputParser`도 비슷하다. 스키마 검증 없이 JSON을 dict로 바꿔 주고, 스트리밍 중에 부분 JSON을 조금씩 파싱해 내보내는 쪽에 장점이 있는 걸로 알고 있다. 이 부분은 내가 정확히 확인하진 못했다.

## with_structured_output이 나온 뒤

같은 일을 이렇게도 한다.

```python
structured_model = model.with_structured_output(Review)
result = structured_model.invoke("배송은 빨랐는데 포장이 아쉬웠다.")
```

포맷 지시문을 프롬프트에 넣지 않는다. 스키마를 모델의 tool calling이나 JSON 모드 같은 네이티브 기능으로 넘기고, 돌아온 값을 알아서 `Review`로 바꿔 준다. 모델이 지원하면 이쪽이 대체로 더 안정적이다. 형식을 글로 부탁하는 것과 API 차원에서 강제하는 것은 신뢰도가 다르기 때문이다.

그럼 파서는 끝났나. 그렇게까지는 아니라고 본다.

## 그래도 파서를 쓰는 경우

- 모델이나 서빙 환경이 tool calling·JSON 모드를 지원하지 않을 때. 로컬 모델에서 흔하다.
- 최종 출력이 문자열이어도 충분할 때. 이때 `StrOutputParser`는 여전히 기본 부품이다.
- 모델 응답에 후처리를 직접 끼워 넣고 싶을 때. 파서는 `Runnable`이라 `|`로 이어 붙이기 쉽다.

반대로 OpenAI, Anthropic 같은 상용 API에서 스키마가 고정된 추출 작업이라면 `with_structured_output`부터 시도하는 게 맞는 순서 같다. 이건 의견이 갈릴 수 있다.

## 아직 정리 안 된 부분

파싱 실패를 자동으로 재시도해 주는 `OutputFixingParser`·`RetryOutputParser` 계열이 최신 버전에서 어떤 위치에 있는지는 확인하지 못했다. 레거시로 옮겨졌다는 이야기를 본 적이 있지만 근거를 직접 확인한 건 아니다. 쓰기 전에 설치한 버전의 문서를 보는 게 안전하다.

## 참고

- [langchain-core output_parsers 레퍼런스](https://reference.langchain.com/python/langchain-core/output_parsers)
- [LangChain Structured Outputs: A Guide to Tools and Methods (Mirascope)](https://mirascope.com/blog/langchain-structured-output)
