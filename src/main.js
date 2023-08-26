import { createApp } from "vue";
import App from "./App.vue";
import { configure, defineRule } from "vee-validate";
import AllRules from "@vee-validate/rules";
import { localize } from "@vee-validate/i18n";
import en from "@vee-validate/i18n/dist/locale/en.json";
import BootstrapVueNext from "bootstrap-vue-next";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";

localize({ en });

configure({
  generateMessage: localize("en"),
  validateOnBlur: true, // controls if `blur` events should trigger validation with `handleChange` handler
  validateOnChange: true, // controls if `change` events should trigger validation with `handleChange` handler
  validateOnInput: false, // controls if `input` events should trigger validation with `handleChange` handler
  validateOnModelUpdate: true // controls if `update:modelValue` events should trigger validation with `handleChange` handler
});

// import all known VeeValidate rules
Object.keys(AllRules).forEach((rule) => {
  defineRule(rule, AllRules[rule]);
});

const app = createApp(App);
app.use(BootstrapVueNext);

app.mount("#app");
