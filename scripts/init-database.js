const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function initDatabase() {
  console.log('开始初始化数据库...')
  
  // 检查环境变量
  if (!process.env.DATABASE_URL) {
    console.error('错误: DATABASE_URL 环境变量未设置');
    process.exit(1);
  }

  try {
    // 测试数据库连接
    console.log('测试数据库连接...')
    await prisma.$connect()
    console.log('数据库连接成功')

    // 检查表结构
    const tables = await prisma.$queryRaw`
      SHOW TABLES;
    `
    console.log('数据库中的表:', tables)

    // 检查 Item 表结构
    const itemTableInfo = await prisma.$queryRaw`
      DESCRIBE Item;
    `
    console.log('Item 表结构:', itemTableInfo)

    // 检查是否需要初始化
    try {
      // 尝试查询 Room 表，如果不存在会抛出错误
      await prisma.room.findFirst()
      console.log('数据库已初始化，跳过迁移')
    } catch (error) {
      // 表不存在，需要执行迁移
      console.log('数据库未初始化，开始执行迁移...')
      
      // 执行数据库迁移
      console.log('执行数据库迁移...')
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      
      //导入基础数据
      console.log('导入房间数据...')
      execSync('node scripts/import-locations.js', { stdio: 'inherit' })
    
      console.log('导入分类数据...')
      execSync('node scripts/import-gpc-json.js', { stdio: 'inherit' })
    }
    
    console.log('数据库初始化完成！')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

initDatabase()