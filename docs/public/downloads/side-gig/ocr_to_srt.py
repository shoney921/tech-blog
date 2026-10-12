#!/usr/bin/env python3
"""프레임별 OCR 결과(TSV: 경로<TAB>텍스트)를 SRT로 묶는다.
같은 자막이 이어지는 프레임을 하나로 합치고, 시간은 프레임 번호 ÷ fps 로 계산한다(±1/fps 오차)."""
import re, sys
from difflib import SequenceMatcher

def clean(t: str) -> str:
    # 한글이 하나도 없는 토큰(배경 무늬를 잘못 읽은 "3000", "•@" 등)은 버린다
    toks = [w for w in t.split() if re.search(r"[가-힣]", w)]
    return " ".join(toks)

def fmt(sec: float) -> str:
    ms = round(sec * 1000)
    h, ms = divmod(ms, 3_600_000); m, ms = divmod(ms, 60_000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

tsv, fps = sys.argv[1], float(sys.argv[2])
frames = [clean(l.rstrip("\n").split("\t", 1)[1] if "\t" in l else "") for l in open(tsv, encoding="utf-8")]
cues, cur, start = [], None, 0
for i, text in enumerate(frames + [""]):
    same = cur and text and SequenceMatcher(None, cur, text).ratio() > 0.8
    if same:
        continue
    if cur:
        cues.append((start / fps, i / fps, cur))
    cur, start = (text or None), i
for n, (s, e, t) in enumerate(cues, 1):
    print(f"{n}\n{fmt(s)} --> {fmt(e)}\n{t}\n")
