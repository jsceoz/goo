const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始重置数据库...');

    // 1. 删除所有表
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
    
    const tables = [
      'inventorylog',
      'item',
      'product',
      'cabinet',
      'room',
      'verificationcode',
      'user',
      'brick',
      'class',
      'family',
      'segment'
    ];

    for (const table of tables) {
      console.log(`删除表 ${table}...`);
      await prisma.$executeRaw`DROP TABLE IF EXISTS ${table}`;
    }

    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

    // 2. 删除所有迁移记录
    console.log('删除迁移记录...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS _prisma_migrations`;

    // 3. 重新推送数据库结构
    console.log('重新创建数据库结构...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });

    console.log('数据库重置完成！');
  } catch (error) {
    console.error('重置失败:', error);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  }); 