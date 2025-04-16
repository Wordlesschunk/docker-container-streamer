import os
from fastapi import FastAPI, HTTPException
from docker import DockerClient
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI()

# Allow all origins (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get container name from environment variable
container_name = os.getenv("CONTAINER_NAME")
if not container_name:
    raise RuntimeError("Environment variable CONTAINER_NAME is required")

# Connect to Docker and get container
client = DockerClient(base_url='unix://var/run/docker.sock')
try:
    container = client.containers.get(container_name)
except Exception as e:
    raise RuntimeError(f"Could not find container '{container_name}'") from e

class Command(BaseModel):
    cmd: str

@app.get("/logs/stream")
def stream_logs():
    def log_generator():
        for line in container.logs(stream=True, follow=True):
            yield f"data: {line.decode()}\n\n"
    return StreamingResponse(log_generator(), media_type="text/event-stream")

@app.get("/exec/stream")
def exec_stream(cmd: str):
    def cmd_generator():
        exec_id = client.api.exec_create(container.id, cmd)
        output = client.api.exec_start(exec_id, stream=True)
        for chunk in output:
            yield f"data: {chunk.decode()}\n\n"
    return StreamingResponse(cmd_generator(), media_type="text/event-stream")