FROM public.ecr.aws/lambda/python:3.12

# Copy requirements.txt
COPY src/requirements.txt ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip install -r requirements.txt

# Copy function code
COPY src/ ${LAMBDA_TASK_ROOT}/
COPY local_server.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "app.lambda_handler" ]
