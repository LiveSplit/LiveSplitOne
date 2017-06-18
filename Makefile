core: bindings
	@make -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

wasm: bindings
	@make wasm -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

debug: bindings
	@make debug -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

bindings:
	@make bindings -C livesplit-core/js

run:
	@python -m SimpleHTTPServer 8080

web: core
	@cp livesplit-core/capi/bindings/emscripten/livesplit_core.ts src/livesplit.ts
	webpack

electron:
	@rm src/livesplit_core.js 2>/dev/null || :
	@rm dist/bundle.js 2>/dev/null || :
	@cp livesplit-core/capi/bindings/node/livesplit_core.ts src/livesplit.ts
	@tsc src/index.tsx --jsx 'react' --outDir 'dist/electron/'
	
clean:
	@make clean -C livesplit-core/js
