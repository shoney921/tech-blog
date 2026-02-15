---
title: "인사고과 AI 시험 출제를 맡게 되어 정리한 키워드 맵"
date: 2026-02-15T10:00:00
---

# 인사고과 AI 시험 출제를 맡게 되어 정리한 키워드 맵

회사에서 인사고과 시험 출제를 맡게 됐다. SI 회사 개발 엔지니어들을 대상으로 AI 관련 문제를 내야 한다. 부담이 크다. 솔직히 말하면 나도 AI 전 영역을 깊이 알고 있는 건 아니니까. 그래도 출제자가 된 이상, 모르는 채로 넘어갈 수는 없어서 하나하나 조사하고 있다.

조사하면 할수록 느끼는 건데, AI라는 게 워낙 넓고 2025년부터 변화 속도가 정말 빠르다. 새로운 키워드가 매주 나오는 기분이다. 그래서 일단 내가 공부하면서 전체 그림을 잡기 위해 키워드들을 학습 순서대로 정리해봤다. 이걸 기반으로 시험 문제도 만들고, 교육자료 뼈대로도 활용할 생각이다. 혹시 비슷한 상황에 있는 분이 있다면 참고가 되면 좋겠다.

---

## 기초 체력: 수학과 머신러닝

AI를 이해하려면 어쩔 수 없이 수학이 필요하다. 다만 출제 관점에서는 "이 개념이 왜 필요한지"를 아는 정도면 충분하다고 본다. 미적분 문제를 풀게 할 건 아니니까.

### 수학 기초

**선형대수**가 가장 먼저다. 벡터, 행렬, 행렬곱, 고유값 — 이런 게 신경망의 기본 연산이다. 그 다음 **미적분**에서 편미분과 그래디언트, 체인 룰을 알아야 역전파(Backpropagation)가 이해된다. **확률과 통계**는 베이즈 정리, 조건부 확률, 확률분포 정도. **최적화**에서는 경사하강법(Gradient Descent), SGD, Adam 같은 옵티마이저 개념이 핵심이다.

손실 함수(Loss Function)도 빠질 수 없다. MSE, Cross-Entropy, Hinge Loss 정도는 각각 어떤 상황에서 쓰는지 알아야 한다. 정보 이론 쪽에서는 엔트로피, KL Divergence, Perplexity — 특히 Perplexity는 LLM 성능 평가에서 자주 나온다.

### 머신러닝 핵심 개념

여기는 개념이 명확해서 정리하기 수월했다.

학습 패러다임부터 정리하면:

- **지도학습(Supervised Learning)** — 레이블이 있는 데이터로 학습. 분류와 회귀
- **비지도학습(Unsupervised Learning)** — 레이블 없이 패턴 발견. 군집화, 차원 축소
- **강화학습(Reinforcement Learning)** — 보상 기반 학습. 상태, 행동, 보상, 정책
- **자기지도학습(Self-Supervised Learning)** — 데이터 자체에서 레이블 생성. BERT의 Masked LM이 대표적
- **준지도학습(Semi-Supervised Learning)** — 소량 레이블 + 대량 비레이블
- **전이학습(Transfer Learning)** — 사전학습 모델을 새 태스크에 적용

주요 알고리즘은 선형회귀/로지스틱 회귀, 결정 트리, 랜덤 포레스트, **XGBoost/LightGBM**(정형 데이터에서 여전히 강력), SVM, KNN, K-Means/DBSCAN, PCA, 나이브 베이즈 정도가 필수다.

모델 평가 쪽에서는 **과적합 vs 과소적합**, 교차 검증(K-Fold), 편향-분산 트레이드오프, 정규화(L1/L2/Dropout/Early Stopping)를 알아야 하고, 평가 지표로 Accuracy, Precision, Recall, F1-Score, AUC-ROC 개념은 확실히 잡아야 한다. 혼동 행렬(Confusion Matrix)에서 TP/TN/FP/FN 해석도 기본 중의 기본이다.

---

## 데이터 — ML 작업의 80%

현업에서 ML 엔지니어들이 시간을 가장 많이 쓰는 곳이 여기다.

**데이터 전처리**는 결측치 처리, 이상치 탐지, 중복 제거 같은 기본기. **특성 공학(Feature Engineering)**은 원시 데이터에서 유의미한 특성을 만들어내는 기술이고, 반대로 **특성 선택(Feature Selection)**은 불필요한 것을 골라내는 기술이다.

**데이터 증강(Data Augmentation)**은 이미지에서는 회전/크롭, 텍스트에서는 역번역 같은 기법으로 데이터를 불린다. 정규화(Min-Max Scaling)와 표준화(Z-Score), 범주형 데이터의 인코딩(One-Hot, Label, Target Encoding)도 기본.

최근 키워드로는 **Feature Store**(ML 피처를 중앙에서 관리하는 저장소, Feast나 Tecton 같은 도구), **합성 데이터(Synthetic Data)**, 그리고 데이터 파이프라인 관련 ETL/ELT, Apache Airflow, Spark 같은 것들이 있다.

---

## 딥러닝 기초

인공 신경망(ANN)의 기본 — 퍼셉트론, 다층 퍼셉트론(MLP), 활성화 함수(ReLU, Sigmoid, Tanh, Softmax, GELU)부터 시작한다. **역전파(Backpropagation)**는 체인 룰로 그래디언트를 계산하는 방법이고, 이게 딥러닝 학습의 핵심 원리다.

학습을 안정시키는 **배치 정규화(Batch Normalization)**, 과적합을 막는 **드롭아웃(Dropout)**, 그리고 깊은 네트워크를 가능하게 한 **잔차 연결(Residual Connection/Skip Connection)** — ResNet이 이걸로 혁신을 만들었다.

주요 아키텍처별로 정리하면:

- **CNN(합성곱 신경망)** — 이미지 처리의 핵심. 커널, 풀링, 스트라이드
- **RNN/LSTM/GRU** — 시퀀스 데이터 처리. 지금은 Transformer에 대체되는 추세지만 개념은 알아야 한다
- **오토인코더** — 차원 축소, 이상 탐지
- **GAN** — 생성자 vs 판별자 구조
- **VAE** — 확률적 생성 모델
- **Attention Mechanism** — Transformer의 기반. 입력의 중요한 부분에 가중치를 부여

프레임워크는 **PyTorch**(현재 연구/산업 표준), **TensorFlow/Keras**(프로덕션 배포 강점), **JAX**(고성능 수치 연산), 그리고 오픈소스 AI 생태계의 중심인 **Hugging Face**를 알아야 한다.

---

## 자연어 처리(NLP)에서 LLM으로

NLP 기본 개념에서 시작해서 LLM까지 이어지는 흐름을 이해해야 한다.

### NLP 기본

**토큰화(Tokenization)**가 출발점이다. BPE(Byte Pair Encoding), WordPiece, SentencePiece — 텍스트를 모델이 처리할 수 있는 토큰으로 쪼개는 방법들이다. 토큰 수가 API 비용과 컨텍스트 윈도우 사용량에 직결되니까 실무적으로도 중요하다.

**임베딩(Embedding)**은 단어를 벡터로 표현하는 기술. Word2Vec, GloVe, FastText가 전통적 방법이고, 요즘은 Sentence-BERT나 OpenAI Ada 같은 문장/문서 단위 임베딩이 주류다.

그리고 **Transformer**. 2017년 "Attention Is All You Need" 논문에서 시작된 이 아키텍처가 현대 AI의 거의 모든 것을 바꿨다. Self-Attention, Multi-Head Attention, Positional Encoding이 핵심 메커니즘이다. **BERT**(양방향 인코더)가 사전학습+파인튜닝 패러다임을 열었고, **GPT 시리즈**(자기회귀 디코더)가 생성 AI의 시대를 열었다.

### LLM — 지금 가장 중요한 영역

조사하면서 가장 시간을 많이 쓴 영역이다. 2025-2026 기준 AI의 중심이니까.

**기본 개념**부터:

- **LLM(Large Language Model)** — 수십억~수천억 파라미터의 대규모 언어 모델
- **사전학습(Pre-training)** — 대규모 코퍼스에서 다음 토큰 예측 학습
- **파인튜닝(Fine-tuning)** — 특정 태스크에 맞게 추가 학습
- **컨텍스트 윈도우** — 한 번에 처리 가능한 최대 토큰 수. 4K에서 시작해서 지금은 1M 이상
- **스케일링 법칙(Scaling Law)** — 모델 크기, 데이터, 컴퓨팅과 성능의 관계
- **환각(Hallucination)** — 사실이 아닌 내용을 그럴듯하게 생성하는 현상. 여전히 해결 중인 문제
- **Temperature / Top-p / Top-k** — 출력의 다양성과 확실성을 제어하는 디코딩 파라미터. Temperature가 낮으면 확정적, 높으면 창의적
- **Structured Output** — JSON Schema 등으로 LLM 출력 형식을 강제하는 기법. API 연동에서 매우 실용적
- **Function Calling** — LLM이 외부 함수를 호출할 수 있도록 구조화된 요청을 생성하는 능력. 에이전트의 기반 기술

**주요 모델**은 알아둬야 한다. 독점 모델로는 GPT-4/GPT-5(OpenAI), Claude(Anthropic), Gemini(Google). 오픈소스로는 **Llama**(Meta, 4 시리즈까지), **Mistral**(유럽, MoE 아키텍처, Apache 2.0), **DeepSeek**(2025년 큰 반향), **Qwen**(알리바바, 멀티모달 포함). 모델별 특성과 차이점을 이해하면 좋다.

### LLM 학습과 정렬(Alignment)

이 부분이 좀 어렵지만, 이해하면 LLM이 어떻게 "똑똑해지는지"가 보인다.

**SFT(Supervised Fine-Tuning)**는 지시-응답 쌍으로 지도 학습하는 것. **RLHF(Reinforcement Learning from Human Feedback)**는 인간 피드백으로 보상 모델을 학습한 뒤 PPO로 모델을 정렬하는 3단계 프로세스다. **DPO(Direct Preference Optimization)**는 RLHF보다 단순하면서 안정적인 대안으로, 비용을 40~75% 줄인다. **RLAIF**는 인간 대신 AI가 평가하는 방식.

효율적 파인튜닝 기법으로는 **LoRA/QLoRA**(파라미터 일부만 학습), **PEFT**(Parameter-Efficient Fine-Tuning), **어댑터** 방식이 있다. 전체 파라미터를 학습하는 것보다 훨씬 적은 자원으로 커스터마이징할 수 있어서 실무에서 많이 쓰인다.

### LLM 효율화와 추론

모델을 실제로 서비스하려면 이 개념들을 알아야 한다:

- **MoE(Mixture of Experts)** — 전문가 혼합. 일부 파라미터만 활성화해서 효율성 확보
- **양자화(Quantization)** — FP16→INT8→INT4로 모델 경량화. GPTQ, AWQ, GGUF 같은 방식
- **지식 증류(Knowledge Distillation)** — 큰 모델의 지식을 작은 모델로 전이
- **가지치기(Pruning)** — 불필요한 파라미터 제거
- **추측 디코딩(Speculative Decoding)** — 작은 모델이 먼저 생성, 큰 모델이 검증
- **KV Cache** — Key-Value 캐싱으로 추론 효율화
- **FlashAttention** — 메모리 효율적 어텐션 연산

추론 인프라로는 **vLLM**(고성능 추론 엔진), **TensorRT-LLM**(NVIDIA 최적화), **ONNX Runtime**(하드웨어 비종속적), **Ollama**(로컬 실행), **Triton Inference Server** 등이 있다.

### LLM 평가(Evaluation)와 벤치마크

이 부분을 조사하면서 알게 된 건데, 2026년 기준으로 "Eval"이 단순한 벤치마크 점수 비교를 넘어 프로덕션 AI의 핵심 역량이 됐다. 공개 벤치마크 점수가 높다고 내 태스크에서도 잘하리란 보장이 없다는 인식이 퍼지면서, 직접 평가 세트를 구축하는 게 표준이 됐다.

알아야 할 키워드들:

- **LLM Eval** — LLM 성능을 체계적으로 측정하는 프로세스. 벤치마크 vs 태스크별 평가
- **MMLU / MMLU-Pro** — 다양한 학문 분야의 지식을 측정하는 대표 벤치마크
- **HumanEval / MBPP** — 코드 생성 능력 벤치마크
- **HELM** — Stanford의 종합 LLM 평가 프레임워크
- **LLM-as-a-Judge** — LLM이 다른 LLM의 출력을 평가하는 방식. 사람 평가의 대안
- **토큰 비용(Token Cost)** — 입력/출력 토큰별 과금. 모델 선택과 프롬프트 최적화의 핵심 고려사항
- **Latency / Throughput** — 응답 지연시간과 처리량. 프로덕션 서비스 품질 지표
- **BLEU / ROUGE** — 번역/요약 품질 평가 지표

---

## 프롬프트 엔지니어링

실무에서 당장 쓸 수 있는 영역이라 조사하면서 나도 꽤 재미있었다.

핵심 기법들:

- **Zero-shot** — 예시 없이 지시만으로 수행
- **Few-shot** — 소수의 예시를 제공
- **Chain-of-Thought(CoT)** — "단계별로 생각해보자"로 추론 유도
- **Tree-of-Thought(ToT)** — 여러 추론 경로를 탐색
- **ReAct** — Reasoning + Acting을 교차 수행
- **Self-Consistency** — 여러 추론 결과 중 다수결

그리고 **시스템 프롬프트**(모델의 역할/규칙 설정), **프롬프트 체이닝**(여러 프롬프트 순차 연결), **프롬프트 템플릿**(재사용 구조화)도 알아야 한다.

2025년부터는 **컨텍스트 엔지니어링**이라는 용어가 부상했다. 프롬프트만 잘 쓰는 게 아니라, 컨텍스트 윈도우 전체에 태스크 설명, Few-shot 예시, RAG 결과, 관련 데이터, 도구 정보, 상태/이력을 어떻게 배치할지 설계하는 더 넓은 개념이다.

---

## RAG — 환각을 잡는 실전 기술

LLM의 환각 문제를 해결하면서 최신 정보도 활용하게 해주는 핵심 패턴. SI 프로젝트에서 실제로 가장 많이 구현하게 되는 영역이기도 하다.

**RAG(Retrieval-Augmented Generation)**의 기본 흐름은 질문 → 관련 문서 검색 → 검색 결과와 함께 LLM에 전달 → 답변 생성이다.

이걸 구현하려면 알아야 할 것들:

- **벡터 임베딩** — 텍스트를 고차원 벡터로 변환
- **임베딩 모델** — OpenAI Ada, Sentence-BERT, BGE, Cohere Embed
- **벡터 데이터베이스** — Pinecone(완전관리형, 엔터프라이즈), ChromaDB(프로토타이핑에 좋음), Weaviate(지식그래프 결합), Milvus, Qdrant, FAISS(연구/최고 성능), pgvector(PostgreSQL 확장)
- **유사도 검색** — 코사인 유사도, L2 거리, 내적 기반 ANN 검색
- **청킹(Chunking)** — 문서 분할 전략. 크기, 오버랩, 의미 단위 분할
- **하이브리드 검색** — 벡터 검색 + BM25 키워드 검색 결합
- **리랭킹(Re-ranking)** — 검색 결과를 크로스인코더로 재순위화

고급 RAG 패턴도 있다. **Self-RAG**(검색이 필요한지 모델이 스스로 판단), **Corrective RAG**(검색 결과 품질 검증 후 보정), **GraphRAG**(지식 그래프와 결합), **멀티모달 RAG**(이미지, 표 등도 검색 대상에 포함).

---

## AI 에이전트 — 2025-2026 최대 화두

Gartner에 따르면 멀티에이전트 시스템 문의가 2024년 Q1 대비 2025년 Q2에 **1,445% 급증**했다. 2028년에는 13억 개 활성 에이전트가 예측된다고. 이건 무시할 수 없는 트렌드다.

### 에이전트 핵심 개념

- **AI Agent** — 자율적으로 계획→실행→관찰을 반복하는 시스템
- **Tool Use / Function Calling** — LLM이 외부 API, DB, 도구를 호출하는 능력
- **Planning** — 복잡한 태스크를 하위 단계로 분해
- **Memory** — 단기/장기 기억. 대화 이력, 작업 상태 유지
- **멀티에이전트 시스템** — 연구 에이전트, 코딩 에이전트, 분석 에이전트가 협업
- **오케스트레이션** — 에이전트 간 조율. "지휘자" 역할
- **Human-in-the-Loop** — 중요 결정에서 인간의 승인 요구
- **Guardrails** — 에이전트 행동의 안전 경계

### 에이전트 프레임워크

이건 변화가 빠른 영역이라 2026년 2월 기준으로 정리한다:

| 프레임워크 | 특징 |
|-----------|------|
| **LangChain** | LLM 앱 개발의 대표. 생태계가 넓음 |
| **LangGraph** | 그래프 기반 복잡한 워크플로. 상태 관리 강점 |
| **CrewAI** | 역할 기반 멀티에이전트 협업 |
| **AutoGen (MS)** | 대화 기반 멀티에이전트 |
| **Semantic Kernel (MS)** | 엔터프라이즈 AI SDK |
| **LlamaIndex** | 데이터 인덱싱 & RAG 특화 |

### MCP — 에이전트 세계의 HTTP

**MCP(Model Context Protocol)**는 2025년에 폭발적으로 채택된 프로토콜이다. 에이전트가 외부 도구, DB, API에 연결하는 방법을 표준화한 것. "MCP 서버를 운영하는 것이 웹 서버를 운영하는 것만큼 일반적"이라는 말이 나올 정도다. **A2A(Agent-to-Agent Protocol)**은 에이전트 간 통신 프로토콜로, 함께 알아두면 좋다.

---

## MLOps & LLMOps — 만들고 나서가 진짜

모델을 만드는 것보다 운영하는 게 더 어렵다는 건 SI 업계 사람들이라면 공감할 이야기.

**MLOps** 핵심 키워드:

- CI/CD for ML — 모델 학습/배포의 자동화
- 모델 레지스트리 — 버전 관리 (MLflow, Weights & Biases)
- 모델 서빙 — 실시간/배치 추론 (BentoML, Seldon, KServe)
- 모델 모니터링 — 성능 저하, 데이터 드리프트 탐지
- 실험 추적 — 파라미터/결과 기록
- 파이프라인 오케스트레이션 — Kubeflow, Airflow, Prefect
- 피처 스토어 — Feast, Tecton
- 데이터 버전 관리 — DVC

**LLMOps**는 LLM 특화 운영이다. 프롬프트 버전 관리, 임베딩 신선도 관리, 토큰 비용 최적화, 환각 모니터링, Human-in-the-Loop 플로우 같은 게 추가된다. 2026년에는 MLOps가 "핵심 엔지니어링 기능"으로 성숙했다는 평가를 받고 있다.

---

## 컴퓨터 비전 & 생성형 AI

### 컴퓨터 비전

이미지 분류(ResNet, EfficientNet, **ViT**), 객체 탐지(**YOLO 시리즈**, Faster R-CNN, DETR), 시맨틱/인스턴스 세그멘테이션(U-Net, Mask R-CNN), OCR이 주요 태스크다.

최근에는 **VLM(Vision-Language Model)**이 대세다. 이미지와 텍스트를 함께 이해하는 멀티모달 모델 — GPT-4V, Gemini, Claude의 비전 기능이 여기에 해당한다. Meta의 **SAM(Segment Anything)**이나 OpenAI의 **CLIP**(이미지-텍스트 연결)도 중요한 키워드.

### 생성형 AI

**Diffusion Model**이 이미지 생성의 주류다. Stable Diffusion, DALL-E, Midjourney가 대표적. Text-to-Image를 넘어 **Text-to-Video**(Sora, Runway), **Text-to-Speech**(ElevenLabs), **Speech-to-Text**(Whisper)까지 확장됐다.

코드 생성도 빼놓을 수 없다. GitHub Copilot, Cursor, Claude Code 같은 AI 코딩 도구는 이미 개발 실무에 깊이 들어와 있고, **Vibe Coding**이라는 용어까지 생겼다.

---

## AI 윤리, 보안, 거버넌스

처음엔 기술 키워드만 정리하면 되겠지 싶었는데, 조사할수록 윤리와 규제 쪽도 무시할 수 없었다. 특히 **EU AI Act**는 SI 업무와 직결된다.

### EU AI Act

2024년 8월 발효, 2026년 8월 전면 적용되는 세계 최초의 포괄적 AI 규제법이다. AI 시스템을 **4단계 리스크**(금지/고위험/제한적/최소)로 분류하고, 위반 시 최대 글로벌 매출의 7%까지 과징금을 물린다. 2025년 2월부터 AI 리터러시 의무가 시작됐고, 핀란드가 최초로 완전한 집행 권한을 가진 EU 회원국이 됐다.

### 기타 윤리/보안 키워드

- **편향(Bias)** & **공정성(Fairness)** — 데이터/알고리즘 편향이 결과에 미치는 영향
- **XAI(설명 가능한 AI)** — SHAP, LIME, Grad-CAM으로 모델 결정을 해석
- **AI Safety** — 의도치 않은 행동 방지, 정렬 문제
- **레드 팀(Red Teaming)** — 적대적 테스트로 취약점 발견
- **AI 워터마킹** — AI 생성물 식별 기술
- **Responsible AI** — 책임 있는 AI 개발/배포 원칙
- **환각 대응** — Hallucination 탐지 및 완화 전략
- **Prompt Injection** — 악의적 프롬프트로 시스템 프롬프트를 우회하는 공격. LLM 보안의 핵심 위협
- **Jailbreaking** — 모델의 안전 장치를 무력화하려는 시도
- **데이터 프라이버시** — GDPR, 개인정보보호법과 AI 학습 데이터의 관계. 민감 정보 유출 방지

---

## 클라우드 AI 서비스

SI 프로젝트에서 실제로 접하는 것들:

| 플랫폼 | 주요 서비스 |
|--------|------------|
| **AWS** | SageMaker, Bedrock(LLM API), Comprehend, Rekognition, Textract |
| **Azure** | Azure OpenAI Service, Azure ML, Cognitive Services, AI Search |
| **GCP** | Vertex AI, Gemini API, AutoML, Document AI |

공통적으로 알아야 할 개념은 API 기반 AI 서비스, 관리형 ML 플랫폼, 서버리스 추론, GPU 인스턴스, **AI Gateway**(LLM API 호출 관리/라우팅/비용 제어), 그리고 온프레미스 vs 클라우드의 의사결정 기준(데이터 주권, 보안, 비용)이다.

---

## 2025-2026 최신 트렌드

조사하면서 가장 재미있었던 파트. 변화가 빨라서 정리하는 족족 새로운 게 나오지만, 그래도 현재 시점에서 중요한 것들을 추렸다.

- **Agentic AI** — 자율적 목표 달성 AI. 2025-2026 최대 키워드
- **MCP** — 에이전트-도구 연결 표준. 2025년 폭발적 채택
- **Vibe Coding** — AI와 대화하며 코딩하는 패러다임
- **AI Coding Assistant** — Copilot, Cursor, Claude Code, Windsurf
- **SLM(Small Language Model)** — 경량 모델의 부상, 엣지 배포
- **멀티모달 AI** — 텍스트+이미지+음성+비디오 통합
- **Reasoning Model** — o1, DeepSeek-R1 등 추론 특화 모델
- **Context Engineering** — 프롬프트 엔지니어링의 진화
- **AI Guardrails** — NeMo Guardrails 등 운영 중 안전장치
- **Agentic Ops** — 에이전트 운영/모니터링 체계
- **Edge AI** — 엣지/온디바이스 AI 추론
- **Compound AI Systems** — 단일 모델이 아닌, 여러 모델/도구/검색을 조합한 복합 AI 시스템
- **Model Merging** — 여러 파인튜닝 모델을 가중 평균 등으로 합성하여 새 모델 생성
- **AI for Science** — AlphaFold(단백질 구조 예측), 신약 개발, 기후 모델링 등 과학에 AI 적용

---

## 공부하면서 참고하고 있는 도서

조사하면서 실제로 도움이 됐거나, 주변에서 추천받은 도서들이다.

### 기초 다지기

- **혼자 공부하는 머신러닝+딥러닝** (박해선, 한빛미디어) — 한국어 입문서 중 가장 접근성 좋다. 스토리텔링 방식이라 읽기 편함
- **핸즈온 머신러닝** 3판 (오렐리앙 제롱) — ML/DL 전반을 실습과 함께 체계적으로 다루는 실무자 바이블
- **밑바닥부터 시작하는 딥러닝** 시리즈 (사이토 고키) — 라이브러리 없이 직접 구현하며 원리를 이해하는 방식. 5권까지 나옴

### 깊이 있는 이해

- **Deep Learning** (Ian Goodfellow 외) — "꽃책"이라 불리는 딥러닝 이론의 바이블
- **패턴 인식과 머신 러닝** (Christopher Bishop) — 수학적으로 탄탄한 이론서

### LLM & 최신 AI 실무

- **LLM을 활용한 실전 AI 애플리케이션 개발** — Transformer부터 RAG, 에이전트까지 포괄
- **대규모 언어 모델, 핵심만 빠르게!** (인사이트) — LLM 핵심 개념 속성 학습
- **Designing Machine Learning Systems** (Chip Huyen, O'Reilly) — ML 시스템 설계와 MLOps 관점의 필독서
- **Prompt Engineering for Generative AI** (O'Reilly) — 프롬프트 엔지니어링 체계 정리

:::tip 출제 비중 — 내가 생각하는 배분
개발 엔지니어 대상이라면 LLM+프롬프트+RAG에 약 40%, 에이전트+최신 트렌드에 20%, ML/DL 기초에 20%, MLOps+클라우드에 15%, 윤리/거버넌스에 5% 정도가 적절하지 않을까 생각한다. SI 특성상 "AI를 시스템에 통합하는 관점"에 비중을 높이는 게 실무적으로 의미 있을 것 같다.
:::

이 글이 완벽한 건 아니다. AI 분야는 매달 새로운 키워드가 쏟아지고, 내가 조사한 것도 빠진 부분이 분명 있을 거다. 그래도 적어도 "어디서부터 봐야 하지?"라는 막막함은 좀 줄었다. 나도 아직 공부 중이고, 이 정리를 기반으로 계속 내용을 보강해갈 생각이다.
