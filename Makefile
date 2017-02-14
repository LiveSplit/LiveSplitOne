core:
	@make -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

optimized:
	@make optimized -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

wasm:
	@make wasm -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

debug:
	@make debug -C livesplit-core/js
	@cp livesplit-core/js/livesplit.js src/livesplit_core.js

run:
	@python -m SimpleHTTPServer 8080

build: core
	webpack

clean:
	@make clean -C livesplit-core/js
