// Polyfill for react-spring's unstable_act import
// In React 18.2+, this is exported as 'act' but react-spring expects 'unstable_act'
export { act as unstable_act } from "react";
