import VueCookies from 'vue-cookies';
import { createApp } from 'vue';
import App from './App.vue';

import 'vue-sonner/style.css';
import './style.css';

createApp(App)
    .use(VueCookies, { expires: '7d' })
    .mount('#app');
