const {
	defineConfig
} = require('@vue/cli-service')
module.exports = defineConfig({
	publicPath: './',
	productionSourceMap: process.env.NODE_ENV != 'production',
	transpileDependencies: [
		'vuetify'
	],
	devServer: {
		https: true,
		host: 'localhost'
	},
	filenameHashing: false,
	configureWebpack: {
		optimization:{
			splitChunks:false
	  },
	  output:{
			filename: '[name].js'
	  },
	},
	css:{
	  extract:{
			filename: '[name].css'
	  }
	},
})
