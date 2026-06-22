export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// 将秒数格式化为 "X.X" 字符串，用于倒计时显示
export function formatSeconds(seconds: number): string {
  return Math.max(0, seconds).toFixed(1)
}
