import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
// EP 基础样式与暗色变量先加载，自己的主题令牌（main.css）最后加载，确保覆盖 EP 默认变量
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './assets/main.css';

const app = createApp(App);
app.use(router);
app.mount('#app');
