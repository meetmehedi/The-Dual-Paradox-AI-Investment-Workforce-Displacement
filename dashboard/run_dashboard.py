import sys
import os
import http.server
import socketserver
import webbrowser
import threading
import time

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def open_browser():
    time.sleep(1.2)
    print(f"\n[Browser] Opening http://localhost:{PORT}/ in your web browser...")
    webbrowser.open(f"http://localhost:{PORT}/")

def main():
    # Change working directory to ensure correct pathing
    os.chdir(DIRECTORY)
    
    print("=" * 60)
    print("      THE DUAL PARADOX: RESEARCH EXPLORER & LAYOFFS DASHBOARD")
    print("=" * 60)
    print(f" Local Web Server Directory : {DIRECTORY}")
    print(f" Local Web Server Port      : {PORT}")
    print(f" Local URL Address          : http://localhost:{PORT}/")
    print("=" * 60)
    print(" Press Ctrl+C to terminate the local server and exit.")
    print("=" * 60)
    
    # Launch browser launch in background thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Allow port reuse to prevent 'Address already in use' errors
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server] Shutting down local server... Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n[Error] Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
