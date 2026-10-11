// 글 속 "직접 만져 보기" 위젯들이 같이 쓰는 계산·표기 함수

/** 0~1 확률을 퍼센트 문자열로. 100에 붙은 값은 "확실하다"로 읽히지 않게 자릿수를 늘린다 */
export function pct(v: number, digits = 1) {
  const x = v * 100
  if (x >= 100) return '100%'
  if (x <= 0) return '0%'
  if (x > 99.9) return `${Math.min(x, 99.99).toFixed(2)}%`
  if (x < 0.1) return '0.1% 미만'
  return `${parseFloat(x.toFixed(digits))}%`
}

/** 표준정규 누적분포 Φ(x). Abramowitz–Stegun 7.1.26 근사 (오차 1e-7 수준) */
export function normCdf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2)
  const y =
    1 -
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
      Math.exp((-x * x) / 2)
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

export function normPdf(x: number) {
  return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI)
}

/** 이항 비율의 Wilson 95% 신뢰구간 */
export function wilson(p: number, n: number, z = 1.96) {
  const z2 = z * z
  const center = (p + z2 / (2 * n)) / (1 + z2 / n)
  const half = (z / (1 + z2 / n)) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return [Math.max(0, center - half), Math.min(1, center + half)] as const
}
