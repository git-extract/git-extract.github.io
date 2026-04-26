import { inject, provide, ref } from 'vue'

const KEY = Symbol('wizardNav')

/**
 * Called once in WizardLayout to create the shared nav state.
 */
export function provideWizardNav() {
  const nav = ref({
    backLabel: '< Back',
    nextLabel: 'Next >',
    nextDisabled: false,
    onBack: null, // null = hidden
    onNext: null, // null = hidden
  })
  provide(KEY, nav)
  return nav
}

/**
 * Called in each page component to register its Back / Next handlers.
 * Pass null for onBack / onNext to hide that button.
 */
export function useWizardNav() {
  return inject(KEY)
}
