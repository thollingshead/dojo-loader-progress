(function() {
	// Utilities
	var compactPath = function(path) {
		var segment, lastSegment;
		var result = [];
		path = path.replace(/\\/g, '/').split('/');
		while (path.length) {
			segment = path.shift();
			if (segment == '..' && result.length && lastSegment != '..') {
				result.pop();
				lastSegment = result[result.length - 1];
			} else if (segment != '.') {
				lastSegment = segment;
				result.push(segment);
			}
		}
		return result.join('/');
	};

	// Initialize
	require.progress = 0;
	require.onProgress = require.onProgress || function() {};

	// Monitor Progress
	var monitor = {
		_modules: {

		},
		add: function(moduleId, dependencies, parent, cached) {
			// Add dependencies
			dependencies = dependencies || [];
			dependencies.forEach(function(dependency) {
				this.add(dependency, null, moduleId);
			}, this);

			// Add moduleId
			var module = this.get(moduleId);
			if (module) {
				// Merge in new dependencies
				dependencies.forEach(function(dependency) {
					if (module.dependencies.indexOf(dependency) === -1) {
						module.dependencies.push(dependency);
					}
				}, this);

				// Merge in new parent
				if (parent) {
					if (module.parents.indexOf(parent) === -1) {
						module.parents.push(parent);
					}
				}
			} else {
				// New Module
				this._modules[moduleId] = {
					percent: cached ? 100 : 0,
					dependencies: dependencies,
					parents: parent ? [parent] : [],
					cached: !!cached
				};
			}

			// Complete or update
			if (cached) {
				this.complete(moduleId);
			} else {
				this.update(moduleId);
			}
		},
		complete: function(moduleId) {
			var module = this.get(moduleId);
			if (module) {
				// Complete dependencies
				if (module.dependencies.length) {
					module.dependencies.forEach(function(dependency) {
						this.complete(dependency);
					}, this);
				}

				// Complete module
				if (module.percent < 100) {
					module.percent = 100;
					this.update(moduleId);
					this.report();
				}
			}
		},
		get: function(moduleId) {
			return this._modules[moduleId];
		},
		update: function(moduleId) {
			var module = this.get(moduleId);
			if (module) {
				if (module.percent < 100 && module.dependencies.length) {
					var count = 1;
					module.percent = 0;
					module.dependencies.forEach(function(dependency) {
						dependency = this.get(dependency);
						if (dependency && !dependency.cached) {
							count++;
							module.percent += dependency.percent;
						}
					}, this);
					module.percent = module.percent / count;
				}

				// Update Parents
				module.parents.forEach(function(parent) {
					this.update(parent);
				}, this);
			}
		},
		report: function() {
			var count = 0,
				percent = 0,
				complete = 0,
				total = 0;
			for (var moduleId in this._modules) {
				if (this._modules.hasOwnProperty(moduleId)) {
					var module = this.get(moduleId);
					if (!module.cached) {
						count += module.dependencies.length + 1;
						percent += module.percent * (module.dependencies.length + 1);
						complete += module.percent >= 100 ? 1 : 0;
						total += 1;
					}
				}
			}

			if (count > 0) {
				require.progress = percent / count;
				require.onProgress(require.progress, complete, total);
			}
		}
	};

	// Add cached modules
	for (var moduleId in require.cache) {
		if (require.cache.hasOwnProperty(moduleId) && !/^url:/.test(moduleId)) {
			monitor.add(moduleId, null, null, true);
		}
	}

	// Setup Tracing
	var trace = function(group, args) {
		if (group === 'loader-finish-exec') {
			monitor.complete(args[0]);
		} else if (group === 'loader-define-module') {
			var dependencies = args[1].map(function(dependency) {
				return compactPath(/^\./.test(dependency) ? args[0] + '/../' + dependency : dependency);
			});
			monitor.add(args[0], dependencies);
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