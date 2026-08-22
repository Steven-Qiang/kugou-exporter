import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import 'element-plus/dist/index.css';
// Element Plus 暗色变量（配合 html.dark 生效，修复暗色下组件 hover 纯白 / 依旧浅色的问题）
import 'element-plus/theme-chalk/dark/css-vars.css';

const app = createApp(App);
app.use(router);
app.mount('#app');
