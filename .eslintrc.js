module.exports = {
	extends: [
		// add more generic rulesets here, such as:
		// 'eslint:recommended',
		// 'plugin:vue/vue3-recommended',
		'plugin:vue/recommended' // Use this if you are using Vue.js 2.x.
	],
	rules: {
		// override/add rules settings here, such as:
		'vue/no-unused-vars': 'warn',
		'vue/valid-v-slot': ['error', {
			'allowModifiers': true
		}],
		"vue/max-attributes-per-line": ["warn", {
			"singleline": {
				"max": 8
			},
			"multiline": {
				"max": 8
			}
		}],

		"vue/html-indent": ["warn", "tab", {
			"baseIndent": 0
		}], // enforce tabs in template

		"indent": ["warn", "tab"] // enforce tabs in script and js files
	}
}
