import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const publicDir = join(__dirname, '..', 'public')

const svgBuffer = readFileSync(join(publicDir, 'favicon.svg'))

// Generate different sizes
const sizes = [
  { name: 'favicon.png', size: 32 },
  { name: 'favicon.ico', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 }
]

for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name))
  console.log(`Generated ${name}`)
}

console.log('All icons generated!')
