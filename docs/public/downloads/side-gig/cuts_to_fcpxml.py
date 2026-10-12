#!/usr/bin/env python3
"""컷 목록(CSV) → Final Cut Pro용 FCPXML. 표준 라이브러리만 사용.

CSV 열: start,end,note   (초 단위 소수 또는 HH:MM:SS,mmm)
  - 남길 구간만 적는다. 적힌 순서대로 타임라인에 이어 붙인다.
  - note 는 각 클립 첫 프레임에 마커로 들어간다.

사용: python3 cuts_to_fcpxml.py 원본.mp4 cuts.csv -o rough.fcpxml --fps 30
원본 해상도·길이는 ffprobe로 읽는다(ffprobe 필요).
"""
import argparse, csv, json, subprocess, sys
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

def probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_type,width,height,sample_rate,channels",
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def seconds(v: str) -> float:
    v = v.strip()
    if ":" in v:
        h, m, s = v.replace(",", ".").split(":")
        return int(h) * 3600 + int(m) * 60 + float(s)
    return float(v)

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("media", type=Path)
    ap.add_argument("cuts", type=Path)
    ap.add_argument("-o", "--out", type=Path, default=Path("rough.fcpxml"))
    ap.add_argument("--fps", type=int, default=30, help="정수 프레임레이트만 지원(24/25/30/60)")
    ap.add_argument("--name", default="AI 러프컷")
    a = ap.parse_args()

    info = probe(a.media)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    au = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    total_f = int(float(info["format"]["duration"]) * a.fps)
    t = lambda f: f"{f * 100}/{a.fps * 100}s"  # 프레임 수 → FCPXML 유리수 시간

    clips, offset = [], 0
    for i, row in enumerate(csv.DictReader(open(a.cuts, encoding="utf-8-sig")), 1):
        s, e = round(seconds(row["start"]) * a.fps), round(seconds(row["end"]) * a.fps)
        if not (0 <= s < e <= total_f):
            sys.exit(f"{i}행: 구간 {row['start']}~{row['end']} 이 원본 길이(0~{total_f / a.fps:.2f}s)를 벗어나거나 거꾸로임")
        note = (row.get("note") or "").strip()
        marker = f'\n          <marker start="{t(s)}" duration="{t(1)}" value={quoteattr(note)}/>' if note else ""
        clips.append(
            f'        <asset-clip ref="r2" name={quoteattr(f"컷 {i:02}")} offset="{t(offset)}" '
            f'start="{t(s)}" duration="{t(e - s)}" format="r1" tcFormat="NDF">{marker}\n        </asset-clip>')
        offset += e - s

    audio = (f' hasAudio="1" audioSources="1" audioChannels="{au["channels"]}" audioRate="{au["sample_rate"]}"'
             if au else "")
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.11">
  <resources>
    <format id="r1" frameDuration="{t(1)}" width="{v['width']}" height="{v['height']}"/>
    <asset id="r2" name={quoteattr(a.media.stem)} start="0s" duration="{t(total_f)}" hasVideo="1" format="r1"{audio}>
      <media-rep kind="original-media" src={quoteattr(a.media.resolve().as_uri())}/>
    </asset>
  </resources>
  <library>
    <event name={quoteattr(a.name)}>
      <project name={quoteattr(a.name)}>
        <sequence format="r1" duration="{t(offset)}" tcStart="0s" tcFormat="NDF">
          <spine>
{chr(10).join(clips)}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
'''
    a.out.write_text(xml, encoding="utf-8")
    print(f"{a.out}: 클립 {len(clips)}개, 총 {offset / a.fps:.2f}초 (원본 {total_f / a.fps:.2f}초)")

if __name__ == "__main__":
    main()
