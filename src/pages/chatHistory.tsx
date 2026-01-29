import { useEffect, useState } from 'react';
import { useGetConversationHistoryMutation, useGetConversationsMutation } from '../hooks/useChat';
import chatStore from '../zustand/stores/chatStore';
import { MessageContent } from '../interfaces/chatInterface';
import Avatar from 'react-avatar';
import { BsStars, BsDownload } from 'react-icons/bs';
import { MdCode, MdOutlineAnalytics } from 'react-icons/md';
import ChartComponent from '../components/ChartComponent';
import HighlightText from '../components/steps/HighlightText';

const SqlToggle = ({ sql }: { sql?: string }) => {
  const [show, setShow] = useState(false);
  if (!sql) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center text-[10px] font-bold uppercase tracking-widest text-navy-400 hover:text-navy-600 transition-colors"
      >
        <MdCode className="mr-1 text-sm" />
        {show ? 'Hide SQL Query' : 'View SQL Query'}
      </button>
      {show && (
        <div className="mt-2 p-3 bg-navy-900 rounded-lg text-blue-100 text-[11px] font-mono leading-relaxed border border-navy-800 shadow-inner overflow-x-auto">
          <code>{sql}</code>
        </div>
      )}
    </div>
  );
};

// import axios from 'axios';

const ChatHistory = () => {
  const chats = chatStore((state) => state.chats);
  const [selectedChat, setSelectedChat] = useState<number>(0);
  const [messages, setMessages] = useState<MessageContent[]>([]);
  const { mutate: getConversations, status } = useGetConversationsMutation();
  const { mutate: getConversationMessageHistory, status: conversationLoader } =
    useGetConversationHistoryMutation({
      onSuccess: (response) => {
        setMessages(response);
      },
    });

  useEffect(() => {
    getConversations();
  }, []);

  const chatHistory = async (conversation_id: number) => {
    console.log(conversation_id);
    setSelectedChat(conversation_id);
    getConversationMessageHistory(conversation_id);
  };

  return (
    <div className="flex flex-col py-8 pr-8 h-screen">
      <div className="h-full flex rounded-[20px] bg-white border border-blue-gray-100 dark:bg-maroon-400 dark:border-maroon-600 w-full">
        <div className="w-1/6 bg-yellow-gray-50 rounded-l-[20px] border-r border-l-blue-gray-100 flex flex-col h-full">
          {/* Fixed header */}
          <div className="sticky top-0 bg-yellow-gray-50 z-10">
            <p className="text-center font-medium font-yellow-gray-600 py-4 border-b-2">
              Chat history
            </p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {status === 'pending'
              ? [...Array(5)].map((_, index) => (
                <div className="border-b px-6 py-4 w-full animate-pulse" key={index}>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))
              : chats.map((chat, index) => (
                <div
                  key={index}
                  onClick={() => chatHistory(chat?.id)}
                  className={`border-b px-6 py-4 truncate w-full hover:bg-yellow-gray-100/50 cursor-pointer font-normal font-yellow-gray-600 ${selectedChat === chat?.id ? 'bg-yellow-gray-100' : ''
                    }`}
                >
                  {chat?.title}
                </div>
              ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-blue-gray-50/10">
          {conversationLoader === 'pending' ? (
            <p>Loading...</p>
          ) : (
            messages?.map((message, index) => {
              if (message?.question) {
                return (
                  <div className="mb-6 flex items-start" key={index}>
                    <Avatar
                      name="Sahil Mund"
                      size="40"
                      className="h-8 w-8 mr-2 rounded-md flex-shrink-0"
                    />
                    <p className="text-md text-navy-600">{message?.question}</p>
                  </div>
                );
              } else {
                return message.answer?.map((data: any) => {
                  console.log([data.formatted_data_for_visualization]);
                  if (data?.answer) {
                    return (
                      <div className="mb-6 bg-blue-gray-50 rounded-lg p-4 shadow-sm" key={Math.random()}>
                        <div className="flex items-start mb-2">
                          <BsStars className="text-2xl text-navy-600 mr-3 flex-shrink-0 mt-1" />
                          <div className="flex-1 overflow-hidden">
                            <HighlightText text={data.answer} />
                          </div>
                        </div>

                        {data.source_documents && data.source_documents.length > 0 && (
                          <div className="mt-4 border-t border-blue-100 pt-3 ml-10">
                            <p className="text-[10px] font-bold text-navy-400 mb-2 uppercase tracking-widest">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                              {data.source_documents.map((doc: any, docIndex: number) => (
                                <div key={docIndex} className="text-[10px] bg-white text-navy-600 px-2 py-1 rounded border border-blue-100 flex items-center shadow-sm">
                                  <span className="font-medium truncate max-w-[150px]">{doc.metadata?.source || `Doc ${docIndex + 1}`}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {data.sql_query && <SqlToggle sql={data.sql_query} />}
                      </div>
                    );
                  } else if (
                    data?.recommended_visualization &&
                    data?.formatted_data_for_visualization
                  ) {
                    return (
                      <div className="mt-6 border border-blue-100 rounded-xl overflow-hidden bg-white shadow-sm mb-6" key={Math.random()}>
                        <div className="bg-blue-gray-50/50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-navy-400 uppercase tracking-widest flex items-center">
                            <MdOutlineAnalytics className="mr-1 text-sm text-blue-500" />
                            Data Visualization
                          </span>
                          <button
                            className="text-navy-400 hover:text-blue-500 transition-colors"
                            title="Export Data"
                          >
                            <BsDownload className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="w-full h-[400px] p-4">
                          <ChartComponent
                            type={data?.recommended_visualization || ''}
                            data={data?.formatted_data_for_visualization}
                          />
                        </div>
                      </div>
                    );
                  }
                });
              }
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
