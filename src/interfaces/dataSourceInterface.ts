export interface DataSources {
  id: number;
  name: string;
  type: string;
  connection_url?: string;
  table_name?: string;
  created_at: string;
}

export interface FileInfo {
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed';
}


export interface AddDataSource {
  table_name: string;
  source_name: string;
}

export interface AddDataSourceResponse {
  table_name: string,
  connection_url: string,
  id: number
}

export interface GetDataSourcesResponse {
  data_sources: DataSources[];
}

export interface UploadSpreadSheetResponse {
  table_name: string,
  rows_processed: number,
  data_source_id: number
}

export interface GetTablesList {
  db_url: string
}
export interface GetTablesListResponse {
  tables: string[]
}

export interface SuggestQuestionsResponse {
  questions: string[]
}