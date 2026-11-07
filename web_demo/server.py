import http.server
import socketserver
import json
import os
import sys
import time
import duckdb

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

PORT = int(os.environ.get("PORT", 5000))
WEB_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(WEB_DIR)
DB_PATH = os.path.join(PROJECT_DIR, "data", "clustering_results.duckdb")
PARQUET_PATH = os.path.join(PROJECT_DIR, "data", "events.parquet").replace("\\", "/")


def get_duckdb_connection():
    con = duckdb.connect(DB_PATH, read_only=True)
    abs_parquet = os.path.abspath(os.path.join(PROJECT_DIR, "data", "events.parquet")).replace("\\", "/")
    if os.path.exists(abs_parquet):
        try:
            con.execute(f"CREATE OR REPLACE TEMPORARY VIEW events AS SELECT * FROM read_parquet('{abs_parquet}')")
        except Exception as e:
            print(f"[WARN] Khong the tao view events: {e}")
    return con


class KDDLabRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_POST(self):
        if self.path == "/api/sql":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length).decode("utf-8")
            
            try:
                payload = json.loads(post_body)
                query = payload.get("query", "").strip()
                if not query:
                    self.send_json_response({"error": "Cau truy van SQL khong duoc de trong"}, status=400)
                    return

                # Disallow modifying queries for safety
                query_upper = query.upper()
                for forbidden in ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE TABLE"]:
                    if forbidden in query_upper:
                        self.send_json_response({"error": f"Lenh {forbidden} khong duoc phep thuc thi tren che do chi doc."}, status=403)
                        return

                t_start = time.time()
                con = get_duckdb_connection()
                try:
                    df = con.execute(query).df()
                    duration_ms = round((time.time() - t_start) * 1000, 2)
                    columns = list(df.columns)
                    
                    # Convert DataFrame to records, converting NaNs/Infs to None
                    records = df.replace({float("nan"): None, float("inf"): None, float("-inf"): None}).to_dict(orient="records")
                    
                    response_data = {
                        "success": True,
                        "columns": columns,
                        "data": records,
                        "total_rows": len(records),
                        "execution_time_ms": duration_ms
                    }
                    self.send_json_response(response_data)
                finally:
                    con.close()

            except Exception as e:
                self.send_json_response({"error": str(e)}, status=500)
        else:
            self.send_error(404, "Not Found")

    def send_json_response(self, data, status=200):
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def run_server():
    os.chdir(WEB_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), KDDLabRequestHandler) as httpd:
        print(f"================================================================")
        print(f"[*] KDD Analytics Lab Web Server is RUNNING at:")
        print(f"    -> http://localhost:{PORT}")
        print(f"    -> http://127.0.0.1:{PORT}")
        print(f"    DuckDB Database: {DB_PATH}")
        print(f"    Press Ctrl+C to stop.")
        print(f"================================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Dang dung server...")
            httpd.server_close()


if __name__ == "__main__":
    run_server()
