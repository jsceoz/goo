const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('crypto')
const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const prisma = new PrismaClient()
const DEFAULT_USER_ID = 'bcc5acd9-8f72-4afe-9194-a45452296153'

async function importLocations() {
  try {
    // 读取 YAML 文件
    const filePath = path.join(__dirname, '../data/location.yaml')
    console.log('Reading location data from:', filePath)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const data = yaml.load(fileContents)
    console.log('Found rooms:', data.rooms.length)

    console.log('Importing locations...')

    // 清除现有数据
    console.log('Clearing existing data...')
    await prisma.cabinet.deleteMany()
    await prisma.room.deleteMany()
    console.log('Existing data cleared')

    // 导入房间和柜子
    for (const room of data.rooms) {
      console.log(`Creating room: ${room.name} with ${room.cabinets.length} cabinets`)
      const createdRoom = await prisma.room.create({
        data: {
          id: randomUUID(),
          name: room.name,
          userId: DEFAULT_USER_ID,
          updatedAt: new Date(),
          cabinets: {
            create: room.cabinets.map(cabinet => ({
              id: randomUUID(),
              name: cabinet.name,
              userId: DEFAULT_USER_ID,
              updatedAt: new Date()
            }))
          }
        }
      })
      console.log(`Created room: ${createdRoom.name}`)
    }

    console.log('Location import completed successfully!')
  } catch (error) {
    console.error('Error importing locations:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行导入
importLocations()
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  }) 