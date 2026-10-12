// 이미지 파일들을 Apple Vision으로 OCR한다. 사용: swift ocr.swift 이미지1.png 이미지2.png ...
// 출력: 파일경로<TAB>인식된 텍스트(줄은 공백으로 이음)
import Foundation
import Vision
for path in CommandLine.arguments.dropFirst() {
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["ko-KR", "en-US"]
    req.usesLanguageCorrection = true
    let handler = VNImageRequestHandler(url: URL(fileURLWithPath: path))
    try? handler.perform([req])
    let text = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
    print("\(path)\t\(text)")
}
