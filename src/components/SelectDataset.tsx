import { useState, useEffect } from 'react';
import { MdKeyboardArrowDown, MdLightbulbOutline } from 'react-icons/md';
import { BiLink } from 'react-icons/bi';
import dataSetStore from '../zustand/stores/dataSetStore';
import { useGetDataSourcesMutation, useGetTablesMutation, useSuggestQuestionsMutation } from '../hooks/useDataSet';
import { SelectModelSkeleton } from './loaders/DataSourceTableLoader';
import { useParams } from 'react-router-dom';
import { DataSources } from '../interfaces/dataSourceInterface';

// Add this prop to trigger question sending in parent
interface SelectDatasetProps {
  onSuggestClick?: (question: string) => void;
}

const SelectDataset: React.FC<SelectDatasetProps> = ({ onSuggestClick }) => {
  const { data_source_id } = useParams();

  const tables = dataSetStore((state) => state.tables);
  const model = dataSetStore((state) => state.selectedModel);
  const dataSets = dataSetStore((state) => state.dataSets);
  const getDataSet = dataSetStore((state) => state.getDataSet);
  const setModel = dataSetStore((state) => state.setModel);
  const secondaryDataSetIds = dataSetStore((state) => state.secondaryDataSetIds);
  const addSecondary = dataSetStore((state) => state.addSecondaryDataSet);
  const removeSecondary = dataSetStore((state) => state.removeSecondaryDataSet);

  const { mutate: getDataSource, status: dataSourceStatus } = useGetDataSourcesMutation();
  const { mutate: getTables, status: loadTableStatus } = useGetTablesMutation();
  const { mutate: getSuggestions, data: suggestionData, status: suggestionStatus } = useSuggestQuestionsMutation();

  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [dataSet, setDataSet] = useState<DataSources>();


  useEffect(() => {
    if (!dataSets) {
      getDataSource();
    }
    if (dataSets && data_source_id) {
      const data = getDataSet(Number(data_source_id));
      setDataSet(data);
    }
  }, [dataSets, data_source_id]);

  useEffect(() => {
    if (dataSet?.type === 'url' && dataSet?.connection_url) {
      getTables({ db_url: dataSet?.connection_url })
    }
    if (data_source_id) {
      getSuggestions(Number(data_source_id));
    }
  }, [dataSet, data_source_id]);

  return (
    <div className="mx-auto mb-24 max-w-2xl px-4">
      <h1 className={`text-center text-3xl font-bold text-navy-800 mb-2`}>Have Something In Mind?</h1>

      <p className={`text-center text-sm text-navy-600 mb-8`}>
        Select Or Add A Data Set, Ask Me Anything About The Data Set,
        <br />
        Get Meaningful Insight From Me.
      </p>

      {(dataSourceStatus === 'pending' || loadTableStatus === 'pending') ? (
        <SelectModelSkeleton />
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex justify-center items-center mb-10">
            {dataSet?.type === 'url' && (
              <>
                <div className="relative">
                  <select
                    className={`appearance-none bg-blue-gray-50 border-blue-gray-100 text-gray-700 border rounded-[12px] py-2.5 pr-10 pl-4 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                  >
                    <option value="">Selected Tables</option>
                    {
                      tables?.map((table) => (
                        <option key={table} value={table}>{table}</option>
                      ))
                    }
                  </select>
                  <div className={`mr-l pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700`}>
                    <MdKeyboardArrowDown className="h-5 w-5" />
                  </div>
                </div>
                <span className={`mx-4 text-gray-400`}>|</span>
              </>
            )}

            <div className="relative">
              <select
                className={`appearance-none bg-blue-gray-50 border-blue-gray-100 text-gray-700 border rounded-[12px] py-2.5 pr-10 pl-4 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="">Select LLM Model</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
              </select>
              <div className={`mr-l pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700`}>
                <MdKeyboardArrowDown className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Secondary Sources selection */}
          <div className="w-full max-w-lg mb-10">
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {secondaryDataSetIds.map(id => {
                const s = dataSets?.find(d => d.id === Number(id)); // Type cast to handle both string/number
                if (!s) return null;
                return (
                  <div key={id} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-100 shadow-sm animate-in zoom-in-50">
                    <span className="mr-2 truncate max-w-[150px]">{s.name}</span>
                    <button
                      onClick={() => removeSecondary(Number(id))}
                      className="hover:text-red-500 transition-colors bg-white/50 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="relative group">
              <select
                className={`w-full appearance-none bg-white border-blue-gray-100 text-gray-700 border rounded-[12px] py-3 pr-10 pl-10 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md`}
                value=""
                onChange={(e) => {
                  if (e.target.value) addSecondary(Number(e.target.value));
                }}
              >
                <option value="">+ Add another data source for cross-analysis</option>
                {dataSets
                  ?.filter(d => d.id !== Number(data_source_id) && !secondaryDataSetIds.includes(Number(d.id)))
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                  ))
                }
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <BiLink className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className={`mr-l pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700`}>
                <MdKeyboardArrowDown className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2 italic">
              LUMIN can now join data across multiple sources automatically using DuckDB fusion.
            </p>
          </div>

          {/* Suggested Questions */}
          {data_source_id && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-center gap-2 mb-4 text-navy-400">
                <MdLightbulbOutline className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Suggested for you</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {suggestionStatus === 'pending' ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-blue-gray-50 rounded-xl animate-pulse" />
                  ))
                ) : (
                  suggestionData?.data.questions?.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onSuggestClick?.(q)}
                      className="text-left text-sm p-4 bg-white hover:bg-navy-50 border border-blue-gray-100 hover:border-navy-200 text-navy-700 rounded-xl shadow-sm transition-all hover:shadow-md active:scale-95 flex items-center justify-between group"
                    >
                      <span className="line-clamp-2">{q}</span>
                      <MdKeyboardArrowDown className="w-4 h-4 text-navy-200 group-hover:text-navy-400 -rotate-90" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectDataset;
