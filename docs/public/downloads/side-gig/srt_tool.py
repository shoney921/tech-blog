#!/usr/bin/env python3
"""SRT 점검·정리 도구 (표준 라이브러리만 사용, Python 3.9+)

  check   : 번호·시간 순서·겹침·한 줄 글자 수 점검
  fix     : 용어집 치환 + 줄바꿈 재배치 → 새 SRT
  vtt     : SRT → WebVTT
"""
import argparse, csv, re, sys
from dataclasses import dataclass
from typing import List

TIME = re.compile(r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})")

@dataclass
class Cue:
    idx: int
    start: int  # ms
    end: int
    text: str

def to_ms(s: str) -> int:
    h, m, sec, ms = map(int, TIME.match(s.strip()).groups())
    return ((h * 60 + m) * 60 + sec) * 1000 + ms

def fmt(ms: int, sep: str = ",") -> str:
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"

def parse(path: str) -> List[Cue]:
    raw = open(path, encoding="utf-8-sig").read().replace("\r\n", "\n")
    cues = []
    for block in re.split(r"\n\s*\n", raw.strip()):
        lines = block.split("\n")
        if len(lines) < 2 or "-->" not in lines[1]:
            sys.exit(f"형식 오류: {block[:40]!r}")
        a, b = lines[1].split("-->")
        cues.append(Cue(int(lines[0]), to_ms(a), to_ms(b), "\n".join(l.strip() for l in lines[2:])))
    return cues

def write_srt(cues: List[Cue], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for i, c in enumerate(cues, 1):
            f.write(f"{i}\n{fmt(c.start)} --> {fmt(c.end)}\n{c.text}\n\n")

def vlen(s: str) -> float:
    """넷플릭스 한국어 자막 기준 글자 수: 한글·한자 1자, 라틴 문자·숫자·공백·문장부호 0.5자"""
    return sum(1 if ord(ch) >= 0x1100 else 0.5 for ch in s)

def wrap(text: str, width: int) -> str:
    """어절 단위로 width 글자 안에서 최대 2줄로 나눈다. 넘치면 그대로 두고 check에서 잡는다."""
    words = text.replace("\n", " ").split()
    if vlen(" ".join(words)) <= width:
        return " ".join(words)
    best, best_gap = None, 10**9
    for k in range(1, len(words)):
        l1, l2 = " ".join(words[:k]), " ".join(words[k:])
        gap = abs(vlen(l1) - vlen(l2))
        if max(vlen(l1), vlen(l2)) <= width and gap < best_gap:
            best, best_gap = f"{l1}\n{l2}", gap
    return best or " ".join(words)

def fits(text: str, width: int) -> bool:
    return all(vlen(line) <= width for line in wrap(text, width).split("\n"))

def split_long(c: Cue, width: int) -> List[Cue]:
    """2줄에 안 들어가는 자막을 어절 단위로 나눈다. 문장 끝(.?!)에서 끊는 걸 우선한다.
    시간은 글자 수 비율로 나눈 근사치다. 정확한 경계가 필요하면 단어 타임스탬프(JSON)를 써야 한다."""
    if fits(c.text, width):
        return [c]
    chunks: List[str] = []
    cur = ""
    for w in c.text.replace("\n", " ").split():
        cand = f"{cur} {w}".strip()
        if cur and not fits(cand, width):
            chunks.append(cur)
            cur = w
        else:
            cur = cand
        if re.search(r"[.?!]$", cur) and vlen(cur) >= width * 0.6:
            chunks.append(cur)
            cur = ""
    if cur:
        chunks.append(cur)
    # 마지막 조각이 너무 짧으면("했어요." 한 단어만 남는 경우) 앞 조각에서 어절을 넘겨 균형을 맞춘다
    while len(chunks) >= 2 and vlen(chunks[-1]) < width * 0.5:
        head, tail = chunks[-2].split(), chunks[-1]
        if len(head) < 2 or not fits(f"{head[-1]} {tail}", width):
            break
        chunks[-2], chunks[-1] = " ".join(head[:-1]), f"{head[-1]} {tail}"
    total = sum(len(x) for x in chunks)
    out, t = [], c.start
    for i, ch in enumerate(chunks):
        end = c.end if i == len(chunks) - 1 else t + round((c.end - c.start) * len(ch) / total)
        out.append(Cue(c.idx, t, end, ch))
        t = end
    return out

def check(cues: List[Cue], width: int, max_cps: float) -> int:
    problems = 0
    for prev, c in zip([None] + cues[:-1], cues):
        where = f"#{c.idx} {fmt(c.start)}"
        if c.end <= c.start:
            print(f"{where} 끝 시간이 시작보다 빠르거나 같음"); problems += 1
        if prev and c.start < prev.end:
            print(f"{where} 앞 자막과 {prev.end - c.start}ms 겹침"); problems += 1
        for line in c.text.split("\n"):
            if vlen(line) > width:
                print(f"{where} 한 줄 {vlen(line):g}자 > {width}자: {line}"); problems += 1
        if c.text.count("\n") >= 2:
            print(f"{where} 3줄 이상"); problems += 1
        dur = (c.end - c.start) / 1000
        chars = len(c.text.replace("\n", "").replace(" ", ""))
        if dur > 0 and chars / dur > max_cps:
            print(f"{where} 읽기 속도 {chars / dur:.1f}자/초 > {max_cps}"); problems += 1
    print(f"자막 {len(cues)}개, 문제 {problems}건")
    return problems

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["check", "fix", "vtt"])
    ap.add_argument("src")
    ap.add_argument("-o", "--out")
    ap.add_argument("--glossary", help="CSV: 틀린말,바른말")
    ap.add_argument("--width", type=int, default=16, help="한 줄 최대 글자 수(한글 1, 라틴·숫자·공백·부호 0.5)")
    ap.add_argument("--max-cps", type=float, default=12.0, help="초당 글자 수 상한(공백 제외)")
    a = ap.parse_args()
    cues = parse(a.src)
    if a.cmd == "check":
        sys.exit(1 if check(cues, a.width, a.max_cps) else 0)
    if a.cmd == "fix":
        pairs = list(csv.reader(open(a.glossary, encoding="utf-8"))) if a.glossary else []
        fixed: List[Cue] = []
        for c in cues:
            for wrong, right in pairs:
                c.text = c.text.replace(wrong, right)
            for piece in split_long(c, a.width):
                piece.text = wrap(piece.text, a.width)
                fixed.append(piece)
        write_srt(fixed, a.out or a.src.replace(".srt", ".fixed.srt"))
    if a.cmd == "vtt":
        with open(a.out or a.src.replace(".srt", ".vtt"), "w", encoding="utf-8") as f:
            f.write("WEBVTT\n\n")
            for c in cues:
                f.write(f"{fmt(c.start, '.')} --> {fmt(c.end, '.')}\n{c.text}\n\n")

if __name__ == "__main__":
    main()
