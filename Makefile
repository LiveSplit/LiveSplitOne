core: bindings
	@make -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

wasm: bindings
	@make wasm -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

wasm-unknown:
	@make bindings -C livesplit-core/capi/js
	@cp livesplit-core/capi/bindings/wasm/livesplit_core.ts src/livesplit.ts
	@make wasm-unknown -C livesplit-core/capi/js
	@cp livesplit-core/capi/js/livesplit_core.wasm src/livesplit_core.wasm

debug: bindings
	@make debug -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

bindings:
	@make bindings -C livesplit-core/js
	@cp livesplit-core/capi/bindings/emscripten/livesplit_core.ts src/livesplit.ts

run:
	@python -m SimpleHTTPServer 8080

build: core
	webpack

clean:
	@make clean -C livesplit-core/js
