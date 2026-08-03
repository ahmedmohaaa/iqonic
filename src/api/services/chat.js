import apiClient from '../axios';

export const getConversations   = ()        => apiClient.get('chat/conversations/');
export const openDirect         = (userId)  => apiClient.get(`chat/direct/${userId}/`);
export const openGeneral        = ()        => apiClient.get('chat/general/');
export const getMessages        = (roomId)  => apiClient.get(`chat/${roomId}/messages/`, { params: { page_size: 60 } });
export const getUsers           = ()        => apiClient.get('users/');

// الإرسال كـ FormData (ليعمل حقل mentions المتعدد + المرفقات)
export const sendMessage = (roomId, { message, mentions = [], attachment = null }) => {
  const fd = new FormData();
  fd.append('message', message);
  mentions.forEach((id) => fd.append('mentions', id));
  if (attachment) fd.append('attachment', attachment);
  return apiClient.post(`chat/${roomId}/send/`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};