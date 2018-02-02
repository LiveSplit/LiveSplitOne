core: bindings
	@make -C livesplit-core/capi/js
	@cp livesplit-core/capi/js/livesplit.js src/livesplit_core.js

wasm: bindings
	@make wasm -C livesplit-core/capi/js
	@cp livesplit-core/capi/js/livesplit.js src/livesplit_core.js

debug: bindings
	@make debug -C livesplit-core/capi/js
	@cp livesplit-core/capi/js/livesplit.js src/livesplit_core.js

bindings:
	@make bindings -C livesplit-core/capi/js
	@cp livesplit-core/capi/bindings/emscripten/livesplit_core.ts src/livesplit.ts

run:
	@python -m SimpleHTTPServer 8080

build: core
	webpack

clean:
	@make clean -C livesplit-core/capi/js
