FROM python:3.11-slim

# install Node.js 18 (and build tools)
RUN apt-get update && \
    apt-get install -y curl build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Python deps
COPY ml/requirements.txt ./ml/
RUN pip install --no-cache-dir -r ml/requirements.txt

# copy the backend + ml code
COPY . .

# Node deps
RUN npm install

# expose & env
ENV PORT=5001 PYTHON_COMMAND=python3
EXPOSE 5001

CMD ["npm", "start"]
