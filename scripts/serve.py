#!/usr/bin/env python3
# Local dev server (not part of the deployed site).
import http.server
import os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
port = int(os.environ.get("PORT", 8741))


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


server = http.server.HTTPServer(("127.0.0.1", port), Handler)
server.serve_forever()
