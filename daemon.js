// docker-daemon.js (Node.js version of the Python FastAPI Docker daemon)

const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const { PassThrough } = require('stream');

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const containerName = process.env.CONTAINER_NAME;

if (!containerName) {
  console.error('CONTAINER_NAME environment variable is required');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

let container;
docker.getContainer(containerName).inspect((err, data) => {
  if (err) {
    console.error(`Container '${containerName}' not found.`);
    process.exit(1);
  } else {
    container = docker.getContainer(containerName);
    console.log(`Connected to container: ${containerName}`);
  }
});

// Stream logs
app.get('/logs/stream', async (req, res) => {
  try {
    const logStream = new PassThrough();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 100,
    }, (err, stream) => {
      if (err) {
        res.status(500).end('Failed to get logs');
        return;
      }
      stream.on('data', chunk => {
        res.write(`data: ${chunk.toString()}\n\n`);
      });
      stream.on('end', () => res.end());
    });
  } catch (error) {
    res.status(500).send('Error streaming logs');
  }
});

// Execute a command
app.get('/exec/stream', async (req, res) => {
  const cmd = req.query.cmd;
  if (!cmd) return res.status(400).send('Missing cmd');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const exec = await container.exec({
      Cmd: ['/bin/sh', '-c', cmd],
      AttachStdout: true,
      AttachStderr: true,
    });

    exec.start((err, stream) => {
      if (err) return res.status(500).end('Exec failed');

      stream.on('data', chunk => {
        res.write(`data: ${chunk.toString()}\n\n`);
      });
      stream.on('end', () => res.end());
    });
  } catch (err) {
    res.status(500).send('Exec error');
  }
});

// Start server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Daemon running at http://localhost:${port}`);
});
