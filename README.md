# dojo-loader-progress

Use this tool to track the progress of the Dojo Toolkit loader.

### Usage:
1. Include `progress.js` immediately after loading the Dojo Toolkit

```html
<script src="//ajax.googleapis.com/ajax/libs/dojo/1.10.1/dojo/dojo.js"></script>
<script src="progress.js"></script>
```

2. Use the `require.progress` variable:
```javascript
console.log('Loader Progress: ', Math.round(require.progress) + '%');
```
or define a custom `require.onProgress` function:
```javascript
require.onProgress = function(percent, complete, total) {
	console.log('Loader Progress:', Math.round(percent) + '%');
	console.log('Loaded ', complete, ' of ', total);
};
```