import { ArrowIcon } from './icons'
import { useReveal } from './useReveal'

/**
 * The one memorable idea below the fold: the canonical reward-scaling fault,
 * shown as expected → observed → incident → verified recovery.
 * All numbers are the README canonical example, labelled as illustrative where needed.
 */
export function IncidentSpotlight() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.25)
  return (
    <section className="ls-incident" aria-labelledby="ls-incident-title">
      <div className="ls-incident__wrap">
        <p className="ls-kicker">Canonical incident · Warehouse 2D</p>
        <h2 id="ls-incident-title" className="ls-incident__title">
          Goal reward 100 became 25. <em>The contract caught it.</em>
        </h2>

        <div
          ref={ref}
          className="ls-incident__flow"
          data-reveal=""
          data-in={visible ? '' : undefined}
        >
          <article className="ls-incident__card">
            <p className="ls-incident__step">01 · Contract</p>
            <p className="ls-incident__value">100</p>
            <p className="ls-incident__desc">
              Developer-confirmed goal reward, versioned with the environment.
            </p>
          </article>

          <span className="ls-incident__arrow" aria-hidden="true">
            <ArrowIcon width={18} height={18} />
          </span>

          <article className="ls-incident__card ls-incident__card--fault">
            <p className="ls-incident__step">02 · Observed</p>
            <p className="ls-incident__value">25</p>
            <p className="ls-incident__desc">
              Reward-scaling fault ×0.25 in the live run. Actual reward recorded per event.
            </p>
          </article>

          <span className="ls-incident__arrow" aria-hidden="true">
            <ArrowIcon width={18} height={18} />
          </span>

          <article className="ls-incident__card">
            <p className="ls-incident__step">03 · Incident</p>
            <p className="ls-incident__value">evt_*</p>
            <p className="ls-incident__desc">
              Deterministic violation tied to real event IDs and an immutable env version.
            </p>
          </article>

          <span className="ls-incident__arrow" aria-hidden="true">
            <ArrowIcon width={18} height={18} />
          </span>

          <article className="ls-incident__card ls-incident__card--ok">
            <p className="ls-incident__step">04 · Recovered</p>
            <p className="ls-incident__value">✓</p>
            <p className="ls-incident__desc">
              Compatible checkpoint restored, fresh experience collected, re-evaluated.
            </p>
          </article>
        </div>

        <p className="ls-incident__note">
          Illustrative flow from the documented demo — not output from a live run. The detector
          never merges expected and actual into one field.
        </p>
      </div>
    </section>
  )
}
