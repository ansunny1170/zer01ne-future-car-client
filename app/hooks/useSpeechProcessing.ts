import { useMutation } from '@tanstack/react-query';
import { speechApi, SpeechResponse } from '../api/speech';

export const useSpeechProcessing = () => {
  return useMutation({
    mutationFn: ({session_id, user_message, is_new_session}: {session_id: string, user_message: string, is_new_session: boolean}) => speechApi.processSpeech({session_id, user_message, is_new_session}),
    onSuccess: (data: SpeechResponse) => {
      console.log('Speech processed successfully:', data);
    },
    onError: (error) => {
      console.error('Speech processing failed:', error);
    },
  });
}; 