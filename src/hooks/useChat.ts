/* eslint-disable @typescript-eslint/no-explicit-any */

// import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChatRequestBody, ConversationHistoryResponse, ConversationsResponse, InitiateConversationRequestBody, InitiateConversationResponse, MessageContent } from "../interfaces/chatInterface";
import { AxiosError } from 'axios';
import { ApiResponse } from "../interfaces/globalInterfaces";
import { askQuestion, getConversationHistory, getConversations, initiateConversation } from '../zustand/apis/chatApi';
import { toast } from 'react-toastify';
import { parseData } from '../utils/utils';
import chatStore from '../zustand/stores/chatStore';

interface ErrorResponse {
  [key: string]: any;
}
interface UseStreamChatOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onStreamData?: (chunk: any) => void;
}

interface ConversationMessageHistoryOptions {
  onSuccess?: (data: MessageContent[]) => void;
  onError?: (error: Error) => void;
}

export const useInitiateConversationMutation = (
  onInitiated?: (conversation_id: number) => void,
  onFailed?: () => void
) => {
  return useMutation<ApiResponse<InitiateConversationResponse>, AxiosError<ErrorResponse>, InitiateConversationRequestBody>({
    mutationFn: initiateConversation,
    onSuccess: (response) => {
      console.log(response.data.conversaction_id);
      onInitiated?.(response.data.conversaction_id)
    },
    onError: (error) => {
      onFailed?.()
      console.log(error.response?.data);
      toast.error(error.response?.data.message)
    },
  })
}

export const useGetConversationsMutation = () => {
  const setChats = chatStore((state) => state.setChats);
  return useMutation<ApiResponse<ConversationsResponse>, AxiosError<ErrorResponse>, void>({
    mutationFn: getConversations,
    onSuccess: (response) => {
      console.log(response.data.conversations);
      setChats(response.data.conversations)
    },
    onError: (error) => {
      console.log(error.response?.data);
      toast.error(error.response?.data.message);
    }
  });
}

export const useGetConversationHistoryMutation = (options?: ConversationMessageHistoryOptions) => {
  return useMutation<ApiResponse<ConversationHistoryResponse>, AxiosError<ErrorResponse>, number>({
    mutationFn: getConversationHistory,
    onSuccess: (response) => {
      console.log(response.data);
      const conversationHistory: MessageContent[] = []
      response.data.messages.forEach((message) => {
        if (message?.role === 'user') {
          conversationHistory.push({ question: message.content.question || "No question content" })
        } else {
          let answer: any[] = [];
          if (message.content && Array.isArray(message.content.answer)) {
            // SQL chat format: answer is an array of JSON strings or objects
            answer = message.content.answer.map((data: any) => {
              try {
                return typeof data === 'string' ? JSON.parse(data) : data;
              } catch (e) {
                return { answer: data };
              }
            })
          } else if (message.content) {
            // Document chat or other format: content is the answer object itself
            answer = [message.content];
          }
          conversationHistory.push({ answer })
        }
      })
      options?.onSuccess?.(conversationHistory)
    },
    onError: (error) => {
      console.log(error.response?.data);
      toast.error(error.response?.data.message);
    }
  });
}

export const useStreamChat = (options?: UseStreamChatOptions) => {
  return useMutation<Response, Error, ChatRequestBody>({
    mutationFn: (requestData: ChatRequestBody) => {
      return askQuestion(
        requestData,
        (chunks: any) => {
          console.log(chunks);
          const parsedChunk = parseData(chunks);
          options?.onStreamData?.(parsedChunk);
        }
      );
    },
    onSuccess: (data: any) => {
      // console.log('Stream data:', data);
      const parsedChunk = parseData(data);
      options?.onSuccess?.(parsedChunk);
    },
    onError: (error) => {
      console.error('Stream error:', error);
      options?.onError?.(error);
    },
  });
};