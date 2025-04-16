On Docker Host
Install requirements:
`pip install fastapi uvicorn docker`

`CONTAINER_NAME=my-container-name uvicorn daemon:app --host 0.0.0.0 --port 8000`

Run the daemon:
`uvicorn daemon:app --host 0.0.0.0 --port 8000`
Replace "your_container_name" in the Python file with your actual container name or ID.


sudo apt update
sudo apt install nodejs npm -y

npm init -y
npm install express cors dockerode

CONTAINER_NAME=my-container-name node daemon.js

