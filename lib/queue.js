class MetaPriorityQueue {
	constructor() {
		this._queue = [];
    this._dequeued = [];
	}

	enqueue(run, options) {
		options = Object.assign({
			priority: 0,
      meta: {},
		}, options);

		const element = {
      priority: options.priority,
      meta: options.meta,
      run,
    };

		if (this.size && this._queue[this.size - 1].priority >= options.priority) {
			this._queue.push(element);
			return;
		}

		const index = lowerBound(this._queue, element, (a, b) => b.priority - a.priority);
		this._queue.splice(index, 0, element);
	}

	dequeue() {
    const element = this._queue.shift();
    element.meta.dequeued = true;
    this._dequeued.push(element);
		return element.run;
	}
  
  purge() {
    this._dequeued.length = 0;
  }

	get size() {
		return this._queue.length;
	}
}

// Port of lower_bound from http://en.cppreference.com/w/cpp/algorithm/lower_bound
// Used to compute insertion index to keep queue sorted after insertion
function lowerBound(array, value, comp) {
	let first = 0;
	let count = array.length;

	while (count > 0) {
		const step = (count / 2) | 0;
		let it = first + step;

		if (comp(array[it], value) <= 0) {
			first = ++it;
			count -= step + 1;
		} else {
			count = step;
		}
	}

	return first;
}

module.exports = {
  MetaPriorityQueue,
};