(function() {
	// Initialize
	require.progress = 0;

	// Setup Tracing
	var trace = function(group, args) {
		if (group === 'loader-finish-exec') {
			console.log('Completed', args[0]);
		} else if (group === 'loader-define-module') {
			console.log('New Module', args[0], args[1]);
		}
	};

	if (!require.trace.set) {
		require.trace = trace;
	} else {
		require.trace.set('loader-finish-exec', 1);
		require.trace.set('loader-define-module', 1);
		require.on('trace', function(args) {
			trace(args.shift(), args);
		});
	}
})();