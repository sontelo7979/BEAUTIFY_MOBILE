// types/user.ts
export interface User {
    id: string
    name: string
    email: string
    role: string
    profilePicture?: string
    roleId?: string
  }
  
  export interface JwtPayload {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string
    RoleId: string
    UserId: string
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/expired": string
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string
    Name: string
    Email: string
    ProfilePicture: string
    RoleName: string
    exp: number
    iss: string
    aud: string
  }