/**
 * Intent & requirements service for the Training page. Two modes:
 *
 * - `VITE_USE_MOCKS=true`: delegates to the labeled mock adapter
 *   (`src/mocks/intentRequirements.ts`) and returns payloads wrapped in
 *   `MockData`, carrying the shared `Sample data` label.
 * - otherwise: the real project-scoped pipeline (see `realAdapter`).
 */
import type {
  IntentSubmissionResult,
  RequirementDecision,
  RequirementRecord,
} from '../schemas/intent'
import type { MockData } from '../mocks/index'
import type { ServiceResult } from './types'
import type { ProjectRequirement, IntentSubmitResult } from '../schemas/projects'
import { createProjectService } from './projects'
import { getProjectScope } from './projectScope'
import { serviceError } from './types'
import { mocksEnabled } from '../mocks/index'
import { mockIntentRequirementsAdapter } from '../mocks/intentRequirements'

export type IntentSubmissionOutcome = ServiceResult<
  IntentSubmissionResult | MockData<IntentSubmissionResult>
>

export interface IntentRequirementsService {
  submitIntent(text: string): Promise<IntentSubmissionOutcome>
  listRequirements(): Promise<ServiceResult<RequirementRecord[] | MockData<RequirementRecord[]>>>
  decideRequirement(
    requirementId: string,
    decision: RequirementDecision,
  ): Promise<ServiceResult<RequirementRecord | MockData<RequirementRecord>>>
}

/**
 * Real mode binds the project-scoped Intent-to-Verification pipeline (`backend/api/routers/projects.py`):
 * `POST /projects/{id}/intents`, `GET /projects/{id}/requirements`, `POST .../requirements/{rid}/confirm|reject`.
 * A project must be active; nothing is invented when none is.
 */
const NO_PROJECT = serviceError(
  'invalid_request',
  'Open a project first: requirements belong to a project.',
)

function toDraft(r: ProjectRequirement): RequirementRecord {
  const confirmed = r.confirmation_status === 'confirmed'
  return {
    requirement_id: r.requirement_id,
    description: r.description || r.source_statement,
    rule_type: r.category ?? null,
    parameters: r.comparison_operator
      ? { comparison_operator: r.comparison_operator, expected_value: r.expected_value }
      : null,
    tolerance: r.tolerance ?? null,
    // the backend never marks a model-extracted requirement as user-authored until the user confirms it
    source: confirmed ? 'developer_confirmed' : 'code_inferred',
    confirmed,
    environment_version: null,
    source_version: null,
    created_at: null,
  }
}

function toSubmission(result: IntentSubmitResult): IntentSubmissionResult {
  const reqs = result.intents.flatMap((i) => (i.requirements ?? []) as ProjectRequirement[])
  const warnings = result.intents
    .map((i) => i.status_reason)
    .filter((w): w is string => typeof w === 'string' && w.length > 0)
  const unclear = reqs.some(
    (r) => r.lifecycle_status === 'needs_clarification' || r.lifecycle_status === 'invalid',
  )
  return {
    schema_version: '1.0',
    extraction_status: reqs.length === 0 ? 'unsupported' : unclear ? 'ambiguous' : 'accepted',
    warnings:
      reqs.length === 0 && warnings.length === 0
        ? ['No verifiable requirement was extracted.']
        : warnings,
    requirements: reqs.map(toDraft),
    timestamp: null,
  }
}

const realAdapter: IntentRequirementsService = {
  async submitIntent(text: string) {
    const projectId = getProjectScope()
    if (!projectId) return NO_PROJECT
    const res = await createProjectService().submitIntent(projectId, { statement: text })
    return res.state === 'ok' ? { state: 'ok', data: toSubmission(res.data) } : res
  },
  async listRequirements() {
    const projectId = getProjectScope()
    if (!projectId) return NO_PROJECT
    const res = await createProjectService().listRequirements(projectId)
    return res.state === 'ok' ? { state: 'ok', data: res.data.map(toDraft) } : res
  },
  async decideRequirement(requirementId: string, decision: RequirementDecision) {
    const projectId = getProjectScope()
    if (!projectId) return NO_PROJECT
    const service = createProjectService()
    const res =
      decision === 'confirm'
        ? await service.confirmRequirement(projectId, requirementId)
        : await service.rejectRequirement(projectId, requirementId)
    return res.state === 'ok' ? { state: 'ok', data: toDraft(res.data) } : res
  },
}

/** Mock-mode adapter; payloads carry the shared `Sample data` label. */
const mockedAdapter: IntentRequirementsService = {
  async submitIntent(text) {
    const outcome = await mockIntentRequirementsAdapter.submitIntent(text)
    return { state: 'ok', data: outcome }
  },
  async listRequirements() {
    const outcome = await mockIntentRequirementsAdapter.listRequirements()
    return { state: 'ok', data: outcome }
  },
  async decideRequirement(requirementId, decision) {
    const outcome = await mockIntentRequirementsAdapter.decideRequirement(requirementId, decision)
    return { state: 'ok', data: outcome }
  },
}

/** Select the adapter from the mock opt-in flag. */
export function createIntentRequirementsService(): IntentRequirementsService {
  return mocksEnabled() ? mockedAdapter : realAdapter
}
