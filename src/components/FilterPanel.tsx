import { Search, X } from 'lucide-react';
import { TaskFilters } from '../types/task';
import { useFilterStore } from '../store/filterStore';

export function FilterPanel() {
  const { filters, updateFilter, clearFilters, triggerSearch } = useFilterStore();
  const hasFilters = Object.values(filters).some((value) => value);

  const handleChange = (key: keyof TaskFilters, value: string) => {
    updateFilter(key, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">筛选条件</h2>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          )}
          <button
            onClick={triggerSearch}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            搜索
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">项目号</label>
          <input
            type="text"
            value={filters.projectNumber}
            onChange={(e) => handleChange('projectNumber', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入项目号..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">人员</label>
          <input
            type="text"
            value={filters.person}
            onChange={(e) => handleChange('person', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入人员姓名..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">个性化号</label>
          <input
            type="text"
            value={filters.customNumber}
            onChange={(e) => handleChange('customNumber', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入个性化号..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">个性化内容</label>
          <input
            type="text"
            value={filters.customContent}
            onChange={(e) => handleChange('customContent', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入个性化内容..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">交付路径</label>
          <input
            type="text"
            value={filters.deliveryPath}
            onChange={(e) => handleChange('deliveryPath', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入交付路径..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">交付时间</label>
          <input
            type="text"
            value={filters.deliveryTime}
            onChange={(e) => handleChange('deliveryTime', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入日期 (YYYY-MM-DD)..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  );
}
