import React, { useEffect } from 'react';
import { BiFile, BiLink, BiTrash } from 'react-icons/bi';
import { BsFillFileEarmarkSpreadsheetFill } from "react-icons/bs";
import { useGetDataSourcesMutation, useDeleteDataSourceMutation, useAnalyzeHealthMutation } from '../hooks/useDataSet';
import { MdHealthAndSafety } from 'react-icons/md';
import dataSetStore from '../zustand/stores/dataSetStore';
import { DataSourceTableLoader } from '../components/loaders/DataSourceTableLoader';
import { toast } from 'react-toastify';

const DataSource: React.FC = () => {

  const dataSets = dataSetStore((state) => state.dataSets);
  const { mutate: getDataSource,status } = useGetDataSourcesMutation();
  const { mutate: deleteSource } = useDeleteDataSourceMutation();
  const { mutate: analyzeHealth, status: healthStatus } = useAnalyzeHealthMutation();

  useEffect(() => {
    if(!dataSets){
      getDataSource()
    }
  }, [])

  const handleAnalyze = (id: number) => {
    toast.info("Analyzing data health...");
    analyzeHealth(id, {
      onSuccess: (res) => {
        const suggestions = res.data.suggestions;
        if (suggestions && suggestions.length > 0) {
          const formatted = suggestions.map((s: any) => `• ${s.issue}: ${s.fix}`).join('\n');
          alert(`Data Health Suggestions:\n\n${formatted}`);
        } else {
          toast.success("Data looks healthy!");
        }
      }
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteSource(id);
    }
  };

  return (
    <div className="flex flex-col py-8 pr-8 h-screen">
      <div className="h-full rounded-[20px] bg-white border border-blue-gray-100 dark:bg-maroon-400 dark:border-maroon-600 w-full">
        <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
          {
            status === 'pending' ?
              <DataSourceTableLoader rows={3} />
              :
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Source name</th>
                    <th className="px-6 py-3">Date uploaded</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataSets?.map((file, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              {
                                file.type === "url" ?
                                  <BiLink className="h-6 w-6 text-blue-600" />
                                  : file.type === "spreadsheet" ?
                                    <BsFillFileEarmarkSpreadsheetFill className="h-6 w-6 text-blue-600" />
                                    :
                                    <BiFile className="h-6 w-6 text-blue-600" />
                              }

                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="text-xs text-gray-500 uppercase">{file.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.type === "url" ?
                          file.connection_url
                          : file.type === "spreadsheet" ? file?.table_name : file?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file?.created_at}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                      onClick={() => handleAnalyze(file.id as number)}
                      className="text-green-500 hover:text-green-700 transition-colors p-2 rounded-full hover:bg-green-50 mr-2"
                      title="Analyze Data Health"
                    >
                      <MdHealthAndSafety className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id as number, file.name)}
                          className="text-red-400 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                          title="Delete Data Source"
                        >
                          <BiTrash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }

        </div>
      </div>
    </div>
  );
};

export default DataSource;
