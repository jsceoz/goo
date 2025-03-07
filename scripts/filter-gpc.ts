import fs from 'fs';
import readline from 'readline';

async function filterGpcData() {
  // 创建输入输出流
  const fileStream = fs.createReadStream('data/gpc.jsonl');
  const outputStream = fs.createWriteStream('data/gpc-filtered.jsonl');
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let totalLines = 0;
  let filteredLines = 0;

  // 逐行处理
  for await (const line of rl) {
    totalLines++;
    try {
      const data = JSON.parse(line);
      
      // 只保留 hierarchy = 4 的数据
      if (data.hierarchy === 4) {
        outputStream.write(line + '\n');
        filteredLines++;
      }
    } catch (error) {
      console.error('Error parsing line:', error);
    }
  }

  // 关闭流
  outputStream.end();

  // 输出统计信息
  console.log(`总行数: ${totalLines}`);
  console.log(`保留行数: ${filteredLines}`);
  console.log(`删除行数: ${totalLines - filteredLines}`);

  // 替换原文件
  fs.renameSync('data/gpc-filtered.jsonl', 'data/gpc.jsonl');
  console.log('文件处理完成');
}

// 执行过滤
filterGpcData().catch(console.error); 