import { afterEach, describe, expect, it, vi } from 'vitest'
import { createIntentRequirementsService } from './intentRequirements'
import { setProjectScope } from './projectScope'
import { MOCK_DATA_LABEL } from '../mocks'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('real adapter (mocks disabled): project-scoped pipeline', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    setProjectScope(null)
  })

  it('refuses honestly when no project is active', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await createIntentRequirementsService().submitIntent('x')
    expect(result.state).toBe('error')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the statement to the project intents route and maps requirements as unconfirmed', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    setProjectScope('prj_abc')
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, {
        project_id: 'prj_abc', stage: 'pre_training', run_id: null, requirement_count: 1,
        intents: [{ status_reason: null, requirements: [{
          requirement_id: 'req1', description: 'reward >= 200', source_statement: 'reward >= 200',
          category: 'reward', comparison_operator: '>=', expected_value: 200, tolerance: null,
          lifecycle_status: 'draft', confirmation_status: 'proposed',
        }] }],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const result = await createIntentRequirementsService().submitIntent('reward >= 200')
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/projects/prj_abc/intents')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ statement: 'reward >= 200' })
    expect(result.state).toBe('ok')
    if (result.state !== 'ok') return
    const data = result.data as { extraction_status: string; requirements: Array<{ confirmed: boolean; requirement_id: string }> }
    expect(data.extraction_status).toBe('accepted')
    expect(data.requirements[0]).toMatchObject({ requirement_id: 'req1', confirmed: false })
  })

  it('reports unsupported when the backend extracts nothing, never a fabricated requirement', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    setProjectScope('prj_abc')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(201, {
      project_id: 'prj_abc', stage: 'pre_training', run_id: null, requirement_count: 0,
      intents: [{ status_reason: 'No verifiable expectations', requirements: [] }],
    })))
    const result = await createIntentRequirementsService().submitIntent('be good')
    expect(result.state === 'ok' && (result.data as { extraction_status: string }).extraction_status).toBe('unsupported')
  })

  it('confirm and reject hit the project requirement routes', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    setProjectScope('prj_abc')
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(200, {
      requirement_id: 'req/1', description: 'd', source_statement: 's', category: 'reward', confirmation_status: 'confirmed',
    })))
    vi.stubGlobal('fetch', fetchMock)
    const svc = createIntentRequirementsService()
    await svc.decideRequirement('req/1', 'confirm')
    await svc.decideRequirement('req/1', 'reject')
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/projects/prj_abc/requirements/req%2F1/confirm')
    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/v1/projects/prj_abc/requirements/req%2F1/reject')
  })
})

describe('mock adapter (VITE_USE_MOCKS=true)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns payloads labeled as sample data without touching the network', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true')
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const service = createIntentRequirementsService()

    const submission = await service.submitIntent('The goal reward must be 100.')
    expect(submission.state).toBe('ok')
    if (submission.state === 'ok' && 'label' in submission.data) {
      expect(submission.data.label).toBe(MOCK_DATA_LABEL)
    }

    const decision = await service.decideRequirement('req_mock_goal_reward', 'confirm')
    expect(decision.state).toBe('ok')
    if (decision.state === 'ok' && 'label' in decision.data) {
      expect(decision.data.data.requirement_id).toBe('req_mock_goal_reward')
    }
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
