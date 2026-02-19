// ../../node_modules/lru-cache/dist/esm/index.js
const defaultPerf =
	typeof performance === "object" &&
	performance &&
	typeof performance.now === "function"
		? performance
		: Date;
const warned = new Set();
const PROCESS = typeof process === "object" && !!process ? process : {};
const emitWarning = (msg, type, code, fn) => {
	typeof PROCESS.emitWarning === "function"
		? PROCESS.emitWarning(msg, type, code, fn)
		: console.error(`[${code}] ${type}: ${msg}`);
};
let AC = globalThis.AbortController;
let AS = globalThis.AbortSignal;
if (typeof AC === "undefined") {
	AS = class AbortSignal {
		onabort;
		_onabort = [];
		reason;
		aborted = false;
		addEventListener(_, fn) {
			this._onabort.push(fn);
		}
	};
	AC = class AbortController {
		constructor() {
			warnACPolyfill();
		}
		signal = new AS();
		abort(reason) {
			if (this.signal.aborted) {
				return;
			}
			this.signal.reason = reason;
			this.signal.aborted = true;
			for (const fn of this.signal._onabort) {
				fn(reason);
			}
			this.signal.onabort?.(reason);
		}
	};
	let printACPolyfillWarning = PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1";
	const warnACPolyfill = () => {
		if (!printACPolyfillWarning) {
			return;
		}
		printACPolyfillWarning = false;
		emitWarning(
			"AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.",
			"NO_ABORT_CONTROLLER",
			"ENOTSUP",
			warnACPolyfill,
		);
	};
}
const shouldWarn = (code) => !warned.has(code);
const _TYPE = Symbol("type");
const isPosInt = (n) => n && n === Math.floor(n) && n > 0 && Number.isFinite(n);
const getUintArray = (max) =>
	isPosInt(max)
		? max <= 2 ** 8
			? Uint8Array
			: max <= 2 ** 16
				? Uint16Array
				: max <= 2 ** 32
					? Uint32Array
					: max <= Number.MAX_SAFE_INTEGER
						? ZeroArray
						: null
		: null;

class ZeroArray extends Array {
	constructor(size) {
		super(size);
		this.fill(0);
	}
}

class Stack {
	heap;
	length;
	static #constructing = false;
	static create(max) {
		const HeapCls = getUintArray(max);
		if (!HeapCls) {
			return [];
		}
		Stack.#constructing = true;
		const s = new Stack(max, HeapCls);
		Stack.#constructing = false;
		return s;
	}
	constructor(max, HeapCls) {
		if (!Stack.#constructing) {
			throw new TypeError("instantiate Stack using Stack.create(n)");
		}
		this.heap = new HeapCls(max);
		this.length = 0;
	}
	push(n) {
		this.heap[this.length++] = n;
	}
	pop() {
		return this.heap[--this.length];
	}
}

class LRUCache {
	#max;
	#maxSize;
	#dispose;
	#onInsert;
	#disposeAfter;
	#fetchMethod;
	#memoMethod;
	#perf;
	get perf() {
		return this.#perf;
	}
	ttl;
	ttlResolution;
	ttlAutopurge;
	updateAgeOnGet;
	updateAgeOnHas;
	allowStale;
	noDisposeOnSet;
	noUpdateTTL;
	maxEntrySize;
	sizeCalculation;
	noDeleteOnFetchRejection;
	noDeleteOnStaleGet;
	allowStaleOnFetchAbort;
	allowStaleOnFetchRejection;
	ignoreFetchAbort;
	#size;
	#calculatedSize;
	#keyMap;
	#keyList;
	#valList;
	#next;
	#prev;
	#head;
	#tail;
	#free;
	#disposed;
	#sizes;
	#starts;
	#ttls;
	#hasDispose;
	#hasFetchMethod;
	#hasDisposeAfter;
	#hasOnInsert;
	static unsafeExposeInternals(c) {
		return {
			starts: c.#starts,
			ttls: c.#ttls,
			sizes: c.#sizes,
			keyMap: c.#keyMap,
			keyList: c.#keyList,
			valList: c.#valList,
			next: c.#next,
			prev: c.#prev,
			get head() {
				return c.#head;
			},
			get tail() {
				return c.#tail;
			},
			free: c.#free,
			isBackgroundFetch: (p) => c.#isBackgroundFetch(p),
			backgroundFetch: (k, index, options, context) =>
				c.#backgroundFetch(k, index, options, context),
			moveToTail: (index) => c.#moveToTail(index),
			indexes: (options) => c.#indexes(options),
			rindexes: (options) => c.#rindexes(options),
			isStale: (index) => c.#isStale(index),
		};
	}
	get max() {
		return this.#max;
	}
	get maxSize() {
		return this.#maxSize;
	}
	get calculatedSize() {
		return this.#calculatedSize;
	}
	get size() {
		return this.#size;
	}
	get fetchMethod() {
		return this.#fetchMethod;
	}
	get memoMethod() {
		return this.#memoMethod;
	}
	get dispose() {
		return this.#dispose;
	}
	get onInsert() {
		return this.#onInsert;
	}
	get disposeAfter() {
		return this.#disposeAfter;
	}
	constructor(options) {
		const {
			max = 0,
			ttl,
			ttlResolution = 1,
			ttlAutopurge,
			updateAgeOnGet,
			updateAgeOnHas,
			allowStale,
			dispose,
			onInsert,
			disposeAfter,
			noDisposeOnSet,
			noUpdateTTL,
			maxSize = 0,
			maxEntrySize = 0,
			sizeCalculation,
			fetchMethod,
			memoMethod,
			noDeleteOnFetchRejection,
			noDeleteOnStaleGet,
			allowStaleOnFetchRejection,
			allowStaleOnFetchAbort,
			ignoreFetchAbort,
			perf,
		} = options;
		if (perf !== undefined && typeof perf?.now !== "function") {
			throw new TypeError("perf option must have a now() method if specified");
		}
		this.#perf = perf ?? defaultPerf;
		if (max !== 0 && !isPosInt(max)) {
			throw new TypeError("max option must be a nonnegative integer");
		}
		const UintArray = max ? getUintArray(max) : Array;
		if (!UintArray) {
			throw new Error(`invalid max value: ${max}`);
		}
		this.#max = max;
		this.#maxSize = maxSize;
		this.maxEntrySize = maxEntrySize || this.#maxSize;
		this.sizeCalculation = sizeCalculation;
		if (this.sizeCalculation) {
			if (!(this.#maxSize || this.maxEntrySize)) {
				throw new TypeError(
					"cannot set sizeCalculation without setting maxSize or maxEntrySize",
				);
			}
			if (typeof this.sizeCalculation !== "function") {
				throw new TypeError("sizeCalculation set to non-function");
			}
		}
		if (memoMethod !== undefined && typeof memoMethod !== "function") {
			throw new TypeError("memoMethod must be a function if defined");
		}
		this.#memoMethod = memoMethod;
		if (fetchMethod !== undefined && typeof fetchMethod !== "function") {
			throw new TypeError("fetchMethod must be a function if specified");
		}
		this.#fetchMethod = fetchMethod;
		this.#hasFetchMethod = !!fetchMethod;
		this.#keyMap = new Map();
		this.#keyList = new Array(max).fill(undefined);
		this.#valList = new Array(max).fill(undefined);
		this.#next = new UintArray(max);
		this.#prev = new UintArray(max);
		this.#head = 0;
		this.#tail = 0;
		this.#free = Stack.create(max);
		this.#size = 0;
		this.#calculatedSize = 0;
		if (typeof dispose === "function") {
			this.#dispose = dispose;
		}
		if (typeof onInsert === "function") {
			this.#onInsert = onInsert;
		}
		if (typeof disposeAfter === "function") {
			this.#disposeAfter = disposeAfter;
			this.#disposed = [];
		} else {
			this.#disposeAfter = undefined;
			this.#disposed = undefined;
		}
		this.#hasDispose = !!this.#dispose;
		this.#hasOnInsert = !!this.#onInsert;
		this.#hasDisposeAfter = !!this.#disposeAfter;
		this.noDisposeOnSet = !!noDisposeOnSet;
		this.noUpdateTTL = !!noUpdateTTL;
		this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
		this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
		this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
		this.ignoreFetchAbort = !!ignoreFetchAbort;
		if (this.maxEntrySize !== 0) {
			if (this.#maxSize !== 0 && !isPosInt(this.#maxSize)) {
				throw new TypeError("maxSize must be a positive integer if specified");
			}
			if (!isPosInt(this.maxEntrySize)) {
				throw new TypeError(
					"maxEntrySize must be a positive integer if specified",
				);
			}
			this.#initializeSizeTracking();
		}
		this.allowStale = !!allowStale;
		this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
		this.updateAgeOnGet = !!updateAgeOnGet;
		this.updateAgeOnHas = !!updateAgeOnHas;
		this.ttlResolution =
			isPosInt(ttlResolution) || ttlResolution === 0 ? ttlResolution : 1;
		this.ttlAutopurge = !!ttlAutopurge;
		this.ttl = ttl || 0;
		if (this.ttl) {
			if (!isPosInt(this.ttl)) {
				throw new TypeError("ttl must be a positive integer if specified");
			}
			this.#initializeTTLTracking();
		}
		if (this.#max === 0 && this.ttl === 0 && this.#maxSize === 0) {
			throw new TypeError("At least one of max, maxSize, or ttl is required");
		}
		if (!(this.ttlAutopurge || this.#max || this.#maxSize)) {
			const code = "LRU_CACHE_UNBOUNDED";
			if (shouldWarn(code)) {
				warned.add(code);
				const msg =
					"TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.";
				emitWarning(msg, "UnboundedCacheWarning", code, LRUCache);
			}
		}
	}
	getRemainingTTL(key) {
		return this.#keyMap.has(key) ? Number.POSITIVE_INFINITY : 0;
	}
	#initializeTTLTracking() {
		const ttls = new ZeroArray(this.#max);
		const starts = new ZeroArray(this.#max);
		this.#ttls = ttls;
		this.#starts = starts;
		this.#setItemTTL = (index, ttl, start = this.#perf.now()) => {
			starts[index] = ttl !== 0 ? start : 0;
			ttls[index] = ttl;
			if (ttl !== 0 && this.ttlAutopurge) {
				const t = setTimeout(() => {
					if (this.#isStale(index)) {
						this.#delete(this.#keyList[index], "expire");
					}
				}, ttl + 1);
				if (t.unref) {
					t.unref();
				}
			}
		};
		this.#updateItemAge = (index) => {
			starts[index] = ttls[index] !== 0 ? this.#perf.now() : 0;
		};
		this.#statusTTL = (status, index) => {
			if (ttls[index]) {
				const ttl = ttls[index];
				const start = starts[index];
				if (!(ttl && start)) {
					return;
				}
				status.ttl = ttl;
				status.start = start;
				status.now = cachedNow || getNow();
				const age = status.now - start;
				status.remainingTTL = ttl - age;
			}
		};
		let cachedNow = 0;
		const getNow = () => {
			const n = this.#perf.now();
			if (this.ttlResolution > 0) {
				cachedNow = n;
				const t = setTimeout(() => (cachedNow = 0), this.ttlResolution);
				if (t.unref) {
					t.unref();
				}
			}
			return n;
		};
		this.getRemainingTTL = (key) => {
			const index = this.#keyMap.get(key);
			if (index === undefined) {
				return 0;
			}
			const ttl = ttls[index];
			const start = starts[index];
			if (!(ttl && start)) {
				return Number.POSITIVE_INFINITY;
			}
			const age = (cachedNow || getNow()) - start;
			return ttl - age;
		};
		this.#isStale = (index) => {
			const s = starts[index];
			const t = ttls[index];
			return !!t && !!s && (cachedNow || getNow()) - s > t;
		};
	}
	#updateItemAge = () => {};
	#statusTTL = () => {};
	#setItemTTL = () => {};
	#isStale = () => false;
	#initializeSizeTracking() {
		const sizes = new ZeroArray(this.#max);
		this.#calculatedSize = 0;
		this.#sizes = sizes;
		this.#removeItemSize = (index) => {
			this.#calculatedSize -= sizes[index];
			sizes[index] = 0;
		};
		this.#requireSize = (k, v, size, sizeCalculation) => {
			if (this.#isBackgroundFetch(v)) {
				return 0;
			}
			if (!isPosInt(size)) {
				if (sizeCalculation) {
					if (typeof sizeCalculation !== "function") {
						throw new TypeError("sizeCalculation must be a function");
					}
					size = sizeCalculation(v, k);
					if (!isPosInt(size)) {
						throw new TypeError(
							"sizeCalculation return invalid (expect positive integer)",
						);
					}
				} else {
					throw new TypeError(
						"invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.",
					);
				}
			}
			return size;
		};
		this.#addItemSize = (index, size, status) => {
			sizes[index] = size;
			if (this.#maxSize) {
				const maxSize = this.#maxSize - sizes[index];
				while (this.#calculatedSize > maxSize) {
					this.#evict(true);
				}
			}
			this.#calculatedSize += sizes[index];
			if (status) {
				status.entrySize = size;
				status.totalCalculatedSize = this.#calculatedSize;
			}
		};
	}
	#removeItemSize = (_i) => {};
	#addItemSize = (_i, _s, _st) => {};
	#requireSize = (_k, _v, size, sizeCalculation) => {
		if (size || sizeCalculation) {
			throw new TypeError(
				"cannot set size without setting maxSize or maxEntrySize on cache",
			);
		}
		return 0;
	};
	*#indexes({ allowStale = this.allowStale } = {}) {
		if (this.#size) {
			for (let i = this.#tail; ; ) {
				if (!this.#isValidIndex(i)) {
					break;
				}
				if (allowStale || !this.#isStale(i)) {
					yield i;
				}
				if (i === this.#head) {
					break;
				}
				i = this.#prev[i];
			}
		}
	}
	*#rindexes({ allowStale = this.allowStale } = {}) {
		if (this.#size) {
			for (let i = this.#head; ; ) {
				if (!this.#isValidIndex(i)) {
					break;
				}
				if (allowStale || !this.#isStale(i)) {
					yield i;
				}
				if (i === this.#tail) {
					break;
				}
				i = this.#next[i];
			}
		}
	}
	#isValidIndex(index) {
		return (
			index !== undefined && this.#keyMap.get(this.#keyList[index]) === index
		);
	}
	*entries() {
		for (const i of this.#indexes()) {
			if (
				this.#valList[i] !== undefined &&
				this.#keyList[i] !== undefined &&
				!this.#isBackgroundFetch(this.#valList[i])
			) {
				yield [this.#keyList[i], this.#valList[i]];
			}
		}
	}
	*rentries() {
		for (const i of this.#rindexes()) {
			if (
				this.#valList[i] !== undefined &&
				this.#keyList[i] !== undefined &&
				!this.#isBackgroundFetch(this.#valList[i])
			) {
				yield [this.#keyList[i], this.#valList[i]];
			}
		}
	}
	*keys() {
		for (const i of this.#indexes()) {
			const k = this.#keyList[i];
			if (k !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
				yield k;
			}
		}
	}
	*rkeys() {
		for (const i of this.#rindexes()) {
			const k = this.#keyList[i];
			if (k !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
				yield k;
			}
		}
	}
	*values() {
		for (const i of this.#indexes()) {
			const v = this.#valList[i];
			if (v !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
				yield this.#valList[i];
			}
		}
	}
	*rvalues() {
		for (const i of this.#rindexes()) {
			const v = this.#valList[i];
			if (v !== undefined && !this.#isBackgroundFetch(this.#valList[i])) {
				yield this.#valList[i];
			}
		}
	}
	[Symbol.iterator]() {
		return this.entries();
	}
	[Symbol.toStringTag] = "LRUCache";
	find(fn, getOptions = {}) {
		for (const i of this.#indexes()) {
			const v = this.#valList[i];
			const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
			if (value === undefined) {
				continue;
			}
			if (fn(value, this.#keyList[i], this)) {
				return this.get(this.#keyList[i], getOptions);
			}
		}
	}
	forEach(fn, thisp = this) {
		for (const i of this.#indexes()) {
			const v = this.#valList[i];
			const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
			if (value === undefined) {
				continue;
			}
			fn.call(thisp, value, this.#keyList[i], this);
		}
	}
	rforEach(fn, thisp = this) {
		for (const i of this.#rindexes()) {
			const v = this.#valList[i];
			const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
			if (value === undefined) {
				continue;
			}
			fn.call(thisp, value, this.#keyList[i], this);
		}
	}
	purgeStale() {
		let deleted = false;
		for (const i of this.#rindexes({ allowStale: true })) {
			if (this.#isStale(i)) {
				this.#delete(this.#keyList[i], "expire");
				deleted = true;
			}
		}
		return deleted;
	}
	info(key) {
		const i = this.#keyMap.get(key);
		if (i === undefined) {
			return;
		}
		const v = this.#valList[i];
		const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
		if (value === undefined) {
			return;
		}
		const entry = { value };
		if (this.#ttls && this.#starts) {
			const ttl = this.#ttls[i];
			const start = this.#starts[i];
			if (ttl && start) {
				const remain = ttl - (this.#perf.now() - start);
				entry.ttl = remain;
				entry.start = Date.now();
			}
		}
		if (this.#sizes) {
			entry.size = this.#sizes[i];
		}
		return entry;
	}
	dump() {
		const arr = [];
		for (const i of this.#indexes({ allowStale: true })) {
			const key = this.#keyList[i];
			const v = this.#valList[i];
			const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
			if (value === undefined || key === undefined) {
				continue;
			}
			const entry = { value };
			if (this.#ttls && this.#starts) {
				entry.ttl = this.#ttls[i];
				const age = this.#perf.now() - this.#starts[i];
				entry.start = Math.floor(Date.now() - age);
			}
			if (this.#sizes) {
				entry.size = this.#sizes[i];
			}
			arr.unshift([key, entry]);
		}
		return arr;
	}
	load(arr) {
		this.clear();
		for (const [key, entry] of arr) {
			if (entry.start) {
				const age = Date.now() - entry.start;
				entry.start = this.#perf.now() - age;
			}
			this.set(key, entry.value, entry);
		}
	}
	set(k, v, setOptions = {}) {
		if (v === undefined) {
			this.delete(k);
			return this;
		}
		const {
			ttl = this.ttl,
			start,
			noDisposeOnSet = this.noDisposeOnSet,
			sizeCalculation = this.sizeCalculation,
			status,
		} = setOptions;
		let { noUpdateTTL = this.noUpdateTTL } = setOptions;
		const size = this.#requireSize(k, v, setOptions.size || 0, sizeCalculation);
		if (this.maxEntrySize && size > this.maxEntrySize) {
			if (status) {
				status.set = "miss";
				status.maxEntrySizeExceeded = true;
			}
			this.#delete(k, "set");
			return this;
		}
		let index = this.#size === 0 ? undefined : this.#keyMap.get(k);
		if (index === undefined) {
			index =
				this.#size === 0
					? this.#tail
					: this.#free.length !== 0
						? this.#free.pop()
						: this.#size === this.#max
							? this.#evict(false)
							: this.#size;
			this.#keyList[index] = k;
			this.#valList[index] = v;
			this.#keyMap.set(k, index);
			this.#next[this.#tail] = index;
			this.#prev[index] = this.#tail;
			this.#tail = index;
			this.#size++;
			this.#addItemSize(index, size, status);
			if (status) {
				status.set = "add";
			}
			noUpdateTTL = false;
			if (this.#hasOnInsert) {
				this.#onInsert?.(v, k, "add");
			}
		} else {
			this.#moveToTail(index);
			const oldVal = this.#valList[index];
			if (v !== oldVal) {
				if (this.#hasFetchMethod && this.#isBackgroundFetch(oldVal)) {
					oldVal.__abortController.abort(new Error("replaced"));
					const { __staleWhileFetching: s } = oldVal;
					if (s !== undefined && !noDisposeOnSet) {
						if (this.#hasDispose) {
							this.#dispose?.(s, k, "set");
						}
						if (this.#hasDisposeAfter) {
							this.#disposed?.push([s, k, "set"]);
						}
					}
				} else if (!noDisposeOnSet) {
					if (this.#hasDispose) {
						this.#dispose?.(oldVal, k, "set");
					}
					if (this.#hasDisposeAfter) {
						this.#disposed?.push([oldVal, k, "set"]);
					}
				}
				this.#removeItemSize(index);
				this.#addItemSize(index, size, status);
				this.#valList[index] = v;
				if (status) {
					status.set = "replace";
					const oldValue =
						oldVal && this.#isBackgroundFetch(oldVal)
							? oldVal.__staleWhileFetching
							: oldVal;
					if (oldValue !== undefined) {
						status.oldValue = oldValue;
					}
				}
			} else if (status) {
				status.set = "update";
			}
			if (this.#hasOnInsert) {
				this.onInsert?.(v, k, v === oldVal ? "update" : "replace");
			}
		}
		if (ttl !== 0 && !this.#ttls) {
			this.#initializeTTLTracking();
		}
		if (this.#ttls) {
			if (!noUpdateTTL) {
				this.#setItemTTL(index, ttl, start);
			}
			if (status) {
				this.#statusTTL(status, index);
			}
		}
		if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
			const dt = this.#disposed;
			let task;
			while ((task = dt?.shift())) {
				this.#disposeAfter?.(...task);
			}
		}
		return this;
	}
	pop() {
		try {
			while (this.#size) {
				const val = this.#valList[this.#head];
				this.#evict(true);
				if (this.#isBackgroundFetch(val)) {
					if (val.__staleWhileFetching) {
						return val.__staleWhileFetching;
					}
				} else if (val !== undefined) {
					return val;
				}
			}
		} finally {
			if (this.#hasDisposeAfter && this.#disposed) {
				const dt = this.#disposed;
				let task;
				while ((task = dt?.shift())) {
					this.#disposeAfter?.(...task);
				}
			}
		}
	}
	#evict(free) {
		const head = this.#head;
		const k = this.#keyList[head];
		const v = this.#valList[head];
		if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) {
			v.__abortController.abort(new Error("evicted"));
		} else if (this.#hasDispose || this.#hasDisposeAfter) {
			if (this.#hasDispose) {
				this.#dispose?.(v, k, "evict");
			}
			if (this.#hasDisposeAfter) {
				this.#disposed?.push([v, k, "evict"]);
			}
		}
		this.#removeItemSize(head);
		if (free) {
			this.#keyList[head] = undefined;
			this.#valList[head] = undefined;
			this.#free.push(head);
		}
		if (this.#size === 1) {
			this.#head = this.#tail = 0;
			this.#free.length = 0;
		} else {
			this.#head = this.#next[head];
		}
		this.#keyMap.delete(k);
		this.#size--;
		return head;
	}
	has(k, hasOptions = {}) {
		const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
		const index = this.#keyMap.get(k);
		if (index !== undefined) {
			const v = this.#valList[index];
			if (this.#isBackgroundFetch(v) && v.__staleWhileFetching === undefined) {
				return false;
			}
			if (!this.#isStale(index)) {
				if (updateAgeOnHas) {
					this.#updateItemAge(index);
				}
				if (status) {
					status.has = "hit";
					this.#statusTTL(status, index);
				}
				return true;
			}
			if (status) {
				status.has = "stale";
				this.#statusTTL(status, index);
			}
		} else if (status) {
			status.has = "miss";
		}
		return false;
	}
	peek(k, peekOptions = {}) {
		const { allowStale = this.allowStale } = peekOptions;
		const index = this.#keyMap.get(k);
		if (index === undefined || (!allowStale && this.#isStale(index))) {
			return;
		}
		const v = this.#valList[index];
		return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
	}
	#backgroundFetch(k, index, options, context) {
		const v = index === undefined ? undefined : this.#valList[index];
		if (this.#isBackgroundFetch(v)) {
			return v;
		}
		const ac = new AC();
		const { signal } = options;
		signal?.addEventListener("abort", () => ac.abort(signal.reason), {
			signal: ac.signal,
		});
		const fetchOpts = {
			signal: ac.signal,
			options,
			context,
		};
		const cb = (v2, updateCache = false) => {
			const { aborted } = ac.signal;
			const ignoreAbort = options.ignoreFetchAbort && v2 !== undefined;
			if (options.status) {
				if (aborted && !updateCache) {
					options.status.fetchAborted = true;
					options.status.fetchError = ac.signal.reason;
					if (ignoreAbort) {
						options.status.fetchAbortIgnored = true;
					}
				} else {
					options.status.fetchResolved = true;
				}
			}
			if (aborted && !ignoreAbort && !updateCache) {
				return fetchFail(ac.signal.reason);
			}
			const bf2 = p;
			const vl = this.#valList[index];
			if (vl === p || (ignoreAbort && updateCache && vl === undefined)) {
				if (v2 === undefined) {
					if (bf2.__staleWhileFetching !== undefined) {
						this.#valList[index] = bf2.__staleWhileFetching;
					} else {
						this.#delete(k, "fetch");
					}
				} else {
					if (options.status) {
						options.status.fetchUpdated = true;
					}
					this.set(k, v2, fetchOpts.options);
				}
			}
			return v2;
		};
		const eb = (er) => {
			if (options.status) {
				options.status.fetchRejected = true;
				options.status.fetchError = er;
			}
			return fetchFail(er);
		};
		const fetchFail = (er) => {
			const { aborted } = ac.signal;
			const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
			const allowStale =
				allowStaleAborted || options.allowStaleOnFetchRejection;
			const noDelete = allowStale || options.noDeleteOnFetchRejection;
			const bf2 = p;
			if (this.#valList[index] === p) {
				const del = !noDelete || bf2.__staleWhileFetching === undefined;
				if (del) {
					this.#delete(k, "fetch");
				} else if (!allowStaleAborted) {
					this.#valList[index] = bf2.__staleWhileFetching;
				}
			}
			if (allowStale) {
				if (options.status && bf2.__staleWhileFetching !== undefined) {
					options.status.returnedStale = true;
				}
				return bf2.__staleWhileFetching;
			}
			if (bf2.__returned === bf2) {
				throw er;
			}
		};
		const pcall = (res, rej) => {
			const fmp = this.#fetchMethod?.(k, v, fetchOpts);
			if (fmp && fmp instanceof Promise) {
				fmp.then((v2) => res(v2 === undefined ? undefined : v2), rej);
			}
			ac.signal.addEventListener("abort", () => {
				if (!options.ignoreFetchAbort || options.allowStaleOnFetchAbort) {
					res(undefined);
					if (options.allowStaleOnFetchAbort) {
						res = (v2) => cb(v2, true);
					}
				}
			});
		};
		if (options.status) {
			options.status.fetchDispatched = true;
		}
		const p = new Promise(pcall).then(cb, eb);
		const bf = Object.assign(p, {
			__abortController: ac,
			__staleWhileFetching: v,
			__returned: undefined,
		});
		if (index === undefined) {
			this.set(k, bf, { ...fetchOpts.options, status: undefined });
			index = this.#keyMap.get(k);
		} else {
			this.#valList[index] = bf;
		}
		return bf;
	}
	#isBackgroundFetch(p) {
		if (!this.#hasFetchMethod) {
			return false;
		}
		const b = p;
		return (
			!!b &&
			b instanceof Promise &&
			Object.hasOwn(b, "__staleWhileFetching") &&
			b.__abortController instanceof AC
		);
	}
	async fetch(k, fetchOptions = {}) {
		const {
			allowStale = this.allowStale,
			updateAgeOnGet = this.updateAgeOnGet,
			noDeleteOnStaleGet = this.noDeleteOnStaleGet,
			ttl = this.ttl,
			noDisposeOnSet = this.noDisposeOnSet,
			size = 0,
			sizeCalculation = this.sizeCalculation,
			noUpdateTTL = this.noUpdateTTL,
			noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
			allowStaleOnFetchRejection = this.allowStaleOnFetchRejection,
			ignoreFetchAbort = this.ignoreFetchAbort,
			allowStaleOnFetchAbort = this.allowStaleOnFetchAbort,
			context,
			forceRefresh = false,
			status,
			signal,
		} = fetchOptions;
		if (!this.#hasFetchMethod) {
			if (status) {
				status.fetch = "get";
			}
			return this.get(k, {
				allowStale,
				updateAgeOnGet,
				noDeleteOnStaleGet,
				status,
			});
		}
		const options = {
			allowStale,
			updateAgeOnGet,
			noDeleteOnStaleGet,
			ttl,
			noDisposeOnSet,
			size,
			sizeCalculation,
			noUpdateTTL,
			noDeleteOnFetchRejection,
			allowStaleOnFetchRejection,
			allowStaleOnFetchAbort,
			ignoreFetchAbort,
			status,
			signal,
		};
		const index = this.#keyMap.get(k);
		if (index === undefined) {
			if (status) {
				status.fetch = "miss";
			}
			const p = this.#backgroundFetch(k, index, options, context);
			return (p.__returned = p);
		}
		const v = this.#valList[index];
		if (this.#isBackgroundFetch(v)) {
			const stale = allowStale && v.__staleWhileFetching !== undefined;
			if (status) {
				status.fetch = "inflight";
				if (stale) {
					status.returnedStale = true;
				}
			}
			return stale ? v.__staleWhileFetching : (v.__returned = v);
		}
		const isStale = this.#isStale(index);
		if (!(forceRefresh || isStale)) {
			if (status) {
				status.fetch = "hit";
			}
			this.#moveToTail(index);
			if (updateAgeOnGet) {
				this.#updateItemAge(index);
			}
			if (status) {
				this.#statusTTL(status, index);
			}
			return v;
		}
		const p = this.#backgroundFetch(k, index, options, context);
		const hasStale = p.__staleWhileFetching !== undefined;
		const staleVal = hasStale && allowStale;
		if (status) {
			status.fetch = isStale ? "stale" : "refresh";
			if (staleVal && isStale) {
				status.returnedStale = true;
			}
		}
		return staleVal ? p.__staleWhileFetching : (p.__returned = p);
	}
	async forceFetch(k, fetchOptions = {}) {
		const v = await this.fetch(k, fetchOptions);
		if (v === undefined) {
			throw new Error("fetch() returned undefined");
		}
		return v;
	}
	memo(k, memoOptions = {}) {
		const memoMethod = this.#memoMethod;
		if (!memoMethod) {
			throw new Error("no memoMethod provided to constructor");
		}
		const { context, forceRefresh, ...options } = memoOptions;
		const v = this.get(k, options);
		if (!forceRefresh && v !== undefined) {
			return v;
		}
		const vv = memoMethod(k, v, {
			options,
			context,
		});
		this.set(k, vv, options);
		return vv;
	}
	get(k, getOptions = {}) {
		const {
			allowStale = this.allowStale,
			updateAgeOnGet = this.updateAgeOnGet,
			noDeleteOnStaleGet = this.noDeleteOnStaleGet,
			status,
		} = getOptions;
		const index = this.#keyMap.get(k);
		if (index !== undefined) {
			const value = this.#valList[index];
			const fetching = this.#isBackgroundFetch(value);
			if (status) {
				this.#statusTTL(status, index);
			}
			if (this.#isStale(index)) {
				if (status) {
					status.get = "stale";
				}
				if (fetching) {
					if (
						status &&
						allowStale &&
						value.__staleWhileFetching !== undefined
					) {
						status.returnedStale = true;
					}
					return allowStale ? value.__staleWhileFetching : undefined;
				}
				if (!noDeleteOnStaleGet) {
					this.#delete(k, "expire");
				}
				if (status && allowStale) {
					status.returnedStale = true;
				}
				return allowStale ? value : undefined;
			}
			if (status) {
				status.get = "hit";
			}
			if (fetching) {
				return value.__staleWhileFetching;
			}
			this.#moveToTail(index);
			if (updateAgeOnGet) {
				this.#updateItemAge(index);
			}
			return value;
		}
		if (status) {
			status.get = "miss";
		}
	}
	#connect(p, n) {
		this.#prev[n] = p;
		this.#next[p] = n;
	}
	#moveToTail(index) {
		if (index !== this.#tail) {
			if (index === this.#head) {
				this.#head = this.#next[index];
			} else {
				this.#connect(this.#prev[index], this.#next[index]);
			}
			this.#connect(this.#tail, index);
			this.#tail = index;
		}
	}
	delete(k) {
		return this.#delete(k, "delete");
	}
	#delete(k, reason) {
		let deleted = false;
		if (this.#size !== 0) {
			const index = this.#keyMap.get(k);
			if (index !== undefined) {
				deleted = true;
				if (this.#size === 1) {
					this.#clear(reason);
				} else {
					this.#removeItemSize(index);
					const v = this.#valList[index];
					if (this.#isBackgroundFetch(v)) {
						v.__abortController.abort(new Error("deleted"));
					} else if (this.#hasDispose || this.#hasDisposeAfter) {
						if (this.#hasDispose) {
							this.#dispose?.(v, k, reason);
						}
						if (this.#hasDisposeAfter) {
							this.#disposed?.push([v, k, reason]);
						}
					}
					this.#keyMap.delete(k);
					this.#keyList[index] = undefined;
					this.#valList[index] = undefined;
					if (index === this.#tail) {
						this.#tail = this.#prev[index];
					} else if (index === this.#head) {
						this.#head = this.#next[index];
					} else {
						const pi = this.#prev[index];
						this.#next[pi] = this.#next[index];
						const ni = this.#next[index];
						this.#prev[ni] = this.#prev[index];
					}
					this.#size--;
					this.#free.push(index);
				}
			}
		}
		if (this.#hasDisposeAfter && this.#disposed?.length) {
			const dt = this.#disposed;
			let task;
			while ((task = dt?.shift())) {
				this.#disposeAfter?.(...task);
			}
		}
		return deleted;
	}
	clear() {
		return this.#clear("delete");
	}
	#clear(reason) {
		for (const index of this.#rindexes({ allowStale: true })) {
			const v = this.#valList[index];
			if (this.#isBackgroundFetch(v)) {
				v.__abortController.abort(new Error("deleted"));
			} else {
				const k = this.#keyList[index];
				if (this.#hasDispose) {
					this.#dispose?.(v, k, reason);
				}
				if (this.#hasDisposeAfter) {
					this.#disposed?.push([v, k, reason]);
				}
			}
		}
		this.#keyMap.clear();
		this.#valList.fill(undefined);
		this.#keyList.fill(undefined);
		if (this.#ttls && this.#starts) {
			this.#ttls.fill(0);
			this.#starts.fill(0);
		}
		if (this.#sizes) {
			this.#sizes.fill(0);
		}
		this.#head = 0;
		this.#tail = 0;
		this.#free.length = 0;
		this.#calculatedSize = 0;
		this.#size = 0;
		if (this.#hasDisposeAfter && this.#disposed) {
			const dt = this.#disposed;
			let task;
			while ((task = dt?.shift())) {
				this.#disposeAfter?.(...task);
			}
		}
	}
}

// src/lib/lru-cache.ts
class LRUCache2 {
	cache;
	onEvict;
	constructor(options) {
		this.onEvict = options.onEvict;
		this.cache = new LRUCache({
			max: options.maxSize,
			ttl: options.ttl,
			dispose: options.onEvict
				? (value, key) => {
						this.onEvict?.(key, value);
					}
				: undefined,
		});
	}
	get(key) {
		return this.cache.get(key);
	}
	set(key, value) {
		this.cache.set(key, value);
	}
	has(key) {
		return this.cache.has(key);
	}
	delete(key) {
		return this.cache.delete(key);
	}
	clear() {
		this.cache.clear();
	}
	get size() {
		return this.cache.size;
	}
	keys() {
		return [...this.cache.keys()];
	}
	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.cache.max,
			oldestTimestamp: null,
			newestTimestamp: null,
		};
	}
}
const createMemoizedFunction = (fn, options, keyGenerator) => {
	const cache = new LRUCache2(options);
	const defaultKeyGenerator = (...args) => {
		return JSON.stringify(args);
	};
	const getKey = keyGenerator ?? defaultKeyGenerator;
	const memoized = async (...args) => {
		const key = getKey(...args);
		const cached = cache.get(key);
		if (cached !== undefined) {
			return cached;
		}
		const result = await fn(...args);
		cache.set(key, result);
		return result;
	};
	return {
		execute: memoized,
		cache,
		invalidate: (key) => cache.delete(key),
		clear: () => cache.clear(),
	};
};
export { createMemoizedFunction, LRUCache2 as LRUCache };
