import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export class N8nApi {
    private instance: AxiosInstance;

    constructor() {
      this.instance = axios.create({
        baseURL: `https://escape1001.app.n8n.cloud/webhook-test`,
      })
      this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        console.log('Request:', config)
        return config
      })
      this.instance.interceptors.response.use((resp: AxiosResponse) => {
        const { data } = resp
        return data.data
      })
    }
  
    postStep(step: number, message: string): Promise<AxiosResponse> {
      return this.instance.post(`/${step}`, { message })
    }
  }