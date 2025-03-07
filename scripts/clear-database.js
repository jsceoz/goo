const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('开始清空数据库...')
  
  try {
    // 按照外键依赖关系的顺序删除
    // 先删除没有被引用的表
    await prisma.inventoryLog.deleteMany()
    console.log('已清空 InventoryLog 表')

    await prisma.item.deleteMany()
    console.log('已清空 Item 表')

    await prisma.product.deleteMany()
    console.log('已清空 Product 表')
    
    // await prisma.brick.deleteMany()
    // console.log('已清空 Brick 表')
    
    // await prisma.class.deleteMany()
    // console.log('已清空 Class 表')
    
    // await prisma.family.deleteMany()
    // console.log('已清空 Family 表')
    
    // await prisma.segment.deleteMany()
    // console.log('已清空 Segment 表')
    
    await prisma.cabinet.deleteMany()
    console.log('已清空 Cabinet 表')
    
    await prisma.room.deleteMany()
    console.log('已清空 Room 表')

    console.log('数据库清空完成！')
  } catch (error) {
    console.error('清空数据库失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase() 