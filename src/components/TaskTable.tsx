import { Task } from '../types/task';

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-slate-500">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                项目号
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                人员
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                个性化号
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                个性化内容
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                交付路径
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                消耗人时
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                交付时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task, index) => (
              <tr
                key={task.id}
                className={`hover:bg-slate-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                    {task.projectNumber}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-slate-800 font-medium">{task.person}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-slate-600">{task.customNumber}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-700">{task.customContent}</span>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {task.deliveryPath}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    task.hours > 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {task.hours}h
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-slate-600">{task.deliveryTime}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
