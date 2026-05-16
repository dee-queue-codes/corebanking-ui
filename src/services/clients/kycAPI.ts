import { http } from '../http'

export const kycAPI = {
  getDocuments: (clientId: string) => http.get(`/clients/${clientId}/kyc/documents`),
  uploadDocument: (clientId: string, formData: FormData) =>
    http.post(`/clients/${clientId}/kyc/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
