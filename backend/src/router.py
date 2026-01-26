import re

# Import handlers - use fixed version directly
from handlers import data_fixed as data

from handlers import auth, ai, storage, queue

# Route Definition
# (Method, PathPattern, Handler)
ROUTES = [
    # System
    ('POST', r'^/v1/system/initialize-schemas$', data.initialize_schemas),

    # Auth
    ('GET', r'^/v1/auth/config$', auth.get_config),
    ('POST', r'^/v1/auth/invitations/redeem$', auth.redeem_invitation),

    # AI
    ('POST', r'^/v1/ai/analyze$', ai.analyze),

    # Queue System
    ('POST', r'^/v1/queue/analysis$', queue.queue_analysis),
    ('GET', r'^/v1/queue/status/(?P<job_id>[a-zA-Z0-9-]+)$', queue.get_job_status),
    ('GET', r'^/v1/queue/jobs$', queue.get_user_jobs),

    # Storage
    ('POST', r'^/storage/upload$', storage.upload_file),
    ('GET', r'^/v1/storage/(?P<path>.+)$', storage.get_file),

    # Generic Data (Last to avoid collisions)
    ('GET', r'^/v1/(?P<table>[a-zA-Z0-9_]+)$', data.list_data),
    ('POST', r'^/v1/(?P<table>[a-zA-Z0-9_]+)$', data.create_data),
    ('GET', r'^/v1/(?P<table>[a-zA-Z0-9_]+)/(?P<id>[a-zA-Z0-9-]+)$', data.get_data_by_id),
    ('PUT', r'^/v1/(?P<table>[a-zA-Z0-9_]+)/(?P<id>[a-zA-Z0-9-]+)$', data.update_data if hasattr(data, 'update_data') else data.create_data),
    ('DELETE', r'^/v1/(?P<table>[a-zA-Z0-9_]+)/(?P<id>[a-zA-Z0-9-]+)$', data.delete_data if hasattr(data, 'delete_data') else data.get_data_by_id),
]

def route_request(event, context):
    """
    Matches method and path to a handler.
    """
    path = event.get('path', '')
    method = event.get('httpMethod', 'GET')

    # Remove trailing slash for consistency
    if path.endswith('/') and len(path) > 1:
        path = path[:-1]

    print(f"Router: {method} {path}")

    for route_method, route_pattern, handler in ROUTES:
        if route_method == method:
            match = re.match(route_pattern, path)
            if match:
                # Add path parameters to event
                if not event.get('pathParameters'):
                    event['pathParameters'] = {}

                event['pathParameters'].update(match.groupdict())

                # Execute Handler
                return handler(event, context)

    return {
        "statusCode": 404,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": '{"error": "Route not found"}'
    }
