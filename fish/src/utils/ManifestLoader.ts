/**
 * ManifestLoader.ts
 * 全局单例，持有 public/manifest.json 解析后的数据。
 * 在 LoadingScene.create() 中调用 init() 初始化，之后各模块可同步读取。
 */

interface ManifestData {
  version: number
  heroes:  Record<string, Record<string, string[]>>
  effects: Record<string, Record<string, string[]>>
  ui:      Record<string, string>
}

let _data: ManifestData | null = null

export const ManifestLoader = {
  /**
   * 注入 manifest 数据，必须在任何 getXxx() 调用之前执行。
   * LoadingScene.create() 中从 Phaser cache 取出 JSON 后调用此方法。
   */
  init(data: ManifestData): void {
    _data = data
  },

  isReady(): boolean {
    return _data !== null
  },

  /** 返回指定角色、指定动作的帧 URL 列表（已排序），不存在时返回空数组 */
  getHeroFrames(fishId: string, action: string): string[] {
    return _data?.heroes[fishId]?.[action] ?? []
  },

  hasHeroAction(fishId: string, action: string): boolean {
    return (_data?.heroes[fishId]?.[action]?.length ?? 0) > 0
  },

  /** 返回指定角色、指定特效类型的帧 URL 列表，不存在时返回空数组 */
  getEffectFrames(fishId: string, effType: string): string[] {
    return _data?.effects[fishId]?.[effType] ?? []
  },

  /** 返回 ui 资源路径，如 bg、sk */
  getUiPath(key: string): string {
    return _data?.ui[key] ?? ''
  },
}
