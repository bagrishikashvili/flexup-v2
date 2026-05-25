# Batch 2.Z + F1.2 — Email Verification (End-to-End)

## ⚠ პირველი ნაბიჯი — წაიკითხე ეს ფაილები

1. `CLAUDE.md` (root-ში)
2. `docs/ARCHITECTURE.md` — ყველა ADR
3. `apps/flexup-backend/prisma/schema.prisma` — User model (emailVerified field უკვე გვაქვს)
4. `apps/flexup-backend/src/auth/` — სრული auth module
5. `apps/flexup-web/src/` — Frontend foundation (F1.1-დან)
6. `packages/shared/src/` — types, schemas

თუ რომელიმე ცვლილება ეწინააღმდეგება CLAUDE.md-ს — **შემაჩერე და მკითხე**.

---

## INPUT (კონტექსტი)

რა გვაქვს:
- სრული Auth (cookies-based)
- `User.emailVerified: Boolean` field schema-ში (default false)
- Frontend Login page მუშაობს
- packages/shared types

რა გვაკლია:
- Email service (SMTP-based)
- Verification token entity + endpoints
- Register page frontend-ში
- Email-locked gate page (verification not complete)
- Verify token landing page
- Email template (HTML, login card style)

---

## CRITICAL CONSTRAINT — Web Scope

**ეს web app მხოლოდ COMPANY_USER-ისთვისაა.** WORKER role-ი web-ში არ ფიქსირდება. Mobile app მერე იქნება worker-ებისთვის.

ეს ნიშნავს:
- Email verification logic მხოლოდ COMPANY_USER-ისთვის
- Register page hardcode-ად `role: COMPANY_USER` (UI-ში არ ჩანს role selector)
- Login backend-ში — თუ WORKER შემოვიდა web-ისთვის specific endpoint-ი, error
- Verification gate მხოლოდ COMPANY_USER-ისთვის applies
- Schema-ში არაფერი იცვლება — WORKER-ი მერე mobile-დან გაივლის verification-ს ცალკე flow-ით

---

## GOAL

ააშენე end-to-end email verification:
1. რეგისტრაცია → email გაგზავნა → "check email" page
2. User-ი ხედავს email-ს Mailpit-ში → click verify → success page → dashboard
3. სანამ არ verify, ლოგინი → blocked gate page (only logout + language switch)

---

# PART 1 — BACKEND (Mini-Batch 2.Z)

## A. Schema cvlilebebi

### 1. Prisma schema-ში დაამატე

`apps/flexup-backend/prisma/schema.prisma`:

```prisma
model EmailVerificationToken {
  id            String    @id @default(cuid())
  tokenHash     String    @unique         // SHA-256 hash, never raw
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  email         String                    // snapshot — User.email-ი შეიძლება შეიცვალოს
  expiresAt     DateTime
  usedAt        DateTime?                 // one-time use
  
  createdAt     DateTime  @default(now())
  
  @@index([userId])
  @@index([tokenHash])
  @@index([expiresAt])
}
```

User model-ში დაამატე relation:
```prisma
model User {
  // ... existing fields
  emailVerificationTokens   EmailVerificationToken[]
}
```

### 2. Migration

```bash
npm run db:migrate:dev -- --name email_verification_token
```

## B. Docker — Mailpit service

`docker-compose.yml`-ში დაამატე:

```yaml
  mailpit:
    image: axllent/mailpit:latest
    container_name: flexup-mailpit
    restart: unless-stopped
    ports:
      - "${MAILPIT_SMTP_PORT:-1025}:1025"     # SMTP
      - "${MAILPIT_WEB_PORT:-8025}:8025"     # Web UI
    environment:
      MP_MAX_MESSAGES: 5000
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1
```

⚠ Backend service-ში env vars დაამატე:
```yaml
  backend:
    environment:
      # ... existing
      SMTP_HOST: mailpit
      SMTP_PORT: 1025
      SMTP_USER: ""
      SMTP_PASS: ""
      EMAIL_FROM: noreply@flexup.local
      EMAIL_FROM_NAME: flexup
      WEB_BASE_URL: http://localhost:5173
```

## C. Config

`.env.example`:

```bash
# Email
EMAIL_PROVIDER=smtp                     # smtp | console (future: resend)
SMTP_HOST=localhost                     # Mailpit dev
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false                       # production: true (TLS)
EMAIL_FROM=noreply@flexup.local
EMAIL_FROM_NAME=flexup

# Web app URL (for email links)
WEB_BASE_URL=http://localhost:5173

# Verification
EMAIL_VERIFICATION_TTL_HOURS=24
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
EMAIL_VERIFICATION_MAX_PER_DAY=5

# Mailpit ports (dev)
MAILPIT_SMTP_PORT=1025
MAILPIT_WEB_PORT=8025
```

`config.schema.ts` (Joi):
```typescript
EMAIL_PROVIDER: Joi.string().valid('smtp', 'console').default('smtp'),
SMTP_HOST: Joi.string().required(),
SMTP_PORT: Joi.number().port().required(),
SMTP_USER: Joi.string().allow('').default(''),
SMTP_PASS: Joi.string().allow('').default(''),
SMTP_SECURE: Joi.boolean().default(false),
EMAIL_FROM: Joi.string().email().required(),
EMAIL_FROM_NAME: Joi.string().required(),
WEB_BASE_URL: Joi.string().uri().required(),
EMAIL_VERIFICATION_TTL_HOURS: Joi.number().integer().min(1).max(168).default(24),
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(0).default(60),
EMAIL_VERIFICATION_MAX_PER_DAY: Joi.number().integer().min(1).default(5),
```

`config.service.ts`:
```typescript
get email() {
  return {
    provider: this.configService.get<'smtp' | 'console'>('EMAIL_PROVIDER')!,
    smtp: {
      host: this.configService.get<string>('SMTP_HOST')!,
      port: this.configService.get<number>('SMTP_PORT')!,
      user: this.configService.get<string>('SMTP_USER')!,
      pass: this.configService.get<string>('SMTP_PASS')!,
      secure: this.configService.get<boolean>('SMTP_SECURE')!,
    },
    from: this.configService.get<string>('EMAIL_FROM')!,
    fromName: this.configService.get<string>('EMAIL_FROM_NAME')!,
  };
}

get webBaseUrl(): string {
  return this.configService.get<string>('WEB_BASE_URL')!;
}

get verification() {
  return {
    ttlHours: this.configService.get<number>('EMAIL_VERIFICATION_TTL_HOURS')!,
    resendCooldownSeconds: this.configService.get<number>('EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS')!,
    maxPerDay: this.configService.get<number>('EMAIL_VERIFICATION_MAX_PER_DAY')!,
  };
}
```

## D. Dependencies (მკითხე ჯერ)

- `nodemailer` (SMTP)
- `@types/nodemailer` (dev)

**⚠ React Email skip:** ჯერ ჩვეულებრივი HTML strings — Mailpit-ში მუშაობს, simpler. React Email მერე თუ template-ები გართულდა.

## E. Email Module

### 1. `src/email/email.module.ts`

```typescript
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

### 2. Provider interface

`src/email/providers/email-provider.interface.ts`:

```typescript
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;            // plaintext fallback
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
```

### 3. SMTP provider

`src/email/providers/smtp.provider.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '@/config/config.service';
import type { EmailMessage, EmailProvider } from './email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtp = configService.email.smtp;
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    const fromName = this.configService.email.fromName;
    const fromAddress = this.configService.email.from;

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      this.logger.log(`Email sent: ${info.messageId} → ${message.to}`);
    } catch (error) {
      this.logger.error(`Email send failed: ${message.to}`, error);
      throw error;
    }
  }
}
```

### 4. Console provider (testing)

`src/email/providers/console.provider.ts`:

```typescript
@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log('=== EMAIL (console mode) ===');
    this.logger.log(`To: ${message.to}`);
    this.logger.log(`Subject: ${message.subject}`);
    this.logger.log(`HTML:\n${message.html}`);
  }
}
```

### 5. EmailService

`src/email/email.service.ts`:

```typescript
@Injectable()
export class EmailService implements EmailProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly consoleProvider: ConsoleEmailProvider,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const provider = this.configService.email.provider;
    
    switch (provider) {
      case 'smtp':
        return this.smtpProvider.send(message);
      case 'console':
        return this.consoleProvider.send(message);
      default:
        throw new Error(`Unknown email provider: ${provider}`);
    }
  }
}
```

### 6. Email templates

`src/email/templates/verification-email.template.ts`:

```typescript
interface VerificationEmailParams {
  firstName: string;
  verifyUrl: string;
  expiresInHours: number;
  appName: string;
  language: 'ka' | 'en';
}

const T = {
  ka: {
    subject: 'flexup — ანგარიშის გააქტიურება',
    greeting: 'გამარჯობა',
    body: 'flexup-ზე რეგისტრაციისთვის მადლობა! გთხოვთ, დააწექით ქვემოთ მოცემულ ღილაკს თქვენი ანგარიშის გასააქტიურებლად.',
    button: 'ანგარიშის გააქტიურება',
    expires: 'ეს ლინკი მოქმედებს {{hours}} საათის განმავლობაში.',
    fallback: 'თუ ღილაკი არ მუშაობს, დააკოპირეთ ეს ბმული თქვენი ბრაუზერის მისამართის ველში:',
    notYou: 'თუ თქვენ არ დარეგისტრირებულხართ flexup-ზე, უბრალოდ უგულებელყავით ეს წერილი.',
    footer: 'პატივისცემით, flexup-ის გუნდი',
  },
  en: {
    subject: 'flexup — Verify your account',
    greeting: 'Hello',
    body: "Thank you for signing up to flexup! Please click the button below to activate your account.",
    button: 'Verify Account',
    expires: 'This link is valid for {{hours}} hours.',
    fallback: "If the button doesn't work, copy this link into your browser's address bar:",
    notYou: "If you didn't sign up for flexup, simply ignore this email.",
    footer: 'Best regards, the flexup team',
  },
};

export function renderVerificationEmail(params: VerificationEmailParams): { subject: string; html: string; text: string } {
  const t = T[params.language] || T.en;
  const expiresText = t.expires.replace('{{hours}}', String(params.expiresInHours));

  const html = `<!DOCTYPE html>
<html lang="${params.language}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans Georgian',Roboto,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- App name header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;margin-bottom:24px;">
          <tr>
            <td align="center">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">${params.appName}</h1>
            </td>
          </tr>
        </table>
        
        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:600;color:#0f172a;">${t.greeting}, ${escapeHtml(params.firstName)}!</h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">${t.body}</p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 24px 0;">
                    <a href="${params.verifyUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">${t.button}</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0 0 16px 0;font-size:13px;color:#64748b;text-align:center;">${expiresText}</p>
              
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
              
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">${t.fallback}</p>
              <p style="margin:0 0 24px 0;font-size:12px;color:#3b82f6;word-break:break-all;">${params.verifyUrl}</p>
              
              <p style="margin:0;font-size:13px;color:#94a3b8;">${t.notYou}</p>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <p style="margin:24px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">${t.footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${t.greeting}, ${params.firstName}!

${t.body}

${t.button}: ${params.verifyUrl}

${expiresText}

${t.notYou}

— ${t.footer}`;

  return { subject: t.subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]!));
}
```

**მნიშვნელოვანი:** Email HTML inline CSS-ით (table-based layout) — Gmail, Outlook, Apple Mail-ში renders consistently. CSS classes ემეილებში ვერ მუშაობს reliable.

## F. Verification Module

### 1. `src/email-verification/email-verification.module.ts`

```typescript
@Module({
  imports: [EmailModule],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
  controllers: [EmailVerificationController],
})
export class EmailVerificationModule {}
```

### 2. `src/email-verification/email-verification.service.ts`

```typescript
@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Issues a verification token and sends email.
   * Called automatically after registration, and on resend request.
   */
  async issueAndSend(userId: string, language: 'ka' | 'en' = 'ka'): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      throw new BadRequestException({
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'Email already verified',
      });
    }

    // Rate limit checks
    await this.checkRateLimits(userId);

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const ttlHours = this.configService.verification.ttlHours;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    // Save hash
    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        email: user.email,
        expiresAt,
      },
    });

    // Build verify URL — frontend handles
    const verifyUrl = `${this.configService.webBaseUrl}/auth/verify-email?token=${rawToken}`;

    // Render email
    const rendered = renderVerificationEmail({
      firstName: user.firstName,
      verifyUrl,
      expiresInHours: ttlHours,
      appName: 'flexup',
      language,
    });

    // Send
    await this.emailService.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    this.logger.log(`Verification email sent to ${user.email}`);
  }

  /**
   * Verifies a token. Marks user as verified, marks token as used.
   */
  async verify(rawToken: string): Promise<{ userId: string }> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!token) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_INVALID',
        message: 'Invalid verification token',
      });
    }

    if (token.usedAt) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_USED',
        message: 'This verification link has already been used',
      });
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'VERIFICATION_TOKEN_EXPIRED',
        message: 'This verification link has expired',
      });
    }

    // Verify in transaction — token usage + user.emailVerified
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: token.userId },
        data: { emailVerified: true },
      }),
    ]);

    this.logger.log(`Email verified: userId=${token.userId}`);
    return { userId: token.userId };
  }

  private async checkRateLimits(userId: string): Promise<void> {
    const cooldownSec = this.configService.verification.resendCooldownSeconds;
    const maxPerDay = this.configService.verification.maxPerDay;

    // Cooldown check
    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const sinceLastMs = Date.now() - lastToken.createdAt.getTime();
      if (sinceLastMs < cooldownSec * 1000) {
        const secondsLeft = Math.ceil((cooldownSec * 1000 - sinceLastMs) / 1000);
        throw new BadRequestException({
          code: 'VERIFICATION_RESEND_COOLDOWN',
          message: `Please wait ${secondsLeft}s before resending`,
        });
      }
    }

    // Daily quota
    const since24h = new Date(Date.now() - 24 * 3600 * 1000);
    const count = await this.prisma.emailVerificationToken.count({
      where: { userId, createdAt: { gte: since24h } },
    });

    if (count >= maxPerDay) {
      throw new BadRequestException({
        code: 'VERIFICATION_DAILY_LIMIT',
        message: 'Daily verification email limit reached',
      });
    }
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
```

### 3. `src/email-verification/email-verification.controller.ts`

```typescript
@ApiTags('auth')
@Controller('auth')
export class EmailVerificationController {
  constructor(private readonly service: EmailVerificationService) {}

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @Post('verify-email')
  @HttpCode(200)
  async verify(@Body() dto: VerifyEmailDto): Promise<{ success: true }> {
    await this.service.verify(dto.token);
    return { success: true };
  }

  @Throttle({ short: { ttl: 60_000, limit: 3 } })
  @Post('resend-verification')
  @HttpCode(204)
  async resend(
    @CurrentUser() user: User,
    @Body() dto: ResendVerificationDto,
  ): Promise<void> {
    await this.service.issueAndSend(user.id, dto.language ?? 'ka');
  }
}
```

### 4. DTOs

`src/email-verification/dto/verify-email.dto.ts`:
```typescript
export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

`src/email-verification/dto/resend-verification.dto.ts`:
```typescript
export class ResendVerificationDto {
  @ApiPropertyOptional({ enum: ['ka', 'en'] })
  @IsOptional()
  @IsEnum(['ka', 'en'])
  language?: 'ka' | 'en';
}
```

## G. AuthService refactor

`AuthService.register` — issue verification email after creating user:

```typescript
async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthTokensInternalResponse> {
  // ... existing user creation logic

  // After user.create, before returning tokens:
  if (newUser.role === UserRole.COMPANY_USER) {
    // Fire and forget — don't fail registration if email fails
    void this.emailVerificationService.issueAndSend(newUser.id, dto.language ?? 'ka')
      .catch((err) => {
        this.logger.error(`Failed to send verification email on register: ${newUser.email}`, err);
      });
  }

  // ... return tokens
}
```

⚠ **DI:** `EmailVerificationService` inject-დება `AuthService`-ში. AuthModule imports EmailVerificationModule.

**Circular dep risk:** Auth → EmailVerification → ... უკან Auth-ი არ ჯდება. OK.

### Update RegisterDto

`src/auth/dto/register.dto.ts`:
```typescript
export class RegisterDto implements RegisterRequest {
  // ... existing fields
  
  @ApiPropertyOptional({ enum: ['ka', 'en'] })
  @IsOptional()
  @IsEnum(['ka', 'en'])
  language?: 'ka' | 'en';
}
```

## H. AuthController response — add emailVerified

`AuthResponseWithoutRefresh` უკვე გვაქვს. დაამატე `emailVerified`:

`packages/shared/src/types/auth.types.ts`:
```typescript
export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;        // ← NEW
}
```

Mapper-ი update-ი ყველგან — Prisma User → AuthUserDto must include `emailVerified`.

## I. Optional Guard — EmailVerifiedGuard

Future-proofing — როცა frontend-ი ვერ ენდობა client-side check-ს, server-side guard.

`src/common/guards/email-verified.guard.ts`:
```typescript
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    // ADMIN-ი exempt
    if (user.role === 'ADMIN') {
      return true;
    }

    // WORKER არ ხდება web-ში (mobile-ისთვის)
    // COMPANY_USER უნდა იყოს verified
    if (user.role === 'COMPANY_USER' && !user.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email to access this resource',
      });
    }

    return true;
  }
}
```

გამოყენება მერე — Companies module-ში დაუმატე `@UseGuards(JwtAuthGuard, EmailVerifiedGuard)` ცალკე batch-ში (out of scope here).

ამ batch-ში guard-ი არსებობს, მაგრამ controllers-ში არ მიდის — მხოლოდ frontend gate-ი.

## J. Shared types update

`packages/shared/src/types/auth.types.ts`:
```typescript
export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  language?: 'ka' | 'en';
}
```

`packages/shared/src/types/error.types.ts` — დაამატე ახალი codes:
```typescript
export enum ErrorCode {
  // ... existing
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED',
  VERIFICATION_TOKEN_INVALID = 'VERIFICATION_TOKEN_INVALID',
  VERIFICATION_TOKEN_EXPIRED = 'VERIFICATION_TOKEN_EXPIRED',
  VERIFICATION_TOKEN_USED = 'VERIFICATION_TOKEN_USED',
  VERIFICATION_RESEND_COOLDOWN = 'VERIFICATION_RESEND_COOLDOWN',
  VERIFICATION_DAILY_LIMIT = 'VERIFICATION_DAILY_LIMIT',
}
```

`packages/shared/src/validation/auth.schemas.ts`:
```typescript
export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  language: z.enum(['ka', 'en']).optional(),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
```

`registerSchema` update — დაამატე language:
```typescript
export const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/),
  phoneNumber: z.string().optional(),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  role: z.literal(UserRole.COMPANY_USER),    // ← web-ისთვის ფიქსირებული
  language: z.enum(['ka', 'en']).optional(),
});
```

⚠ **მნიშვნელოვანი:** `role: z.literal(UserRole.COMPANY_USER)` — web client COMPANY_USER-ს მხოლოდ. WORKER რეგისტრაცია mobile-ისთვის separately მერე.

---

# PART 2 — FRONTEND (Batch F1.2)

## K. Translation files

`apps/flexup-web/src/locales/ka/auth.json` — დაამატე:
```json
{
  "register": {
    "title": "რეგისტრაცია",
    "subtitle": "შექმენი ახალი ანგარიში flexup-ზე",
    "firstName": "სახელი",
    "firstNamePlaceholder": "შენი სახელი",
    "lastName": "გვარი",
    "lastNamePlaceholder": "შენი გვარი",
    "email": "ელ.ფოსტა",
    "emailPlaceholder": "name@example.com",
    "phoneNumber": "ტელეფონის ნომერი (არასავალდებულო)",
    "phoneNumberPlaceholder": "+995 555 12 34 56",
    "password": "პაროლი",
    "passwordPlaceholder": "მინიმუმ 8 სიმბოლო",
    "passwordHint": "მინიმუმ 8 სიმბოლო, ერთი ასო და ერთი ციფრი",
    "submit": "რეგისტრაცია",
    "loading": "მუშავდება...",
    "hasAccount": "უკვე გაქვს ანგარიში?",
    "login": "შესვლა",
    "terms": "რეგისტრაციით ეთანხმები წესებსა და კონფიდენციალურობის პოლიტიკას"
  },
  "verifyGate": {
    "title": "გააქტიურე ანგარიში",
    "subtitle": "თქვენი ანგარიში თითქმის მზადაა",
    "body": "გადახედე შენი ელ.ფოსტა <strong>{{email}}</strong> და დააწექი გააქტიურების ბმულს.",
    "resend": "ხელახლა გამოგზავნა",
    "resending": "გამოგზავნა...",
    "resendSuccess": "ემეილი ხელახლა გამოგზავნილია",
    "resendCooldown": "კიდევ {{seconds}} წამის ლოდინი",
    "wrongEmail": "არასწორი ელ.ფოსტა? ",
    "logoutAndRegister": "გასვლა და ხელახლა რეგისტრაცია"
  },
  "verifyEmail": {
    "verifying": "მოწმდება...",
    "successTitle": "ანგარიში გააქტიურდა!",
    "successBody": "თქვენი ანგარიში წარმატებით გააქტიურდა. გადამისამართდები dashboard-ზე...",
    "errorTitle": "გააქტიურება ვერ მოხერხდა",
    "errorInvalid": "ბმული არასწორია ან გაუვალია.",
    "errorExpired": "ბმული ვადაგასულია. ხელახლა ითხოვე verification email.",
    "errorUsed": "ეს ბმული უკვე გამოყენებულია.",
    "goToLogin": "შესვლის გვერდზე გადასვლა",
    "resend": "ხელახლა გამოგზავნა"
  }
}
```

ანალოგიური `en/auth.json`:
```json
{
  "register": {
    "title": "Create Account",
    "subtitle": "Create your flexup account",
    "firstName": "First name",
    "firstNamePlaceholder": "Your first name",
    "lastName": "Last name",
    "lastNamePlaceholder": "Your last name",
    "email": "Email",
    "emailPlaceholder": "name@example.com",
    "phoneNumber": "Phone number",
    "phoneNumberPlaceholder": "+995 555 12 34 56",
    "password": "Password",
    "passwordPlaceholder": "At least 8 characters",
    "passwordHint": "Min 8 chars, must include letter + number",
    "submit": "Register",
    "loading": "Processing...",
    "hasAccount": "Already have an account?",
    "login": "Login",
    "terms": "By registering you agree to the Terms and Privacy Policy"
  },
  "verifyGate": {
    "title": "Activate your account",
    "subtitle": "Your account is almost ready",
    "body": "Check your email <strong>{{email}}</strong> and click the activation link.",
    "resend": "Resend email",
    "resending": "Sending...",
    "resendSuccess": "Verification email resent",
    "resendCooldown": "Wait {{seconds}}s",
    "wrongEmail": "Wrong email? ",
    "logoutAndRegister": "Log out and register again"
  },
  "verifyEmail": {
    "verifying": "Verifying...",
    "successTitle": "Account activated!",
    "successBody": "Your account has been activated successfully. Redirecting to dashboard...",
    "errorTitle": "Verification failed",
    "errorInvalid": "Link is invalid or expired.",
    "errorExpired": "Link has expired. Request a new verification email.",
    "errorUsed": "This link has already been used.",
    "goToLogin": "Go to login",
    "resend": "Resend"
  }
}
```

Error codes ka/en `errors.json`:
```json
{
  "EMAIL_NOT_VERIFIED": "გთხოვთ, გააქტიურეთ ანგარიში ემეილზე გაგზავნილი ბმულით",
  "EMAIL_ALREADY_VERIFIED": "ანგარიში უკვე გააქტიურებულია",
  "VERIFICATION_TOKEN_INVALID": "verification ბმული არასწორია",
  "VERIFICATION_TOKEN_EXPIRED": "verification ბმული ვადაგასულია",
  "VERIFICATION_TOKEN_USED": "ეს ბმული უკვე გამოყენებულია",
  "VERIFICATION_RESEND_COOLDOWN": "გთხოვთ დაელოდოთ ხელახლა გამოგზავნამდე",
  "VERIFICATION_DAILY_LIMIT": "დღიური ლიმიტი ამოწურულია"
}
```

## L. Routes

### 1. Register page — `src/routes/auth/register.tsx`

```typescript
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, UserRole, type RegisterRequest } from '@flexup/shared';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiRequest, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { AuthResponseWithoutRefresh } from '@flexup/shared';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { t, i18n } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: UserRole.COMPANY_USER,
      language: i18n.language === 'en' ? 'en' : 'ka',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterRequest) =>
      apiRequest<AuthResponseWithoutRefresh>('/auth/register', {
        method: 'POST',
        body: data,
        skipAuth: true,
      }),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      // emailVerified=false, redirects to gate via root layout / index guard
      navigate({ to: '/' });
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: tErrors('UNKNOWN_ERROR') }));
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('register.title')}</CardTitle>
          <CardDescription>{t('register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.firstName')}</FormLabel>
                      <FormControl><Input placeholder={t('register.firstNamePlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.lastName')}</FormLabel>
                      <FormControl><Input placeholder={t('register.lastNamePlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.email')}</FormLabel>
                    <FormControl><Input type="email" placeholder={t('register.emailPlaceholder')} autoComplete="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.phoneNumber')}</FormLabel>
                    <FormControl><Input type="tel" placeholder={t('register.phoneNumberPlaceholder')} autoComplete="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.password')}</FormLabel>
                    <FormControl><Input type="password" placeholder={t('register.passwordPlaceholder')} autoComplete="new-password" {...field} /></FormControl>
                    <FormDescription>{t('register.passwordHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t('register.loading') : t('register.submit')}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t('register.terms')}
              </p>

              <p className="text-center text-sm text-muted-foreground">
                {t('register.hasAccount')}{' '}
                <Link to="/auth/login" className="text-primary hover:underline">
                  {t('register.login')}
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Verify Gate — `src/routes/auth/verify-gate.tsx`

```typescript
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation, Trans } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiRequest, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Mail } from 'lucide-react';

export const Route = createFileRoute('/auth/verify-gate')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
    if (user?.emailVerified) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: VerifyGatePage,
});

function VerifyGatePage() {
  const { t, i18n } = useTranslation('auth');
  const { t: tCommon } = useTranslation();
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const resendMutation = useMutation({
    mutationFn: () =>
      apiRequest<void>('/auth/resend-verification', {
        method: 'POST',
        body: { language: i18n.language === 'en' ? 'en' : 'ka' },
      }),
    onSuccess: () => {
      toast.success(t('verifyGate.resendSuccess'));
      setCooldown(60);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: tErrors('UNKNOWN_ERROR') }));
      if (code === 'VERIFICATION_RESEND_COOLDOWN') {
        setCooldown(60);
      }
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {/* ignore */}
    logout();
    navigate({ to: '/auth/register' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          {t('logout')}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('verifyGate.title')}</CardTitle>
          <CardDescription>{t('verifyGate.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            <Trans 
              i18nKey="verifyGate.body" 
              ns="auth"
              values={{ email: user?.email }}
              components={{ strong: <strong className="text-foreground" /> }}
            />
          </p>

          <Button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending || cooldown > 0}
            className="w-full"
            variant="outline"
          >
            {resendMutation.isPending
              ? t('verifyGate.resending')
              : cooldown > 0
              ? t('verifyGate.resendCooldown', { seconds: cooldown })
              : t('verifyGate.resend')}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t('verifyGate.wrongEmail')}
            <button onClick={handleLogout} className="text-primary hover:underline">
              {t('verifyGate.logoutAndRegister')}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Verify Email Token — `src/routes/auth/verify-email.tsx`

```typescript
import { createFileRoute, useNavigate, useSearch, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { apiRequest, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
});

type State = 
  | { kind: 'verifying' }
  | { kind: 'success' }
  | { kind: 'error'; code: string };

function VerifyEmailPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const { token } = useSearch({ from: '/auth/verify-email' });
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  
  const [state, setState] = useState<State>({ kind: 'verifying' });

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', code: 'VERIFICATION_TOKEN_INVALID' });
      return;
    }

    apiRequest('/auth/verify-email', {
      method: 'POST',
      body: { token },
      skipAuth: true,
    })
      .then(() => {
        setState({ kind: 'success' });
        // Update auth store — emailVerified true
        if (user) {
          setAuth(useAuthStore.getState().accessToken!, { ...user, emailVerified: true });
        }
        // Auto-redirect after 2s
        setTimeout(() => navigate({ to: '/dashboard' }), 2000);
      })
      .catch((err) => {
        const code = err instanceof ApiError ? err.code : 'UNKNOWN_ERROR';
        setState({ kind: 'error', code });
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {state.kind === 'verifying' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
              <CardTitle className="mt-4">{t('verifyEmail.verifying')}</CardTitle>
            </>
          )}
          {state.kind === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <CardTitle className="mt-4">{t('verifyEmail.successTitle')}</CardTitle>
            </>
          )}
          {state.kind === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="mt-4">{t('verifyEmail.errorTitle')}</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state.kind === 'success' && (
            <p className="text-sm text-muted-foreground">{t('verifyEmail.successBody')}</p>
          )}
          {state.kind === 'error' && (
            <>
              <p className="text-sm text-muted-foreground">
                {tErrors(state.code, { defaultValue: tErrors('UNKNOWN_ERROR') })}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate({ to: '/auth/login' })}>
                  {t('verifyEmail.goToLogin')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## M. Index route — routing logic

`src/routes/index.tsx`:

```typescript
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }

    // COMPANY_USER unverified → gate
    if (user?.role === 'COMPANY_USER' && !user.emailVerified) {
      throw redirect({ to: '/auth/verify-gate' });
    }

    throw redirect({ to: '/dashboard' });
  },
});
```

## N. Dashboard route guard

`src/routes/dashboard.tsx`:

```typescript
export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
    // Block unverified COMPANY_USER from dashboard
    if (user?.role === 'COMPANY_USER' && !user.emailVerified) {
      throw redirect({ to: '/auth/verify-gate' });
    }
  },
  component: DashboardPage,
});
```

## O. Login route — handle unverified

`src/routes/auth/login.tsx` — login mutation onSuccess:

```typescript
onSuccess: (data) => {
  setAuth(data.accessToken, data.user);
  toast.success(t('login.title'));
  
  // Route based on verification status
  if (data.user.role === 'COMPANY_USER' && !data.user.emailVerified) {
    navigate({ to: '/auth/verify-gate' });
  } else {
    navigate({ to: '/dashboard' });
  }
},
```

---

## ACCEPTANCE CRITERIA

### Build & startup
```bash
# Root
npm install
npm run build -w @flexup/shared

# Backend
cd apps/flexup-backend
npm run build && npm run lint
npm run db:migrate:dev -- --name email_verification_token

# Up everything
cd ../..
npm run docker:up
```

### Mailpit accessible
- Browser: `http://localhost:8025`
- Empty inbox

### E2E flow

**1. Register new company user:**
- Browser: `http://localhost:5173/auth/register`
- შეავსე form
- Submit
- **Expected:** redirect to `/auth/verify-gate`

**2. Verify gate page:**
- Card "გააქტიურე ანგარიში"
- ემეილ ჩანს body-ში
- Only language switcher + logout visible (no navigation)
- "ხელახლა გამოგზავნა" button enabled

**3. Email arrived in Mailpit:**
- Open `http://localhost:8025`
- Inbox-ში თემა "flexup — ანგარიშის გააქტიურება"
- HTML view-ში — login card style email design
- "ანგარიშის გააქტიურება" button visible
- Click → opens `http://localhost:5173/auth/verify-email?token=...`

**4. Verify success:**
- Verifying spinner ~1 second
- Success message
- Auto-redirect to `/dashboard` (2s delay)
- Dashboard accessible

**5. Re-login after logout — already verified:**
- Logout
- Login with same credentials
- **Expected:** straight to `/dashboard` (no gate)

**6. Logout from gate, re-login as unverified:**
- Register second user
- Cancel email click
- Logout
- Login again
- **Expected:** still gate

**7. Resend cooldown:**
- Click resend
- toast success
- Button disabled "კიდევ 60 წამის ლოდინი"
- Wait 60s → enabled again

**8. Used token reuse:**
- Use a verify link
- Click same link again
- **Expected:** error page, "ეს ბმული უკვე გამოყენებულია"

**9. Expired token:**
- DB-ში manually: `UPDATE "EmailVerificationToken" SET "expiresAt" = NOW() - INTERVAL '1 day' WHERE ...`
- Click link
- **Expected:** error "ბმული ვადაგასულია"

**10. Language switching:**
- Verify gate page
- Switch to English
- Body, buttons, footer ყველაფერი ინგლისურად

**11. Email in English:**
- Register new user with `language: 'en'`
- Mailpit email subject — English

**12. Rate limit register:**
- Register 4-ჯერ ზედიზედ
- Backend throttle protects (Batch 2.X-დან)

**13. Worker role rejected in register:**
- შეცადე API ცარიელად:
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"w@w.com","password":"Test1234","firstName":"W","lastName":"W","role":"WORKER"}'
```
- **Expected:** ან 400 (Zod validation rejects), ან strict literal-ი reject-ი frontend-ის level-ით. Backend ჯერ ღია — ეს mobile-ისთვის რჩება.

⚠ **Decision needed:** Backend `register` ენდპოინტი workers-ისთვის ღია რჩება (mobile mer გამოიყენებს)? თუ ცალკე endpoints `/api/auth/register/company` + `/api/auth/register/worker`?

**ჩემი რჩევა:** ჯერ ერთიანი endpoint-ი — Zod schema web-ში literal-ი, backend-ში არ ფიქსირდება. ეს Phase 3-ში (mobile) გადაიწერება.

---

## CONSTRAINTS

1. **არ შეცვალო Auth core logic** — token rotation, refresh, login
2. **არ შეცვალო Phase 1-2 ფუნქციონალი** — backwards compatible
3. **არ წაშალო verification token DB row** წარმატებული verify-ის შემდეგ — `usedAt` flag-ი
4. **არ შენახო raw token DB-ში** — SHA-256 hash
5. **არ გამოიყენო email body inline images** — base64 ან external URLs (Mailpit OK ორივესთვის)
6. **არ გამოიყენო CSS classes ემეილში** — inline styles only
7. **არ შექმნა verification token user-ისთვის რომელიც already verified** — error
8. **არ გამოიყენო `any`** — explicit types
9. **არ წაშალო expired tokens automatic-ად** — Phase 3-ში cleanup job

---

## SECURITY REVIEW

- [ ] Raw token არ ინახება DB-ში — SHA-256 hash only
- [ ] Token TTL ≤ 24 saaTi
- [ ] Token one-time use (`usedAt` flag)
- [ ] Token URL-safe (hex)
- [ ] Email link uses HTTPS in production (`WEB_BASE_URL` env-driven)
- [ ] Resend rate limited (cooldown + daily max)
- [ ] Reuse detection on used token
- [ ] No information leak — wrong token == invalid (same error as expired)
- [ ] Email content sanitized (firstName via escapeHtml)
- [ ] No PII in error logs beyond email + userId

---

## OUT OF SCOPE

- Phone verification (V2)
- Password reset (V2)
- Magic link login (V2)
- React Email components (current HTML templates fine)
- Resend / SendGrid integration (SMTP abstraction ready, swap provider later)
- Email queue (BullMQ / Redis) (sync send OK for MVP)
- Email analytics (open tracking) (V2)
- HTML template editor / live preview (dev tool, later)
- Cleanup job for expired tokens (cron later)

---

## ADR-ი

`docs/ARCHITECTURE.md`-ში:

**ADR-035: Email verification — soft strategy with route gate**
- Decision: User logs in immediately, but COMPANY_USER unverified → route gate
- Reason: better UX than strict, still safe (no business actions until verified)

**ADR-036: SMTP abstraction with provider switching**
- Decision: EmailProvider interface, SMTP default
- Dev: Mailpit
- Production: SMTP (Gmail beta) → Resend (scale)
- Reason: vendor-agnostic, easy migration

**ADR-037: Verification token storage — SHA-256 hash + one-time**
- Same pattern as refresh tokens
- One-time enforced by `usedAt` field

**ADR-038: Web app COMPANY_USER-only scope**
- Decision: web-ი მხოლოდ COMPANY_USER (+ADMIN). WORKER mobile-ისთვის.
- Register schema-ში `role: z.literal(COMPANY_USER)` web-ში
- Mobile app separate endpoints და UI Phase 3-ში

---

## დასასრულს

- ყველა 13 acceptance criterion უნდა გავიდეს
- Mailpit-ში email-ი ჩანს login card style design-ით
- Verify gate მუშაობს, logout-ი მისგან გადის
- Verify link-ი ცოცხალია, success → dashboard
- Commit: `feat: email verification — backend service + frontend gate + register page (batch 2.z + f1.2)`
- Tag: `v0.4.0`

---

## **შემაჩერე** თუ:
- Dependencies დასადასტურებლად (nodemailer)
- Mailpit docker config-ი ცვლის
- React Email migration (out of scope — plain HTML rest)
- Email template design — შემაჩერე და მაჩვენე preview
- Role strategy backend-ში cvlilba (out of scope)
- Cleanup cron job (out of scope — manual SQL ჯერ)
