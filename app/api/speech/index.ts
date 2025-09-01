import axios from 'axios';
import { StepInfo } from '@/type';
import { BASE_API_LINK } from '@/constants';

const axiosInstance = axios.create({
  baseURL: BASE_API_LINK,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

export interface SpeechResponse {
  success: boolean;
  message: string;
  data: StepInfo;
}

export const speechApi = {
  processSpeech: async ({
    session_id, user_message, is_new_session
  }: {
    session_id: string, user_message: string, is_new_session: boolean
  }): Promise<SpeechResponse> => {
    try {
      const response = await axiosInstance.post('/scenario', { session_id, user_message, is_new_session });
      return response.data;
    } catch (error) {

      // 다시 해보라는 효과음 넣을 수도 있음
      console.error('Speech processing error:', error);
      throw error;
    }
  },
}; 
