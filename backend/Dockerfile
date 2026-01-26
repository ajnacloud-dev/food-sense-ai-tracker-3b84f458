FROM public.ecr.aws/lambda/python:3.12

# Install uv for faster dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml ${LAMBDA_TASK_ROOT}
COPY src/requirements.txt ${LAMBDA_TASK_ROOT}

# Install dependencies using uv (faster than pip)
RUN uv pip install --system -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy function code
COPY src/ ${LAMBDA_TASK_ROOT}/
COPY local_server.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "app.lambda_handler" ]
