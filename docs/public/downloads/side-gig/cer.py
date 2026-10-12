#!/usr/bin/env python3
"""정답 대본과 SRT를 비교해 글자 오류율(CER)을 계산한다.
공백·문장부호는 지우고 비교한다. --digits 를 주면 숫자 표기 차이(2시간/두 시간)를 정답 쪽 표기로 맞춘 뒤 계산."""
import re, sys

def norm(s: str) -> str:
    return re.sub(r"[\s.,?!·\"'“”‘’…-]", "", s)

def edit_distance(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]

def srt_text(path: str) -> str:
    out = []
    for line in open(path, encoding="utf-8-sig"):
        line = line.strip()
        if not line or line.isdigit() or "-->" in line:
            continue
        out.append(line)
    return " ".join(out)

ref_path, hyp_path = sys.argv[1], sys.argv[2]
ref = " ".join(l.split("\t")[-1] for l in open(ref_path, encoding="utf-8").read().splitlines())
hyp = srt_text(hyp_path)
if "--digits" in sys.argv:
    for a, b in [("2시간", "두시간"), ("1개", "한개"), ("3만", "삼만"), ("2 시간", "두 시간")]:
        hyp = hyp.replace(a, b)
r, h = norm(ref), norm(hyp)
d = edit_distance(r, h)
print(f"정답 {len(r)}자, 편집거리 {d}, CER {d / len(r) * 100:.1f}%")
