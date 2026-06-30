import { LayoutDashboard, BarChart3, FileSpreadsheet } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  qcEnabled?: boolean;
}

export function Sidebar({ currentPage, onPageChange, qcEnabled = false }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: '数据列表', icon: LayoutDashboard },
    { id: 'statistics', label: '统计分析', icon: BarChart3 },
    ...(qcEnabled ? [{ id: 'qc', label: '标分质量', icon: FileSpreadsheet }] : []),
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          项目统计
        </h1>
        <p className="text-slate-400 text-sm mt-1">Project Statistics</p>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto pt-8 border-t border-slate-700">
        <p className="text-slate-400 text-xs text-center">
          数据推送接口已就绪
        </p>
      </div>
    </aside>
  );
}
