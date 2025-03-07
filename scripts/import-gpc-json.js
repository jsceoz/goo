const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importGPC() {
  console.log('Initializing import process...')
  
  const jsonFilePath = path.resolve(__dirname, '../data/gpc.json')
  console.log('Reading JSON file from:', jsonFilePath)
  
  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8')
  const records = JSON.parse(fileContent)
  console.log('Total records loaded:', records.length)

  // 按层级分组
  const levelMap = new Map()
  for (const record of records) {
    if (!levelMap.has(record.hierarchy)) {
      levelMap.set(record.hierarchy, [])
    }
    levelMap.get(record.hierarchy).push(record)
  }
  console.log('Records grouped by hierarchy:', Array.from(levelMap.keys()))

  // 创建父ID到记录的映射，用于快速查找
  const idMap = new Map()
  for (const record of records) {
    idMap.set(record.ID, record)
  }

  console.log('Starting database operations...')

  try {
    console.log('Clearing existing data...')
    // 清空现有数据（按照外键关系的反序删除）
    await prisma.brick.deleteMany()
    await prisma.Renamedclass.deleteMany()
    await prisma.family.deleteMany()
    await prisma.segment.deleteMany()
    console.log('Existing data cleared successfully')

    // 导入第一级：Segment
    console.log('Importing Segments...')
    const segments = new Map() // code -> id mapping
    for (const record of levelMap.get(1) || []) {
      const segment = await prisma.segment.create({
        data: {
          id: String(record.ID),
          code: record.Code,
          name: record.Description,
          updatedAt: new Date()
        }
      })
      segments.set(record.Code, segment.id)
    }
    console.log('Segments imported:', segments.size)

    // 导入第二级：Family
    console.log('Importing Families...')
    const families = new Map() // code -> id mapping
    for (const record of levelMap.get(2) || []) {
      const parentRecord = idMap.get(record.PID)
      const segment = segments.get(parentRecord.Code)
      const family = await prisma.family.create({
        data: {
          id: String(record.ID),
          code: record.Code,
          name: record.Description,
          segmentId: segment,
          updatedAt: new Date()
        }
      })
      families.set(record.Code, family.id)
    }
    console.log('Families imported:', families.size)

    // 导入第三级：Class
    console.log('Importing Classes...')
    const classes = new Map() // code -> id mapping
    for (const record of levelMap.get(3) || []) {
      const parentRecord = idMap.get(record.PID)
      const family = families.get(parentRecord.Code)
      const cls = await prisma.Renamedclass.create({
        data: {
          id: String(record.ID),
          code: record.Code,
          name: record.Description,
          familyId: family,
          updatedAt: new Date()
        }
      })
      classes.set(record.Code, cls.id)
    }
    console.log('Classes imported:', classes.size)

    // 导入第四级：Brick
    console.log('Importing Bricks...')
    let brickCount = 0
    for (const record of levelMap.get(4) || []) {
      const parentRecord = idMap.get(record.PID)
      const cls = classes.get(parentRecord.Code)
      await prisma.brick.create({
        data: {
          id: String(record.ID),
          code: record.Code,
          name: record.Description,
          classId: cls,
          updatedAt: new Date()
        }
      })
      brickCount++
    }
    console.log('Bricks imported:', brickCount)

    console.log('Import completed successfully!')
  } catch (error) {
    console.error('Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importGPC().catch(error => {
  console.error('Import failed:', error)
  process.exit(1)
})