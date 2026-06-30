export interface QCSample {
  id: string;
  merge_project_code: string;
  library_name: string;
  library_code: string;
  update_time: number;
  project_code: string;
  estimated_number_of_cells: number | null;
  mean_reads_per_cell: number | null;
  median_genes_per_cell: number | null;
  number_of_reads: number | null;
  valid_barcodes: number | null;
  sequencing_saturation: number | null;
  q30_bases_in_barcode: number | null;
  q30_bases_in_rna_read: number | null;
  q30_benome: number | null;
  q30_bases_in_umi: number | null;
  reads_mct_exonic_regions: number | null;
  reads_mct_intronic_regions: number | null;
  reads_mct_transcriptome: number | null;
  reads_mct_gene: number | null;
  fraction_reads_in_Cells: number | null;
  data_enough: number | null;
  data_added: number | null;
  reads_mapped_confidently_to_transcriptome: number | null;
  primer: string;
  species: string;
  target_cell_num: number | null;
  filter_date: string;
  filter_year: string;
  filter_month: string;
}

export interface QCStats {
  total_samples: number;
  pass_samples: number;
  fail_samples: number;
  pass_rate: number;
  failed_metrics: MetricFailStats[];
  by_target_cell: TargetCellStats[];
}

export interface MetricFailStats {
  metric: string;
  fail_count: number;
  fail_rate: number;
}

export interface TargetCellStats {
  target_cell_num: number;
  min_val: number | null;
  max_val: number | null;
  total: number;
  pass: number;
  pass_rate: number;
}

export interface QCResult {
  totalTable: QCSample[];
  s1Stats: QCStats;
  s3Stats: QCStats;
}