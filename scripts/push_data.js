import readline from 'readline';
import fs from 'fs';
import * as XLSX from 'xlsx';

let API_BASE_URL = "http://localhost:3001/api";

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      parsed[key] = value;
    }
  }
  return parsed;
}

function initApiUrl(args) {
  if (args.api) {
    API_BASE_URL = args.api;
  } else if (args.host || args.port) {
    const host = args.host || 'localhost';
    const port = args.port || '3001';
    API_BASE_URL = `http://${host}:${port}/api`;
  }
  console.log(`API地址: ${API_BASE_URL}`);
}

async function pushTask(taskData) {
  const url = `${API_BASE_URL}/tasks`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log(`[OK] 成功推送任务: ${taskData.customNumber}`);
    return result;
  } catch (error) {
    console.error(`[ERR] 推送失败: ${error.message}`);
    return null;
  }
}

async function pushTasks(tasks) {
  const results = [];
  for (const task of tasks) {
    const result = await pushTask(task);
    if (result) results.push(result);
  }
  console.log(`\n批量推送完成，成功 ${results.length} 条`);
  return results;
}

async function getAllTasks() {
  const url = `${API_BASE_URL}/tasks`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`获取数据失败: ${error.message}`);
    return [];
  }
}

async function updateTask(taskId, updates) {
  const url = `${API_BASE_URL}/tasks/${taskId}`;
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log(`[OK] 成功更新任务: ${taskId}`);
    return result;
  } catch (error) {
    console.error(`[ERR] 更新失败: ${error.message}`);
    return null;
  }
}

async function deleteTask(taskId) {
  const url = `${API_BASE_URL}/tasks/${taskId}`;
  try {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log(`[OK] 成功删除任务: ${taskId}`);
    return result;
  } catch (error) {
    console.error(`[ERR] 删除失败: ${error.message}`);
    return null;
  }
}

async function pushFromExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const tasks = [];
    const requiredFields = ['projectNumber', 'person', 'customNumber', 'customContent', 'deliveryPath', 'hours', 'deliveryTime'];
    
    data.forEach((row) => {
      const task = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = String(key).toLowerCase();
        if (lowerKey.includes('项目号') || lowerKey.includes('project')) {
          task['projectNumber'] = String(value);
        } else if (lowerKey.includes('人员') || lowerKey.includes('person')) {
          task['person'] = String(value);
        } else if (lowerKey.includes('个性化号') || lowerKey.includes('customnumber')) {
          task['customNumber'] = String(value);
        } else if (lowerKey.includes('个性化内容') || lowerKey.includes('customcontent')) {
          task['customContent'] = String(value);
        } else if (lowerKey.includes('交付路径') || lowerKey.includes('deliverypath')) {
          task['deliveryPath'] = String(value);
        } else if (lowerKey.includes('消耗人时') || lowerKey.includes('hours')) {
          task['hours'] = parseFloat(String(value)) || 0;
        } else if (lowerKey.includes('交付时间') || lowerKey.includes('deliverytime')) {
          task['deliveryTime'] = String(value);
        }
      }
      if (task.projectNumber && task.person) {
        tasks.push(task);
      }
    });
    
    console.log(`从Excel文件读取到 ${tasks.length} 条数据`);
    return pushTasks(tasks);
  } catch (error) {
    console.error(`[ERR] 读取Excel文件失败: ${error.message}`);
    return [];
  }
}

function pushFromArgs(args) {
  const taskData = {
    projectNumber: args.projectNumber || '',
    person: args.person || '',
    customNumber: args.customNumber || '',
    customContent: args.customContent || '',
    deliveryPath: args.deliveryPath || '',
    hours: parseFloat(args.hours || '0'),
    deliveryTime: args.deliveryTime || ''
  };
  
  if (!taskData.projectNumber || !taskData.person) {
    console.log("[ERR] 缺少必要参数: --projectNumber 和 --person 为必填");
    return null;
  }
  
  return pushTask(taskData);
}

async function interactiveMode() {
  const sampleTask = {
    projectNumber: "P006",
    person: "钱七",
    customNumber: "C016",
    customContent: "系统性能优化",
    deliveryPath: "/docs/P006/优化报告.docx",
    hours: 20,
    deliveryTime: "2024-06-01",
  };

  console.log("=== 项目统计数据推送脚本 ===");
  console.log(`当前API地址: ${API_BASE_URL}`);
  console.log("");
  console.log("使用方法:");
  console.log("  node push_data.js --push --projectNumber P001 --person 张三 ...");
  console.log("  node push_data.js --excel <Excel文件路径>");
  console.log("");
  console.log("指定服务器(可选):");
  console.log("  node push_data.js --api http://192.168.1.100:3001/api");
  console.log("  node push_data.js --host 192.168.1.100 --port 3001");
  console.log("");
  console.log("默认API地址: http://localhost:3001/api");
  console.log("");
  console.log("1. 推送单个任务");
  console.log("2. 批量推送任务");
  console.log("3. 从Excel文件导入");
  console.log("4. 获取所有任务");
  console.log("5. 更新任务");
  console.log("6. 删除任务");
  console.log("7. 退出");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function askQuestion(query) {
    return new Promise((resolve) => rl.question(query, resolve));
  }

  while (true) {
    const choice = await askQuestion("\n请输入选择: ");

    if (choice === "1") {
      await pushTask(sampleTask);
    } else if (choice === "2") {
      const batchTasks = [
        {
          projectNumber: "P006",
          person: "钱七",
          customNumber: "C017",
          customContent: "安全漏洞修复",
          deliveryPath: "/docs/P006/安全报告.docx",
          hours: 8,
          deliveryTime: "2024-06-05",
        },
        {
          projectNumber: "P006",
          person: "张三",
          customNumber: "C018",
          customContent: "文档更新",
          deliveryPath: "/docs/P006/更新文档.docx",
          hours: 4,
          deliveryTime: "2024-06-10",
        },
      ];
      await pushTasks(batchTasks);
    } else if (choice === "3") {
      const filePath = await askQuestion("请输入Excel文件路径: ");
      await pushFromExcel(filePath);
    } else if (choice === "4") {
      const tasks = await getAllTasks();
      console.log(`\n共 ${tasks.length} 条任务:`);
      tasks.forEach((task) => {
        console.log(`  - ${task.projectNumber} | ${task.person} | ${task.customNumber} | ${task.hours}h`);
      });
    } else if (choice === "5") {
      const taskId = await askQuestion("请输入任务ID: ");
      await updateTask(taskId, { hours: 25 });
    } else if (choice === "6") {
      const taskId = await askQuestion("请输入任务ID: ");
      await deleteTask(taskId);
    } else if (choice === "7") {
      console.log("退出脚本");
      rl.close();
      break;
    } else {
      console.log("无效选择，请重新输入");
    }
  }
}

async function main() {
  const args = parseArgs();
  initApiUrl(args);

  if (args.push) {
    await pushFromArgs(args);
  } else if (args.excel) {
    await pushFromExcel(args.excel);
  } else {
    await interactiveMode();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  pushTask,
  pushTasks,
  getAllTasks,
  updateTask,
  deleteTask,
  initApiUrl,
};
