---
title: 랭체인 & 랭그래프
sidebar: true
prev: false
---

# 랭체인 & 랭그래프

『혼자서도 척척 해내는 AI 에이전트 만들기 with 랭체인&랭그래프』를 따라가며 정리한 학습 연재. 책의 흐름대로 **배경지식 → LangChain → LangGraph → LLM 평가** 순서로 읽으면 된다. 각 글은 책의 여러 챕터를 묶어서 다룬다.

## 읽는 순서

**PART I. 개발 전 필요한 배경지식** → [배경지식](/posts/langchain-langgraph/background/)

1. [LLM의 작동 원리부터 RAG까지, 처음 만나는 AI 기초](/posts/langchain-langgraph/background/2026-02-16-llm-and-rag-basics) — Ch 1. LLM과 RAG 기초
2. [벡터 저장소부터 프롬프트 엔지니어링까지 — RAG를 떠받치는 기둥들](/posts/langchain-langgraph/background/2026-02-16-vector-store-embedding-prompt) — Ch 2~3. 벡터 저장소·임베딩·검색 전략, 프롬프트 엔지니어링

**PART II. LangChain을 활용한 RAG 파이프라인 구성하기** → [LangChain](/posts/langchain-langgraph/langchain/)

3. [LangChain 입문 — 설치부터 로컬 LLM 연동까지](/posts/langchain-langgraph/langchain/2026-02-16-langchain-getting-started) — Ch 4~5. LangChain 입문, Ollama·허깅페이스
4. [LangChain으로 RAG 파이프라인 구성하기 — Chroma부터 LCEL까지](/posts/langchain-langgraph/langchain/2026-02-16-rag-pipeline-with-langchain) — Ch 6~10. Chroma, 전처리, LCEL, 비용 최적화
5. [LangChain 출력 파서, 아직 쓸 일이 있을까](/posts/langchain-langgraph/langchain/2026-10-05-langchain-output-parsers) — 번외. 출력 파서 vs with_structured_output

**PART III. LangGraph를 활용한 AI 에이전트 구현하기** → [LangGraph](/posts/langchain-langgraph/langgraph/)

6. [LangGraph 입문 — 워크플로와 에이전트, 뭐가 다른 걸까](/posts/langchain-langgraph/langgraph/2026-02-16-langgraph-workflow-agent) — Ch 11~12. LangGraph 입문, 워크플로 vs 에이전트
7. [멀티 에이전트 오케스트레이션부터 MCP, 그리고 실전 사례까지](/posts/langchain-langgraph/langgraph/2026-02-16-agent-orchestration-mcp) — Ch 13~16. 슈퍼바이저, MCP, LangSmith 모니터링, 실전 사례

**PART IV. LLM 성능 평가** → [LLM 평가](/posts/langchain-langgraph/evaluation/)

8. [LLM 평가, 왜 이렇게 어려운 걸까 — 지표와 전략 정리](/posts/langchain-langgraph/evaluation/2026-02-16-llm-evaluation-importance-metrics) — Ch 17~18. 평가의 중요성, 평가 지표
9. [골든 데이터셋과 평가 전략 — 안정적인 AI 에이전트를 위한 마지막 퍼즐](/posts/langchain-langgraph/evaluation/2026-02-16-golden-dataset-evaluation-strategy) — Ch 19~22. 골든 데이터셋, 오프라인·온라인 평가, 앞으로의 방향

## 전체 글

<PostList category="langchain-langgraph" order="asc" :show-description="false" />
