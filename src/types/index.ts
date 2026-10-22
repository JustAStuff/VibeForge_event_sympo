// Supabase Database Types
// Auto-generated from schema — update when migrations change

export type AcademicYear = 'Second Year' | 'Third Year'

export type SessionStatus =
  | 'pending_challenge'
  | 'challenge_selected'
  | 'active'
  | 'paused'
  | 'completed'
  | 'expired'
  | 'cancelled'

export type RecoveryStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type SurpriseTaskStatus =
  | 'draft'
  | 'published'
  | 'acknowledged'
  | 'completed'
  | 'withdrawn'

export type MilestoneType = 'elapsed_15min' | 'elapsed_30min' | 'elapsed_45min'

export type ProcessingStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'skipped'

export type NotificationChannel = 'browser' | 'push' | 'realtime'

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'skipped'

// ============================================================
// Database Row Types
// ============================================================

export interface Challenge {
  id: string
  challenge_number: number
  title: string
  brief: string
  core_requirements: string[]
  possible_additions: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  full_name: string
  academic_year: AcademicYear
  register_number: string
  normalized_register_number: string
  created_at: string
  updated_at: string
}

export interface ParticipantIdentity {
  id: string
  participant_id: string
  auth_user_id: string
  linked_at: string
  linked_by_admin_id: string | null
  is_active: boolean
  created_at: string
}

export interface Session {
  id: string
  participant_id: string
  challenge_id: string | null
  session_status: SessionStatus
  started_at: string | null
  deadline_at: string | null
  ended_at: string | null
  paused_at: string | null
  resumed_at: string | null
  total_paused_seconds: number
  last_heartbeat_at: string | null
  connection_status: 'connected' | 'connection_lost' | 'unknown'
  created_at: string
  updated_at: string
}

export interface RecoveryRequest {
  id: string
  participant_id: string
  session_id: string | null
  requesting_auth_user_id: string
  status: RecoveryStatus
  request_reason: string | null
  requested_at: string
  reviewed_at: string | null
  reviewed_by_admin_id: string | null
  rejection_reason: string | null
  approved_identity_id: string | null
  created_at: string
  updated_at: string
}

export interface SessionEvent {
  id: string
  session_id: string
  participant_id: string
  event_type: string
  actor_id: string | null
  actor_role: 'participant' | 'admin' | 'system' | null
  event_timestamp: string
  reason: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface SurpriseTask {
  id: string
  session_id: string
  participant_id: string
  title: string
  instructions: string
  status: SurpriseTaskStatus
  created_by_admin_id: string
  created_at: string
  updated_at: string
  published_at: string | null
  published_by_admin_id: string | null
  acknowledged_at: string | null
  acknowledged_by_participant_id: string | null
  completed_at: string | null
  completed_by_participant_id: string | null
  withdrawn_at: string | null
  withdrawn_by_admin_id: string | null
  withdrawal_reason: string | null
}

export interface MilestoneEvent {
  id: string
  session_id: string
  participant_id: string
  milestone_type: MilestoneType
  due_at: string
  processing_status: ProcessingStatus
  processed_at: string | null
  created_at: string
}

export interface Evaluation {
  id: string
  participant_id: string
  session_id: string
  creativity_score: number | null
  functionality_score: number | null
  ai_iteration_score: number | null
  surprise_task_score: number | null
  presentation_score: number | null
  total_score: number | null
  remarks: string | null
  surprise_task_manually_verified: boolean
  surprise_task_verification_note: string | null
  evaluated_by_admin_id: string | null
  updated_at: string
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_role: 'participant' | 'admin' | 'system' | null
  action: string
  table_name: string | null
  record_id: string | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface NotificationDelivery {
  id: string
  milestone_event_id: string | null
  notification_type: string
  reference_id: string | null
  recipient_auth_user_id: string
  recipient_role: 'participant' | 'admin'
  channel: NotificationChannel
  delivery_status: DeliveryStatus
  attempt_count: number
  last_attempt_at: string | null
  delivered_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface PushSubscription {
  id: string
  auth_user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  is_active: boolean
  created_at: string
  revoked_at: string | null
}

// ============================================================
// Extended / Joined Types for UI
// ============================================================

/**
 * Narrow view of a surprise task that is safe to expose to a participant.
 * Deliberately omits admin identity columns and any draft-only fields.
 */
export type ParticipantSurpriseTask = Pick<
  SurpriseTask,
  | 'id'
  | 'session_id'
  | 'participant_id'
  | 'title'
  | 'instructions'
  | 'status'
  | 'published_at'
  | 'acknowledged_at'
  | 'completed_at'
  | 'created_at'
  | 'updated_at'
>

export interface ChallengeBrief {
  number: number
  title: string
  brief: string
  core_requirements: string[]
  possible_additions: string[]
}

export interface ParticipantWithSession extends Participant {
  session: Session | null
  challenge: Challenge | null
  recovery_request: RecoveryRequest | null
  evaluation: Evaluation | null
  surprise_task: SurpriseTask | null
}

export interface SessionWithDetails extends Session {
  participant: Participant
  challenge: Challenge | null
  surprise_task: SurpriseTask | null
  evaluation: Evaluation | null
}

export interface AdminParticipantRow {
  participant: Participant
  session: Session | null
  challenge: Challenge | null
  surprise_task: SurpriseTask | null
  evaluation: Evaluation | null
  pending_recovery: RecoveryRequest | null
  remaining_seconds: number | null
  elapsed_seconds: number | null
}

// ============================================================
// API Response Types (Edge Functions)
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export interface RegisterResponse {
  participant_id: string
  session_id: string
  is_new: boolean
}

export interface StartSessionResponse {
  session_id: string
  started_at: string
  deadline_at: string
  challenge: Challenge
}

export interface RecoveryRequestResponse {
  request_id: string
  status: RecoveryStatus
}

export interface HeartbeatResponse {
  ok: boolean
  session_status: SessionStatus
  remaining_seconds: number | null
}
