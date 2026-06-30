import { getConnection, getMysqlPool } from '../config/mysql.js';
import { QCSample, QCStats, MetricFailStats, TargetCellStats, QCResult } from '../types/qc.js';

const WARNING_COLS = [
  'estimated_number_of_cells', 'mean_reads_per_cell', 'median_genes_per_cell',
  'number_of_reads', 'valid_barcodes', 'sequencing_saturation',
  'q30_bases_in_barcode', 'q30_bases_in_rna_read', 'q30_benome',
  'q30_bases_in_umi',
  'reads_mct_exonic_regions', 'reads_mct_intronic_regions',
  'reads_mct_transcriptome', 'reads_mct_gene',
  'fraction_reads_in_Cells', 'data_enough', 'data_added'
];

const TARGET_RULES: Record<number, [number, number]> = {
  3000: [2000, 10000],
  4000: [2000, 9000],
  4500: [3000, 9500],
  5000: [3500, 10000],
  6000: [4000, 12000],
  6800: [5300, 11800],
  7000: [5000, 14000],
  8000: [5000, 18000],
  9000: [6000, 18000],
  10000: [7000, 20000],
  11000: [8000, 21000],
  12000: [9000, 22000],
  13000: [10000, 23000],
  15000: [12000, 25000],
  16000: [11000, 26000],
  17000: [12000, 27000],
  18000: [13000, 28000],
  20000: [15000, 30000],
};

const ADDITIONAL_QC_RULES: [string, string, number, string][] = [
  ['median_genes_per_cell', '>', 600, 'median_genes_per_cell'],
  ['sequencing_saturation', '>', 0, 'sequencing_saturation'],
  ['q30_benome', '>', 80, 'reads_mapped_to_genome'],
  ['reads_mapped_confidently_to_transcriptome', '>', 40, 'reads_mapped_confidently_to_transcriptome'],
  ['fraction_reads_in_Cells', '>', 60, 'fraction_reads_in_Cells'],
  ['q30_bases_in_barcode', '>', 80, 'q30_bases_in_barcode'],
  ['q30_bases_in_rna_read', '>', 80, 'q30_bases_in_rna_read'],
  ['q30_bases_in_umi', '>', 80, 'q30_bases_in_umi'],
];

function cleanTargetCellNum(target_num: any): number {
  if (target_num === null || target_num === undefined) {
    return 10000;
  }
  if (typeof target_num === 'number') {
    if (isNaN(target_num)) {
      return 10000;
    }
    return Math.round(target_num);
  }
  let s = String(target_num).trim();
  if (s.includes('/')) {
    s = s.split('/')[1];
  }
  if (s.includes('-')) {
    s = s.split('-')[1];
  }
  if (s.includes('全量')) {
    return 10000;
  }
  const wMatch = s.match(/W+/i);
  if (wMatch) {
    const numPart = s.replace(/[^0-9]/g, '');
    if (numPart) {
      return parseInt(numPart, 10) * 10000;
    }
    return 10000;
  }
  try {
    return Math.round(parseFloat(s));
  } catch {
    return 10000;
  }
}

function checkCellNumPass(estimated_cells: number, target_cell_num: number): boolean {
  const target = cleanTargetCellNum(target_cell_num);
  let [min_val, max_val] = TARGET_RULES[target] || [Math.round(target * 0.5), Math.round(target * 1.5)];
  if (estimated_cells === null || estimated_cells === undefined) {
    return false;
  }
  const est = parseFloat(String(estimated_cells).replace(/,/g, ''));
  return !isNaN(est) && est >= min_val && est <= max_val;
}

function parseNumeric(val: any): number | null {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  try {
    return parseFloat(String(val).replace(/,/g, '').replace(/%/g, '').trim());
  } catch {
    return null;
  }
}

function checkAllQC(row: Record<string, any>, available_qc_columns: Set<string>): { pass: boolean; failed_metrics: string[] } {
  const failed_metrics: string[] = [];

  if (available_qc_columns.has('estimated_number_of_cells')) {
    if (!checkCellNumPass(row.estimated_number_of_cells, row.target_cell_num)) {
      failed_metrics.push('estimated_number_of_cells');
    }
  }

  for (const [col_name, op, threshold, display_name] of ADDITIONAL_QC_RULES) {
    if (!available_qc_columns.has(col_name)) {
      continue;
    }
    const val = parseNumeric(row[col_name]);
    if (val === null) {
      failed_metrics.push(col_name);
    } else if (op === '>' && !(val > threshold)) {
      failed_metrics.push(col_name);
    } else if (op === '>=' && !(val >= threshold)) {
      failed_metrics.push(col_name);
    } else if (op === '<' && !(val < threshold)) {
      failed_metrics.push(col_name);
    } else if (op === '<=' && !(val <= threshold)) {
      failed_metrics.push(col_name);
    }
  }

  return { pass: failed_metrics.length === 0, failed_metrics };
}

function generateStats(samples: QCSample[]): QCStats {
  const total = samples.length;
  const available_qc_columns = new Set<string>();
  
  if (total > 0) {
    Object.keys(samples[0]).forEach(key => available_qc_columns.add(key));
  }

  const qcResults = samples.map(row => checkAllQC(row, available_qc_columns));
  const pass_count = qcResults.filter(r => r.pass).length;
  const fail_count = total - pass_count;
  const pass_rate = total > 0 ? Math.round(pass_count / total * 10000) / 100 : 0;

  const allFailedMetrics: Set<string> = new Set();
  qcResults.forEach(r => r.failed_metrics.forEach(m => allFailedMetrics.add(m)));

  const failed_metrics: MetricFailStats[] = [];
  for (const metric of Array.from(allFailedMetrics).sort()) {
    const count = qcResults.filter(r => r.failed_metrics.includes(metric)).length;
    const rate = total > 0 ? Math.round(count / total * 10000) / 100 : 0;
    failed_metrics.push({ metric, fail_count: count, fail_rate: rate });
  }

  const targetCellMap = new Map<number, QCSample[]>();
  samples.forEach(sample => {
    const target = cleanTargetCellNum(sample.target_cell_num);
    if (!targetCellMap.has(target)) {
      targetCellMap.set(target, []);
    }
    targetCellMap.get(target)!.push(sample);
  });

  const by_target_cell: TargetCellStats[] = [];
  for (const [target, targetSamples] of Array.from(targetCellMap.entries()).sort((a, b) => a[0] - b[0])) {
    const [min_val, max_val] = TARGET_RULES[target] || ['N/A' as any, 'N/A' as any];
    const targetAvailableColumns = new Set<string>();
    targetSamples.forEach(s => Object.keys(s).forEach(k => targetAvailableColumns.add(k)));
    const targetQcResults = targetSamples.map(row => checkAllQC(row, targetAvailableColumns));
    const sub_total = targetSamples.length;
    const sub_pass = targetQcResults.filter(r => r.pass).length;
    const sub_ratio = sub_total > 0 ? Math.round(sub_pass / sub_total * 10000) / 100 : 0;
    by_target_cell.push({
      target_cell_num: target,
      min_val: typeof min_val === 'number' ? min_val : null,
      max_val: typeof max_val === 'number' ? max_val : null,
      total: sub_total,
      pass: sub_pass,
      pass_rate: sub_ratio,
    });
  }

  return {
    total_samples: total,
    pass_samples: pass_count,
    fail_samples: fail_count,
    pass_rate: pass_rate,
    failed_metrics,
    by_target_cell,
  };
}

export async function getQCData(yearMonth?: string): Promise<QCResult> {
  if (!getMysqlPool()) {
    return {
      totalTable: [],
      s1Stats: {
        total_samples: 0,
        pass_samples: 0,
        fail_samples: 0,
        pass_rate: 0,
        failed_metrics: [],
        by_target_cell: [],
      },
      s3Stats: {
        total_samples: 0,
        pass_samples: 0,
        fail_samples: 0,
        pass_rate: 0,
        failed_metrics: [],
        by_target_cell: [],
      },
    };
  }
  
  const conn = await getConnection();
  try {
    let start_time: string;
    let end_time: string;

    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      start_time = `${year}-${month.toString().padStart(2, '0')}-01`;
      end_time = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    } else {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      start_time = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
      end_time = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${lastDay}`;
    }

    const s_ts = Math.floor(new Date(start_time).getTime());
    const e_ts = Math.floor(new Date(end_time).getTime()) + 86400000;

    const select_cols = [
      'merge_project_code', 'library_name', 'library_code',
      'update_time', 'project_code'
    ].concat(WARNING_COLS);

    const [columns] = await conn.execute('SHOW COLUMNS FROM tb_filter_lib2th');
    const db_cols = new Set((columns as any[]).map(row => row.Field));
    const valid_cols = select_cols.filter(c => db_cols.has(c));

    const cols_str = valid_cols.join(', ');
    const sql = `
      SELECT ${cols_str}
      FROM tb_filter_lib2th
      WHERE update_time >= ? AND update_time < ?
        AND update_time IS NOT NULL
        AND number_of_reads IS NOT NULL
        AND passed = 'YES'
    `;

    const [rows] = await conn.execute(sql, [s_ts, e_ts]);
    const data = rows as any[];

    if (data.length === 0) {
      return {
        totalTable: [],
        s1Stats: {
          total_samples: 0,
          pass_samples: 0,
          fail_samples: 0,
          pass_rate: 0,
          failed_metrics: [],
          by_target_cell: [],
        },
        s3Stats: {
          total_samples: 0,
          pass_samples: 0,
          fail_samples: 0,
          pass_rate: 0,
          failed_metrics: [],
          by_target_cell: [],
        },
      };
    }

    const library_names = [...new Set(data.map(row => row.library_name).filter(Boolean))];
    
    let sampleInfoData: any[] = [];
    if (library_names.length > 0) {
      const placeholders = library_names.map(() => '?').join(',');
      const sql2 = `
        SELECT project_code, task_name, sample_name, species, target_cell_num
        FROM tb_info_sampleinfo
        WHERE sample_name IN (${placeholders})
      `;
      const [infoRows] = await conn.execute(sql2, library_names);
      sampleInfoData = infoRows as any[];
    }

    const sampleInfoMap = new Map<string, any>();
    sampleInfoData.forEach(row => {
      const key = `${row.project_code}_${row.sample_name}`;
      sampleInfoMap.set(key, row);
    });

    const processedSamples: QCSample[] = [];
    const seenLibraryNames = new Set<string>();

    const sortedData = [...data].sort((a, b) => a.update_time - b.update_time);

    for (const row of sortedData) {
      if (seenLibraryNames.has(row.library_name)) {
        continue;
      }
      seenLibraryNames.add(row.library_name);

      const key = `${row.merge_project_code}_${row.library_name}`;
      const info = sampleInfoMap.get(key);

      let primer = null;
      let species = null;
      let target_cell_num = null;

      if (info) {
        if (typeof info.task_name === 'string' && info.task_name.includes('-')) {
          primer = info.task_name.split('-')[1];
        } else {
          primer = info.task_name;
        }
        species = info.species;
        target_cell_num = cleanTargetCellNum(info.target_cell_num);
      } else {
        target_cell_num = 10000;
      }

      const filter_date = row.update_time 
        ? new Date(row.update_time).toISOString().split('T')[0] 
        : '';

      const sample: QCSample = {
        id: `${row.merge_project_code}_${row.library_name}`,
        merge_project_code: row.merge_project_code,
        library_name: row.library_name,
        library_code: row.library_code,
        update_time: row.update_time,
        project_code: row.project_code,
        estimated_number_of_cells: parseNumeric(row.estimated_number_of_cells),
        mean_reads_per_cell: parseNumeric(row.mean_reads_per_cell),
        median_genes_per_cell: parseNumeric(row.median_genes_per_cell),
        number_of_reads: parseNumeric(row.number_of_reads),
        valid_barcodes: parseNumeric(row.valid_barcodes),
        sequencing_saturation: parseNumeric(row.sequencing_saturation),
        q30_bases_in_barcode: parseNumeric(row.q30_bases_in_barcode),
        q30_bases_in_rna_read: parseNumeric(row.q30_bases_in_rna_read),
        q30_benome: parseNumeric(row.q30_benome),
        q30_bases_in_umi: parseNumeric(row.q30_bases_in_umi),
        reads_mct_exonic_regions: parseNumeric(row.reads_mct_exonic_regions),
        reads_mct_intronic_regions: parseNumeric(row.reads_mct_intronic_regions),
        reads_mct_transcriptome: parseNumeric(row.reads_mct_transcriptome),
        reads_mct_gene: parseNumeric(row.reads_mct_gene),
        fraction_reads_in_Cells: parseNumeric(row.fraction_reads_in_Cells),
        data_enough: parseNumeric(row.data_enough),
        data_added: parseNumeric(row.data_added),
        reads_mapped_confidently_to_transcriptome: parseNumeric(row.reads_mapped_confidently_to_transcriptome),
        primer: primer || '',
        species: species || '',
        target_cell_num: target_cell_num,
        filter_date: filter_date,
        filter_year: filter_date ? filter_date.substring(0, 4) : '',
        filter_month: filter_date ? filter_date.substring(5, 7) : '',
      };

      processedSamples.push(sample);
    }

    const s1Samples = processedSamples.filter(s => s.library_code && s.library_code.includes('S1'));
    const s3Samples = processedSamples.filter(s => s.library_code && s.library_code.includes('S3'));

    return {
      totalTable: processedSamples,
      s1Stats: generateStats(s1Samples),
      s3Stats: generateStats(s3Samples),
    };
  } finally {
    conn.release();
  }
}