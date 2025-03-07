const sharp = require('sharp');

// 创建一个 1024x1024 的基础图标
sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: { r: 59, g: 130, b: 246, alpha: 1 } // Tailwind blue-500
  }
})
.composite([
  {
    input: Buffer.from(`
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <text x="512" y="512" text-anchor="middle" dominant-baseline="middle" font-size="600" font-family="Arial" fill="white">G</text>
      </svg>`
    ),
    top: 0,
    left: 0,
  }
])
.png()
.toFile('public/logo.png')
.then(() => console.log('Default icon created!'))
.catch(err => console.error('Error creating default icon:', err)); 