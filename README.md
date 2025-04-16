On Docker Host
Install requirements:
`pip install fastapi uvicorn docker`

Run the daemon:
`uvicorn daemon:app --host 0.0.0.0 --port 8000`
Replace "your_container_name" in the Python file with your actual container name or ID.