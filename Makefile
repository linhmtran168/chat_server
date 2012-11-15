run-production:
	@NODE_ENV=production forever -w --watchDirectory /home/linhtm/sites/ogorinChat start -l forever_ogorinChat.log -o logs/out.log -e logs/err.log -a app.js

restart:
	@NODE_ENV=production forever restart KsCo

.PHONY: run-production
