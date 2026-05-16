export interface LoginRequest {
  email: string
  password: string
}

export interface LoginTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

// Backend wraps all responses in { success, data, responseCode, responseMessage }
export interface ApiResponse<T> {
  success: boolean
  data: T
  responseCode: string
  responseMessage: string
}

export type LoginResponse = ApiResponse<LoginTokens>

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  photoUrl?: string
  gender?: string
  isActive: boolean
  defaultRole: string
  roleIds: Array<{ id: string; name: string }>
}
