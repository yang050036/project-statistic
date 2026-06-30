import { useState, useEffect, useRef, useCallback } from 'react';
import { FilterPanel } from '../components/FilterPanel';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiClient } from '../api/client';
import { TaskFilters, PersonStats, ProjectStats, TimeStats, TimeComparison, TimeRangeType, YearComparison } from '../types/task';
import { Download, RefreshCw, Users, FolderKanban, Calendar, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { useFilterStore } from '../store/filterStore';

const BAR_SIZE = 40;

const timeRangeOptions: { value: TimeRangeType; label: string }[] = [
  { value: 'month', label: '月' },
  { value: 'quarter', label: '季度' },
  { value: 'halfYear', label: '半年' },
  { value: 'year', label: '年' },
];

const currentYear = new Date().getFullYear();
const yearOptions = [2024, 2025, 2026];

export function Statistics() {
  const [personStats, setPersonStats] = useState<PersonStats[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats[]>([]);
  const [timeComparison, setTimeComparison] = useState<TimeComparison | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('month');
  const [compareYear, setCompareYear] = useState<number>(currentYear);
  const [baseYear, setBaseYear] = useState<number>(currentYear - 1);
  const [loading, setLoading] = useState(true);
  const scrollPositionRef = useRef<number>(0);
  
  const personChartRef = useRef<HTMLDivElement>(null);
  const projectChartRef = useRef<HTMLDivElement>(null);
  const timeChartRef = useRef<HTMLDivElement>(null);
  
  const { filters, searchKey } = useFilterStore();

  const fetchStatistics = async () => {
    scrollPositionRef.current = window.scrollY;
    setLoading(true);
    try {
      const params: TaskFilters = { ...filters };
      const yearComparison: YearComparison = { compareYear, baseYear };
      const [personData, projectData, timeData, comparisonData] = await Promise.all([
        apiClient.getPersonStats(params),
        apiClient.getProjectStats(params),
        apiClient.getTimeStats(params),
        apiClient.getTimeComparison(params, timeRange, yearComparison),
      ]);
      setPersonStats(personData);
      setProjectStats(projectData);
      setTimeStats(timeData);
      setTimeComparison(comparisonData);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [searchKey, timeRange, compareYear, baseYear]);

  const getChartHeight = (dataLength: number, baseHeight: number = 350) => {
    if (dataLength <= 3) return baseHeight;
    if (dataLength <= 5) return baseHeight + 50;
    if (dataLength <= 8) return baseHeight + 100;
    if (dataLength <= 12) return baseHeight + 150;
    return Math.min(baseHeight + dataLength * 25, 700);
  };

  const exportChartAsImage = useCallback((chartRef: React.RefObject<HTMLDivElement>, filename: string, format: string = 'png') => {
    if (!chartRef.current) {
      alert('图表未找到');
      return;
    }
    
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {
      alert('图表元素未找到');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        alert('Canvas上下文获取失败');
        return;
      }

      const svgWidth = svgElement.getBoundingClientRect().width;
      const svgHeight = svgElement.getBoundingClientRect().height;
      
      const scale = 2;
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      ctx.scale(scale, scale);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, svgWidth, svgHeight);

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        
        let mimeType = 'image/png';
        if (format === 'jpeg') mimeType = 'image/jpeg';
        else if (format === 'webp') mimeType = 'image/webp';

        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      img.onerror = () => {
        alert('图片加载失败');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  }, []);

  const showExportMenu = useCallback((e: React.MouseEvent, chartRef: React.RefObject<HTMLDivElement>, chartName: string) => {
    e.stopPropagation();
    
    const existingMenu = document.getElementById(`stats-export-menu-${chartName}`);
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.id = `stats-export-menu-${chartName}`;
    menu.className = 'fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px]';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const options = [
      { name: '导出 PNG', action: () => exportChartAsImage(chartRef, chartName, 'png') },
      { name: '导出 JPEG', action: () => exportChartAsImage(chartRef, chartName, 'jpeg') },
      { name: '导出 WebP', action: () => exportChartAsImage(chartRef, chartName, 'webp') },
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
  }, [exportChartAsImage]);

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">统计分析</h1>
          <p className="text-slate-500 mt-1">按人员、项目和时间统计任务数据</p>
        </div>
        <button
          onClick={fetchStatistics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>

      <FilterPanel />

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-semibold text-slate-800">人员统计</h2>
              </div>
              <button
                onClick={(e) => showExportMenu(e, personChartRef, '人员统计')}
                className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出图片
              </button>
            </div>
            <div ref={personChartRef} style={{ height: getChartHeight(personStats.length) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="person" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taskCount" name="任务数量" fill="#06b6d4" barSize={BAR_SIZE} />
                  <Bar dataKey="totalHours" name="消耗人时" fill="#10b981" barSize={BAR_SIZE} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-semibold text-slate-800">项目统计</h2>
              </div>
              <button
                onClick={(e) => showExportMenu(e, projectChartRef, '项目统计')}
                className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出图片
              </button>
            </div>
            <div ref={projectChartRef} style={{ height: getChartHeight(projectStats.length) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="projectNumber" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taskCount" name="任务数量" fill="#f59e0b" barSize={BAR_SIZE} />
                  <Bar dataKey="totalHours" name="消耗人时" fill="#8b5cf6" barSize={BAR_SIZE} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-semibold text-slate-800">时间统计</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      {timeRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">对比年份:</span>
                    <select
                      value={compareYear}
                      onChange={(e) => setCompareYear(parseInt(e.target.value))}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-slate-400">vs</span>
                    <select
                      value={baseYear}
                      onChange={(e) => setBaseYear(parseInt(e.target.value))}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={(e) => showExportMenu(e, timeChartRef, '时间统计')}
                  className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出图片
                </button>
              </div>
            </div>
            <div ref={timeChartRef} style={{ height: getChartHeight(timeStats.length) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="deliveryTime" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taskCount" name="任务数量" fill="#ef4444" barSize={BAR_SIZE} />
                  <Bar dataKey="totalHours" name="消耗人时" fill="#ec4899" barSize={BAR_SIZE} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {timeComparison && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-sm font-medium text-slate-600 mb-1">环比变化</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {timeComparison.currentPeriod} vs {timeComparison.previousPeriod}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: '当前', value: 100 + timeComparison.taskCountChange },
                              { name: '上期', value: 100 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            <Cell fill="#06b6d4" />
                            <Cell fill="#94a3b8" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 text-center">
                        <p className="text-xs text-slate-500">任务数量</p>
                        <p className={`text-sm font-bold ${timeComparison.taskCountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(timeComparison.taskCountChange)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: '当前', value: 100 + timeComparison.totalHoursChange },
                              { name: '上期', value: 100 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#94a3b8" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 text-center">
                        <p className="text-xs text-slate-500">消耗人时</p>
                        <p className={`text-sm font-bold ${timeComparison.totalHoursChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(timeComparison.totalHoursChange)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                  <h3 className="text-sm font-medium text-slate-600 mb-1">同比变化</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {timeComparison.currentPeriod} vs {timeComparison.samePeriodLastYear}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: '当前', value: 100 + timeComparison.taskCountYoY },
                              { name: '去年同期', value: 100 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            <Cell fill="#8b5cf6" />
                            <Cell fill="#94a3b8" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 text-center">
                        <p className="text-xs text-slate-500">任务数量</p>
                        <p className={`text-sm font-bold ${timeComparison.taskCountYoY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(timeComparison.taskCountYoY)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: '当前', value: 100 + timeComparison.totalHoursYoY },
                              { name: '去年同期', value: 100 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            <Cell fill="#ec4899" />
                            <Cell fill="#94a3b8" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 text-center">
                        <p className="text-xs text-slate-500">消耗人时</p>
                        <p className={`text-sm font-bold ${timeComparison.totalHoursYoY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(timeComparison.totalHoursYoY)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}