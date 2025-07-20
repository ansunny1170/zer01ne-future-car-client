import { useMutation } from '@tanstack/react-query';
import { speechApi, SpeechResponse } from '../api/speech';

export const useSpeechProcessing = () => {
  return useMutation<SpeechResponse, Error, {
    session_id: string;
    user_message: string;
    is_new_session: boolean;
  }>({
    mutationFn: ({session_id, user_message, is_new_session}) => 
      speechApi.processSpeech({session_id, user_message, is_new_session}),
    onSuccess: (data) => {
      console.log('Speech processed successfully:', data);
    },
    onError: (error) => {
      console.error('Speech processing failed:', error);
    },
  });
}; 