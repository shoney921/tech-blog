// Public-facing summaries based on the individual projects' introduction files.
// These are personal projects, not claims of a public launch or measured results.
export const projects = [
  {
    id: 'nadarm', name: '나닮', english: 'Nadarm', tagline: '나를 닮아가는 AI 일기.',
    type: 'AI 서비스 · 개인 프로젝트', tags: ['FastAPI', 'React', 'PostgreSQL · pgvector', 'LangChain'],
    phrase: 'A little more<br>like you.', next: 'macrelay',
    sections: [
      ['기록이 대화가 된다면', ['일기를 쓰고 다시 읽는 일에서 한 걸음 더 나아가 보고 싶었습니다. 내가 남긴 기록을 AI가 이해하고, 그 기록에 바탕을 둔 나만의 페르소나와 대화하는 서비스입니다.', '기록을 바탕으로 나 자신을 돌아보는 대화와, 친구의 페르소나를 통해 서로를 이해하는 경험을 함께 다룹니다. 친구의 일기 원문을 직접 공개하는 방식은 아닙니다.']],
      ['화면 하나보다, 연결된 경험', ['일기 작성, 성격 퀴즈, 페르소나 생성, 대화 기능이 하나의 흐름으로 이어집니다. 백엔드는 FastAPI와 PostgreSQL, 프론트엔드는 React를 사용하고 AI 기능을 연결했습니다.', '서비스를 만드는 과정은 모델 호출에서 끝나지 않았습니다. 화면의 상태 관리와 캐싱, 모바일 연동, OAuth, 배포와 운영까지 연결해야 사용자가 실제로 사용할 수 있는 경험이 됩니다.']],
      ['만들면서 남긴 기록', ['기술 선택과 구현 과정은 블로그의 나닮 개발 기록에 정리했습니다. 프론트엔드와 백엔드의 선택, PWA와 캐싱, 모바일 인증과 배포 과정에서 겪은 문제를 읽을 수 있습니다.']],
    ],
    status: '개인 프로젝트의 개요입니다. 이 페이지는 현재 서비스 가입 가능 여부나 스토어 배포 상태를 보증하지 않습니다. 개발 과정은 아래 블로그 기록에서 확인할 수 있습니다.',
    link: { href: 'https://blog.shoneylife.com/posts/nadarm/', label: '나닮 개발 기록 읽기' },
  },
  {
    id: 'macrelay', name: 'macrelay', english: 'macrelay', tagline: '생각은 폰에서. 실행은 맥에서.',
    type: '개발 도구 · 개인 사용', tags: ['Cloudflare Workers', 'WebSocket', 'Claude Code · Cursor', '암호화'],
    phrase: 'Small screen.<br>Real work.', next: 'cutroom',
    sections: [
      ['책상 밖에서도 개발을 이어 가고 싶어서', ['폰에서 떠오른 생각을 맥의 개발 환경으로 이어 보내는 도구입니다. 폰이나 다른 브라우저에서 Claude Code 또는 Cursor와 대화하고, 실제 개발 작업은 맥에서 실행합니다.', '작은 화면으로 모든 개발 환경을 옮기기보다, 폰은 대화와 확인을 맡고 작업에 필요한 환경은 맥에 남겨 두는 구성을 택했습니다.']],
      ['화면과 실행 환경 사이의 연결', ['브라우저, Cloudflare Worker와 Durable Object를 사용하는 릴레이, 맥의 데몬을 WebSocket으로 연결합니다. 대화 세션과 실행 결과가 이 연결을 통해 오갑니다.', '프롬프트와 답변, 도구 호출은 암호화된 내용으로 전달합니다. 연결이 끊겼을 때의 재전송과 입력 문제처럼, 실제 사용 과정에서 생기는 불편함을 줄이는 것도 작업의 중요한 부분입니다.']],
      ['나에게 맞는 개발 흐름', ['이 프로젝트의 관심사는 원격 터미널 화면을 그대로 옮기는 데 있지 않습니다. 생각을 보내고, 진행 상황을 확인하고, 필요할 때 다시 지시하는 흐름을 폰에서 다루기 쉽게 만드는 것입니다.', '현재는 개인 개발 환경을 위한 도구로 소개합니다. 이 홈페이지에서는 실제 원격 제어 주소나 개인 환경에 접근할 수 있는 링크를 공개하지 않습니다.']],
    ],
    status: '개인용 개발 도구입니다. 이 소개 페이지에서 원격 작업을 실행하거나 계정·토큰을 입력받지 않습니다.',
    link: { href: 'https://blog.shoneylife.com/posts/ai-llm/', label: 'AI와 개발 도구에 관한 기록' },
  },
  {
    id: 'cutroom', name: 'Cutroom', english: 'Cutroom', tagline: '원본의 긴 시간에서, 남기고 싶은 순간으로.',
    type: '영상 도구 · 개인 사용 · macOS', tags: ['자막 전사', 'whisper.cpp', 'FCPXML', 'Codex 연동'],
    phrase: 'Find the<br>good parts.', next: 'darkroom',
    sections: [
      ['편집 전에 반복하는 일들', ['촬영 원본을 확인하고, 말을 글로 옮기고, 말한 구간을 찾아 자르고, Final Cut에서 편집을 이어 가는 흐름을 다룹니다. 반복되는 준비 작업을 도구로 묶어 보고 싶어 시작했습니다.', 'Cutroom은 원본 파일에서 자막을 만들고, 자막과 규칙을 기준으로 컷을 구성한 뒤, Final Cut에서 이어 편집할 수 있는 FCPXML과 SRT를 내보내는 개인용 도구입니다.']],
      ['영상 자체보다, 우선 자막에서', ['전사에는 whisper.cpp 또는 macOS의 내장 전사 기능을 사용합니다. 앞뒤 여유 시간, 구간 연결 간격, 포함하거나 제외할 단어 등의 규칙으로 말한 구간을 편집할 수 있습니다.', '선택적으로 AI가 자막을 읽고 서로 다른 편집 아이디어를 제안합니다. AI가 영상을 직접 보고 장면을 판단한다고 가정하지 않습니다. 사용자가 후보를 확인하고 선택하는 흐름입니다.']],
      ['Final Cut과 이어지는 작업', ['최종 결과를 영상 파일 하나로 굳히기보다, 원본을 유지하며 편집을 이어 갈 수 있는 형태로 내보냅니다. FCPXML을 Final Cut으로 가져와 타이밍과 자막 스타일을 조정할 수 있습니다.', '이 도구의 배경이 된 영상 편집과 자막 자동화에 관한 생각은 블로그의 영상 편집 기록에 남겼습니다.']],
    ],
    status: 'macOS에서 사용하는 개인 개발 도구입니다. 공개 다운로드나 제품 지원을 제공하는 페이지가 아닙니다.',
    link: { href: 'https://blog.shoneylife.com/posts/side-gig/video-editing/', label: '영상 편집과 자동화 기록 읽기' },
  },
  {
    id: 'darkroom', name: 'Darkroom', english: 'Darkroom', tagline: '빛과 색을 다루는 나만의 작은 암실.',
    type: '사진 도구 · 개인 사용 · macOS', tags: ['Swift · SwiftUI', 'Core Image', 'RAW 현상', 'Metal'],
    phrase: 'A different<br>way to see.', next: 'nadarm',
    sections: [
      ['사진을 다루는 도구를 만들어 보기', ['RAW 사진을 읽고 빛과 색을 조절하는 macOS용 개인 편집기입니다. 사진을 정리하고 현상하는 과정에 관심을 갖고, 익숙한 웹과 백엔드 밖의 기술로 도구를 만들어 보고 있습니다.', '완성된 상용 편집기의 기능을 모두 구현하기보다, RAW 이미지를 불러오고 편집 상태를 관리하며 화면에 결과를 보여 주는 핵심 흐름부터 다룹니다.']],
      ['사진 한 장이 화면에 보이기까지', ['SwiftUI로 화면을 만들고 Core Image의 RAW 필터와 Metal 기반 커널을 사용합니다. RAW 이미지의 렌더링과 편집 상태, 사진의 분류 정보를 각각 다루는 구조입니다.', '편집 값을 바꿀 때 어떤 작업을 다시 수행해야 하는지, 화면에 표시할 결과를 어떻게 전달할지처럼 앱의 사용감과 맞닿아 있는 문제를 살펴보고 있습니다.']],
      ['만들면서 배우는 다른 영역', ['백엔드에서 주로 다루던 요청과 데이터의 흐름이 이미지 파이프라인에서는 다른 형태로 나타납니다. 큰 이미지를 다루는 비용, 상태와 결과의 연결, 화면 반응을 생각하는 과정 자체가 이 프로젝트의 경험입니다.']],
    ],
    status: '개인적으로 개발하는 RAW 편집 도구입니다. 동명의 다른 제품과 관계없으며, 공개 판매·배포 상태를 뜻하지 않습니다.',
    link: { href: 'https://blog.shoneylife.com/', label: '다른 개발 기록 읽기' },
  },
]
