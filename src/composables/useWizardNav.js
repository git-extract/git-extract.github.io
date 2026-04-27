import { inject, provide, ref } from 'vue'

const KEY = Symbol('wizardNav')

/**
 * Called once in WizardLayout to create the shared nav state.
 */
export function provideWizardNav() {
  const nav = ref({
    // ← Back
    backLabel: '< Back',
    backDisabled: false,
    onBack: null,         // null  = disabled

    // Next →
    nextLabel: 'Next >',
    nextDisabled: false,
    onNext: null,         // null  = disabled

    // Finish (final action — Extract & Push, Done, etc.)
    finishLabel: 'Finish',
    finishDisabled: false,
    onFinish: null,       // null  = disabled
  })
  provide(KEY, nav)
  return nav
}

/**
 * Called in each page component to register its nav handlers.
 * Any field omitted keeps its previous value; pass null for a
 * handler to disable that button.
 */
export function useWizardNav() {
  return inject(KEY)
}
