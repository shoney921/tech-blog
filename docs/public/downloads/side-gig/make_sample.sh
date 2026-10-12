#!/bin/sh
# 따라 하기용 42초 한국어 합성 샘플을 만든다(macOS 전용, 외부 업로드 없음).
# 필요: macOS say(한국어 '유나' 음성), ffmpeg
# 사용: sh make_sample.sh sample-script.tsv   → sample.wav, sample.mp4 생성
#
# 화자 A는 "Yuna (Enhanced)", 화자 B는 기본 Yuna 음성을 낮게 바꿔 쓴다.
# 한국어 음성이 Yuna 하나만 받아져 있는 맥이 많아서 이렇게 했다.
# "Yuna (Enhanced)"가 없으면: 시스템 설정 > 손쉬운 사용 > 읽기 및 말하기 > 시스템 음성 > 음성 관리에서 받는다.
set -e
SCRIPT=${1:-sample-script.tsv}
WORK=$(mktemp -d)
i=0
: > "$WORK/concat.txt"
while IFS="$(printf '\t')" read -r spk voice text; do
  i=$((i + 1))
  if [ "$spk" = A ]; then
    say -v "Yuna (Enhanced)" -o "$WORK/seg$i.aiff" "$text"
    ffmpeg -loglevel error -y -i "$WORK/seg$i.aiff" -ar 16000 -ac 1 "$WORK/seg$i.wav"
  else
    say -v Yuna -o "$WORK/seg$i.aiff" "$text"
    ffmpeg -loglevel error -y -i "$WORK/seg$i.aiff" -af "asetrate=22050*0.82,aresample=16000,atempo=1.12" -ac 1 "$WORK/seg$i.wav"
  fi
  ffmpeg -loglevel error -y -f lavfi -i anullsrc=r=16000:cl=mono -t 0.7 "$WORK/sil$i.wav"
  echo "file '$WORK/seg$i.wav'" >> "$WORK/concat.txt"
  echo "file '$WORK/sil$i.wav'" >> "$WORK/concat.txt"
done < "$SCRIPT"
ffmpeg -loglevel error -y -f concat -safe 0 -i "$WORK/concat.txt" -c copy sample.wav
# 세로(1080x1920) 테스트 화면 + 위 음성 → FCPXML 실습용 영상
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 sample.wav)
ffmpeg -loglevel error -y -f lavfi -i testsrc2=size=1080x1920:rate=30 -i sample.wav \
  -map 0:v -map 1:a -t "$DUR" -c:v libx264 -pix_fmt yuv420p -c:a aac -ar 48000 sample.mp4
echo "sample.wav, sample.mp4 생성 (길이 ${DUR}초)"
