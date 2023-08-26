<template>
  <component :is="tag">
    <Field
      ref="provider"
      v-slot="{ componentField, meta, errors }"
      :rules="currentRules"
      :type="currentCheckboxOrRadioType"
      :value="currentInputStaticValue"
      :name="name"
      :label="label"
      :unchecked-value="uncheckedValue"
      :keep-value="keepValue"
      :validate-on-mount="validateOnMount ?? VeeInputMode.validateOnMount"
      :validate-on-input="validateOnInput ?? VeeInputMode.validateOnInput"
      :validate-on-change="validateOnChange ?? VeeInputMode.validateOnChange"
      :validate-on-blur="validateOnBlur ?? VeeInputMode.validateOnBlur"
      :validate-on-model-update="validateOnModelUpdate ?? VeeInputMode.validateOnModelUpdate"
      v-model="localMutableValue"
    >
      <optional-field-wrapper
        :tag="useWrapperTag ? wrapperTag : undefined"
        :class="useWrapperTag ? wrapperClass : undefined"
        :style="useWrapperTag ? wrapperStyle : undefined"
      >
        <slot name="wrapperBegin" v-bind="{ meta, errors }"></slot>
        <b-form-input
          v-bind="mergeProps(componentField, inputAttrsDynamic)"
          ref="input"
          :id="currentId"
          :autofocus="useAutoFocus"
          :class="currentClass"
          :style="inputStyle"
          :type="currentType"
          :name="currentInputName"
          :autocomplete="currentAutocomplete"
          :placeholder="placeholder"
        />
        <slot name="printValue">
          <pre
            v-if="isTextareaField || isBFormTextarea"
            :class="currentClass"
            :style="inputStyle"
            :is_slot_print_value="true"
            >{{ localMutableValue }}</pre
          >
        </slot>
        <slot name="wrapperEnd" v-bind="{ meta, errors }"></slot>
      </optional-field-wrapper>
      <small v-if="helpText != null && helpText !== ''" :class="helpClass" :style="helpStyle">{{
        helpText
      }}</small>
      <div
        v-if="showAnyErrorMsg && errors.length > 0"
        :class="currentErrorClass"
        :style="errorStyle"
      >
        {{ errorText || errors[0] }}
      </div>
    </Field>
  </component>
</template>

<script>
import { mergeProps, h as createElement } from 'vue';
import { Field } from 'vee-validate';
import isString from 'lodash/isString';
import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';
import { conversionTable } from './vue-imask';
//import mixinAutoJump from "@/plugins/vue-directives-mixins-filters/mixinAutoJump";
import hash from 'hash-sum';
//import { isChromium } from "@/plugins/platform";
import { defineRule, normalizeRules } from 'vee-validate';
//import PseudoInputMask from "./PseudoInputMask.vue";
//import PseudoDate from "./PseudoDate.vue";
import { markRaw } from 'vue';

defineRule('VeeInputControlCharConv', (value, [formatStringValueFn], ctx) => {
  if (isString(value) && value !== formatStringValueFn(value)) {
    return `La valeur du champ ${ctx.field} n'est pas formatée correctement`;
  }
  return true;
});

defineRule('VeeInputRuleFn', (value, [ruleFn], ctx) => {
  return ruleFn(value, [], ctx);
});

const OptionalFieldWrapper = {
  name: 'OptionalFieldWrapper',
  inheritAttrs: false,
  props: {
    tag: {
      type: String,
      default: undefined
    },
    class: {
      type: String,
      default: undefined
    },
    style: {
      type: String,
      default: undefined
    }
  },
  setup(props, { slots }) {
    return () => {
      const defaultSlot = slots.default();
      if (props.tag == null) {
        if (
          defaultSlot.length != 4 ||
          defaultSlot[0].children.length > 0 ||
          defaultSlot[0].key !== '_wrapperBegin' ||
          defaultSlot[2].children.length != 1 ||
          defaultSlot[2].key !== '_printValue' ||
          defaultSlot[3].children.length > 0 ||
          defaultSlot[3].key !== '_wrapperEnd'
        ) {
          throw new Error(
            'Operation not supported: cannot have more than one node inside the "default" slot when no "wrapping tag" is set!'
          );
        }
        return defaultSlot[2].children[0].children === 'v-if' &&
          !(
            defaultSlot[2].children[0].type === 'pre' &&
            defaultSlot[2].children[0]?.props?.is_slot_print_value
          )
          ? defaultSlot
          : createElement(
              'div',
              {
                class: props.class !== '' ? props.class : undefined,
                style: props.style
              },
              defaultSlot
            );
      }
      return createElement(
        props.tag,
        {
          class: props.class !== '' ? props.class : undefined,
          style: props.style
        },
        defaultSlot
      );
    };
  }
};

const enableAutocompleteHack = false;

const initialStateFn = () => ({
  // https://vuejs.org/api/options-state.html#data
  // Propriété non réactive :
  _cacheFormatValue: markRaw(['', ''])
});

export default {
  name: 'VeeInput',
  components: {
    Field,
    OptionalFieldWrapper
    //PseudoInputMask,
    //PseudoDate,
  },
  //mixins: [mixinAutoJump],
  inject: {
    VeeInputMode: {
      default: () => ({})
    }
  },
  inheritAttrs: false,
  props: {
    tag: {
      type: String,
      default: 'div'
    },
    // XXX : utiliser "inject" (https://v3-migration.vuejs.org/breaking-changes/props-default-this.html) ?
    validateOnMount: {
      type: Boolean,
      default: undefined
    },
    // XXX : utiliser "inject" (https://v3-migration.vuejs.org/breaking-changes/props-default-this.html) ?
    validateOnInput: {
      type: Boolean,
      default: undefined
    },
    // XXX : utiliser "inject" (https://v3-migration.vuejs.org/breaking-changes/props-default-this.html) ?
    validateOnChange: {
      type: Boolean,
      default: undefined
    },
    // XXX : utiliser "inject" (https://v3-migration.vuejs.org/breaking-changes/props-default-this.html) ?
    validateOnBlur: {
      type: Boolean,
      default: undefined
    },
    // XXX : utiliser "inject" (https://v3-migration.vuejs.org/breaking-changes/props-default-this.html) ?
    validateOnModelUpdate: {
      type: Boolean,
      default: undefined
    },
    rules: {
      type: [String, Object, Function],
      default: undefined
    },
    //immediate: {
    //  type: Boolean,
    //  default: undefined
    //},
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: undefined
    },
    uncheckedValue: {
      type: [String, Number, Boolean, Array],
      default: undefined
    },
    keepValue: {
      type: Boolean,
      default: true
    },
    //vid: {
    //  type: String,
    //  default: undefined
    //},
    inputName: {
      type: String,
      default: undefined
    },
    // NB : les propriétés/attributs "class" et "style" sont toujours appliqués à l'élément "root",
    // même si inheritAttrs vaut false.
    inputClass: {
      type: String,
      // NB : définir cette propriété à '' force currentClass à ne pas utiliser les valeurs par défaut.
      default: undefined
    },
    inputStyle: {
      type: String,
      default: undefined
    },
    inputFocus: {
      type: Boolean,
      default: false
    },
    inputAutoJumpMode: {
      type: Number,
      default: 0,
      validator(value) {
        // 0 : pas d'auto-jump, 1 : auto-jump simple, 2 : auto-jump avec auto-select
        return value >= 0 && value <= 2;
      }
    },
    inputTag: {
      type: String,
      default: 'input'
    },
    inputMask: {
      type: Object,
      default: undefined
    },
    inputNoCharConv: {
      type: Boolean,
      default: false
    },
    inputEnforceCharConv: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: undefined
    },
    modelValue: {
      type: [String, Number, Boolean, Array],
      default: undefined
    },
    // Sert principalement à passer une valeur "statique" pour les champs de type CHECKBOX ou RADIO :
    staticValue: {
      type: [String, Number, Boolean, Array],
      default: undefined
    },
    id: {
      type: String,
      default: undefined
    },
    autocomplete: {
      type: String,
      default: undefined
    },
    showAnyErrorMsg: {
      type: Boolean,
      default: true
    },
    helpText: {
      type: String,
      default: undefined
    },
    helpClass: {
      type: String,
      default: 'form-text text-muted'
    },
    helpStyle: {
      type: String,
      default: undefined
    },
    errorText: {
      type: String,
      default: undefined
    },
    errorClass: {
      type: String,
      default: undefined
    },
    errorStyle: {
      type: String,
      default: undefined
    },
    inputDiffValue: {
      type: [String, Number, Boolean],
      default: undefined
    },
    inputDiffClass: {
      type: String,
      default: 'egeremi-diff-feedback'
    },
    wrapperTag: {
      type: String,
      default: undefined
    },
    wrapperClass: {
      type: String,
      default: undefined
    },
    wrapperStyle: {
      type: String,
      default: undefined
    },
    placeholder: {
      type: String,
      default: undefined
    }
  },
  data: initialStateFn,
  computed: {
    localMutableValue: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        this.$emit('update:modelValue', this.formatValue(newValue));
      }
    },
    currentUpperTag() {
      return this.inputTag.toUpperCase();
    },
    currentType() {
      return !this.type && (this.isInputField || this.isNativeBFormInput) ? 'text' : this.type;
    },
    currentCheckboxOrRadioType() {
      return this.isInputCheckboxField || this.isInputRadioField
        ? this.currentType.toLocaleLowerCase()
        : undefined;
    },
    currentInputName() {
      if (this.isAutocompleteDisabled && enableAutocompleteHack) {
        return this.inputName ? this.inputName : this.currentId;
      }
      return this.inputName;
    },
    currentId() {
      if (this.isAutocompleteDisabled && enableAutocompleteHack) {
        return this.id
          ? this.id
          : this.inputName
          ? this.inputName
          : // On génère un "id" qui ne contiendra que des caractères valides
            // à l'aide de la fonction hash()
            `no-autocomplete-${hash(this.name)}`;
      }
      return this.id;
    },
    currentAutocomplete() {
      return this.isAutocompleteDisabled && enableAutocompleteHack
        ? this.currentId
        : this.autocomplete;
    },
    currentInputStaticValue() {
      return this.isInputCheckboxField || this.isInputRadioField ? this.staticValue : undefined;
    },
    isSelectField() {
      return this.currentUpperTag === 'SELECT';
    },
    isTextareaField() {
      return this.currentUpperTag === 'TEXTAREA';
    },
    isInputField() {
      return this.currentUpperTag === 'INPUT';
    },
    isTextField() {
      return (
        (this.isInputField || this.isNativeBFormInput) && this.currentType.toUpperCase() === 'TEXT'
      );
    },
    isInputTextField() {
      return this.isInputField && this.currentType.toUpperCase() === 'TEXT';
    },
    isInputCheckboxField() {
      return this.isInputField && this.currentType.toUpperCase() === 'CHECKBOX';
    },
    isInputRadioField() {
      return this.isInputField && this.currentType.toUpperCase() === 'RADIO';
    },
    isNativeBFormInput() {
      return ['b-form-input', 'BFormInput'].includes(this.inputTag);
    },
    isBFormInput() {
      return (
        (this.isInputField &&
          !this.isInputCheckboxField &&
          !this.isInputRadioField &&
          !this.currentMask) ||
        this.isNativeBFormInput
      );
    },
    isPseudoInputMask() {
      return this.isInputTextField && !!this.currentMask;
    },
    isNonHtmlComponent() {
      return (
        this.isBFormInput ||
        this.isPseudoInputMask ||
        !(this.isSelectField || this.isTextareaField || this.isInputField)
      );
    },
    isBFormTextarea() {
      return (
        this.isNonHtmlComponent && ['b-form-textarea', 'BFormTextarea'].includes(this.inputTag)
      );
    },
    isAutocompleteDisabled() {
      return this.autocomplete === 'off';
    },
    useWrapperTag() {
      return this.wrapperTag != null && this.wrapperTag !== '';
    },
    useAutoFocus() {
      return !!this.$attrs['autofocus'] || this.inputFocus;
    },
    currentMask() {
      if (
        this.isInputTextField &&
        // On n'utilise pas le masque actuel lorsque l'utilisateur fourni un objet vide {}, null ou incomplet :
        this.inputMask?.mask
      ) {
        return this.inputMask;
      }
      return undefined;
    },
    appendDiffClass() {
      if (
        this.inputDiffClass != null &&
        this.inputDiffClass !== '' &&
        this.inputDiffValue !== undefined &&
        // TODO : on ne gère pas les valeurs de type "Array" liées aux composants HTML <select multiple>
        this.inputDiffValue !== this.modelValue
      ) {
        return ' ' + this.inputDiffClass;
      }
      return '';
    },
    currentClass() {
      if (this.inputClass != null) {
        return '' + this.inputClass + this.appendDiffClass;
      }
      if (this.isSelectField) {
        return 'form-control custom-select' + this.appendDiffClass;
      }
      if (this.isInputCheckboxField || this.isInputRadioField) {
        return 'form-check-input' + this.appendDiffClass;
      }
      if (this.isInputField) {
        return 'form-control' + this.appendDiffClass;
      }
      if (this.isTextareaField || this.isBFormTextarea) {
        return 'form-control handle-print-value' + this.appendDiffClass;
      }
      return this.appendDiffClass !== '' ? this.inputDiffClass : undefined;
    },
    currentErrorClass() {
      if (this.errorClass == null) {
        // On fait en sorte d'afficher "proprement" la zone d'erreurs sous les "petits champs".
        // NB : chaque attribut stocké dans $attrs peut valoir undefined !
        if (
          'maxlength' in this.$attrs &&
          this.$attrs['maxlength'] !== undefined &&
          +this.$attrs['maxlength'] <= 4
        ) {
          return 'alert alert-danger m-0 mt-1 px-2 py-1 veevalidate-invalid-feedback d-md-inline-block';
        }
        return 'alert alert-danger m-0 mt-1 px-2 py-1 veevalidate-invalid-feedback';
      }
      return this.errorClass;
    },
    currentRules() {
      const objRules = isString(this.rules)
        ? normalizeRules(this.rules)
        : isFunction(this.rules)
        ? { VeeInputRuleFn: this.rules }
        : this.rules;
      if (this.isNonHtmlComponent) {
        // https://logaretm.github.io/vee-validate/guide/rules.html#rules
        // Rules marked with inferred can be automatically
        // inferred from the HTML5 input attributes without providing rules prop.
        // !!! This does not work for custom components !!!.
        const convAttrsToRules = {
          email: 'email',
          pattern: 'regex',
          required: 'required',
          minlength: 'min',
          min: 'min_value',
          maxlength: 'max',
          max: 'max_value'
        };
        const componentRules = {};
        for (const attr in convAttrsToRules) {
          // NB : chaque attribut stocké dans $attrs peut valoir undefined !
          if (attr in this.$attrs && this.$attrs[attr] !== undefined) {
            componentRules[convAttrsToRules[attr]] = this.$attrs[attr];
          }
        }
        return {
          ...componentRules,
          ...(objRules || {}),
          ...(this.inputEnforceCharConv && (this.willFormatValue || this.willUseExternalFormatter)
            ? {
                VeeInputControlCharConv: [this.$attrs['formatter'] || this.formatValue]
              }
            : {})
        };
      }
      return this.inputEnforceCharConv && (this.willFormatValue || this.willUseExternalFormatter)
        ? {
            ...(objRules || {}),
            VeeInputControlCharConv: [this.$attrs['formatter'] || this.formatValue]
          }
        : objRules;
    },
    willUseExternalFormatter() {
      return (this.isBFormInput || this.isBFormTextarea) && !!this.$attrs['formatter'];
    },
    willFormatValue() {
      if (this.inputNoCharConv || this.currentMask) return false;
      if (this.isBFormInput && this.$attrs['formatter']) return false;
      if (this.isBFormTextarea && this.$attrs['formatter']) return false;
      if (!(this.isTextField || this.isTextareaField || this.isBFormTextarea)) return false;
      return true;
    },
    // https://vuejs.org/v2/guide/components-custom-events.html#Binding-Native-Events-to-Components
    inputAttrs: function () {
      const newAttrs = (({
        // eslint-disable-next-line no-unused-vars
        'onUpdate:modelValue': _x,
        // eslint-disable-next-line no-unused-vars
        modelValue, // NB : déjà filtré via les "props"
        // eslint-disable-next-line no-unused-vars
        value,
        // eslint-disable-next-line no-unused-vars
        class: _y,
        // eslint-disable-next-line no-unused-vars
        style,
        // eslint-disable-next-line no-unused-vars
        onInput,
        // eslint-disable-next-line no-unused-vars
        onChange,
        // eslint-disable-next-line no-unused-vars
        onFocus,
        // eslint-disable-next-line no-unused-vars
        onBlur,
        ...o
      }) => o)(this.$attrs);
      newAttrs.onInput = event => {
        if (event.target.composing) return;
        this.hackInputField(event.target);
        if (this.inputAutoJumpMode != 0) {
          if ('checked' in event.target) {
            /*this.jumpToNextFormField(
              event.target,
              event.target.checked,
              this.inputAutoJumpMode == 2
            );*/
          } else if ('value' in event.target) {
            /*this.jumpToNextFormField(
              event.target,
              event.target.value,
              this.inputAutoJumpMode == 2
            );*/
          }
        }
      };
      if ('onChange' in this.$attrs) {
        newAttrs.onChange = () => {
          this.$nextTick(() => {
            this.$emit('change', this.modelValue);
          });
        };
      }
      newAttrs.onFocus = event => this.$emit('focus', event);
      newAttrs.onBlur = event => this.$emit('blur', event);

      if (this.currentInputStaticValue !== undefined) {
        newAttrs.value = this.currentInputStaticValue;
      }

      return newAttrs;
    },
    inputAttrsDynamic: function () {
      const vm = this;
      // eslint-disable-next-line no-unused-vars
      const newAttrs = (({
        // eslint-disable-next-line no-unused-vars
        'onUpdate:modelValue': _x,
        // eslint-disable-next-line no-unused-vars
        modelValue, // NB : déjà filtré via les "props"
        // eslint-disable-next-line no-unused-vars
        value,
        // eslint-disable-next-line no-unused-vars
        class: _y,
        // eslint-disable-next-line no-unused-vars
        style,
        // eslint-disable-next-line no-unused-vars
        onInput,
        // eslint-disable-next-line no-unused-vars
        onChange,
        // eslint-disable-next-line no-unused-vars
        onFocus,
        // eslint-disable-next-line no-unused-vars
        onBlur,
        ...o
      }) => o)(this.$attrs);
      // This ensures that the component works with v-model
      newAttrs['onUpdate:modelValue'] = /*newAttrs.onInput =*/ () => {
        const inputField = vm.$refs.input?.$refs.input;
        this.hackInputField(inputField);
        if (this.inputAutoJumpMode != 0 && inputField) {
          /*this.jumpToNextFormField(
            inputField,
            value,
            this.inputAutoJumpMode == 2
          );*/
        }
      };
      if ('onChange' in this.$attrs) {
        newAttrs.onChange = () => {
          this.$nextTick(() => {
            this.$emit('change', this.modelValue);
          });
        };
      }
      newAttrs.onFocus = event => this.$emit('focus', event);
      newAttrs.onBlur = event => this.$emit('blur', event);

      if (this.currentInputStaticValue !== undefined) {
        newAttrs.value = this.currentInputStaticValue;
      }

      return newAttrs;
    }
  },
  methods: {
    mergeProps,
    // Helper pour simplifier l'accès à la méthode "focus" du champ de saisie sous-jacent :
    focus(focusOptions = undefined) {
      if (!this.$refs.input.focus) {
        console.error('Missing focus() function:', this.dumpAllAttrs());
      } else {
        this.$refs.input.focus(focusOptions);
      }
    },
    // Helper pour simplifier l'accès à la méthode "select" du champ de saisie sous-jacent :
    select() {
      this.$refs.input.select?.();
    },
    // Helper pour simplifier l'accès à la méthode "blur" du champ de saisie sous-jacent :
    blur() {
      if (!this.$refs.input.blur) {
        console.error('Missing blur() function:', this.dumpAllAttrs());
      } else {
        this.$refs.input.blur();
      }
    },
    // De préférence, éviter tout appel direct à cette méthode :
    getProvider() {
      return this.$refs.provider;
    },
    // De préférence, éviter tout appel direct à cette méthode :
    getDomInput() {
      return this.isNonHtmlComponent ? this.$refs.input?.$refs.input : this.$refs.input;
    },
    dumpAllAttrs() {
      const allAttrsAndProps = Object.assign({}, this.$attrs);
      forEach(this.$props, (value, key) => {
        // NB : "this" pointe vers l'objet de type VeeInput
        allAttrsAndProps[key] = this[key];
      });
      return allAttrsAndProps;
    },
    hackInputField(inputField) {
      if (!inputField || !this.willFormatValue) {
        return;
      }
      const cursorStart = inputField.selectionStart,
        cursorEnd = inputField.selectionEnd;
      this.$nextTick(() => {
        if ('value' in inputField && isString(inputField.value)) {
          const upperCaseValue = inputField.value.toUpperCase();
          if (inputField.value !== upperCaseValue) {
            inputField.value = upperCaseValue;
          }
        }
        // http://dimafeldman.com/js/maintain-cursor-position-after-changing-an-input-value-programatically/
        const newCursorStart = inputField.selectionStart,
          newCursorEnd = inputField.selectionEnd;
        if (
          inputField.setSelectionRange &&
          (newCursorStart !== cursorStart || newCursorEnd !== cursorEnd)
        ) {
          inputField.setSelectionRange(cursorStart, cursorEnd);
        }
      });
    },
    formatValue(val) {
      if (!this.willFormatValue || !isString(val)) {
        if (this.$data._cacheFormatValue[0] !== '') {
          this.$data._cacheFormatValue[0] = '';
          this.$data._cacheFormatValue[1] = '';
        }
        return val;
      }
      if (this.$data._cacheFormatValue[0] !== val) {
        this.$data._cacheFormatValue[0] = val;
        this.$data._cacheFormatValue[1] = val
          .split('')
          .map(c => conversionTable[c] || c)
          .join('')
          .toUpperCase();
      }
      return this.$data._cacheFormatValue[1];
    }
  }
};
</script>
