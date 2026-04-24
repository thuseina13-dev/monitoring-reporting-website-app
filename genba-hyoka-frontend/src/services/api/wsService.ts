import axiosClient from './axiosClient';

export const wsService = {
  /**
   * Request ticket for WebSocket handshake
   */
  getTicket: async () => {
    const response = await axiosClient.post('/v1/ws/ticket');
    return response.data.data; // { ticket_id, expires_at }
  }
};
