import { useState, useEffect, useCallback, useRef } from 'react';
import { FilterPanel } from '../components/FilterPanel';
import { TaskTable } from '../components/TaskTable';
import { apiClient } from '../api/client';
import { Task } from '../types/task';
import { RefreshCw, Database, FileSpreadsheet } from 'lucide-react';
import { useFilterStore } from '../store/filterStore';
import * as XLSX from 'xlsx';

export function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, searchKey, triggerSearch } = useFilterStore();
  const scrollPositionRef = useRef<number>(0);

  const fetchTasks = async () => {
    scrollPositionRef.current = window.scrollY;
    setLoading(true);
    try {
      const hasFilters = Object.values(filters).some((value) => value);
      const data = hasFilters
        ? await apiClient.searchTasks(filters)
        : await apiClient.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchKey]);

  const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);

  const exportToExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const sheetData = [
      ['项目号', '人员', '个性化号', '个性化内容', '交付路径', '消耗人时', '交付时间'],
      ...tasks.map(task => [
        task.projectNumber,
        task.person,
        task.customNumber,
        task.customContent,
        task.deliveryPath,
        task.hours,
        task.deliveryTime,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, '任务数据');
    XLSX.writeFile(wb, `任务数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [tasks]);

  const exportToCSV = useCallback(() => {
    let csvContent = '\uFEFF';
    csvContent += '项目号,人员,个性化号,个性化内容,交付路径,消耗人时,交付时间\n';
    tasks.forEach(task => {
      csvContent += `${task.projectNumber},${task.person},${task.customNumber},"${task.customContent}","${task.deliveryPath}",${task.hours},${task.deliveryTime}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `任务数据_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tasks]);

  const showExportMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const existingMenu = document.getElementById('home-export-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.id = 'home-export-menu';
    menu.className = 'fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px]';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const options = [
      { name: '导出 Excel (.xlsx)', action: () => exportToExcel() },
      { name: '导出 CSV (.csv)', action: () => exportToCSV() },
    ];

    options.forEach(({ name, action }) => {
      const button = document.createElement('button');
      button.className = 'w-full px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 text-left transition-colors';
      button.textContent = name;
      button.onclick = (ev) => {
        ev.stopPropagation();
        action();
        menu.remove();
      };
      menu.appendChild(button);
    });

    document.body.appendChild(menu);

    const closeMenu = (event: MouseEvent) => {
      if (!menu.contains(event.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 10);
  }, [exportToExcel, exportToCSV]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">任务数据列表</h1>
          <p className="text-slate-500 mt-1">查看和筛选所有项目任务数据</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={showExportMenu}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            导出表格
          </button>
          <button
            onClick={triggerSearch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-cyan-100 text-sm">任务总数</p>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm">总消耗人时</p>
              <p className="text-2xl font-bold">{totalHours}h</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-amber-100 text-sm">平均人时</p>
              <p className="text-2xl font-bold">
                {tasks.length > 0 ? (totalHours / tasks.length).toFixed(1) : 0}h
              </p>
            </div>
          </div>
        </div>
      </div>

      <FilterPanel />

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      ) : (
        <TaskTable tasks={tasks} />
      )}
    </div>
  );
}
