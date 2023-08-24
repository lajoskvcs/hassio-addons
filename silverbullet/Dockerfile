ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    curl \
    git


RUN curl -fsSL https://deno.land/x/install/install.sh | sh

RUN echo 'export DENO_INSTALL="/root/.deno"' >> ~/.bashrc
RUN echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
RUN source ~/.bashrc


RUN deno install -f --name silverbullet --unstable -A https://get.silverbullet.md

CMD [ "silverbullet /data -p 8090" ]
