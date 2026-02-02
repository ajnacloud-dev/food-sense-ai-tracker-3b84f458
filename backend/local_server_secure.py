"""
Enhanced Local Lambda Server with Security Improvements
Includes authentication, validation, and logging

Usage:
    # Development mode (local auth)
    AUTH_MODE=local python local_server_secure.py

    # Test with mock Cognito
    AUTH_MODE=test python local_server_secure.py

    # Production mode (requires Cognito)
    AUTH_MODE=cognito python local_server_secure.py
"""

import os
import sys
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from dotenv import load_dotenv

# Load env vars from .env file
load_dotenv()

# Configuration
PORT = int(os.environ.get('PORT', 8080))
SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
sys.path.append(SRC_DIR)

# Setup logging
from lib.logger import logger

# Import the Lambda Handler
try:
    from app import lambda_handler
    logger.info("Lambda handler imported successfully")
except ImportError as e:
    logger.error(f"Error importing app.py: {e}")
    sys.exit(1)

# Import auth provider
from lib.auth_provider import AuthFactory


class SecureLocalLambdaHandler(BaseHTTPRequestHandler):
    """Enhanced request handler with security features"""

    def log_message(self, format, *args):
        """Override to use our logger instead of stderr"""
        logger.debug(f"HTTP: {format % args}")

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _set_cors_headers(self):
        """Set CORS headers based on environment"""
        origin = self.headers.get('Origin', '')
        env = os.environ.get('ENVIRONMENT', 'development')

        if env == 'development':
            # Allow any origin in development
            self.send_header('Access-Control-Allow-Origin', '*')
        else:
            # Check against allowed origins
            allowed_origins = [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://127.0.0.1:5173'
            ]
            if origin in allowed_origins:
                self.send_header('Access-Control-Allow-Origin', origin)
                self.send_header('Access-Control-Allow-Credentials', 'true')
            else:
                self.send_header('Access-Control-Allow-Origin', allowed_origins[0])

        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key, X-Tenant-ID, X-User-Id')

    def _get_request_body(self, method):
        """Get request body with size limit"""
        if method not in ['POST', 'PUT', 'PATCH']:
            return None

        content_length = int(self.headers.get('Content-Length', 0))

        # Check max request size (10MB default)
        max_size = int(os.environ.get('MAX_REQUEST_SIZE', 10485760))
        if content_length > max_size:
            raise ValueError(f"Request too large: {content_length} bytes (max: {max_size})")

        if content_length > 0:
            raw_body = self.rfile.read(content_length)
            try:
                return raw_body.decode('utf-8')
            except:
                # If not UTF-8, might be binary (like an image)
                import base64
                return base64.b64encode(raw_body).decode('utf-8')

        return None

    def _invoke_lambda(self, method):
        """Invoke Lambda handler with enhanced logging and error handling"""
        import uuid
        request_id = str(uuid.uuid4())
        start_time = datetime.utcnow()

        # Construct Lambda Event
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = {k: v[0] for k, v in parse_qs(parsed_path.query).items()}

        try:
            # Get body with validation
            body = self._get_request_body(method)

            # Construct event
            event = {
                'httpMethod': method,
                'path': path,
                'queryStringParameters': query_params if query_params else None,
                'headers': dict(self.headers),
                'body': body,
                'isBase64Encoded': False,
                'requestContext': {
                    'requestId': request_id,
                    'requestTime': start_time.isoformat(),
                    'http': {
                        'method': method,
                        'path': path,
                        'sourceIp': self.client_address[0]
                    }
                }
            }

            # Add auth context if using local auth
            auth_mode = os.environ.get('AUTH_MODE', 'local')
            if auth_mode == 'local':
                # Inject user context for local development
                user_id = self.headers.get('X-User-Id', 'dev-user-1')
                event['requestContext']['authorizer'] = {
                    'userId': user_id
                }

            # Log request
            logger.info(
                f"Request: {method} {path}",
                request_id=request_id,
                user_id=event['requestContext'].get('authorizer', {}).get('userId'),
                query_params=query_params
            )

            # Call Lambda Handler
            context = {'request_id': request_id}
            response = lambda_handler(event, context)

            # Calculate duration
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Log response
            status_code = response.get('statusCode', 200)
            logger.info(
                f"Response: {status_code}",
                request_id=request_id,
                duration_ms=duration_ms
            )

            # Send Response
            self.send_response(status_code)

            # Send Headers
            for header, value in response.get('headers', {}).items():
                self.send_header(header, value)
            self.end_headers()

            # Send Body
            body = response.get('body', '')
            if response.get('isBase64Encoded'):
                import base64
                body = base64.b64decode(body)
                self.wfile.write(body)
            else:
                if isinstance(body, dict):
                    body = json.dumps(body)
                self.wfile.write(body.encode('utf-8'))

        except ValueError as e:
            # Client error (e.g., request too large)
            logger.warning(f"Client error: {e}", request_id=request_id)
            self._send_error_response(400, str(e), request_id)

        except Exception as e:
            # Server error
            logger.exception(f"Server error: {e}", request_id=request_id)
            self._send_error_response(500, "Internal server error", request_id)

    def _send_error_response(self, status_code, message, request_id):
        """Send an error response with proper formatting"""
        self.send_response(status_code)
        self._set_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        error_response = {
            'error': message,
            'request_id': request_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_GET(self):
        self._invoke_lambda('GET')

    def do_POST(self):
        self._invoke_lambda('POST')

    def do_PUT(self):
        self._invoke_lambda('PUT')

    def do_DELETE(self):
        self._invoke_lambda('DELETE')

    def do_PATCH(self):
        self._invoke_lambda('PATCH')


def print_startup_info():
    """Print startup configuration information"""
    print("\n" + "="*60)
    print("🚀 SECURE LOCAL LAMBDA SERVER")
    print("="*60)

    # Environment info
    env = os.environ.get('ENVIRONMENT', 'development')
    auth_mode = os.environ.get('AUTH_MODE', 'local')
    log_level = os.environ.get('LOG_LEVEL', 'INFO')

    print(f"\n📋 Configuration:")
    print(f"   Environment: {env}")
    print(f"   Auth Mode: {auth_mode}")
    print(f"   Log Level: {log_level}")
    print(f"   Port: {PORT}")

    # Auth mode specific info
    if auth_mode == 'local':
        print(f"\n👤 Local Auth Users:")
        print(f"   - dev-user-1 (admin)")
        print(f"   - test-user-1 (participant)")
        print(f"   - caretaker-1 (caretaker)")
        print(f"\n   Set X-User-Id header to use a specific user")
    elif auth_mode == 'cognito':
        user_pool = os.environ.get('COGNITO_USER_POOL_ID', 'Not configured')
        print(f"\n🔐 Cognito Configuration:")
        print(f"   User Pool: {user_pool}")

    # Feature flags
    print(f"\n⚙️  Features:")
    features = {
        'AI Analysis': os.environ.get('FEATURE_ENABLE_AI_ANALYSIS', 'true'),
        'Optimized AI': os.environ.get('USE_OPTIMIZED_AI', 'true'),
        'Rate Limiting': os.environ.get('RATE_LIMIT_ENABLED', 'false')
    }
    for feature, enabled in features.items():
        status = "✅" if enabled.lower() == 'true' else "❌"
        print(f"   {status} {feature}")

    print(f"\n🌐 Server Address:")
    print(f"   http://localhost:{PORT}")
    print(f"\n📝 Logs:")
    print(f"   Check console output for structured logs")

    print("\n" + "="*60)
    print("Ready to accept requests...")
    print("Press Ctrl+C to stop")
    print("="*60 + "\n")


def run_server():
    """Run the enhanced local server"""
    # Print startup info
    print_startup_info()

    # Create and start server
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, SecureLocalLambdaHandler)

    # Log startup
    logger.info(
        "Secure local server started",
        port=PORT,
        auth_mode=os.environ.get('AUTH_MODE', 'local'),
        environment=os.environ.get('ENVIRONMENT', 'development')
    )

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down server...")
        logger.info("Server shutdown requested")
    finally:
        httpd.server_close()
        print("Server stopped")


if __name__ == '__main__':
    run_server()