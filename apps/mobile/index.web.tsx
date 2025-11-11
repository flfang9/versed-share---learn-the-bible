import '@expo/metro-runtime';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import './__create/reset.css';
import App from './App';

LoadSkiaWeb().then(async () => {
  renderRootComponent(App);
});
