export interface QCSample {
  id: string;
  merge_project_code: string;
  library_name: string;
  library_code: string;
  update_time: number;
  project_code: string;
  estimated_number_of_cells: number;
  mean_reads_per_cell: number;
  median_genes_per_cell: number;
  number_of_reads: number;
  valid_barcodes: number;
  sequencing_saturation: number;
  q30_bases_in_barcode: number;
  q30_bases_in_rna_read: number;
  q30_benome: number;
  q30_bases_in_umi: number;
  reads_mct_exonic_regions: number;
  reads_mct_intronic_regions: number;
  reads_mct_transcriptome: number;
  reads_mct_gene: number;
  fraction_reads_in_Cells: number;
  data_enough: number;
  data_added: number;
  reads_mapped_confidently_to_transcriptome: number;
  primer: string;
  species: string;
  target_cell_num: number;
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
  min_val: number;
  max_val: number;
  total: number;
  pass: number;
  pass_rate: number;
}

export interface QCResult {
  totalTable: QCSample[];
  s1Stats: QCStats;
  s3Stats: QCStats;
}