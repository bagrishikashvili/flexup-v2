export enum UserRole {
  WORKER = 'WORKER',
  COMPANY_USER = 'COMPANY_USER',
  ADMIN = 'ADMIN',
}

export enum CompanyMemberRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

export enum ShiftVisibility {
  OPEN = 'OPEN',
  PRIVATE = 'PRIVATE',
}

export enum ShiftStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FILLED = 'FILLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum JobCategory {
  HOSPITALITY = 'HOSPITALITY',
  RETAIL = 'RETAIL',
  LOGISTICS = 'LOGISTICS',
  DELIVERY = 'DELIVERY',
  EVENTS = 'EVENTS',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}
