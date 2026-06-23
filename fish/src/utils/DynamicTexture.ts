import Phaser from 'phaser'

/** PNG URL 转 Phaser 纹理 key：取文件名去掉 .png 后缀 */
export function urlToTextureKey(url: string): string {
  const filename = url.split('/').pop() ?? url
  return filename.endsWith('.png') ? filename.slice(0, -4) : filename
}

/**
 * 动态加载一张 PNG 到 Phaser 纹理缓存，并在加载完成后回调。
 * 适用于卡片头像、弹窗立绘、CTA 主视觉等非预加载资源。
 */
export function ensureTexture(
  scene: Phaser.Scene,
  url: string,
  onReady: (key: string) => void,
): void {
  if (!url) return

  const key = urlToTextureKey(url)
  if (scene.textures.exists(key)) {
    onReady(key)
    return
  }

  const img = new Image()
  img.onload = () => {
    if (!scene.textures.exists(key)) {
      scene.textures.addImage(key, img)
    }
    onReady(key)
  }
  img.onerror = () => {
    console.error(`[DynamicTexture] 加载失败: ${url}`)
  }
  img.src = url
}

export function ensureTexturePromise(
  scene: Phaser.Scene,
  url: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('empty texture url'))
      return
    }

    const key = urlToTextureKey(url)
    if (scene.textures.exists(key)) {
      resolve(key)
      return
    }

    const img = new Image()
    img.onload = () => {
      if (!scene.textures.exists(key)) {
        scene.textures.addImage(key, img)
      }
      resolve(key)
    }
    img.onerror = () => {
      console.error(`[DynamicTexture] 加载失败: ${url}`)
      reject(new Error(`texture load failed: ${url}`))
    }
    img.src = url
  })
}

export async function ensureTexturesPromise(
  scene: Phaser.Scene,
  urls: string[],
): Promise<void> {
  const uniqueUrls = [...new Set(urls.filter(Boolean))]
  await Promise.all(uniqueUrls.map(url => ensureTexturePromise(scene, url)))
}

/** 将动态 PNG 设置到现有 Image 上，并在成功后显示。 */
export function applyTextureToImage(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  url: string,
): void {
  if (!url) {
    image.setVisible(false)
    return
  }

  ensureTexture(scene, url, (key) => {
    if (!image.scene) return
    image.setTexture(key)
    image.setVisible(true)
  })
}
