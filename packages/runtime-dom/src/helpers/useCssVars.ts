import {
  ComponentPublicInstance,
  getCurrentInstance,
  onMounted,
  watchEffect,
  warn,
  VNode,
  Fragment
} from '@vue/runtime-core'
import { ShapeFlags } from '@vue/shared/src'

export function useCSSVars(
  getter: (ctx: ComponentPublicInstance) => Record<string, string>,
  scoped = false
) {
  const instance = getCurrentInstance()
  if (!instance) {
    __DEV__ &&
      warn(`useCssVars is called without current active component instance.`)
    return
  }

  const prefix =
    scoped && instance.type.__scopeId
      ? `${instance.type.__scopeId.replace(/^data-v-/, '')}-`
      : ``

  onMounted(() => {
    watchEffect(() => {
      setVarsOnVNode(instance.subTree, getter(instance.proxy!), prefix)
    })
  })
}

function setVarsOnVNode(
  vnode: VNode,
  vars: Record<string, string>,
  prefix: string
) {
  // drill down HOCs until it's a non-component vnode
  while (vnode.component) {
    vnode = vnode.component.subTree
  }
  if (vnode.shapeFlag & ShapeFlags.ELEMENT && vnode.el) {
    const style = vnode.el.style
    for (const key in vars) {
      style.setProperty(`--${prefix}${key}`, vars[key])
    }
  } else if (vnode.type === Fragment) {
    ;(vnode.children as VNode[]).forEach(c => setVarsOnVNode(c, vars, prefix))
  }
}
