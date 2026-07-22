export default function htm(strings, ...values) {
  return { type: 'mock-vdom', strings, values };
}
