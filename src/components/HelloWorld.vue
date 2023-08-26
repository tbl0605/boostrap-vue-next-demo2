<template>
  <div class="container">
    <div class="form-row align-items-start">
      <div class="col mb-1">
        <label>City (write "PAR" and select "75000 PARIS" with the mouse)</label>
        <vue-simple-suggest
          ref="suggestCity"
          v-model="Label"
          v-slot="{ componentField }"
          :list="getList"
          value-attribute="key"
          display-attribute="label"
          :max-suggestions="100"
          :debounce="200"
          @select="setNewValue"
        >
          <VeeInput
            v-model="City"
            v-bind="componentField"
            name="City"
            wrapper-tag="div"
            wrapper-class="input-group"
            required
            autocomplete="off"
          />
        </vue-simple-suggest>
      </div>
    </div>
    <div class="form-row align-items-start">Label: {{ Label }}</div>
    <div class="form-row align-items-start">City: {{ City }}</div>
  </div>
</template>

<script>
import VeeInput from './VeeInput.vue';
import VueSimpleSuggest from './vue-simple-suggest.vue';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Cities',
  data() {
    return {
      City: '',
      Label: '',
      list: []
    };
  },
  components: {
    VeeInput,
    VueSimpleSuggest
  },
  methods: {
    setNewValue(e) {
      if (e == null) {
        return;
      }
      this.$nextTick(() => {
        this.City = e.city;
      });
    },
    async getList(query) {
      if (!query) {
        return (this.list = []);
      }
      return [
        {
          city: 'PARIS',
          label: '75000 PARIS',
          key: 'PARIS'
        },
        {
          city: 'PARIGNY',
          label: '42120 PARIGNY',
          key: 'PARIGNY'
        },
        {
          city: 'PAROY',
          label: '25440 PAROY',
          key: 'PAROY'
        }
      ];
    }
  }
};
</script>
