export type GameMode = 'win' | 'lose'

// 从 URL 参数读取游戏模式，未传或未知值均默认 win
export function detectMode(): GameMode {
  const params = new URLSearchParams(window.location.search)
  return params.get('mode') === 'lose' ? 'lose' : 'win'
}
