export function createElement(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}

export const h = createElement;

export function Fragment(props) {
  return { type: Symbol.for('preact.fragment'), props };
}

export function render() {}

export function hydrate() {}

export function cloneElement(vnode, props) {
  return { ...vnode, props: { ...vnode.props, ...props } };
}

export default { createElement, h, Fragment, render, hydrate, cloneElement };
