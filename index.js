import { registerRootComponent } from 'expo';

const startTime = Date.now();
global.startupTime = startTime;
console.log("[PERF] INDEX.JS LOADED", 0);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
