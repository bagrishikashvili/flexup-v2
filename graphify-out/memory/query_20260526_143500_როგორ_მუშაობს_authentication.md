---
type: "query"
date: "2026-05-26T14:35:00.351487+00:00"
question: "როგორ მუშაობს authentication?"
contributor: "graphify"
source_nodes: ["AuthService", "AuthModule", "JwtStrategy", "JwtAuthGuard", "AuthController", "EmailVerificationService"]
---

# Q: როგორ მუშაობს authentication?

## Answer

Expanded from original query via vocab: [auth, login, jwt, token, refresh, register, password, guard, strategy, verify, logout, session]. Authentication flows through 5 layers: (1) AuthModule wires together AuthService, JwtStrategy, JwtAuthGuard, AuthController + EmailVerificationModule; (2) Register/Login/Refresh/Logout endpoints on AuthController delegate to AuthService methods (.register(), .login(), .refresh(), .logout()); (3) JwtStrategy.validate() decodes JWT payload (sub+role) and hydrates the request user; (4) JwtAuthGuard.canActivate() gates all routes except those marked @Public(); (5) EmailVerificationService.issueAndSend() is fire-and-forget called after register for COMPANY_USER. Refresh tokens are hashed (SHA-256), stored in DB, rotated on use, and revoked on logout. Cookies managed by auth-cookies.utils.ts (setRefreshTokenCookie/clearRefreshTokenCookie).

## Source Nodes

- AuthService
- AuthModule
- JwtStrategy
- JwtAuthGuard
- AuthController
- EmailVerificationService