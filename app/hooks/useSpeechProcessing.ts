import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { speechApi, SpeechResponse } from '../api/speech';

// 전역 동시 요청 방지 플래그
let isGlobalPending = false;

export const useSpeechProcessing = () => {
  const mutation = useMutation<SpeechResponse, Error, {
    session_id: string;
    user_message: string;
    is_new_session: boolean;
  }>({
    mutationFn: ({ session_id, user_message, is_new_session }) =>
      speechApi.processSpeech({ session_id, user_message, is_new_session }),
    onSuccess: (data) => {
    },
    onError: (error) => {
    },
    onSettled: () => {
      // 요청 완료(성공/실패) 시 동시 실행 잠금 해제
      isGlobalPending = false;
    },
  });

  // safe mutate: pending 중엔 무시, 아니면 실행
  const safeMutate = useCallback((variables: {
    session_id: string;
    user_message: string;
    is_new_session: boolean;
  }) => {
    if (isGlobalPending) return; // 이미 다른 요청 진행 중이면 무시
    isGlobalPending = true;
    mutation.mutate(variables);
  }, [mutation]);

  const safeMutateAsync = useCallback(async (variables: {
    session_id: string;
    user_message: string;
    is_new_session: boolean;
  }) => {
    if (isGlobalPending) throw new Error('Request in progress');
    isGlobalPending = true;
    try {
      const result = await mutation.mutateAsync(variables);
      return result;
    } finally {
      // onSettled 에서도 해제되나, 예외 등 대비해 이곳에서도 해제
      isGlobalPending = false;
    }
  }, [mutation]);

  return { ...mutation, mutate: safeMutate, mutateAsync: safeMutateAsync } as typeof mutation;
};