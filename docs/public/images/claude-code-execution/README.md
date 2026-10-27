# Claude Code 내부 동작 원리 — 이미지 제작 기록

2026-10-27. 내장 image_gen으로 각각 생성한 개념 삽화 6장. 공식 제품 이미지·로고·화면이 아니다. 원본 1536×1024 PNG를 sips로 JPEG(품질 76) 변환했다. 기존 `/images/<주제>/` 규칙에 맞춰 저장했다.

`execution-flow.svg`는 공개 문서를 바탕으로 직접 작성한 구조도다. 삽화의 화살표는 비유이며, 실행 순서는 구조도와 본문이 기준이다.

## 최종 생성 프롬프트

### hero.jpg

Use case: illustration-story. Asset: landscape editorial illustration for a Korean technical blog, 1536x1024. Unified art direction: warm ivory paper, dark navy ink outlines, muted teal and burnt orange, gentle hand-drawn gouache texture, simple charming geometric workshop objects, generous margins, readable at 688px. No text, no letters, no logos, no watermarks, no imitation product UI. A conceptual metaphor, not an official architecture. Scene: A cutaway miniature workshop: a small unbranded cream mechanical assistant at a central workbench, incoming task cards on left, tools on a wall, a small permission gate, a canvas backpack, and a finished checked card on right. Coherent inviting scene, restrained details.

### agent-loop.jpg

Use case: illustration-story. Asset: landscape editorial illustration for a Korean technical blog, 1536x1024. Unified art direction: warm ivory paper, dark navy ink outlines, muted teal and burnt orange, gentle hand-drawn gouache texture, simple charming geometric workshop objects, generous margins, readable at 688px. No text, no letters, no logos, no watermarks, no imitation product UI. A conceptual metaphor, not an official architecture. Scene: A very clear conceptual loop of four stations arranged clockwise: incoming paper task upper left, small mechanical reasoning assistant upper right, wrench and file workbench lower right, magnifying glass inspecting result card lower left. Teal curved arrows connect each station clockwise and back to assistant. A small finished card exits at right. Minimal symbols, ample space.

### permission-gate.jpg

Use case: illustration-story. Asset: landscape editorial illustration for a Korean technical blog, 1536x1024. Unified art direction: warm ivory paper, dark navy ink outlines, muted teal and burnt orange, gentle hand-drawn gouache texture, simple charming geometric workshop objects, generous margins, readable at 688px. No text, no letters, no logos, no watermarks, no imitation product UI. A conceptual metaphor, not an official architecture. Scene: A small mechanical assistant carrying a wrench waits at a teal garden-style gate separating a planning desk from a workshop. A human hand holds a key next to gate, with a red stop marker and small approved card. The assistant cannot simply reach across the gate. Warm, friendly, spacious scene.

### context-backpack.jpg

Use case: illustration-story. Asset: landscape editorial illustration for a Korean technical blog, 1536x1024. Unified art direction: warm ivory paper, dark navy ink outlines, muted teal and burnt orange, gentle hand-drawn gouache texture, simple charming geometric workshop objects, generous margins, readable at 688px. No text, no letters, no logos, no watermarks, no imitation product UI. A conceptual metaphor, not an official architecture. Scene: An open teal canvas backpack with limited space, papers and maps overflowing beside it; a small mechanical assistant selects a compact neatly folded summary map, leaving a labelled-by-color archive box nearby. Some small details remain on discarded loose sheets. No writing, no compression machine, thoughtful mood.

### extensions.jpg

Use case: illustration-story. Asset: landscape editorial illustration for a Korean technical blog, 1536x1024. Unified art direction: warm ivory paper, dark navy ink outlines, muted teal and burnt orange, gentle hand-drawn gouache texture, simple charming geometric workshop objects, generous margins, readable at 688px. No text, no letters, no logos, no watermarks, no imitation product UI. A conceptual metaphor, not an official architecture. Scene: A central small mechanical assistant at a round workbench with five distinct metaphor objects around it: event bell, tiny separate research desk with a second assistant, recipe booklet, connector cable reaching a filing cabinet, and a command card. Each distinct and balanced, connected by subtle teal paths. Not a technical diagram.

### human-review.jpg

Use case: illustration-story. Asset: landscape editorial illustration for a Korean technical blog, 1536x1024. Unified art direction: warm ivory paper, dark navy ink outlines, muted teal and burnt orange, gentle hand-drawn gouache texture, simple charming geometric workshop objects, generous margins, readable at 688px. No text, no letters, no logos, no watermarks, no imitation product UI. A conceptual metaphor, not an official architecture. Scene: Human hands and a small mechanical assistant collaborate at a desk. Assistant presents a changed paper and a checked test card. Human compares two documents through a magnifying glass. A little delivery parcel waits unopened at far right behind an orange boundary line. Calm deliberate review moment.
