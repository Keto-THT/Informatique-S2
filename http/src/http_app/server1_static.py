from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 9000

def main() -> None:
    print(f"Open this in your browser:\nhttp://localhost:{PORT}/index.html")
    httpd = HTTPServer(('', PORT), SimpleHTTPRequestHandler)
    httpd.serve_forever()

if __name__ == "__main__":
    main()
