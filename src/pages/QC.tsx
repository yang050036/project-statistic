import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { QCResult, QCSample } from '../types/qc';
import { Calendar, RefreshCw, CheckCircle2, XCircle, TrendingUp, FileSpreadsheet, AlertTriangle } from 'lucide-react';

const METRIC_DISPLAY_NAMES: Record<string, string> = {
  estimated_number_of_cells: '预估细胞数',
  median_genes_per_cell: '每个细胞的中位基因数',
  sequencing_saturation: '测序饱和度',
  q30_benome: '基因组Q30碱基',
  reads_mapped_confidently_to_transcriptome: '转录组比对率',
  fraction_reads_in_Cells: '细胞中reads比例',
  q30_bases_in_barcode: 'Barcode Q30',
  q30_bases_in_rna_read: 'RNA Read Q30',
  q30_bases_in_umi: 'UMI Q30',
};

export function QC() {
  const [qcData, setQcData] = useState<QCResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearMonth, setYearMonth] = useState<string>('');
  const [showTable, setShowTable] = useState(false);

  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      options.push({
        value: `${year}-${month.toString().padStart(2, '0')}`,
        label: `${year}年${month}月`,
      });
    }
    return options;
  };

  const fetchQCData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getQCData(yearMonth);
      setQcData(data);
    } catch (error) {
      console.error('Failed to fetch QC data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQCData();
  }, [yearMonth]);

  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return '-';
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  const formatPercent = (num: number | null): string => {
    if (num === null || num === undefined) return '-';
    return num.toFixed(2) + '%';
  };

  const renderStatsCard = (title: string, stats: QCResult['s1Stats'], color: string) => {
    const passColor = stats.pass_rate >= 90 ? 'text-green-600' : stats.pass_rate >= 70 ? 'text-yellow-600' : 'text-red-600';
    const failColor = stats.fail_samples > 0 ? 'text-red-600' : 'text-green-600';

    return (
      <div className={`bg-gradient-to-br ${color} rounded-xl shadow-sm p-6`}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">总样本数</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_samples}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">通过</p>
            <p className="text-2xl font-bold text-green-600">
              <CheckCircle2 className="w-5 h-5 inline mr-1" />
              {stats.pass_samples}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">失败</p>
            <p className={`text-2xl font-bold ${failColor}`}>
              <XCircle className="w-5 h-5 inline mr-1" />
              {stats.fail_samples}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">通过率</p>
            <p className={`text-2xl font-bold ${passColor}`}>
              <TrendingUp className="w-5 h-5 inline mr-1" />
              {formatPercent(stats.pass_rate)}
            </p>
          </div>
        </div>

        {stats.failed_metrics.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-600 mb-2">按指标失败统计</h4>
            <div className="space-y-2">
              {stats.failed_metrics.map((item) => (
                <div key={item.metric} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-600">
                    {METRIC_DISPLAY_NAMES[item.metric] || item.metric}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-red-600">失败 {item.fail_count} 例</span>
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${item.fail_rate}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-16 text-right">{formatPercent(item.fail_rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.by_target_cell.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-600 mb-2">按目标细胞数分组</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/80">
                    <th className="text-left px-3 py-2">目标细胞数</th>
                    <th className="text-center px-3 py-2">范围</th>
                    <th className="text-center px-3 py-2">总数</th>
                    <th className="text-center px-3 py-2">通过</th>
                    <th className="text-center px-3 py-2">通过率</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.by_target_cell.map((item) => (
                    <tr key={item.target_cell_num} className="border-t border-slate-200">
                      <td className="px-3 py-2 font-medium">{item.target_cell_num.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center text-slate-500">
                        {item.min_val !== null ? `${item.min_val.toLocaleString()}-${item.max_val?.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-center">{item.total}</td>
                      <td className="px-3 py-2 text-center text-green-600">{item.pass}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={item.pass_rate >= 90 ? 'text-green-600' : item.pass_rate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                          {formatPercent(item.pass_rate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSampleTable = (samples: QCSample[]) => {
    const columns = [
      { key: 'library_name', label: '样本名称' },
      { key: 'library_code', label: '文库编号' },
      { key: 'merge_project_code', label: '项目编号' },
      { key: 'target_cell_num', label: '目标细胞数' },
      { key: 'estimated_number_of_cells', label: '预估细胞数' },
      { key: 'median_genes_per_cell', label: '中位基因数' },
      { key: 'sequencing_saturation', label: '测序饱和度' },
      { key: 'q30_benome', label: '基因组Q30' },
      { key: 'fraction_reads_in_Cells', label: '细胞reads比例' },
      { key: 'filter_date', label: '筛选日期' },
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">总数据表</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {columns.map((col) => (
                  <th key={col.key} className="text-left px-4 py-3 font-medium text-slate-600">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.id} className="border-t border-slate-100 hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-slate-700">
                      {col.key === 'estimated_number_of_cells' || col.key === 'target_cell_num' || col.key === 'median_genes_per_cell' || col.key === 'number_of_reads' || col.key === 'valid_barcodes'
                        ? formatNumber(sample[col.key as keyof QCSample] as number)
                        : col.key === 'sequencing_saturation' || col.key === 'q30_benome' || col.key === 'fraction_reads_in_Cells' || col.key === 'q30_bases_in_barcode' || col.key === 'q30_bases_in_rna_read' || col.key === 'q30_bases_in_umi'
                          ? formatPercent(sample[col.key as keyof QCSample] as number)
                          : sample[col.key as keyof QCSample] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">标分质量</h1>
            <p className="text-sm text-slate-500">CellRanger QC 月度统计分析</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="">本月</option>
              {generateMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={fetchQCData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
          
          <button
            onClick={() => setShowTable(!showTable)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showTable
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {showTable ? '隐藏表格' : '显示表格'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : qcData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderStatsCard('S1 (V3.1)', qcData.s1Stats, 'from-blue-50 to-indigo-50')}
            {renderStatsCard('S3 (V4)', qcData.s3Stats, 'from-purple-50 to-pink-50')}
          </div>

          {showTable && qcData.totalTable.length > 0 && renderSampleTable(qcData.totalTable)}

          {qcData.totalTable.length === 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-yellow-800 font-medium">暂无数据</p>
              <p className="text-yellow-600 text-sm mt-1">当前月份没有符合条件的样本数据</p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-800 font-medium">数据加载失败</p>
          <p className="text-red-600 text-sm mt-1">无法连接到数据库，请检查网络连接</p>
        </div>
      )}
    </div>
  );
}